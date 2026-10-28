"""Read a supplied XLS directory; export business reference fields only, never contacts."""
import argparse,collections,hashlib,json,re,unicodedata,urllib.parse
from pathlib import Path
import pandas as pd
STATES={'AC':'Acre','AL':'Alagoas','AP':'Amapá','AM':'Amazonas','BA':'Bahia','CE':'Ceará','DF':'Distrito Federal','ES':'Espírito Santo','GO':'Goiás','MA':'Maranhão','MT':'Mato Grosso','MS':'Mato Grosso do Sul','MG':'Minas Gerais','PA':'Pará','PB':'Paraíba','PR':'Paraná','PE':'Pernambuco','PI':'Piauí','RJ':'Rio de Janeiro','RN':'Rio Grande do Norte','RS':'Rio Grande do Sul','RO':'Rondônia','RR':'Roraima','SC':'Santa Catarina','SP':'São Paulo','SE':'Sergipe','TO':'Tocantins'}
REGIONS={**dict.fromkeys(['AC','AP','AM','PA','RO','RR','TO'],'Norte'),**dict.fromkeys(['AL','BA','CE','MA','PB','PE','PI','RN','SE'],'Nordeste'),**dict.fromkeys(['DF','GO','MT','MS'],'Centro-Oeste'),**dict.fromkeys(['ES','MG','RJ','SP'],'Sudeste'),**dict.fromkeys(['PR','RS','SC'],'Sul')}
def fold(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
def place(address):
 a=address.replace('\x96',' - ');f=fold(a);matches=[]
 for uf,name in STATES.items():
  for m in re.finditer(r'(?<![a-z])'+re.escape(fold(name))+r'(?![a-z])',f):matches.append((m.start(),m.end(),uf))
  for m in re.finditer(r'(?:/|[-,;]\s*|\s+)'+uf+r'(?=\s*[,/;|\-]|\s+(?:\d|CEP)|\s*$)',a,re.I):matches.append((m.start(),m.end(),uf))
 if not matches:return None,None,'missing'
 start,end,uf=max(matches,key=lambda x:x[0]);prefix=re.sub(r'State of\s*$','',a[:start],flags=re.I).strip(' ,-/');tokens=re.split(r'\s+-\s+|[,;]',prefix);city=tokens[-1].strip()
 if not city or len(city)>70 or re.search(r'\d|^(rua|r\.|av\.?|avenida|rod|travessa|tv\.|praca|praça|alameda|bairro|centro|brasil|brazil)\b',city,re.I):city=None
 if city:city=' '.join(w.lower() if w.lower() in ['de','do','da','dos','das','e'] else w.capitalize() for w in city.split())
 return uf,city,'parsed' if city else 'state_only'
def site(value):
 try:
  u=urllib.parse.urlsplit(value.strip());h=(u.hostname or '').lower().removeprefix('www.')
  if u.scheme not in ['http','https'] or u.username or u.password or not re.fullmatch(r'(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}',h) or h.endswith(('.local','.internal','.invalid','.test','.onion')):return None,None,False
  social=any(h==d or h.endswith('.'+d) for d in ['instagram.com','facebook.com','linktr.ee','google.com','wixsite.com'])
  return urllib.parse.urlunsplit(('https',u.netloc,u.path,u.query,'')),h,not social
 except Exception:return None,None,False
def audit(path):
 frame=pd.read_excel(path).fillna('');frame.columns=[str(c).strip() for c in frame.columns];sha=hashlib.sha256(Path(path).read_bytes()).hexdigest();rows=[];keys=collections.Counter()
 for index,r in frame.iterrows():
  name=str(r['Nome Loja']).strip();address=str(r['Endereço']).strip();uf,city,geo=place(address);url,domain,eligible=site(str(r['Site']));owned='prohospital' in fold(name) or domain=='shoppingprohospital.com.br'
  key=fold(name)+'|'+fold(address);keys[key]+=1
  segment='Locação' if re.search('loca|aluga',fold(name)) else 'Distribuição' if 'distrib' in fold(name) else 'Ortopedia' if 'ortop' in fold(name) else 'Cirúrgica / hospitalar' if re.search('cirurg|hospital|medic',fold(name)) else 'Segmento a confirmar'
  rows.append({'source_row':index+2,'source_key':str(r['Ciente Theramart']).removesuffix('.0'),'name':name,'address':address,'state':uf,'city':city,'region':REGIONS.get(uf),'geo_status':geo,'site_url':url,'domain':domain,'is_owned':owned,'monitor_enabled':bool(eligible and not owned),'segment':segment,'source_updated_text':str(r['Última Atualização']),'source_hash':sha,'dedup_key':hashlib.sha256(key.encode()).hexdigest()})
 summary={'rows':len(rows),'states':dict(collections.Counter(r['state'] or 'Não informado' for r in rows)),'cities_parsed':sum(bool(r['city']) for r in rows),'distinct_city_state':len({(r['city'],r['state']) for r in rows if r['city']}),'missing_sites':int((frame['Site']=='').sum()),'owned':sum(r['is_owned'] for r in rows),'monitor_rows':sum(r['monitor_enabled'] for r in rows),'monitor_domains':len({r['domain'] for r in rows if r['monitor_enabled']}),'duplicate_name_address':sum(n-1 for n in keys.values()),'source_hash':sha,'missing_phone':int((frame['Telefone']=='').sum()),'missing_email':int((frame['E-Mail']=='').sum())}
 return {'source_name':Path(path).name,'summary':summary,'rows':rows}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');args=p.parse_args();data=audit(args.source);Path(args.output).write_text(json.dumps(data,ensure_ascii=False));Path(args.output).chmod(0o600);print(json.dumps(data['summary'],ensure_ascii=False))
