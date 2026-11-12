import {supabase} from './supabase';
import {withDeadline} from './request';
export type Customer={id:string;name:string;phone:string|null;whatsapp_opt_in:boolean};
export type Sale={id:string;total:number;status:string;created_at:string;customer_id:string|null;customer_name:string|null;payment:string};
export const paymentName=(method:string)=>({pix:'PIX',cash:'Dinheiro',debit:'Débito',credit:'Crédito',credit_book:'Fiado'}[method]||method);
const messages:Record<string,string>={forbidden:'Seu perfil não permite esta ação. Confira também a sessão de suporte.',invalid_customer_details:'Informe nome e um telefone brasileiro com DDD, ou deixe o telefone vazio.',customer_phone_exists:'Este telefone já está cadastrado. Busque o cliente existente.',invalid_customer:'Cliente não encontrado nesta empresa.',cash_already_open:'Já existe um caixa aberto nesta loja. Atualize a tela.',cash_conflict:'Esta confirmação já existe com outros valores. Confira o caixa antes de repetir.',invalid_amount:'Informe um valor válido, positivo ou zero, com até dois centavos.',invalid_contact:'Escreva uma observação de 3 a 1000 caracteres.'};
export async function retail<T=any>(action:string,orgId:string,payload:Record<string,unknown>={}):Promise<T>{
 const r=await withDeadline(supabase.rpc('srp_retail',{p_action:action,p_org:orgId,p_payload:payload}));
 if(r.error)throw new Error(['PGRST202','42P01'].includes(r.error.code)?'Esta área aguarda a atualização do banco de dados.':messages[r.error.message]||'Não foi possível confirmar. Atualize e confira antes de repetir.');
 return r.data as T;
}
