import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm';
const params=new URLSearchParams(location.hash.slice(1));
const isRecovery=params.get('type')==='recovery'&&!params.has('error');
const client=createClient('https://pcrwtoddavpvkaxwtstc.supabase.co','sb_publishable_m11Lb0v2t5Cp-BrooNWE6g_np421eYS',{
 auth:{storageKey:'grit-password-recovery',persistSession:false,autoRefreshToken:false,detectSessionInUrl:true}
});
const $=id=>document.getElementById(id);
let ready=false;
async function initialize(){
 try{
  await client.auth.getSession();
  if(!isRecovery)throw Error('invalid');
  const {data,error}=await client.auth.getUser();
  if(error||!data?.user)throw Error('invalid');
  $('recoveryAccount').textContent='Conta validada: '+data.user.email;
  ready=true;
  $('message').textContent='Link validado. Informe e confirme sua nova senha.';
  $('recoveryForm').classList.remove('hidden');
 }catch{
  $('message').textContent='Este link é inválido ou expirou. Solicite uma nova recuperação no CIP.';
 }finally{
  // The SDK has consumed the URL. Remove auth fragments before the next paint.
  history.replaceState(null,'',location.pathname);
 }
}
$('recoveryForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!ready)return;
 const password=$('newPassword').value,confirmation=$('confirmPassword').value;
 if(password.length<12||password!==confirmation){
  $('message').textContent='Use pelo menos 12 caracteres e confirme a mesma senha.';return;
 }
 $('savePassword').disabled=true;
 try{
  const {data,error}=await client.auth.getUser();
  if(error||!data?.user){ready=false;throw Error('expired');}
  const result=await client.auth.updateUser({password});
  const alreadyCurrent=result.error?.code==='same_password';
  if(result.error&&!alreadyCurrent)throw Error('rejected');
  $('newPassword').value='';$('confirmPassword').value='';ready=false;
  $('recoveryForm').classList.add('hidden');
  $('returnLink').classList.remove('hidden');
  $('message').textContent=alreadyCurrent?'Essa já é sua senha atual. Volte ao CIP e entre com ela.':'Senha GRIT atualizada. Volte ao CIP e entre com a nova senha.';
  await client.auth.signOut({scope:'local'}).catch(()=>{});
 }catch{
  $('newPassword').value='';$('confirmPassword').value='';
  $('message').textContent=ready?'Não foi possível salvar. Confira os requisitos da senha e tente novamente.':'O link expirou. Solicite uma nova recuperação.';
 }finally{$('savePassword').disabled=false;}
});
await initialize();
