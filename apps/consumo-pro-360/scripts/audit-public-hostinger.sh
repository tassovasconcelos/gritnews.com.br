#!/usr/bin/env bash
# Public, unauthenticated, read-only diagnostic. Never changes DNS, files, or auth.
# Run from GitHub Actions with network access. Logs only status / response headers.
set -uo pipefail
DOMAIN="consumo.gritnews.com.br"
BASE="https://${DOMAIN}"
echo "=== DNS ${DOMAIN} ==="
for type in A AAAA CNAME; do
  echo "${type}: $(dig +time=5 +tries=1 +short "$DOMAIN" "$type" | tr '\n' ' ' || true)"
done

is_ready=true
for path in / /gestao /solicitar /manifest.webmanifest /release.json; do
  code="$(curl --location --silent --show-error --connect-timeout 8 --max-time 18 \
     -o /tmp/consumo-response -D /tmp/consumo-headers \
     -w "%{http_code}" "${BASE}${path}" 2>/tmp/consumo-curl-stderr)" || code="ERROR"
  printf '%s HTTP %s\n' "$path" "$code"
  if [ "$code" != "200" ]; then
    is_ready=false
    head -c 180 /tmp/consumo-curl-stderr 2>/dev/null | tr '\n' ' ' || true
    echo
    continue
  fi
  if [ "$path" = /manifest.webmanifest ]; then
    if ! grep -q '"standalone"' /tmp/consumo-response; then echo 'WARN: PWA manifest invalid';is_ready=false;fi
  fi
  if [ "$path" = /release.json ]; then
    if ! grep -q '"releaseTarget": "hostinger"' /tmp/consumo-response; then
      echo 'WARN: Hostinger release signature not found';is_ready=false
    else
      grep -E '"commit"|"releaseTarget"' /tmp/consumo-response | head -3 || true
    fi
  fi
  if [ "$path" = /gestao ] || [ "$path" = /solicitar ];then
    if ! grep -qi '<html' /tmp/consumo-response;then echo 'WARN: SPA route is not HTML';is_ready=false;fi
  fi
done
if [ "$is_ready" = true ];then
  echo "PASS: Hostinger HTTPS shell and SPA routes are externally accessible."
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ];then echo "✅ CONSUMO PRO Hostinger: subdomain shell reachable (login still requires E2E validation)" >> "$GITHUB_STEP_SUMMARY";fi
else
  echo "BLOCKED: subdomain site is not yet a verifiable Hostinger release."
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ];then echo "⚠️ CONSUMO PRO Hostinger: DNS/HTTPS/content not yet validated; do not cut over or claim production." >> "$GITHUB_STEP_SUMMARY";fi
fi
# Diagnostic deliberately does not fail unrelated GRIT builds.
exit 0
