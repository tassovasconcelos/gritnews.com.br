export const COMPANY_NAMES={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital',all:'Todas as empresas autorizadas'};
export function companyIn(text){const q=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(/\b(todas|ambas)\b/.test(q)&&/empresas|unidades/.test(q))return 'all';if(/\bshopping\b/.test(q)&&/\bdistribuidora\b/.test(q))return 'all';if(/\bdistribuidora\b/.test(q))return 'distribuidora_prohospital';if(/\bshopping\b/.test(q))return 'shopping_prohospital';return null;}
export function menu(companies=['shopping_prohospital','distribuidora_prohospital']){return {inline_keyboard:[[{text:'🏢 Escolher empresa',callback_data:'companies'}],[{text:'📊 Resumo',callback_data:'summary'},{text:'📋 Missões',callback_data:'missions'}],[{text:'⤴ Processos',callback_data:'processes'},{text:'📚 Conhecimento',callback_data:'knowledge'}],[{text:'❓ Ajuda',callback_data:'help'}]]};}
export function companyMenu(companies){return {inline_keyboard:[...companies.filter(id=>Object.hasOwn(COMPANY_NAMES,id)&&id!=='all').map(id=>[{text:COMPANY_NAMES[id],callback_data:'company:'+id}]),[{text:COMPANY_NAMES.all,callback_data:'company:all'}]]};}
export function callbackIntent(data){if(['companies','summary','missions','processes','knowledge','help'].includes(data))return {kind:data};if(typeof data==='string'&&data.startsWith('company:')&&Object.hasOwn(COMPANY_NAMES,data.slice(8)))return {kind:'choose_company',company:data.slice(8)};return null;}
export function parseUpdate(u){
 if(!Number.isSafeInteger(u?.update_id)||u.update_id<0)return null;
 const cb=u.callback_query,m=cb?.message??u.message,from=cb?.from??m?.from;
 if(m?.chat?.type!=='private'||from?.is_bot||!Number.isSafeInteger(from?.id)||from.id<=0||m.chat.id!==from.id)return null;
 const base={update_id:u.update_id,chat:String(m.chat.id),user:String(from.id)};
 if(cb)return typeof cb.id==='string'&&callbackIntent(cb.data)?{...base,callback:cb.id,intent:callbackIntent(cb.data),text:''}:null;
 if(typeof m.text==='string'&&m.text.length<=1200)return {...base,text:m.text};
 const audio=m.voice??m.audio;if(audio&&typeof audio.file_id==='string'&&audio.file_id.length<=300&&Number.isFinite(audio.duration)&&audio.duration>0)return {...base,text:'',audio:{file_id:audio.file_id,duration:audio.duration,size:audio.file_size??null,voice:!!m.voice}};
 return null;
}
