#!/usr/bin/env python3
"""CIP product master snapshot. Read-only SQL; signed CIP-only destination."""
import base64,datetime as dt,decimal,fcntl,hashlib,json,os,subprocess,tempfile,time,uuid,urllib.request
from pathlib import Path
import pyodbc
DEST='https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/cip-procfit-catalog'
ROOT=Path('/var/lib/cip-procfit')
def encode(v):
    if v is None:return None
    if isinstance(v,decimal.Decimal):
        if v!=v.to_integral_value():raise ValueError('fractional_identifier')
        return str(int(v))
    if isinstance(v,(dt.datetime,dt.date)):return v.isoformat()
    return str(v)
def collect():
    cfg=json.loads(Path('/etc/cip-procfit/connection.json').read_text())
    password='{'+cfg['password'].replace('}','}}')+'}'
    trust='yes' if cfg.get('trust_server_certificate',False) else 'no'
    db=pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=172.17.0.11,1433;DATABASE=PBS_PROHOSPITAL_DADOS;UID=tasso;PWD='+password+';Encrypt=yes;TrustServerCertificate='+trust+';ApplicationIntent=ReadOnly;',timeout=15,autocommit=False)
    try:
        db.timeout=90
        out={}
        for kind,view,key in [('products','TASS_D_PRODUTOS','COD_PRODUTO'),('eans','TASS_D_PRODUTOS_EAN','REGISTRO')]:
            cur=db.cursor();cur.execute('SELECT * FROM [st].['+view+'] ORDER BY ['+key+']')
            names=[x[0] for x in cur.description]
            rows=[dict(zip(names,[encode(v) for v in r])) for r in cur]
            if len({r[key] for r in rows})!=len(rows) or any(not r[key] for r in rows):raise ValueError('duplicate_key')
            out[kind]=rows
        codes={r['COD_PRODUTO'] for r in out['products']}
        if any(r['COD_PRODUTO'] not in codes for r in out['eans']):raise ValueError('orphan_ean')
        db.rollback();return out
    finally:db.close()
def send(p):
    for attempt in range(4):
        p['sent_at']=dt.datetime.now(dt.timezone.utc).isoformat()
        raw=json.dumps(p,separators=(',',':'),ensure_ascii=False).encode()
        with tempfile.NamedTemporaryFile() as f:
            f.write(raw);f.flush()
            signature=subprocess.run(['openssl','pkeyutl','-sign','-rawin','-inkey','/etc/cip-procfit/signing.pem','-in',f.name],capture_output=True,check=True).stdout
        request=urllib.request.Request(DEST,data=raw,headers={'Content-Type':'application/json','x-cip-signature':base64.b64encode(signature).decode()},method='POST')
        try:
            with urllib.request.urlopen(request,timeout=90) as response:return json.load(response)
        except Exception:
            if attempt==3:raise RuntimeError('delivery_failed') from None
            time.sleep(2**attempt)
def run():
    captured=dt.datetime.now(dt.timezone.utc).isoformat()
    data=collect();batch=str(uuid.uuid4())
    base={'schema':'cip-procfit-catalog-v1','batch_id':batch}
    # Private source capture for reconciliation, never shipped with the public site.
    snapshot=ROOT/('catalog-'+batch+'.json')
    snapshot.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')));os.chmod(snapshot,0o600)
    send(dict(base,action='begin',captured_at=captured,products=len(data['products']),eans=len(data['eans'])))
    for kind,rows in data.items():
        for offset in range(0,len(rows),500):
            send(dict(base,action=kind,rows=rows[offset:offset+500]))
        print(json.dumps({'dataset':kind,'sent':len(rows)}),flush=True)
    result=send(dict(base,action='finish'))
    if not result.get('published'):raise RuntimeError('publication_failed')
    status={'batch_id':batch,'captured_at':captured,'summary':result['summary'],'source_sha256':hashlib.sha256(snapshot.read_bytes()).hexdigest(),'published':True,'financial_data':False}
    target=ROOT/'catalog-status.json';target.write_text(json.dumps(status));os.chmod(target,0o600)
    print(json.dumps(status),flush=True)
if __name__=='__main__':
    ROOT.mkdir(parents=True,exist_ok=True)
    with open(ROOT/'catalog.lock','w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        try:run()
        except Exception as e:
            print(json.dumps({'published':False,'error_type':type(e).__name__}),flush=True)
            raise SystemExit(1)
