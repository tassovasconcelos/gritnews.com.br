#!/usr/bin/env python3
import json
import socket
import ssl
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import requests

INVENTORY = Path('ops/sites.json')
OUT_DIR = Path('artifacts')
OUT_JSON = OUT_DIR / 'grit-control-center.json'
OUT_HTML = OUT_DIR / 'grit-control-center.html'
PUBLIC_JSON = Path('apps/gritnews/public/control-center/status.json')


def fetch(url, method='GET'):
    started = time.perf_counter()
    try:
        r = requests.request(method, url, timeout=25, allow_redirects=True, headers={'User-Agent': 'GRIT-Control-Center/1.1'})
        return {
            'ok': 200 <= r.status_code < 400,
            'status': r.status_code,
            'elapsed_ms': round((time.perf_counter() - started) * 1000),
            'headers': {k.lower(): v for k, v in r.headers.items()},
            'body': r.text[:300000] if method == 'GET' else '',
            'final_url': r.url,
        }
    except Exception as exc:
        return {'ok': False, 'error': str(exc), 'elapsed_ms': round((time.perf_counter() - started) * 1000), 'headers': {}, 'body': ''}


def ssl_info(url):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        return {'ok': False, 'error': 'HTTPS not configured'}
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((parsed.hostname, parsed.port or 443), timeout=12) as sock:
            with ctx.wrap_socket(sock, server_hostname=parsed.hostname) as wrapped:
                cert = wrapped.getpeercert()
        expiry = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z').replace(tzinfo=timezone.utc)
        days = (expiry - datetime.now(timezone.utc)).days
        return {'ok': days >= 7, 'expires_at': expiry.isoformat(), 'days_remaining': days}
    except Exception as exc:
        return {'ok': False, 'error': str(exc)}


def add_check(checks, key, ok, detail, severity='error'):
    checks.append({'key': key, 'ok': bool(ok), 'detail': detail, 'severity': severity})


def audit_site(site):
    result = {'id': site['id'], 'name': site['name'], 'repository': site.get('repository'), 'url': site.get('url'), 'public_index': site.get('public_index', False), 'status': 'pending' if not site.get('url') else 'unknown', 'checks': []}
    if not site.get('url'):
        result['status'] = site.get('status', 'pending')
        add_check(result['checks'], 'domain', False, site.get('notes', 'Production domain pending'), 'warning')
        return result

    home = fetch(site['url'])
    result['http_status'] = home.get('status')
    result['response_ms'] = home.get('elapsed_ms')
    add_check(result['checks'], 'availability', home.get('ok'), f"HTTP {home.get('status', home.get('error', 'error'))}; {home.get('elapsed_ms')} ms")

    tls = ssl_info(site['url'])
    result['ssl'] = tls
    add_check(result['checks'], 'ssl', tls.get('ok'), f"{tls.get('days_remaining', '?')} days remaining" if 'days_remaining' in tls else tls.get('error', 'SSL error'))

    headers = home.get('headers', {})
    for header in ['x-content-type-options', 'referrer-policy', 'strict-transport-security']:
        add_check(result['checks'], f'header:{header}', header in headers, headers.get(header, 'missing'), 'warning')

    if site.get('public_index'):
        robots = fetch(site.get('robots')) if site.get('robots') else {'ok': False, 'body': ''}
        sitemap = fetch(site.get('sitemap')) if site.get('sitemap') else {'ok': False, 'body': ''}
        add_check(result['checks'], 'robots', robots.get('ok'), f"HTTP {robots.get('status', robots.get('error', 'error'))}")
        add_check(result['checks'], 'sitemap', sitemap.get('ok') and ('<urlset' in sitemap.get('body', '') or '<sitemapindex' in sitemap.get('body', '')), f"HTTP {sitemap.get('status', sitemap.get('error', 'error'))}")
        if site.get('sitemap') and robots.get('body'):
            declared = site['sitemap'] in robots['body']
            add_check(result['checks'], 'robots:sitemap-reference', declared, 'sitemap declared in robots.txt' if declared else 'sitemap not declared in robots.txt', 'warning')

    if site.get('expected_noindex'):
        xrobots = headers.get('x-robots-tag', '')
        add_check(result['checks'], 'noindex', 'noindex' in xrobots.lower(), xrobots or 'X-Robots-Tag missing')

    for private_path in site.get('private_paths', []):
        private = fetch(site['url'].rstrip('/') + private_path, method='HEAD')
        xrobots = private.get('headers', {}).get('x-robots-tag', '')
        add_check(result['checks'], f'noindex:{private_path}', 'noindex' in xrobots.lower(), xrobots or 'X-Robots-Tag missing')

    hard = [c for c in result['checks'] if not c['ok'] and c['severity'] == 'error']
    warn = [c for c in result['checks'] if not c['ok'] and c['severity'] == 'warning']
    result['status'] = 'down' if hard else ('warning' if warn else 'healthy')
    return result


def render_html(report):
    rows = []
    for site in report['sites']:
        checks = ''.join(f"<li>{'✅' if c['ok'] else '⚠️' if c['severity']=='warning' else '❌'} {c['key']}: {c['detail']}</li>" for c in site['checks'])
        rows.append(f"<section><h2>{site['name']} — {site['status'].upper()}</h2><p>{site.get('url') or 'Domínio pendente'}</p><ul>{checks}</ul></section>")
    return f"<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><title>GRIT Control Center</title></head><body><h1>GRIT Control Center</h1><p>Gerado em {report['generated_at']}</p>{''.join(rows)}</body></html>"


def public_snapshot(report):
    safe_sites = []
    for site in report['sites']:
        issues = [c['detail'] for c in site['checks'] if not c['ok']]
        safe_sites.append({
            'id': site['id'],
            'name': site['name'],
            'status': site['status'],
            'http_status': site.get('http_status'),
            'response_ms': site.get('response_ms'),
            'ssl_days': site.get('ssl', {}).get('days_remaining'),
            'issues': issues[:6],
        })
    return {'generated_at': report['generated_at'], 'summary': report['summary'], 'sites': safe_sites}


def main():
    sites = json.loads(INVENTORY.read_text(encoding='utf-8'))
    audited = [audit_site(site) for site in sites]
    states = ['healthy', 'warning', 'down', 'pending', 'domain_pending']
    summary = {state: sum(1 for x in audited if x['status'] == state) for state in states}
    report = {'generated_at': datetime.now(timezone.utc).isoformat(), 'summary': summary, 'sites': audited}

    OUT_DIR.mkdir(exist_ok=True)
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    OUT_HTML.write_text(render_html(report), encoding='utf-8')
    PUBLIC_JSON.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_JSON.write_text(json.dumps(public_snapshot(report), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print('GRIT CONTROL CENTER')
    for site in audited:
        print(f"- {site['name']}: {site['status']} | {site.get('http_status', '-')} | {site.get('response_ms', '-')} ms")
        for check in site['checks']:
            if not check['ok']:
                print(f"    {'WARN' if check['severity']=='warning' else 'FAIL'} {check['key']}: {check['detail']}")

    critical_down = [s for s in audited if s['status'] == 'down' and next((x.get('critical') for x in sites if x['id'] == s['id']), False)]
    if critical_down:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
