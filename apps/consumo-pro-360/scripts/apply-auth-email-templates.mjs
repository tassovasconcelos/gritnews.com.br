#!/usr/bin/env node
// CONSUMO PRO 360: controlled publication of HTML email templates.
// Dry run by default, --apply only with authorized Supabase Management token.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const PROJECT="xscxwazanootrdtyrumb";
const API="https://api.supabase.com/v1/projects/"+PROJECT+"/config/auth";
if(process.env.SUPABASE_PROJECT_REF!==PROJECT){
 console.error("Abortado: SUPABASE_PROJECT_REF difere do CONSUMO PRO dedicado.");
 process.exit(2);
}
const targets=[
 ["invite","mailer_subjects_invite","mailer_templates_invite_content","CONSUMO PRO 360 | Convite de acesso — Grupo Prohospital"],
 ["confirmation","mailer_subjects_confirmation","mailer_templates_confirmation_content","CONSUMO PRO 360 | Confirme seu e-mail"],
 ["recovery","mailer_subjects_recovery","mailer_templates_recovery_content","CONSUMO PRO 360 | Redefinição segura de senha"],
 ["magic_link","mailer_subjects_magic_link","mailer_templates_magic_link_content","CONSUMO PRO 360 | Seu acesso seguro"],
 ["email_change","mailer_subjects_email_change","mailer_templates_email_change_content","CONSUMO PRO 360 | Confirme a alteração de e-mail"],
 ["password_changed","mailer_subjects_password_changed_notification","mailer_templates_password_changed_notification_content","CONSUMO PRO 360 | Sua senha foi alterada"]
];
const body={};
for(const [name,subjectKey,htmlKey,subject] of targets){
 const html=await readFile(path.join(ROOT,"supabase","email-templates",name+".html"),"utf-8");
 if(!html.includes("GRUPO PROHOSPITAL")||!html.includes("GRIT Soluções e Negócios")){
  throw Error("Falta identidade corporativa em "+name);
 }
 const required=name==="password_changed"?"{{ .SiteURL }}":"{{ .ConfirmationURL }}";
 if(!html.includes(required))throw Error("Falta marcador Supabase Auth em "+name);
 body[subjectKey]=subject;
 body[htmlKey]=html;
}
const apply=process.argv.includes("--apply");
if(process.argv.some(a=>a.startsWith("--")&&a!=="--apply")){
 console.error("Parâmetro desconhecido. Use apenas --apply.");process.exit(2);
}
if(!apply){
 console.log("SIMULAÇÃO: nenhuma alteração no Supabase.");
 console.log("Projeto verificado: "+PROJECT+". Modelos: "+targets.map(x=>x[0]).join(", "));
 console.log("Para publicar, execute com --apply e SUPABASE_ACCESS_TOKEN em ambiente seguro.");
 process.exit(0);
}
const token=process.env.SUPABASE_ACCESS_TOKEN;
if(!token)throw Error("SUPABASE_ACCESS_TOKEN não disponível no ambiente");
const result=await fetch(API,{method:"PATCH",headers:{
 Authorization:"Bearer "+token,"Content-Type":"application/json",Accept:"application/json"
},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
if(!result.ok){
 console.error("Falha na publicação: HTTP "+result.status+". Verifique as permissões do projeto.");
 process.exit(1);
}
console.log("Modelos enviados à configuração Auth do CONSUMO PRO 360.");
console.log("Obrigatório homologar o envio de teste e o link real antes da operação.");
