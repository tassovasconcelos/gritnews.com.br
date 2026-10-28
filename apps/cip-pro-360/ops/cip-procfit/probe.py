#!/usr/bin/env python3
"""CIP-only schema check. No business rows, no ROTA API calls, no SQL mutations."""
import base64
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.request

ROOT = Path('/var/lib/cip-procfit')
CONFIG = Path('/etc/cip-procfit/connection.json')
SIGNING_KEY = '/etc/cip-procfit/signing.pem'
DESTINATION = 'https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/cip-procfit-gateway'
VIEW = 'st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO'
BASELINE = {'PRODUTO_TOMBAMENTO','TOMBAMENTO','VALOR_DIARIA','PRAZO_LOCACAO'}

def collect():
    import pyodbc
    cfg = json.loads(CONFIG.read_text())
    password = '{' + cfg['password'].replace('}', '}}') + '}'
    trust = 'yes' if cfg.get('trust_server_certificate', False) else 'no'
    connection = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=172.17.0.11,1433;DATABASE=PBS_PROHOSPITAL_DADOS;UID=tasso;PWD=' + password + ';Encrypt=yes;TrustServerCertificate=' + trust + ';ApplicationIntent=ReadOnly;', timeout=15, autocommit=False)
    try:
        connection.timeout = 60
        cursor = connection.cursor()
        cursor.execute("SELECT IS_SRVROLEMEMBER('sysadmin'), IS_MEMBER('db_owner'), HAS_PERMS_BY_NAME('st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO','OBJECT','SELECT'), HAS_PERMS_BY_NAME('st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO','OBJECT','INSERT'), HAS_PERMS_BY_NAME('st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO','OBJECT','UPDATE'), HAS_PERMS_BY_NAME('st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO','OBJECT','DELETE'), HAS_PERMS_BY_NAME('st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO','OBJECT','CONTROL')")
        permission = cursor.fetchone()
        if permission[2] != 1 or any(permission[i] == 1 for i in (0, 1, 3, 4, 5, 6)):
            raise ValueError('read_only_required')
        cursor.execute('SELECT TOP (0) * FROM [st].[TASS_PRODUTOS_TOMBAMENTOS_LOCACAO]')
        columns = [c[0] for c in cursor.description]
        connection.rollback()
        return columns
    finally:
        connection.close()

def run():
    result = {'schema':'cip-procfit-probe-v1','source_view':VIEW,'interval_seconds':600,'captured_at':dt.datetime.now(dt.timezone.utc).isoformat(),'status':'source_error','columns':[]}
    try:
        columns = collect()
        result.update(columns=columns, status='contract_pending' if len(columns)==45 and BASELINE.issubset(columns) else 'mapping_required')
    except Exception:
        pass  # Driver errors can contain secrets. Only controlled status is sent/logged.
    body = json.dumps(result,separators=(',',':'),ensure_ascii=False).encode()
    delivered = False
    with tempfile.NamedTemporaryFile() as tmp:
        tmp.write(body); tmp.flush()
        signature = subprocess.run(['openssl','pkeyutl','-sign','-rawin','-inkey',SIGNING_KEY,'-in',tmp.name],check=True,capture_output=True).stdout
    req = urllib.request.Request(DESTINATION,data=body,headers={'Content-Type':'application/json','x-cip-signature':base64.b64encode(signature).decode()},method='POST')
    try:
        with urllib.request.urlopen(req,timeout=30) as response:
            delivered = json.load(response).get('accepted') is True
    except Exception:
        pass
    status = {'captured_at':result['captured_at'],'status':result['status'],'columns':len(result['columns']),'delivered_to_cip':delivered,'business_data_received':False,'interval_seconds':600}
    temp=ROOT/'latest-status.tmp';temp.write_text(json.dumps(status));os.chmod(temp,0o600);temp.replace(ROOT/'latest-status.json')
    print(json.dumps(status),flush=True)
    return 0 if delivered and result['status']!='source_error' else 1

if __name__=='__main__':
    ROOT.mkdir(mode=0o700,parents=True,exist_ok=True)
    with open(ROOT/'run.lock','w') as lock:
        try:
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit(0)
        raise SystemExit(run())
