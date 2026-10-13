#!/usr/bin/env python3
"""Install CONSUMO PRO 360 directly via Hostinger Hosting Files API.

Safety:
* Upload is disabled by default; --apply is required.
* Domain target hard-locked to the consumption SUBDOMAIN, never gritnews.com.br.
* API lists the target site and requires an independent marker file before writing.
* No deletion; .htaccess and index.html are uploaded last.
* No password, bearer token or temporary upload key ever reaches logs.
Hostinger reference: /api/hosting/v1/files/upload-urls and TUS 1.0.0.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import re
import ssl
import sys
from urllib.parse import quote, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

API="https://developers.hostinger.com"
TARGET="consumo.gritnews.com.br"
MARKER=".consumo-pro-deploy-root"
EXPECTED="CONSUMO_PRO_360_HOSTINGER_ONLY"
TIMEOUT=25

def call(url,method="GET",data=None,headers=None):
    req=Request(url, data=data, method=method, headers=headers or {})
    try:
        with urlopen(req,timeout=TIMEOUT) as response:
            return response.getcode(),dict(response.headers),response.read()
    except HTTPError as ex:
        raise RuntimeError(f"Hostinger request {method} failed with HTTP {ex.code}") from None
    except URLError:
        raise RuntimeError(f"Hostinger service unavailable on {method}") from None

def api(path,token,params=None,method="GET",body=None):
    url=API+path
    if params:url+="?"+urlencode(params)
    payload=json.dumps(body).encode() if body is not None else None
    _,_,response=call(url,method,payload,{
        "Authorization":"Bearer "+token,
        "Accept":"application/json",
        "Content-Type":"application/json",
    })
    try:return json.loads(response)
    except Exception:raise RuntimeError("Unexpected response body from Hostinger") from None

def upload(url,auth_key,rest_key,relative,data):
    parsed=urlsplit(url)
    if parsed.scheme!="https" or not parsed.hostname or parsed.username or parsed.password:
        raise RuntimeError("Hostinger returned invalid secure upload URL")
    relative="/".join(quote(p,safe="") for p in relative.split("/"))
    destination=parsed.path.rstrip("/")+"/"+relative
    target=urlunsplit((parsed.scheme,parsed.netloc,destination,"override=true",""))
    headers={
        "X-Auth":auth_key,
        "X-Auth-Rest":rest_key,
        "Tus-Resumable":"1.0.0",
        "Upload-Length":str(len(data)),
        "Upload-Offset":"0",
    }
    status,meta,_=call(target,"POST",b"",headers)
    if status!=201:raise RuntimeError("Hostinger TUS start rejected")
    # Hostinger docs demonstrate PATCH at same URL. Respect returned Location if safe.
    location=meta.get("Location") or meta.get("location")
    if location:
        from urllib.parse import urljoin
        resolved=urljoin(target,location)
        check=urlsplit(resolved)
        if check.scheme!="https" or check.hostname!=parsed.hostname:
            raise RuntimeError("Hostinger TUS location host mismatch")
        target=resolved
    headers["Content-Type"]="application/offset+octet-stream"
    status,meta,_=call(target,"PATCH",data,headers)
    if status!=204 or int(meta.get("Upload-Offset",meta.get("upload-offset",-1)))!=len(data):
        raise RuntimeError("Hostinger TUS transfer incomplete")

def main(argv=None):
    p=argparse.ArgumentParser(description="Guarded subdomain-only Hostinger publisher")
    p.add_argument("--apply",action="store_true",help="Allow guarded upload")
    p.add_argument("--dist",default="dist",help="Compiled PWA directory")
    args=p.parse_args(argv)
    folder=Path(args.dist)
    must=["index.html",".htaccess","manifest.webmanifest","sw.js","release.json"]
    if not folder.is_dir() or any(not (folder/p).is_file() for p in must):
        print("BLOCKED: missing complete production build")
        return 2
    if any(p.is_symlink() for p in folder.rglob("*")):
        print("BLOCKED: symlinks are not supported for remote upload")
        return 2
    files=sorted([f for f in folder.rglob("*") if f.is_file()],
        key=lambda f: (f.name in [".htaccess","index.html"],f.name=="index.html",f.as_posix()))
    if len(files)>100 or sum(f.stat().st_size for f in files)>25_000_000:
        print("BLOCKED: unexpected app size")
        return 2
    release=json.loads((folder/"release.json").read_text())
    if release.get("application")!="consumo-pro-360" or release.get("releaseTarget")!="hostinger":
        print("BLOCKED: invalid release identifier")
        return 2
    print(f"Verified {len(files)} files for {TARGET}, release {str(release.get('commit',''))[:10]}")
    if not args.apply:
        print("DRY RUN: no files uploaded. Activate only after Hostinger account permissions and marker.")
        return 0
    token=os.environ.get("HOSTINGER_API_TOKEN","")
    username=os.environ.get("HOSTINGER_HOSTING_USERNAME","")
    if not token or not re.fullmatch(r"[a-zA-Z0-9_-]{3,64}",username):
        print("BLOCKED: authorized Hostinger API token or account username absent")
        return 2
    address=f"/api/hosting/v1/accounts/{quote(username)}/domains/{TARGET}/files"
    listed=api(address,token,params={"directory":"","max_depth":1,"max_items":200})
    # Different API versions may wrap items under data.files or files.
    obj=listed.get("data",listed) if isinstance(listed,dict) else {}
    entries=obj.get("files",obj.get("items")) if isinstance(obj,dict) else None
    if not isinstance(entries,list):
        raise RuntimeError("Cannot verify dedicated Hostinger domain files; refusing write")
    names={str(x.get("name","")).split("/")[-1] for x in entries if isinstance(x,dict)}
    if MARKER not in names:
        print("BLOCKED: missing .consumo-pro-deploy-root marker in target website root")
        return 2
    marker=api(address+"/content",token,params={"path":MARKER,"max_lines":10})
    marker_body=json.dumps(marker,ensure_ascii=False)
    if EXPECTED not in marker_body:
        print("BLOCKED: Hostinger root marker does not match")
        return 2
    signed=api("/api/hosting/v1/files/upload-urls",token,method="POST",
        body={"username":username,"domain":TARGET})
    signed=signed.get("data",signed) if isinstance(signed,dict) else {}
    url=signed.get("url")
    auth_key=signed.get("auth_key")
    rest_key=signed.get("rest_auth_key")
    if not all(isinstance(v,str) and v for v in [url,auth_key,rest_key]):
        raise RuntimeError("Hostinger upload credential response incomplete")
    print("Hostinger confirmed dedicated root; uploading without deleting existing data...")
    for number,f in enumerate(files,1):
        rel=f.relative_to(folder).as_posix()
        if rel.startswith("..") or rel==MARKER:
            raise RuntimeError("Unsafe target path")
        upload(url,auth_key,rest_key,rel,f.read_bytes())
        print(f"Uploaded {number}/{len(files)}: {rel}")
    print(f"UPLOADED: {TARGET}; run HTTPS/login/PWA checks before claiming production ready.")
    return 0

if __name__=="__main__":
    try:sys.exit(main())
    except RuntimeError as exc:
        print("BLOCKED: "+str(exc))
        sys.exit(2)
