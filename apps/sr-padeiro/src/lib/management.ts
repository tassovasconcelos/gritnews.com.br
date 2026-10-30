export function profitSummary(s:{revenue:number;known_cost:number;known_revenue:number;expenses:number;missing_cost_lines:number}){
 const revenue=Number(s.revenue),knownCost=Number(s.known_cost),knownRevenue=Number(s.known_revenue);
 return {complete:Number(s.missing_cost_lines)===0,gross:revenue-knownCost,knownGross:knownRevenue-knownCost,margin:revenue?(revenue-knownCost)/revenue*100:0,afterExpenses:revenue-knownCost-Number(s.expenses)};
}
export function managementActions(r:{lowStock:number;unknownCosts:number;inactive:number;sales:number;revenue:number;previousRevenue:number}){
 const rows:{text:string;screen:string}[]=[];
 if(r.lowStock)rows.push({text:`${r.lowStock} produto(s) no mínimo ou abaixo. Confira a reposição.`,screen:'purchases'});
 if(r.unknownCosts)rows.push({text:`Revise o custo de ${r.unknownCosts} produto(s) para avaliar a margem.`,screen:'results'});
 if(r.inactive)rows.push({text:`${r.inactive} produto(s) inativo(s) aguardam revisão do catálogo.`,screen:'products'});
 if(!r.sales)rows.push({text:'Registre as vendas no PDV para acompanhar giro e evolução.',screen:'sell'});
 else if(r.revenue<r.previousRevenue)rows.push({text:'As vendas caíram. Analise o mix, o atendimento e a disponibilidade.',screen:'results'});
 else rows.push({text:'Acompanhe ticket e margem dos produtos para orientar a próxima ação de venda.',screen:'results'});
 return rows;
}
export function csvContent(headers:unknown[],rows:unknown[][]){const escape=(v:unknown)=>{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return '\ufeff'+[headers,...rows].map(row=>row.map(escape).join(';')).join('\r\n');}
export function exportRows(name:string,headers:unknown[],rows:unknown[][]){const url=URL.createObjectURL(new Blob([csvContent(headers,rows)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
