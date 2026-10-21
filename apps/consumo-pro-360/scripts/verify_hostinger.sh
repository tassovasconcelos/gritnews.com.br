#!/usr/bin/env bash
# Check that the GRIT corporate subdomain is served by Hostinger, not Vercel.
# Usage: bash scripts/verify_hostinger.sh https://consumo.gritnews.com.br <expected-Git-commit>
set -euo pipefail
BASE="${1:-https://consumo.gritnews.com.br}"
EXPECTED="${2:-}"
BASE="${BASE%/}"
[[ "$BASE" == https://* ]] || { echo "Only HTTPS origins are allowed"; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

for route in "/gestao" "/solicitar" "/manifest.webmanifest" "/release.json"; do
  outfile="$tmp/response"
  status="$(curl --fail-with-body --location --silent --show-error --max-time 25 -o "$outfile" -w "%{http_code}" "$BASE$route")"
  if [ "$status" != "200" ]; then
    echo "FAIL: $route => HTTP $status"
    exit 1
  fi
  case "$route" in
    "/gestao"|"/solicitar")
      grep -Eqi '<!doctype html|<html' "$outfile" || { echo "Invalid SPA route: $route"; exit 1; }
      ;;
    "/manifest.webmanifest")
      grep -Fq '"standalone"' "$outfile" || { echo "Manifest is not installable"; exit 1; }
      ;;
    "/release.json")
      grep -Fq '"releaseTarget": "hostinger"' "$outfile" || { echo "This origin is NOT serving Hostinger release.json"; exit 1; }
      if [ -n "$EXPECTED" ]; then
        grep -Fq "$EXPECTED" "$outfile" || { echo "Unexpected deploy commit"; exit 1; }
      fi
      ;;
  esac
  echo "OK: $route"
done

headers="$tmp/headers"
curl --silent --show-error --max-time 20 -D "$headers" -o /dev/null "$BASE/gestao"
for header in 'x-content-type-options' 'x-frame-options' 'content-security-policy' 'x-robots-tag'; do
  grep -qi "^$header:" "$headers" || { echo "Security header missing: $header"; exit 1; }
done
echo "PASS: Hostinger release, SPA fallback, PWA manifest, and essential security headers verified."
