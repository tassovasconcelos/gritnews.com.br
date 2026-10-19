// Pure read-only calculations. Call only on a server-authorized, reconciled snapshot.
// Not connected to Telegram or an ERP endpoint until ingestion is homologated.
const companies = ['shopping_prohospital', 'distribuidora_prohospital'];
const fail = code => ({available:false, reason:code});
const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const money = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e10 && Math.abs(value*100-Math.round(value*100))<0.001;
const sumMoney = values => {const cents=values.reduce((s,v)=>s+Math.round(v*100),0);if(!Number.isSafeInteger(cents))throw Error('amount_overflow');return cents/100;};

export function operationalReport({snapshot, company, authorizedCompanies=[], storeIds=[], start, end, now=new Date(), maxAgeMinutes=1440}={}) {
  if(!companies.includes(company)||!authorizedCompanies.includes(company)||!storeIds.length||storeIds.some(s=>typeof s!=='string'||!s))return fail('scope_required');
  if(!day(start)||!day(end)||start>end)return fail('invalid_period');
  if(!snapshot)return fail('source_unavailable');
  if(snapshot.schema!=='cip-procfit-v1'||snapshot.reconciled!==true||typeof snapshot.source!=='string'||!snapshot.source.trim())return fail('source_not_reconciled');
  const observed=Date.parse(snapshot.captured_at), clock=+new Date(now);
  if(!Number.isFinite(observed)||!Number.isFinite(clock)||observed>clock||!Number.isFinite(maxAgeMinutes)||maxAgeMinutes<=0)return fail('invalid_timestamp');
  const coverage=snapshot.coverage?.[company];
  if(!coverage||coverage.stores?.length!==storeIds.length||!storeIds.every(s=>coverage.stores.includes(s))||!day(coverage.sales_from)||!day(coverage.sales_through)||coverage.sales_from>start||coverage.sales_through<end)return fail('incomplete_coverage');
  const datasets=snapshot.datasets;
  if(!Array.isArray(datasets?.sales)||!Array.isArray(datasets?.inventory))return fail('datasets_missing');
  const inScope=r=>r.company_id===company&&storeIds.includes(r.store_id);
  const sales=datasets.sales.filter(inScope), inventory=datasets.inventory.filter(inScope);
  const keys=new Set();
  for(const r of sales){
    const key=JSON.stringify([r.store_id,r.sku,r.sale_date]);
    if(!r.sku||!day(r.sale_date)||!money(r.net_revenue)||keys.has(key))return fail('invalid_sales');
    keys.add(key);
  }
  keys.clear();
  for(const r of inventory){
    const key=JSON.stringify([r.store_id,r.sku]);
    if(!r.sku||!money(r.stock_value)||r.stock_value<0||typeof r.quantity_available!=='number'||!Number.isFinite(r.quantity_available)||r.quantity_available<0||keys.has(key))return fail('invalid_inventory');
    keys.add(key);
  }
  const selected=sales.filter(r=>r.sale_date>=start&&r.sale_date<=end);
  // An aggregate SKU age cannot identify the remaining value of old lots.
  const agingAvailable=coverage.aging_method==='remaining_lots'&&inventory.every(r=>money(r.aged_stock_value_180)&&r.aged_stock_value_180>=0&&r.aged_stock_value_180<=r.stock_value&&typeof r.aged_quantity_180==='number'&&Number.isFinite(r.aged_quantity_180)&&r.aged_quantity_180>=0&&r.aged_quantity_180<=r.quantity_available);
  const total=sumMoney(inventory.map(r=>r.stock_value));
  const aged=agingAvailable?sumMoney(inventory.map(r=>r.aged_stock_value_180)):null;
  return {available:true, company, stores:[...storeIds], period:{start,end}, source:snapshot.source, observedAt:snapshot.captured_at,
    freshness:clock-observed>maxAgeMinutes*60000?'STALE':'CURRENT', netRevenue:sumMoney(selected.map(r=>r.net_revenue)), stockValue:total,
    aging:{available:agingAvailable, reason:agingAvailable?null:'remaining_lot_evidence_required', thresholdDays:180, comparison:'strictly_greater', value:aged, sharePct:agingAvailable&&total>0?aged/total*100:null,
      products:agingAvailable?inventory.filter(r=>r.aged_quantity_180>0).map(r=>({sku:r.sku,storeId:r.store_id,quantity:r.aged_quantity_180,value:r.aged_stock_value_180})).sort((a,b)=>b.value-a.value||b.quantity-a.quantity):[]},
    limitations:['Read-only calculation; server authorization required.','No price changes or commercial actions.','Quantity ranking retains the source unit; quantities across SKUs are not summed.']};
}
