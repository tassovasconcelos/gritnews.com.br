
(function(){
"use strict";
// Preserve legacy hash links after the root redirect.
if (/^#\/?(?:noticia\/|artigo\/|checkout|tenpets|imoveis|eusebio|playbook|emagrecimento|radar|mercados|fato|factcheck|opiniao|colunas)/i.test(location.hash)) { location.replace("/index.html"+location.search+location.hash); return; }
document.documentElement.classList.add("js");
var byId=function(id){return document.getElementById(id)};
var segments={
 padaria:{label:"Padaria e confeitaria",product:"sr-padeiro",message:"Sr. Padeiro + gestão de vendas e estoque"},
 mercadinho:{label:"Mercadinho e conveniência",product:"sr-padeiro",message:"Gestão de caixa, produtos, estoque e vendas"},
 alimentacao:{label:"Bar, espetinho e restaurante",product:"meu-espetinho",message:"Meu Espetinho + gestão de pedidos"},
 varejo:{label:"Lojas e varejo",product:"crm-ia",message:"CRM comercial e indicadores de vendas"},
 servicos:{label:"Prestação de serviços",product:"crm-ia",message:"CRM, propostas e automações"},
 juridico:{label:"Escritório jurídico",product:"juridico",message:"Site, CRM e gestão jurídica"},
 saude:{label:"Saúde e equipamentos",product:"sac-4-0",message:"SAC 4.0 e gestão operacional"},
 ecommerce:{label:"E-commerce",product:"ecommerce",message:"Controle de pedidos e estoque online"},
 outro:{label:"Outros negócios",product:"consultoria",message:"Consultoria com solução personalizada"}
};
var q=new URLSearchParams(location.search);
var selected=q.get("segmento")||q.get("segment")||"",explicit=Boolean(segments[selected]);
var segmentSelect=byId("formSegment"),productSelect=byId("product");
function choose(key,updateProduct){if(!segments[key])return;selected=key;segmentSelect.value=key;
 document.querySelectorAll("[data-segment]").forEach(function(el){var active=el.getAttribute("data-segment")===key;el.classList.toggle("active",active);el.setAttribute("aria-pressed",String(active));});
 var rec=byId("segmentRecommendation");if(rec)rec.textContent=segments[key].message;
 if(updateProduct)productSelect.value=segments[key].product;
}
document.querySelectorAll("[data-segment]").forEach(function(btn){btn.addEventListener("click",function(){explicit=true;choose(btn.getAttribute("data-segment"),true);})});
var infer={"sr-padeiro":"padaria","meu-espetinho":"alimentacao","sac-4-0":"servicos","juridico":"juridico","ecommerce":"ecommerce"};
document.querySelectorAll("[data-interest]").forEach(function(link){link.addEventListener("click",function(){
 var p=link.getAttribute("data-interest");
 if(productSelect.querySelector('option[value="'+p+'"]'))productSelect.value=p;
 if(!explicit&&infer[p])choose(infer[p],false);
 if(window.dataLayer)window.dataLayer.push({event:"grit_lead_interest",interest:p});
})});
document.querySelectorAll("[data-pain]").forEach(function(link){link.addEventListener("click",function(){if(byId("pain"))byId("pain").value=link.getAttribute("data-pain")||"";productSelect.value=link.getAttribute("data-pain").includes("marca")?"marca-site":"diagnostico";})});
var segcta=byId("segmentCTA");if(segcta)segcta.addEventListener("click",function(){if(selected&&segments[selected]){segmentSelect.value=selected;productSelect.value=segments[selected].product}});
segmentSelect.addEventListener("change",function(){explicit=true;choose(segmentSelect.value,false)});
var menubtn=byId("menuBtn"),nav=byId("nav");if(menubtn&&nav){menubtn.addEventListener("click",function(){var opened=nav.classList.toggle("open");menubtn.setAttribute("aria-expanded",String(opened))});nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){nav.classList.remove("open");menubtn.setAttribute("aria-expanded","false")})})}
if(byId("year"))byId("year").textContent=String(new Date().getFullYear());
if(explicit)choose(selected,false);
var directProduct=q.get("produto")||q.get("product");if(directProduct&&productSelect.querySelector('option[value="'+directProduct+'"]'))productSelect.value=directProduct;
function updateHidden(id,key,fallback){var node=byId(id);if(node)node.value=(q.get(key)||fallback||"").slice(0,300)}
updateHidden("utmSource","utm_source","grit-landing");
updateHidden("utmMedium","utm_medium","site");
updateHidden("utmCampaign","utm_campaign","grit-solucoes-360");
updateHidden("utmContent","utm_content","");
updateHidden("utmTerm","utm_term","");
updateHidden("gclid","gclid","");
updateHidden("fbclid","fbclid","");
updateHidden("referralCode","ref","");
if(byId("landingPage"))byId("landingPage").value=location.href.slice(0,500);
// Formulário nativo funciona mesmo que este script seja bloqueado.
var form=byId("leadForm");
if(form)form.addEventListener("submit",function(ev){
 if(window.dataLayer)window.dataLayer.push({event:"grit_lead_submit",product:productSelect.value,segment:segmentSelect.value});
});
})();
