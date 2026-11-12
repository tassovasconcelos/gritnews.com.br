#!/usr/bin/env python3
"""Safely inspect/provision only consumo.gritnews.com.br using Hostinger Hosting API.
Default: read-only. --apply: create only if missing, never modify existing sites.
Requires HOSTINGER_API_TOKEN and HOSTINGER_HOSTING_USERNAME in secure CI environment.
"""
import argparse
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

DOMAIN = "gritnews.com.br"
PREFIX = "consumo"
FULL = f"{PREFIX}.{DOMAIN}"
API = "https://developers.hostinger.com"
# Hostinger API defines "directory" as relative to the website root.
# Creating a dedicated child directory must NOT use the parent's public directory.
DIRECTORY = "consumo"


def request(path, token, method="GET", body=None):
    url = API + path
    encoded = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    req = Request(url, data=encoded, method=method, headers=headers)
    try:
        with urlopen(req, timeout=25) as response:
            data = response.read()
            return json.loads(data) if data else {}
    except HTTPError as exc:
        # Do not print error response body: it could contain sensitive account data.
        raise RuntimeError(f"Hostinger API rejected {method}: HTTP {exc.code}") from None
    except URLError as exc:
        raise RuntimeError(f"Hostinger API connection failed: {exc.reason}") from None


def listing(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get("data"), list):
        return payload["data"]
    raise RuntimeError("Unexpected Hostinger response; refusing any write")


def safe_root(value):
    """Reject any domain root; allow only nested isolated directories."""
    root = str(value or "").rstrip("/")
    if not root:
        return False
    if ".." in root or not root.startswith("/"):
        return False
    return bool(re.search(r"/(?:public_html/)?consumo/?$", root) or
                root.endswith("/consumo.gritnews.com.br/public_html"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Authorize one new subdomain creation")
    args = parser.parse_args()
    token = os.environ.get("HOSTINGER_API_TOKEN", "").strip()
    username = os.environ.get("HOSTINGER_HOSTING_USERNAME", "").strip()
    if not token or not re.fullmatch(r"[a-zA-Z0-9_-]{3,64}", username):
        print("BLOCKED: missing authorized API token or hosting username; no changes made.")
        return 2
    endpoint = (
        f"/api/hosting/v1/accounts/{quote(username, safe='')}"
        f"/websites/{quote(DOMAIN, safe='')}/subdomains"
    )
    before = listing(request(endpoint, token))
    found = [
        record for record in before
        if record.get("subdomain") == PREFIX or record.get("domain") == FULL
    ]
    if found:
        if len(found) != 1:
            print("BLOCKED: multiple matching Hostinger subdomain records")
            return 2
        root = found[0].get("root_directory")
        if not safe_root(root):
            print("BLOCKED: subdomain exists with an unapproved root; no changes made.")
            return 2
        print(f"EXISTS: {FULL}, isolated document root: {root}")
        return 0
    if not args.apply:
        print(f"DRY RUN: {FULL} absent. Would create directory '{DIRECTORY}' under the parent website.")
        return 0

    # Never use is_using_public_directory=true, even if a caller asks.
    print("CREATING: isolated Hostinger subdomain (does not change the main portal).")
    request(endpoint, token, method="POST", body={
        "subdomain": PREFIX,
        "directory": DIRECTORY,
        "is_using_public_directory": False,
    })
    after = listing(request(endpoint, token))
    records = [
        record for record in after
        if record.get("subdomain") == PREFIX or record.get("domain") == FULL
    ]
    if len(records) != 1 or not safe_root(records[0].get("root_directory")):
        print("ATTENTION: request was sent, but the isolated document root could not be verified.")
        print("No DNS or files were modified. Inspect the Hostinger subdomain settings.")
        return 3
    print(f"CREATED: {FULL}. Confirmed root: {records[0]['root_directory']}")
    print("NEXT: create deployment marker, configure SSH keys, upload PWA, verify TLS, then change DNS.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, ValueError, TypeError) as err:
        print(f"BLOCKED: {err}")
        sys.exit(2)
