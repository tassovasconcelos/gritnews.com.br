import {unzipSync,strFromU8} from 'fflate';
import {parseDocument} from 'htmlparser2';
export const MAX_BYTES=10*1024*1024,MAX_TEXT=1000000;
export class ReadError extends Error {constructor(code,message){super(message);this.code=code;}}
const children=n=>n.children??[];
function all(n,name){return [...(n.name===name?[n]:[]),...children(n).flatMap(c=>all(c,name))];}
function text(n){return n.type==='text'?n.data:children(n).map(text).join('');}
const clean=s=>s.replace(/\u0000/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
function xml(s){if(/<!DOCTYPE|<!ENTITY/i.test(s))throw new ReadError('unsafe_xml','XML com declaração externa não é aceito.');return parseDocument(s,{xmlMode:true,decodeEntities:true});}
export function chunkSections(sections){
 let length=0;const chunks=[];
 for(const section of sections){const value=clean(section.text);length+=value.length;if(length>MAX_TEXT)throw new ReadError('size_limit','Conteúdo excede 1 milhão de caracteres; divida o documento para leitura completa.');
  for(let offset=0;offset<value.length;offset+=2400)chunks.push({index:chunks.length,locator:section.locator,offset,text:value.slice(offset,offset+2400)});
 }
 if(!chunks.length)throw new ReadError('no_text','Nenhum texto extraível. O arquivo pode precisar de OCR.');
 return {text_content:chunks.map(c=>`[${c.locator}]\n${c.text}`).join('\n\n'),chunks};
}
function unzip(bytes){let size=0,entries=0;return unzipSync(bytes,{filter:f=>{if(++entries>3000)throw new ReadError('zip_limit','Arquivo contém entradas demais.');if(!/\.xml$|\.rels$/i.test(f.name))return false;size+=f.originalSize;if(f.originalSize>16*1024*1024||size>32*1024*1024)throw new ReadError('zip_limit','XML descompactado excede o limite.');return true;}});}
export function htmlText(value){
 const doc=parseDocument(value,{decodeEntities:true});
 const skip=new Set(['script','style','noscript','template','svg','head']);
 function visible(n){if(skip.has(n.name)||n.attribs?.hidden!==undefined||n.attribs?.['aria-hidden']==='true')return '';if(n.type==='text')return n.data;return children(n).map(visible).join(['p','div','section','article','li','tr','h1','h2','h3','br'].includes(n.name)?'\n':'');}
 return clean(visible(doc));
}
export async function extract(bytes,{name='',mime=''}={}){
 if(!bytes.length||bytes.length>MAX_BYTES)throw new ReadError('size_limit','Arquivo vazio ou maior que 10 MB.');
 const ext=name.toLowerCase().split(/[?#]/)[0].split('.').pop();let sections=[],method='',warnings=[];
 if(ext==='pdf'||mime.includes('application/pdf')||new TextDecoder().decode(bytes.slice(0,5))==='%PDF-'){
  const {getDocumentProxy}=await import('unpdf');let pdf;
  try{pdf=await getDocumentProxy(bytes,{isEvalSupported:false,maxImageSize:1000000,disableFontFace:true});if(pdf.numPages>200)throw new ReadError('page_limit','PDF acima de 200 páginas; divida o arquivo para leitura completa.');
   for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),content=await page.getTextContent();const value=content.items.map(i=>'str'in i?i.str+(i.hasEOL?'\n':' '):'').join('');sections.push({locator:`Página ${n}`,text:value});if(clean(value).length<3)warnings.push(`Página ${n} sem texto: conferir se precisa de OCR.`);page.cleanup();}
  }finally{await pdf?.destroy();}method='pdf-text';
 }else if(ext==='docx'){
  const files=unzip(bytes);if(!files['word/document.xml'])throw new ReadError('invalid_docx','Documento DOCX inválido.');
  const names=['word/document.xml',...Object.keys(files).filter(n=>/^word\/(header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(n)).sort()];
  for(const file of names){const doc=xml(strFromU8(files[file]));all(doc,'w:p').forEach((p,i)=>sections.push({locator:`${file} · parágrafo ${i+1}`,text:all(p,'w:t').map(text).join('')}));}
  method='docx-xml';if(Object.keys(files).some(n=>/word\/embeddings/.test(n)))warnings.push('Objetos incorporados exigem revisão separada.');
 }else if(ext==='xlsx'){
  const files=unzip(bytes),shared=files['xl/sharedStrings.xml']?all(xml(strFromU8(files['xl/sharedStrings.xml'])),'si').map(text):[];
  const workbook=files['xl/workbook.xml']?xml(strFromU8(files['xl/workbook.xml'])):null;
  if(!workbook)throw new ReadError('invalid_xlsx','Planilha XLSX inválida.');
  const relations=files['xl/_rels/workbook.xml.rels']?all(xml(strFromU8(files['xl/_rels/workbook.xml.rels'])),'Relationship'):[];
  for(const sheet of all(workbook,'sheet')){
   const rel=relations.find(r=>r.attribs.Id===sheet.attribs['r:id']),target=rel?.attribs.Target??'';
   const path=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');if(!files[path])throw new ReadError('invalid_xlsx','Não foi possível ler todas as abas da planilha.');
   for(const row of all(xml(strFromU8(files[path])),'row')){
    const cells=children(row).filter(c=>c.name==='c').map(c=>{const v=text(all(c,'v')[0]??{children:[]}),f=all(c,'f')[0];const value=c.attribs.t==='s'?(shared[Number(v)]??''):c.attribs.t==='inlineStr'?text(all(c,'is')[0]??{children:[]}):v;return `${c.attribs.r}: ${value}${f?` [fórmula: ${text(f)}; valor em cache, sem recálculo]`:''}`;});
    sections.push({locator:`Aba ${sheet.attribs.name} · linha ${row.attribs.r}`,text:cells.join(' | ')});
   }
  }method='xlsx-xml';warnings.push('Datas e números preservam valores da planilha; fórmulas não são recalculadas.');
 }else if(ext==='txt'||ext==='md'||mime.startsWith('text/plain')||mime.startsWith('text/markdown')){
  const value=new TextDecoder('utf-8',{fatal:true}).decode(bytes);sections=[{locator:'Texto integral',text:value}];method='utf8';
 }else if(mime.includes('text/html')||ext==='html'||ext==='htm'){
  const html=new TextDecoder().decode(bytes);if(/<input[^>]*type\s*=\s*["']?password/i.test(html))throw new ReadError('requires_login','Página exige login; forneça uma exportação do conteúdo.');sections=[{locator:'Página web',text:htmlText(html)}];method='html-visible-text';
 }else throw new ReadError('unsupported','Formato não suportado para leitura automática.');
 const result=chunkSections(sections);const needsOCR=warnings.some(w=>w.includes('OCR'));
 return {...result,method,units:sections.length,warnings,complete:!needsOCR};
}
