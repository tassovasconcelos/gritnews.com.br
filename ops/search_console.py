#!/usr/bin/env python3
import json
import os
import sys
import urllib.parse

import google.auth
import requests
from google.auth.transport.requests import Request

SCOPES = ["https://www.googleapis.com/auth/webmasters"]
API = "https://www.googleapis.com/webmasters/v3"


def load_credentials():
    creds, _ = google.auth.default(scopes=SCOPES)
    creds.refresh(Request())
    return creds


def api_request(method, url, token):
    r = requests.request(method, url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    if r.status_code >= 400:
        raise RuntimeError(f"{method} {url} -> HTTP {r.status_code}: {r.text[:500]}")
    if r.content:
        try:
            return r.json()
        except Exception:
            return r.text
    return None


def main():
    with open("ops/sites.json", encoding="utf-8") as f:
        sites = json.load(f)

    creds = load_credentials()
    token = creds.token
    accessible = api_request("GET", f"{API}/sites", token) or {}
    accessible_urls = {x.get("siteUrl") for x in accessible.get("siteEntry", [])}

    print("Search Console properties accessible to federated service account:")
    for item in sorted(x for x in accessible_urls if x):
        print(f"  - {item}")

    failures = []
    submitted = []

    for site in sites:
        if not site.get("public_index"):
            continue

        prop = site.get("search_console_property")
        primary = site.get("sitemap")
        extra = site.get("additional_sitemaps") or []
        sitemaps = ([primary] if primary else []) + [x for x in extra if x]
        name = site.get("name", "Unnamed site")

        if not prop or not sitemaps:
            failures.append(f"{name}: missing search_console_property or sitemap")
            continue

        if prop not in accessible_urls:
            failures.append(f"{name}: property not accessible: {prop}")
            continue

        prop_q = urllib.parse.quote(prop, safe="")
        for sitemap in sitemaps:
            sitemap_q = urllib.parse.quote(sitemap, safe="")
            api_request("PUT", f"{API}/sites/{prop_q}/sitemaps/{sitemap_q}", token)
            submitted.append((name, prop, sitemap))
            print(f"Submitted sitemap: {name} -> {sitemap}")

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("\n### Google Search Console\n")
            for name, prop, sitemap in submitted:
                f.write(f"- ✅ {name}: `{sitemap}` submitted to `{prop}`\n")
            for failure in failures:
                f.write(f"- ❌ {failure}\n")

    if failures:
        print("\nErrors:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
