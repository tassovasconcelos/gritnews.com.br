export type FiscalLine = {
  external_code: string; description: string; unit: string; quantity: number;
  unit_price: number; brand: string; product_id: string; conversion_factor: number;
};
export type FiscalDraft = {
  supplier_name: string; tax_id: string; access_key: string; number: string;
  series: string; issued_at: string; lines: FiscalLine[];
};
const textOf=(node:Element|null, name:string):string=>{
  const element=node?.getElementsByTagNameNS("*",name)?.item(0);
  return element?.textContent?.trim()||"";
};
export function readNFe(xml:string):FiscalDraft {
  const doc=new DOMParser().parseFromString(xml,"application/xml");
  if(doc.getElementsByTagName("parsererror").length)throw Error("XML inválido ou malformado.");
  const nfe=doc.getElementsByTagNameNS("*","infNFe").item(0);
  if(!nfe)throw Error("Não foi localizada uma NF-e no XML.");
  const emit=nfe.getElementsByTagNameNS("*","emit").item(0);
  const ide=nfe.getElementsByTagNameNS("*","ide").item(0);
  const key=(nfe.getAttribute("Id")||"").replace(/^NFe/,"");
  if(!/^\d{44}$/.test(key))throw Error("NF-e sem chave de acesso com 44 dígitos.");
  const details=Array.from(nfe.getElementsByTagNameNS("*","det"));
  if(!details.length)throw Error("NF-e não contém itens.");
  const lines:FiscalLine[]=details.map((det)=>{
    const prod=det.getElementsByTagNameNS("*","prod").item(0);
    const description=textOf(prod,"xProd");
    const quantity=Number(textOf(prod,"qCom"));
    const unit_price=Number(textOf(prod,"vUnCom"));
    if(!description||!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(unit_price)||unit_price<0)
      throw Error("Item NF-e com quantidade ou valor inválido.");
    return {external_code:textOf(prod,"cProd"),description,
      unit:textOf(prod,"uCom")||"UN",quantity,unit_price,brand:"",
      product_id:"",conversion_factor:1};
  });
  return {supplier_name:textOf(emit,"xNome"),tax_id:textOf(emit,"CNPJ")||textOf(emit,"CPF"),
    access_key:key,number:textOf(ide,"nNF"),series:textOf(ide,"serie"),
    issued_at:textOf(ide,"dhEmi")||textOf(ide,"dEmi"),lines};
}
