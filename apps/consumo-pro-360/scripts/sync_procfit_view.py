"""Read-only SQL/CSV bridge. Dry-run by default; secrets are environment-only.

The view contract is in docs/PROCFIT_VIEW_CONTRACT.md. No source SQL writes,
no automatic stock posting and no credentials in arguments, files or logs.
"""
from __future__ import annotations
import argparse
import csv
from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import json
import os
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import uuid4

COLUMNS = ('operation_key','source_id','line_id','kind','occurred_on','source_updated_at',
 'status','cost_center_code','cost_center_name','product_code','product_name','base_unit',
 'supplier_code','supplier_name','supplier_tax_id','document_number','access_key',
 'quantity_base','unit_cost_landed','total_landed','currency')
KINDS = ('purchase','purchase_return','consumption','consumption_return')

def validate(raw):
    row = {key: '' if raw.get(key) is None else str(raw[key]).strip() for key in COLUMNS}
    for key in ('operation_key','source_id','line_id','kind','occurred_on','source_updated_at','status','product_code','product_name','base_unit','currency'):
        if not row[key] or len(row[key]) > 512:
            raise ValueError(f'Missing or oversized field: {key}')
    if row['operation_key'] not in ('distributor','retail') or row['kind'] not in KINDS:
        raise ValueError('Unknown operation or movement kind')
    if row['currency'] != 'BRL' or row['status'] not in ('posted','cancelled'):
        raise ValueError('Currency/status must follow the contract')
    if row['kind'].startswith('purchase') and not all(row[k] for k in ('supplier_code','supplier_name')):
        raise ValueError('Purchases require supplier identity')
    if row['kind'].startswith('consumption') and not row['cost_center_code']:
        raise ValueError('Consumption requires sector/store code')
    date.fromisoformat(row['occurred_on'][:10])
    row['occurred_on'] = row['occurred_on'][:10]
    timestamp = datetime.fromisoformat(row['source_updated_at'].replace('Z','+00:00'))
    if timestamp.tzinfo is None:
        raise ValueError('Source timestamp requires a timezone offset')
    for field in ('quantity_base','unit_cost_landed','total_landed'):
        try:
            number = Decimal(row[field])
        except InvalidOperation:
            raise ValueError(f'Invalid decimal: {field}') from None
        if not number.is_finite() or number < 0 or (field == 'quantity_base' and number == 0):
            raise ValueError(f'Invalid sign/value: {field}')
        row[field] = str(number)
    expected=(Decimal(row['quantity_base'])*Decimal(row['unit_cost_landed'])).quantize(Decimal('.01'),rounding=ROUND_HALF_UP)
    if abs(expected-Decimal(row['total_landed'])) > Decimal('.02'):
        raise ValueError('Total must reconcile with normalized quantity and landed unit cost')
    if row['access_key'] and not re.fullmatch(r'\d{44}',row['access_key']):
        raise ValueError('NFe access key must have 44 digits when provided')
    return row

def view_query(name):
    if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*', name):
        raise ValueError('View must be an explicit schema.name identifier')
    schema, view=name.split('.')
    return 'SELECT '+','.join('['+c+']' for c in COLUMNS)+f' FROM [{schema}].[{view}] ORDER BY [source_updated_at],[operation_key],[kind],[source_id],[line_id]'

def records(args):
    if args.csv:
        with Path(args.csv).open(encoding='utf-8-sig',newline='') as stream:
            reader=csv.DictReader(stream,delimiter=args.delimiter)
            if set(COLUMNS)-set(reader.fieldnames or []):
                raise ValueError('CSV does not contain all contract columns')
            yield from reader
        return
    query=view_query(args.view or os.environ.get('PROCFIT_VIEW_NAME',''))
    connection=os.environ.get('PROCFIT_ODBC_CONNECTION','')
    if not connection:
        raise ValueError('Missing read-only ODBC connection in environment')
    # Require certificate verification; do not weaken the server connection.
    if re.search(r'(?:TrustServerCertificate\s*=\s*(?:yes|true|1)|Encrypt\s*=\s*(?:no|false|0))',connection,re.I):
        raise ValueError('ODBC TLS and certificate verification are required')
    import pyodbc  # Optional, installed on the internal bridge host only.
    with pyodbc.connect(connection+';Encrypt=yes;TrustServerCertificate=no',readonly=True,timeout=30) as conn:
        conn.timeout=60
        cursor=conn.cursor()
        cursor.execute(query)
        keys=[column[0].lower() for column in cursor.description]
        while True:
            batch=cursor.fetchmany(500)
            if not batch:
                break
            for row in batch:
                yield dict(zip(keys,row))

def post_batch(operation, rows, run_id):
    endpoint=os.environ.get('PROCONSUMO_SUPABASE_URL','').rstrip('/')
    secret=os.environ.get('PROCONSUMO_SUPABASE_SERVICE_ROLE_KEY','')
    if endpoint != 'https://xscxwazanootrdtyrumb.supabase.co' or not secret:
        raise ValueError('Dedicated Proconsumo target/secret not configured')
    request=Request(endpoint+'/rest/v1/rpc/cp_ingest_procfit_batch',method='POST',
      data=json.dumps({'p_operation':operation,'p_batch_id':run_id,'p_rows':rows}).encode(),
      headers={'Content-Type':'application/json','apikey':secret,'Authorization':'Bearer '+secret})
    try:
        with urlopen(request,timeout=60) as response:
            return json.load(response)
    except HTTPError as exc:
        raise RuntimeError(f'Import rejected (HTTP {exc.code}); batch rolled back. Inspect server logs without exposing credentials.') from None
    except URLError:
        raise RuntimeError('Could not confirm import. Re-running is safe for fact IDs; check server status.') from None

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--csv',help='A canonical export; otherwise read the SQL view')
    parser.add_argument('--delimiter',default=';')
    parser.add_argument('--view',help='schema.view identifier, never arbitrary SQL')
    parser.add_argument('--operation',choices=('all','distributor','retail'),default='all')
    parser.add_argument('--max-rows',type=int,default=100000)
    parser.add_argument('--apply',action='store_true',help='Send validated rows to the dedicated Proconsumo server')
    args=parser.parse_args(argv)
    if args.max_rows<=0 or len(args.delimiter)!=1:
        raise ValueError('Invalid row limit or delimiter')
    seen=set();pending={'distributor':[],'retail':[]};count=0;run_id=str(uuid4())
    for raw in records(args):
        row=validate(raw)
        if args.operation!='all' and row['operation_key']!=args.operation:
            continue
        count+=1
        if count>args.max_rows:
            raise ValueError('Source exceeds row limit. Run stopped; never report this run as a complete synchronization.')
        key=tuple(row[k] for k in ('operation_key','kind','source_id','line_id'))
        if key in seen:
            raise ValueError('Duplicate source identity in the view/export; fix row multiplication before importing')
        seen.add(key)
        operation=row.pop('operation_key');pending[operation].append(row)
        if len(pending[operation])==500:
            if args.apply:
                post_batch(operation,pending[operation],run_id)
            pending[operation]=[]
    for operation,rows in pending.items():
        if args.apply and rows:
            post_batch(operation,rows,run_id)
    print(json.dumps({'mode':'applied' if args.apply else 'dry-run','validated_rows':count,'run_id':run_id,'source_writes':False}))
    return 0

if __name__=='__main__':
    try:
        sys.exit(main())
    except (ValueError,RuntimeError,ImportError) as error:
        print('STOPPED: '+str(error),file=sys.stderr)
        sys.exit(2)
    except Exception:
        # Driver exception text can contain a DSN/user/password. Do not print it.
        print('STOPPED: source connection/read failed; inspect the bridge host privately.',file=sys.stderr)
        sys.exit(2)
