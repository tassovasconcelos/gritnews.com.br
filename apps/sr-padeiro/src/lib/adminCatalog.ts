export type CatalogRow={id?:string;name:string;category:string;variant:string;unit:string;sale_price:number;cost_price:number|null;barcode:string;external_key:string;fulfillment:string;catalog_notes:string;active:boolean};
export function parseCsv(text:string):Record<string,string>[] {
  const source=text.replace(/^\uFEFF/,'');const delimiter=source.split(/\r?\n/,1)[0].includes(';')?';':',';
  const lines:string[][]=[];let row:string[]=[];let field='';let quoted=false;
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(c==='"'){if(quoted&&source[i+1]==='"'){field+='"';i++}else quoted=!quoted}
    else if(c===delimiter&&!quoted){row.push(field);field=''}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))lines.push(row);row=[];field=''}
    else field+=c;
  }
  if(quoted)throw new Error('Há aspas sem fechamento no arquivo.');row.push(field);if(row.some(v=>v.trim()))lines.push(row);
  const headers=lines.shift()?.map(v=>v.trim());if(!headers?.length)throw new Error('Arquivo vazio.');if(new Set(headers).size!==headers.length)throw new Error('Há colunas repetidas no arquivo.');
  return lines.map((cells,index)=>{if(cells.length!==headers.length)throw new Error(`Linha ${index+2}: quantidade de colunas inválida.`);return Object.fromEntries(headers.map((h,i)=>[h,cells[i]]))});
}
export function parseCatalog(text:string):CatalogRow[]{
  const clean=text.replace(/^\uFEFF/,'');const raw:unknown=clean.trimStart().startsWith('[')?JSON.parse(clean):parseCsv(clean);
  if(!Array.isArray(raw)||raw.length<1||raw.length>1000)throw new Error('O arquivo deve conter de 1 a 1000 produtos.');const keys=new Set<string>();
  return raw.map((value,index)=>{
    if(!value||typeof value!=='object')throw new Error(`Linha ${index+1}: produto inválido.`);const r=value as Record<string,unknown>;
    const number=(v:unknown)=>typeof v==='number'?v:Number(String(v??'').trim().replace(',','.'));
    const unitRaw=String(r.unit??r.unidade??'UN').toUpperCase();const units:Record<string,string>={UNIDADE:'UN',CENTO:'CAIXA'};const unit=units[unitRaw]||unitRaw;
    const cents=r.preco_centavos!==undefined;const priceRaw=cents?r.preco_centavos:r.sale_price;
    if(priceRaw===undefined||priceRaw===null||String(priceRaw).trim()==='')throw new Error(`Linha ${index+1}: preço não informado.`);
    const price=cents?number(priceRaw)/100:number(priceRaw);
    const name=String(r.name??r.nome??'').trim();const category=String(r.category??r.categoria??'').trim();const variant=String(r.variant??r.variante??'').trim();
    const external=String(r.external_key??'').trim()||[category,name,variant,unit].join('|').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const fulfillment=String(r.fulfillment??r.modalidade??'confirmar');
    if(!name||!Number.isFinite(price)||price<0||Math.abs(price*100-Math.round(price*100))>0.00001||(cents&&!Number.isInteger(number(r.preco_centavos))))throw new Error(`Linha ${index+1}: nome ou preço inválido.`);
    if(!['UN','KG','G','L','ML','PACOTE','CAIXA'].includes(unit)||!['pronta_entrega','encomenda','confirmar'].includes(fulfillment))throw new Error(`Linha ${index+1}: unidade ou modalidade inválida.`);
    if(keys.has(external))throw new Error(`Linha ${index+1}: produto duplicado no arquivo.`);keys.add(external);
    const cost=r.cost_price===undefined||r.cost_price===null||r.cost_price===''?null:number(r.cost_price);if(cost!==null&&(!Number.isFinite(cost)||cost<0))throw new Error(`Linha ${index+1}: custo inválido.`);
    return {name,category,variant,unit,sale_price:price,cost_price:cost,barcode:String(r.barcode??''),external_key:external,fulfillment,catalog_notes:[String(r.catalog_notes??r.observacao??''),unitRaw==='CENTO'?'Caixa de 100 unidades; preço por cento.':''].filter(Boolean).join(' '),active:false};
  });
}
