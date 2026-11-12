import {createClient} from './supabase-js-2.57.0.mjs';
const params=new URLSearchParams(location.hash.slice(1));history.replaceState(null,'',location.pathname);
const invite_id=params.get('invite'),token=params.get('token'),authToken=params.get('auth_token');
const client=createClient('https://pcrwtoddavpvkaxwtstc.supabase.co','sb_publishable_m11Lb0v2t5Cp-BrooNWE6g_np421eYS',{auth:{storageKey:'cip-activation',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const $=id=>document.getElementById(id);let invited=null,ready=false;
const call=async body=>{const r=await client.functions.invoke('cip-admin',{body});if(r.error||r.data?.error)throw Error('operation_failed');return r.data;};
try{
 if(!invite_id||!token)throw Error('invalid_invitation');
 invited=await call({action:'preview_invite',invite_id,token});
 $('activationAccount').textContent='Conta convidada: '+invited.email;
 $('activationScope').textContent='Acesso: '+invited.role+' · '+invited.companies.map(c=>c==='shopping_prohospital'?'Shopping Prohospital':'Distribuidora Prohospital').join(' · ');
 if(authToken){
  const auth=await client.auth.verifyOtp({token_hash:authToken,type:'invite'});if(auth.error||!auth.data.user||auth.data.user.email?.toLowerCase()!==invited.email)throw Error('invalid_identity');
  $('passwordLabel').firstChild.textContent='Defina sua senha GRIT';$('activationPassword').minLength=12;$('activationPassword').autocomplete='new-password';$('confirmationLabel').classList.remove('hidden');$('activationConfirm').required=true;
  $('activationHelp').textContent='Use pelo menos 12 caracteres. A senha é da sua conta GRIT e não será compartilhada com o administrador.';
 }else $('activationHelp').textContent='Use a senha da sua conta GRIT existente. A ativação não altera sua senha nem o acesso aos outros aplicativos.';
 ready=true;$('activationForm').classList.remove('hidden');$('activationStatus').textContent='Convite validado. Confira a conta e conclua a ativação.';
}catch{$('activationStatus').textContent='Convite inválido, revogado ou expirado. Solicite um novo link ao administrador.';}
$('activationForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!ready)return;const password=$('activationPassword').value,confirmation=$('activationConfirm').value,button=event.currentTarget.querySelector('button');
 if(authToken&&(password.length<12||password!==confirmation)){$('activationStatus').textContent='Use pelo menos 12 caracteres e confirme a mesma senha.';return;}
 button.disabled=true;
 try{
  if(authToken){const r=await client.auth.updateUser({password});if(r.error&&r.error.code!=='same_password')throw r.error;}
  else{const r=await client.auth.signInWithPassword({email:invited.email,password});if(r.error)throw r.error;}
  await call({action:'accept_invite',invite_id,token});ready=false;$('activationForm').classList.add('hidden');$('activationReturn').classList.remove('hidden');$('activationStatus').textContent='Acesso ativado. Entre no CIP com sua conta GRIT.';await client.auth.signOut({scope:'local'});
 }catch{$('activationStatus').textContent='Ativação não concluída. Confira sua senha, a conexão e a validade do convite.';}
 finally{$('activationPassword').value='';$('activationConfirm').value='';button.disabled=false;}
});
