export const ROLES={diretoria:'Diretor',supervisor:'Supervisor',gestor:'Gerente',analista:'Analista',vendedor:'Vendedor',leitura:'Consulta'};
export const COMPANIES={shopping_prohospital:'Shopping Prohospital',distribuidora_prohospital:'Distribuidora Prohospital'};
export function validAccess({role,companies,active=true}){return Object.hasOwn(ROLES,role)&&typeof active==='boolean'&&Array.isArray(companies)&&companies.length>=1&&companies.length<=2&&new Set(companies).size===companies.length&&companies.every(c=>Object.hasOwn(COMPANIES,c));}
export function validEmail(email){return typeof email==='string'&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);}
export function roleCapabilities(role){return {read:Object.hasOwn(ROLES,role),write:['gestor','vendedor'].includes(role),review:role==='gestor',admin:false};}
