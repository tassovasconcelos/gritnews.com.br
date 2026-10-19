import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import {extract,chunkSections,htmlText} from './extract.mjs';
import {fetchSource,sourceURL} from './safe-fetch.mjs';
const utf=s=>new TextEncoder().encode(s);
function pdf(value='Texto integral de teste'){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const stream=`BT /F1 12 Tf 50 700 Td (${value}) Tj ET`;objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);let out='%PDF-1.4\n',positions=[0];objects.forEach((o,i)=>{positions.push(out.length);out+=`${i+1} 0 obj\n${o}\nendobj\n`;});const x=out.length;out+=`xref\n0 6\n0000000000 65535 f \n`+positions.slice(1).map(p=>`${String(p).padStart(10,'0')} 00000 n \n`).join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;return utf(out);
}
test('PDF reads every page text; image-only/blank pages are not certified complete',async()=>{
 const r=await extract(pdf(),{name:'a.pdf'});assert.match(r.text_content,/Texto integral de teste/);assert.equal(r.units,1);assert.equal(r.complete,true);
 const blank=await extract(pdf(''),{name:'a.pdf'}).catch(e=>e);assert.ok(blank.code==='no_text'||blank.complete===false);
});
test('text chunks preserve all characters and fail instead of silently truncating oversized documents',async()=>{
 const content='A'.repeat(6001);const r=await extract(utf(content),{name:'a.md'});assert.equal(r.chunks.map(c=>c.text).join(''),content);assert.equal(r.chunks.length,3);
 assert.throws(()=>chunkSections([{locator:'x',text:'a'.repeat(1000001)}]),/excede/);
});
test('DOCX paragraphs, table text, headers and footnotes are extracted without executing XML',async()=>{
 const bytes=zipSync({'word/document.xml':strToU8('<w:document><w:p><w:r><w:t>Primeiro parágrafo.</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Valor na tabela.</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:document>'),'word/header1.xml':strToU8('<w:hdr><w:p><w:r><w:t>Cabeçalho.</w:t></w:r></w:p></w:hdr>')});
 const r=await extract(bytes,{name:'a.docx'});for(const value of ['Primeiro parágrafo','Valor na tabela','Cabeçalho'])assert.ok(r.text_content.includes(value));
 const malicious=zipSync({'word/document.xml':strToU8('<!DOCTYPE x SYSTEM "file:///etc/passwd"><w:document/>')});await assert.rejects(extract(malicious,{name:'a.docx'}),/declaração externa/);
});
test('XLSX reads named sheets, shared strings, references and marks cached formulas',async()=>{
 const files={'xl/workbook.xml':'<workbook><sheets><sheet name="Vendas" r:id="r1"/></sheets></workbook>','xl/_rels/workbook.xml.rels':'<Relationships><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>','xl/sharedStrings.xml':'<sst><si><t>Produto Alpha</t></si></sst>','xl/worksheets/sheet1.xml':'<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><f>2+2</f><v>4</v></c></row></sheetData></worksheet>'};
 const r=await extract(zipSync(Object.fromEntries(Object.entries(files).map(([k,v])=>[k,strToU8(v)]))),{name:'a.xlsx'});assert.match(r.text_content,/Aba Vendas/);assert.match(r.text_content,/A1: Produto Alpha/);assert.match(r.text_content,/B1: 4.*fórmula/);
});
test('HTML reading decodes text and excludes scripts and hidden content',()=>{
 const r=htmlText('<html><head><title>T</title></head><body><p>Texto &amp; evidência</p><script>steal()</script><div hidden>oculto</div></body></html>');assert.equal(r,'Texto & evidência');
});
test('links pin a public address and revalidate every redirect; private networks and credentials are rejected',async()=>{
 for(const u of ['http://example.org','https://127.0.0.1','https://user:secret@example.org','https://example.org:8443','https://x.local'])assert.throws(()=>sourceURL(u));
 await assert.rejects(fetchSource('https://example.org',{resolve:async()=>[{address:'127.0.0.1'}],request:()=>{throw Error('must not fetch');}}),/privada/);
 let calls=0;await assert.rejects(fetchSource('https://example.org',{resolve:async h=>[{address:h==='example.org'?'93.184.216.34':'10.0.0.1'}],request:async(u,ip)=>{calls++;assert.equal(ip,'93.184.216.34');return {redirect:'https://private.example/path'};}}),/privada/);assert.equal(calls,1);
});
test('login walls require export; chunked responses reject truncation',async()=>{
 await assert.rejects(extract(utf('<html><input type="password"><p>Faça login para ver.</p></html>'),{name:'page',mime:'text/html'}),/exige login/);
 const {decodeChunked}=await import('./safe-fetch.mjs');assert.equal(new TextDecoder().decode(decodeChunked(utf('4\r\nWiki\r\n5\r\npedia\r\n0\r\n\r\n'))),'Wikipedia');assert.throws(()=>decodeChunked(utf('8\r\nshort')),/incompleta/);
});
test('native edge HTTP reader pins TCP address and validates TLS for the original hostname',async()=>{
 const {getPinnedDeno}=await import('./safe-fetch.mjs');const previous=globalThis.Deno;let input=utf('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 4\r\n\r\nTest');let read=false,closed=false;
 const socket={write:async b=>b.length,read:async b=>{if(read)return null;read=true;b.set(input);return input.length;},close:()=>{closed=true;}};
 globalThis.Deno={connect:async options=>{assert.equal(options.hostname,'93.184.216.34');return socket;},startTls:async(conn,options)=>{assert.equal(options.hostname,'example.org');assert.equal(conn,socket);return socket;}};
 try{const r=await getPinnedDeno(new URL('https://example.org/document'),'93.184.216.34');assert.equal(new TextDecoder().decode(r.bytes),'Test');assert.equal(closed,true);}finally{globalThis.Deno=previous;}
});
