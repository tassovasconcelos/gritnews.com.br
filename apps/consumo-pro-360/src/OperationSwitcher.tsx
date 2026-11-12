export type OperationCompany={id:string;name:string;operation_key?:string;requisition_approver_name?:string;requisition_approver_user_id?:string|null;savings_target_percent?:number|null};
export default function OperationSwitcher({companies,currentId,onChange,disabled=false}:{companies:OperationCompany[];currentId:string;onChange:(id:string)=>void;disabled?:boolean}){
 const current=companies.find(c=>c.id===currentId);
 return <section className="operation-selector" aria-label="Frente de operação">
  <div className="operation-options">{companies.map(c=><button key={c.id} type="button" disabled={disabled} aria-pressed={c.id===currentId} onClick={()=>onChange(c.id)}>
   <span>{c.operation_key==='retail'?'VAREJO · LOJAS':'DISTRIBUIDORA · SETORES'}</span><strong>{c.name}</strong>
   <small>Liberação: {c.requisition_approver_name||'Responsável a definir'}</small>
  </button>)}</div>
  {current&&!current.requisition_approver_user_id&&<p className="operation-pending" role="status">{current.requisition_approver_name||'Responsável'}: conta de aprovação ainda não vinculada. O administrador do Grupo deve concluir o vínculo antes das liberações.</p>}
 </section>;
}
