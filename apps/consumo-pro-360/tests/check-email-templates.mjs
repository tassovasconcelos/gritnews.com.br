import assert from "node:assert/strict";
import fs from "node:fs/promises";
const files=["invite","confirmation","recovery","magic_link","email_change","password_changed"];
for(const name of files){
 const html=await fs.readFile(new URL("../supabase/email-templates/"+name+".html",import.meta.url),"utf8");
 assert.match(html,/<html lang="pt-BR">/);
 assert.match(html,/<table role="presentation"/);
 assert.match(html,/GRUPO PROHOSPITAL/);
 assert.match(html,/CONSUMO PRO/);
 assert.match(html,/GRIT Soluções e Negócios/);
 assert.match(html,/https:\/\/grupoprohospital\.com\.br\//);
 assert.match(html,/font-family:Arial/);
 assert.match(html,/<a class="cta" href="\{\{ \.(?:ConfirmationURL|SiteURL) \}\}"/);
 assert.equal(/service.role|sb_secret_|localhost|exemplo\.com|token=123|password=/.test(html),false,"Insegurança ou placeholder incorreto em "+name);
 if(name!=="password_changed")assert.match(html,/\{\{ \.ConfirmationURL \}\}/);
 if(name==="invite")assert.match(html,/\{\{ \.Email \}\}/);
 if(name==="email_change")assert.match(html,/\{\{ \.NewEmail \}\}/);
}
console.log("OK: 6 templates pt-BR, responsivos, identidade institucional e links Supabase Auth sem credenciais.");
