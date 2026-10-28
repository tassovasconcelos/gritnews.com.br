export const SOLUTIONS=[
 ['inicio','Visão geral','Comece por aqui','Uma visão do ambiente e dos seus atalhos.','home','inicio painel dashboard resumo'],
 ['solucoes','Todas as soluções','Comece por aqui','Encontre um módulo pelo objetivo que você quer resolver.','search','buscar pesquisar encontrar menu ferramentas modulos'],
 ['doquita','Doquita','Comece por aqui','Consulte prioridades e a inteligência executiva autorizada.','spark','assistente inteligencia ia analise resumo'],
 ['varejo','Shopping Prohospital','Shopping','Visão do varejo e das fontes de estoque.','store','varejo shopping filiais lojas'],
 ['estoque','Estoque inteligente','Shopping','Localize CD, lojas, produtos, relatórios e ações de estoque.','box','estoque cd saldo sku produtos estoque parado relatorios csv reposicao transferencia'],
 ['precos','Marca-passo de preços','Comercial','Compare preços, concorrência e margem; programe a aplicação assistida por loja, tabela e data.','chart','precos concorrencia tabela agenda programacao margem custo desconto campanhas simulacao lucro promocao'],
 ['b2b','Distribuidora Prohospital','Distribuidora','Acompanhe a frente comercial B2B.','building','atacado b2b distribuidora hospitais clinicas'],
 ['cotacoes','Cotações e conversão','Distribuidora','Registre cotações e acompanhe oportunidades.','document','cotacoes propostas vendas orcamentos funil conversao'],
 ['caderninho','Caderninho inteligente','Distribuidora','Registre produtos procurados e demanda não atendida.','book','faltas procura oportunidades demanda nao atendida'],
 ['concorrentes','Concorrentes do Brasil','Comercial','Acesse lojas por região, estado e cidade, sites e evidências rastreáveis.','store','concorrentes lojas estados cidades diretorio regional sites marcas'],
 ['radar-mercado','Radar B2B2C · Faro','Inteligência e equipe','Pesquise ofertas, confira similaridade e leve evidências ao Marca-passo.','radar','concorrentes concorrencia precos b2b2c radar mercado livre magalu amazon marketplaces atacado distribuidores similaridade marca modelo gtin de para'],
 ['radar-b2g','Radar B2G · Íris','Inteligência e equipe','Pesquise licitações, itens e evidências de mercado.','radar','licitacoes editais pregao pncp governo concorrencia pesquisa iris b2g'],
 ['quartel','Quartel dos agentes','Inteligência e equipe','Acompanhe análises automáticas, missões, metas e aprendizado dos 14 agentes.','team','agentes robos missoes tarefas equipe responsaveis metas resultados rotina conselho coordenacao'],
 ['escola','Escola dos agentes','Inteligência e equipe','Organize materiais, conhecimento e desenvolvimento de habilidades.','school','escola treinamento skills conhecimento documentos links aprendizado'],
 ['processos','Processos vivos','Inteligência e equipe','Desenhe, simule e revise os processos da operação.','flow','processos fluxos auditoria desenho automacao consultor'],
 ['mensageiro','Doquita no Telegram','Inteligência e equipe','Vincule sua conta ao bot e consulte relatórios em conversa.','message','telegram bot mensagem voz audio rotina briefing relatorios'],
 ['procfit','Procfit e relatórios','Gestão e governança','Confira fontes, cargas, catálogo e bases para consulta.','database','erp procfit importar arquivos catalogo dados conexao integracao conciliacao'],
 ['apresentacao','Apresentação executiva','Gestão e governança','Explore a apresentação do CIP para a diretoria.','presentation','apresentacao diretoria investidores projeto demonstracao'],
 ['cronograma','Checklist e cronograma','Gestão e governança','Confira a preparação operacional, pendências e marcos de implantação.','calendar','cronograma checklist operacao prontidao pendencias plano planejamento fases prazos roadmap'],
 ['integracoes','Integrações e acessos','Gestão e governança','Administre convites, usuários e permissões do CIP.','settings','usuarios diretores convites acesso prorrogacao revogar superadm'],
 ['preferencias','Acessibilidade e aplicativo','Seu ambiente','Ajuste leitura, movimento, favoritos e instalação no celular.','access','acessibilidade pwa instalar app celular fonte letras tamanho animacoes favoritos personalizar mobile']
].map(([route,title,group,description,icon,keywords])=>({route,title,group,description,icon,keywords}));
export const GROUPS=['Comece por aqui','Shopping','Comercial','Distribuidora','Inteligência e equipe','Gestão e governança','Seu ambiente'];
export const normalizeSearch=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function searchSolutions(allowed,query=''){
 const words=normalizeSearch(query).split(/\s+/).filter(Boolean);const permitted=new Set(allowed??[]);
 return SOLUTIONS.filter(s=>permitted.has(s.route)&&words.every(w=>normalizeSearch(s.title+' '+s.description+' '+s.keywords+' '+s.group).includes(w)));
}
export function safePreferences(value,allowed){
 const x=value&&typeof value==='object'?value:{},permitted=new Set(allowed??[]),routes=v=>[...new Set(Array.isArray(v)?v.filter(r=>typeof r==='string'&&permitted.has(r)&&SOLUTIONS.some(s=>s.route===r)):[])].slice(0,6);
 return {favorites:routes(x.favorites),recent:routes(x.recent),text:x.text==='large'?'large':'normal',motion:['system','reduce'].includes(x.motion)?x.motion:'system'};
}
export function routeFromHash(hash,allowed){const route=String(hash??'').match(/^#\/([a-z0-9-]+)$/)?.[1];return allowed?.includes(route)&&SOLUTIONS.some(s=>s.route===route)?route:'inicio';}
const PATHS={home:'m3 10 9-7 9 7v10H3z M9 20v-7h6v7',search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',box:'m3 7 9-4 9 4v10l-9 4-9-4z M3 7l9 5 9-5 M12 12v9 M7 5l9 5',chart:'M4 20V4 M4 20h17 M8 16v-5 M13 16V7 M18 16V4',store:'M3 10h18l-2-6H5z M5 10v10h14V10 M9 20v-6h6v6',building:'M4 21V3h12v18 M16 9h4v12 M8 7h4 M8 11h4 M8 15h4',document:'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6',book:'M3 4h6l3 2 3-2h6v16h-6l-3 2-3-2H3z M12 6v16',radar:'M21 12a9 9 0 1 1-9-9 M12 3v9l7-7 M16 12a4 4 0 1 1-4-4',team:'M9 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M1 21v-3a5 5 0 0 1 10 0v3 M13 21v-3a5 5 0 0 1 10 0v3',school:'m2 8 10-5 10 5-10 5z M6 10v7l6 3 6-3v-7 M22 8v8',flow:'M9 3h6v5H9z M3 17h6v5H3z M15 17h6v5h-6z M12 8v5 M6 17v-4h12v4',message:'M3 3h18v14H9l-6 4z M7 8h10 M7 12h6',database:'M3 6c0-4 18-4 18 0s-18 4-18 0 M3 6v12c0 4 18 4 18 0V6 M3 12c0 4 18 4 18 0',presentation:'M3 4h18v13H3z M12 17v4 M7 21h10 M7 12l3-3 3 2 4-5',calendar:'M4 5h16v16H4z M8 2v6 M16 2v6 M4 10h16',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2',access:'M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M4 9l8 2 8-2 M12 11v5 M8 22l4-6 4 6',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z',star:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',close:'M6 6l12 12 M6 18 18 6',menu:'M4 6h16 M4 12h16 M4 18h16',logout:'M10 4H4v16h6 M10 12h11 M17 8l4 4-4 4'};
export function icon(name){return `<svg class="cip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${PATHS[name]??PATHS.document}"/></svg>`;}
