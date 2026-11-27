import {ABC_REFERENCE} from './tower-engine.mjs';
import {priceScenarios,campaignSensitivity,contribution,curveReference} from './tower-pricing-engine.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash=v=>v===null||v===undefined||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const pct=v=>v===null||v===undefined||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%';
const num=v=>v===null||v===undefined||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2});
const safeNumber=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&Number.isFinite(Number(v))?Number(v):null;
const nameMap={protecao:'Proteção de margem',competitivo:'Competitividade',promocao:'Promoção controlada',campanha:'Campanha de giro'};
const fileSizeLimit=6500000;
export function abcWorkbenchFrame(){
 return `<section class="ct-workbench" data-ct-abc id="cipAbcWorkbench" aria-labelledby="ctABCtitle">
 <div class="ct-workbench-head">
  <div><small>MARCA-PASSO · SIMULADOR COMERCIAL</small><h2 id="ctABCtitle">Mesa de margem, preços e campanhas</h2><p>Do SKU à decisão: curva ABC, custo, estoque, piso de contribuição, concorrência e cenários.</p></div>
  <div class="ct-workbench-meta"><span>${ABC_REFERENCE.total.toLocaleString('pt-BR')} SKUs na planilha de referência</span><strong>Sem aplicar preços ao ERP</strong></div>
 </div>
 <div class="ct-abc-quickstats">${ABC_REFERENCE.curves.map(r=>`<div><small>CURVA ${r.curve}</small><strong>${r.products.toLocaleString('pt-BR')} produtos</strong><span>LUCRO ${r.lucro} · DESPESA ${r.despesa} · COMISSÃO ${r.comissao}</span></div>`).join('')}</div>
 <p class="ct-abc-disclaimer">Os números LUCRO, DESPESA e COMISSÃO vieram da planilha, mas seu significado financeiro e vigência ainda precisam de homologação; não constituem pisos ou margens aprovados. Custos da posição histórica não são necessariamente custos atuais.</p>
 <div class="ct-abc-tabstrip"><button type="button" data-abc-tab="sim" aria-pressed="true">◉ Análise por produto</button><button type="button" data-abc-tab="import" aria-pressed="false">▣ Importar base ABC</button><button type="button" data-abc-tab="history" aria-pressed="false">▤ Cenários registrados</button></div>
 <div class="ct-abc-pane" data-abc-pane="sim">
  <div class="ct-abc-workspace">
   <section class="ct-abc-product-panel"><h3>1 · Encontre o produto</h3>
    <form data-abc-find class="ct-abc-find"><input name="q" maxlength="100" placeholder="SKU ou produto (mín. 2 letras)" aria-label="SKU ou produto" required><input name="category" maxlength="80" placeholder="Categoria (opcional)" aria-label="Filtrar categoria"><select name="curve" aria-label="Filtrar curva"><option value="">ABC</option><option value="A">A</option><option value="B">B</option><option value="C">C</option></select><button class="btn" type="submit">Pesquisar</button></form>
    <p class="ct-hint" data-abc-search-note>Base de estoque autorizada; pesquisar não consulta marketplace automaticamente.</p>
    <div data-abc-products class="ct-abc-products"><div class="ct-none">Pesquise um produto para ver custos e preços da última carga disponível.</div></div>
    <div data-abc-product-tag></div>
    <div class="ct-abc-source-status" data-abc-source>Base ABC por produto: aguardando consulta da empresa selecionada.</div>
   </section>
   <section class="ct-abc-calculation"><h3>2 · Monte hipóteses verificáveis</h3>
    <form data-abc-calc>
     <div class="ct-abc-fields">
      <label>Preço atual (R$)<input name="currentPrice" type="number" min=".01" step=".01" placeholder="Preço informado" required></label>
      <label>Custo unitário (R$)<input name="cost" type="number" min=".01" step=".01" placeholder="Custo informado" required></label>
      <label>Despesa variável (%)<input name="expensePct" type="number" min="0" max="99" step=".01" placeholder="Validar com financeiro" required></label>
      <label>Comissão (%)<input name="commissionPct" type="number" min="0" max="99" step=".01" placeholder="Validar comissão" required></label>
      <label>Custo adicional/unid. (R$)<input name="fixedCost" type="number" min="0" step=".01" value="0" required></label>
      <label>Margem mínima simulada (%)<input name="minimumMarginPct" type="number" min="0" max="95" step=".01" placeholder="Hipótese, não política" required></label>
      <label>Margem alvo simulada (%)<input name="targetMarginPct" type="number" min="0" max="95" step=".01" placeholder="Hipótese, não política" required></label>
      <label>Desconto promocional (%)<input name="discountPct" type="number" min="0" max="90" step=".5" value="5"></label>
      <label>Desconto campanha (%)<input name="campaignDiscountPct" type="number" min="0" max="90" step=".5" value="8"></label>
      <label>Unidades estoque (informado)<input name="availableUnits" type="number" min="0" step="1" placeholder="Se confirmado"></label>
      <label>Vendas comparáveis (un.)<input name="baselineUnits" type="number" min="0" step="1" placeholder="Obrigatório para comparar ganho"></label>
      <label>Vendas no cenário (un.)<input name="expectedUnits" type="number" min="0" step="1" placeholder="Não é previsão"></label>
      <label>Custo da campanha (R$)<input name="campaignCost" type="number" min="0" step=".01" value="0"></label>
      <label>Preço de mercado manual (R$)<input name="manualCompetitorPrice" type="number" min="0" step=".01" placeholder="Apenas análise exploratória"></label>
     </div>
     <div class="ct-abc-form-buttons"><button type="button" class="ct-small-button" data-abc-copy-reference>Usar parâmetros ABC apenas como hipótese</button><button type="submit" class="btn">Simular quatro estratégias</button></div>
    </form>
    <p data-abc-calc-status role="status" class="ct-hint"></p>
   </section>
  </div>
  <section class="ct-abc-sim-results" data-abc-results><div class="ct-none">Aguardando custos, preços e premissas de margem para comparar cenários.</div></section>
 </div>
 <div class="ct-abc-pane" data-abc-pane="import" hidden>
  <div class="ct-abc-import-layout">
   <div><h3>Importação versionada da curva ABC</h3><p>A planilha original contém 6.514 itens, porém não identifica a empresa de destino nem comprova políticas de margem. Selecione explicitamente a empresa no topo da Torre e importe o CSV preparado, preservando os campos originais.</p>
    <p><strong>Arquivo aceito:</strong> CSV UTF-8 com cabeçalhos TIPO;COD_PRODUTO;PRODUTO;LUCRO;DESPESA;COMISSAO; total de 6.514 produtos (A 3.545 · B 1.803 · C 1.166).</p>
    <input type="file" data-abc-file accept=".csv,text/csv" aria-label="Carregar arquivo CSV da curva ABC">
    <button type="button" class="btn" data-abc-import>Validar e importar para a empresa selecionada</button>
    <p data-abc-import-status role="status" aria-live="polite">Nenhum arquivo importado nesta sessão.</p></div>
   <div class="ct-abc-guardrails"><h4>Segurança e governança</h4><p>Dados gravados com RLS por empresa, rastreio de lote e autoria. Lotes incompletos não entram na busca. Uma importação pronta é apenas uma referência recebida — não uma política comercial aprovada.</p><p>Preços, campanhas e promoções continuam dependendo da validação de fonte, margem e alçada humana.</p></div>
  </div>
 </div>
 <div class="ct-abc-pane" data-abc-pane="history" hidden><div data-abc-history><div class="ct-none">Nenhum histórico carregado.</div></div></div>
 </section>`;
}
export function parseABCcsv(text){
 const src=String(text||'').replace(/^\uFEFF/,'');
 const lines=[],row=[];let field='',quoted=false;
 for(let i=0;i<src.length;i++){
  const c=src[i],next=src[i+1];
  if(c==='"'){if(quoted&&next==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(c===';'&&!quoted){row.push(field);field='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&next==='\n')i++;row.push(field);if(row.some(x=>x!==''))lines.push([...row]);row.length=0;field='';}
  else field+=c;
 }
 if(quoted)throw Error('Aspas não encerradas no CSV.');
 if(field||row.length){row.push(field);if(row.some(x=>x!==''))lines.push([...row]);}
 const header=lines.shift()?.map(x=>x.trim().toUpperCase())||[];
 if(header.join('|')!=='TIPO|COD_PRODUTO|PRODUTO|LUCRO|DESPESA|COMISSAO')throw Error('Cabeçalhos inválidos; use o CSV preparado da planilha original.');
 if(lines.length!==6514)throw Error('O CSV deve conter exatamente 6.514 produtos; foram encontrados '+lines.length+'.');
 const seen=new Set(),counts={A:0,B:0,C:0};
 const items=lines.map((r,i)=>{
  if(r.length!==6)throw Error('Linha '+(i+2)+' com número incorreto de colunas.');
  const curve=String(r[0]||'').match(/PRODUTOS CURVA - ([ABC])/i)?.[1]?.toUpperCase();
  const sku=String(r[1]||'').trim(),name=String(r[2]||'').trim();
  const values=r.slice(3).map(x=>Number(String(x).replace(',','.')));
  if(!curve||!/^[0-9a-z_-]{1,50}$/i.test(sku)||name.length<2||name.length>350||
     values.some(x=>!Number.isFinite(x)||x<0))throw Error('Dados inválidos na linha '+(i+2)+'.');
  if(seen.has(sku))throw Error('SKU repetido: '+sku);
  seen.add(sku);counts[curve]++;
  return {sku,product_name:name,curve,raw_lucro:values[0],raw_despesa:values[1],raw_comissao:values[2],source_line:i+2};
 });
 if(counts.A!==3545||counts.B!==1803||counts.C!==1166)throw Error('Distribuição ABC diferente da planilha original.');
 return {items,counts};
}
export function mountAbcWorkbench({root,db,user,companies,getCompany,getCanWrite,onDispose}){
 const $=s=>root.querySelector(s);
 let active=true,request=0,company=getCompany(),batch=null,products=[],selected=null,abc=null,
  references=[],currentResult=null,saving=false,importing=false,history=[];
 const live=()=>active&&root.isConnected&&window.cipAuth?.email===user.email;
 if(onDispose)onDispose(()=>{active=false;request++;});
 const status=(text,where='[data-abc-calc-status]')=>{const target=$(where);if(live()&&target)target.textContent=text;};
 function clearProduct(){
  products=[];selected=null;abc=null;references=[];currentResult=null;
  $('[data-abc-products]').innerHTML='<div class="ct-none">Pesquise um SKU ou descrição.</div>';
  $('[data-abc-product-tag]').textContent='';
  $('[data-abc-results]').innerHTML='<div class="ct-none">Escolha um produto, informe custos e margens e simule as estratégias.</div>';
  $('[data-abc-calc]').reset();
  status('');
 }
 async function loadContext(){
  const token=++request;company=getCompany();batch=null;clearProduct();
  if(!companies.includes(company))return;
  const {data,error}=await db.from('cip_abc_import_batches').select('id,company_id,created_at,status,expected_rows,source_file_name').eq('company_id',company).eq('status','ready').order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(!live()||token!==request)return;
  if(error){$('[data-abc-source]').textContent='Base ABC por produto indisponível: verifique permissões.';return;}
  batch=data||null;
  $('[data-abc-source]').textContent=batch?
   'ABC importada em '+new Date(batch.created_at).toLocaleString('pt-BR')+' · '+batch.expected_rows+' itens · referência não homologada.':
   'A ABC da planilha está disponível apenas em resumo; importe o arquivo para relacionar cada SKU à curva.';
 }
 function productCard(p,i){
  return `<button type="button" class="ct-abc-product-item" data-abc-pick="${i}"><strong>${esc(p.sku)} · ${esc(p.description)}</strong><span>Loja ${esc(p.store_code||'—')} · Curva ${esc(p.curve||'—')} · ${esc(p.product_group||'categoria pendente')}</span><small>Preço da carga ${cash(p.sale_price)} · Custo ${cash(p.unit_cost)} · Saldo ${num(p.quantity)} un. · Fonte ${esc(p.as_of||'sem data')}</small></button>`;
 }
 async function search(filters){
  const token=++request;
  const term=String(filters?.term||'').trim().slice(0,100);
  const category=String(filters?.category||'').trim().replace(/[%_]/g,'').slice(0,80);
  const curve=['A','B','C'].includes(filters?.curve)?filters.curve:'';
  if(term.length<2){status('Informe no mínimo 2 caracteres.','[data-abc-search-note]');return;}
  let base=db.from('cip_shopping_stock_rows').select('sku,description,store_code,curve,product_group,unit_cost,sale_price,quantity,as_of,company_id')
   .eq('company_id',company).order('quantity',{ascending:false}).limit(18);
  if(category)base=base.ilike('product_group','%'+category+'%');
  if(curve)base=base.eq('curve',curve);
  const query=/^\d{2,30}$/.test(term)?base.eq('sku',term):base.ilike('description','%'+term.replace(/[%_]/g,'')+'%');
  status('Consultando registro histórico por SKU/categoria...','[data-abc-search-note]');
  const {data,error}=await query;
  if(!live()||token!==request)return;
  if(error){products=[];status('Consulta indisponível: '+error.message,'[data-abc-search-note]');return;}
  products=data||[];
  if(!products.length&&batch){
    let fallback=db.from('cip_abc_products').select('sku,product_name,curve').eq('company_id',company).eq('import_id',batch.id).limit(18);
    if(curve)fallback=fallback.eq('curve',curve);
    fallback=/^\d{2,30}$/.test(term)?fallback.eq('sku',term):fallback.ilike('product_name','%'+term.replace(/[%_]/g,'')+'%');
    const found=await fallback;
    if(!live()||token!==request)return;
    if(!found.error)products=(found.data||[]).map(p=>({sku:p.sku,description:p.product_name,curve:p.curve,store_code:null,
      product_group:null,unit_cost:null,sale_price:null,quantity:null,as_of:null,sourceOrigin:'abc_import'}));
  }
  $('[data-abc-products]').innerHTML=products.length?products.map(productCard).join(''):'<div class="ct-none">Nenhum SKU encontrado nesta empresa na fonte consultável.</div>';
  status(products.length+' registros da posição histórica. Consulte também o Marca-passo original para regras aprovadas.','[data-abc-search-note]');
 }
 async function choose(index){
  const p=products[index];if(!p)return;
  const token=++request;selected=p;abc=null;references=[];currentResult=null;
  const form=$('[data-abc-calc]');form.reset();
  form.elements.currentPrice.value=p.sale_price??'';
  form.elements.cost.value=p.unit_cost??'';
  form.elements.availableUnits.value=p.quantity??'';
  const abcQuery=batch?db.from('cip_abc_products').select('curve,raw_lucro,raw_despesa,raw_comissao,product_name')
    .eq('import_id',batch.id).eq('company_id',company).eq('sku',p.sku).maybeSingle():Promise.resolve({data:null,error:null});
  const refQuery=db.from('cip_mp_market_refs').select('normalized_price,equivalent,active,availability,observed_on,source_url,competitor,channel')
    .eq('company_id',company).eq('sku',p.sku).eq('equivalent',true).eq('active',true).order('observed_on',{ascending:false}).limit(5);
  const [a,r]=await Promise.all([abcQuery,refQuery]);
  if(!live()||token!==request)return;
  abc=a.error?null:a.data;
  references=r.error?[]:r.data||[];
  const curve=abc?.curve||p.curve||'—';
  $('[data-abc-product-tag]').innerHTML=`<div class="ct-abc-selected"><strong>Produto selecionado: ${esc(p.description)}</strong><span>SKU ${esc(p.sku)} · Curva ${esc(curve)} · Categoria ${esc(p.product_group||'não informada')} · Loja ${esc(p.store_code||'—')}</span><span>Carga histórica: ${esc(p.as_of||'sem data')} · Referências concorrentes elegíveis: ${references.length}</span></div>`;
  status('Produto carregado. Preencha despesas, comissão e margens antes de simular; a origem precisa de atualização.');
 }
 function compute(){
  const f=$('[data-abc-calc]'),values=Object.fromEntries(new FormData(f).entries());
  const c=references[0]||null;
  const input={...values,stockAsOf:selected?.as_of||null,stockSource:'historical_stock',
    competitor:c||{normalized_price:values.manualCompetitorPrice,equivalent:false,active:false,availability:'nao_confirmado'}};
  const result=campaignSensitivity(input);
  currentResult=result;
  renderResult(result,input);
 }
 function renderResult(result,input){
  if(!result.ready){$('[data-abc-results]').innerHTML='<div class="ct-none">'+esc(result.blockers.join(' · '))+'</div>';return;}
  const warnings=result.warnings.map(w=>'<li>'+esc(w)+'</li>').join('');
  const before=result.before;
  const rows=result.scenarios.map(s=>`<tr><td>${esc(nameMap[s.kind])}</td><td>${s.available?cash(s.suggestedPrice):'Bloqueado'}</td><td>${pct(s.marginPct)}</td><td>${cash(s.contributionUnit)}</td><td>${pct(s.priceChangePct)}</td><td>${cash(s.expectedContribution)}</td><td>${cash(s.scenarioDifference)}</td></tr>`).join('');
  const stale=input.stockAsOf?'Fonte: estoque histórico em '+input.stockAsOf:'Custos/preços inseridos manualmente';
  $('[data-abc-results]').innerHTML=`<div class="ct-abc-result-head"><div><small>CÁLCULO WHAT-IF · SEM EXECUÇÃO COMERCIAL</small><h3>3 · Compare os cenários</h3><p>${esc(result.headline)}</p></div><span class="ct-abc-simulation">Simulação, não resultado</span></div>
   <div class="ct-abc-numbers"><article><small>Preço vigente da origem</small><strong>${cash(input.currentPrice)}</strong><span>${esc(stale)}</span></article><article><small>Margem de contribuição simulada</small><strong>${pct(before.marginPct)}</strong><span>${cash(before.contributionUnit)} por unidade</span></article><article><small>Piso calculado (não aprovado)</small><strong>${cash(result.floor)}</strong><span>Premissas digitadas</span></article><article><small>Preço para margem alvo</small><strong>${cash(result.target)}</strong><span>Revisão do financeiro exigida</span></article></div>
   <div class="ct-abc-table"><table><thead><tr><th>Cenário</th><th>Preço sugerido</th><th>Margem</th><th>Contrib./un.</th><th>Variação preço</th><th>Contrib. total*</th><th>Diferença*</th></tr></thead><tbody>${rows}</tbody></table></div>
   <p class="ct-hint">* Apenas quando volumes comparáveis forem informados; não é previsão nem ganho efetivo. O preço competitivo só é habilitado com referência equivalente, ativa, disponível e atualizada.</p>
   <ul class="ct-abc-warnings">${warnings}</ul>
   <div class="ct-abc-recommend"><strong>Ponto de equilíbrio da campanha:</strong> ${result.breakEvenUnits===null?'—':result.breakEvenUnits+' unidades teóricas'} <span>Para preservar contribuição da base, sem considerar canibalização, impostos adicionais ou mudança de mix.</span></div>
   <div class="ct-abc-result-actions"><button class="btn secondary" type="button" data-abc-save>Salvar esta simulação</button><button class="btn" type="button" data-abc-escalate>Encaminhar proposta para avaliação</button></div>
   <p data-abc-write-status role="status"></p>`;
 }
 async function save(kind='simulation'){
  if(saving||!getCanWrite()){status('É necessário perfil com permissão de escrita nesta empresa.');return;}
  if(!currentResult?.ready){status('Simule o cenário antes de salvar.');return;}
  const f=$('[data-abc-calc]'),values=Object.fromEntries(new FormData(f).entries());
  const proposed=currentResult.scenarios.find(s=>s.kind==='protecao');
  saving=true;status('Registrando o cenário auditável...');
  try{
   if(kind==='simulation'){
    const payload={company_id:company,sku:selected?.sku||String(values.sku||'MANUAL'),
      store_code:selected?.store_code||null,source_stock_as_of:selected?.as_of||null,
      source_abc_import_id:batch?.id||null,inputs:{...values,sourceStock:selected?'historical':'manual',curve:abc?.curve||selected?.curve||null},
      result:currentResult,scenario_kind:'protecao',
      source_kind:selected?'manual_with_historical_stock':'manual',created_by:user.id};
    const {error}=await db.from('cip_tower_price_scenarios').insert(payload);
    if(error)throw error;
    status('Simulação salva. Nenhum preço foi alterado.','[data-abc-write-status]');
   }else{
    if(!selected?.sku)throw Error('Selecione um SKU antes de encaminhar.');
    const d='Proposta baseada em simulação de margem; SKU '+selected.sku+', loja '+(selected.store_code||'—')+
     ', preço de origem '+values.currentPrice+', piso hipotético '+currentResult.floor+
     ', preço cenário proteção '+proposed?.suggestedPrice+'. Revisar fonte, política e aprovação.';
    const {error}=await db.from('cip_tower_tasks').insert({company_id:company,agent_code:'marca_passo',
     title:('Avaliar preço e margem do SKU '+selected.sku).slice(0,160),description:d,status:'proposta',priority:'normal',
     source_module:'torre_precos',source_reference:selected.sku,evidence_note:'Simulação; custo e preço de '+(selected.as_of||'fonte manual'),created_by:user.id});
    if(error)throw error;
    status('Proposta encaminhada para revisão. Nenhuma alteração no Procfit/PDV.','[data-abc-write-status]');
   }
  }catch(err){status('Falha ao registrar: '+(err.message||'verifique acesso'),'[data-abc-write-status]');}
  finally{saving=false;}
 }
 async function loadHistory(){
  const {data,error}=await db.from('cip_tower_price_scenarios').select('sku,store_code,scenario_kind,result,source_stock_as_of,created_at,source_kind')
    .eq('company_id',company).order('created_at',{ascending:false}).limit(35);
  if(!live())return;
  if(error){$('[data-abc-history]').textContent='Histórico indisponível para este perfil.';return;}
  history=data||[];
  $('[data-abc-history]').innerHTML=history.length?`<div class="ct-abc-table"><table><thead><tr><th>SKU</th><th>Loja</th><th>Data</th><th>Fonte</th><th>Piso simulado</th><th>Estado</th></tr></thead><tbody>${history.map(h=>`<tr><td>${esc(h.sku)}</td><td>${esc(h.store_code||'—')}</td><td>${new Date(h.created_at).toLocaleString('pt-BR')}</td><td>${esc(h.source_kind)}</td><td>${cash(h.result?.floor)}</td><td>Simulação, não executada</td></tr>`).join('')}</tbody></table></div>`:'<div class="ct-none">Nenhum cenário ainda foi registrado para esta empresa.</div>';
 }
 function showTab(tab){
  root.querySelectorAll('[data-abc-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.abcTab===tab)));
  root.querySelectorAll('[data-abc-pane]').forEach(p=>p.hidden=p.dataset.abcPane!==tab);
  if(tab==='history')loadHistory();
 }
 async function importFile(){
  if(importing||!getCanWrite()){status('Seu perfil não pode importar arquivos para esta operação.','[data-abc-import-status]');return;}
  const file=$('[data-abc-file]').files?.[0];
  if(!file||!file.name.toLowerCase().endsWith('.csv')||file.size>fileSizeLimit){status('Selecione CSV UTF-8 de até 6,5 MB.','[data-abc-import-status]');return;}
  importing=true;let batchId=null;
  try{
   status('Validando o arquivo original e os códigos...','[data-abc-import-status]');
   const bytes=await file.arrayBuffer();
   const utf8=new TextDecoder('utf-8').decode(bytes),parsed=parseABCcsv(utf8);
   if(!live())return;
   const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
   const {data:b,error:err}=await db.from('cip_abc_import_batches').insert({company_id:company,source_file_name:file.name.slice(0,180),source_sha256:sha,expected_rows:parsed.items.length,imported_by:user.id}).select('id').single();
   if(err||!b?.id)throw Error(err?.message||'Lote não foi criado.');
   batchId=b.id;
   const chunk=150;
   for(let i=0;i<parsed.items.length;i+=chunk){
    if(!live())throw Error('Sessão encerrada; lote permaneceu incompleto e não será utilizado.');
    const payload=parsed.items.slice(i,i+chunk).map(r=>({...r,company_id:company,import_id:batchId,recorded_by:user.id}));
    const {error}=await db.from('cip_abc_products').insert(payload);
    if(error)throw Error('Falha no bloco '+(1+Math.floor(i/chunk))+': '+error.message);
    status('Importando produtos '+Math.min(i+chunk,parsed.items.length)+' / '+parsed.items.length+'...','[data-abc-import-status]');
   }
   const {data:finish,error:finishError}=await db.rpc('cip_abc_finish_import',{p_import_id:batchId});
   if(finishError)throw finishError;
   status('Importação concluída: '+finish.rows+' produtos na empresa selecionada. A base permanece referência não homologada.','[data-abc-import-status]');
   await loadContext();
  }catch(err){status('Importação não finalizada: '+(err.message||'falha')+'. O lote parcial não é usado para decisões.','[data-abc-import-status]');}
  finally{importing=false;}
 }
 root.addEventListener('click',e=>{
  const tab=e.target.closest('[data-abc-tab]');if(tab){showTab(tab.dataset.abcTab);return;}
  const product=e.target.closest('[data-abc-pick]');if(product){choose(Number(product.dataset.abcPick));return;}
  if(e.target.closest('[data-abc-copy-reference]')){
   const curve=abc?.curve||selected?.curve,source=abc?{curve:abc.curve,lucro:abc.raw_lucro,despesa:abc.raw_despesa,comissao:abc.raw_comissao}:curveReference(curve,ABC_REFERENCE);
   if(!source){status('Curva ABC não identificada para este produto.');return;}
   const f=$('[data-abc-calc]');f.elements.expensePct.value=source.despesa??source.raw_despesa;
   f.elements.commissionPct.value=source.comissao??source.raw_comissao;
   f.elements.minimumMarginPct.value=source.lucro??source.raw_lucro;
   f.elements.targetMarginPct.value=(source.lucro??source.raw_lucro);
   status('Parâmetros originais aplicados SOMENTE como hipótese desta simulação; não são política aprovada.');
   return;
  }
  if(e.target.closest('[data-abc-save]'))save('simulation');
  if(e.target.closest('[data-abc-escalate]'))save('proposal');
  if(e.target.closest('[data-abc-import]'))importFile();
 });
 root.addEventListener('submit',e=>{
  if(e.target.matches('[data-abc-find]')){e.preventDefault();const form=new FormData(e.target);search({term:form.get('q'),category:form.get('category'),curve:form.get('curve')});}
  if(e.target.matches('[data-abc-calc]')){e.preventDefault();compute();}
 });
 loadContext();
 return {setCompany:()=>{if(company!==getCompany())loadContext();},open:()=>{$('[data-ct-abc]').scrollIntoView({behavior:'smooth',block:'start'});showTab('sim');}};
}
