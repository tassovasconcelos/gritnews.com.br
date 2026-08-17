import { Download, Image as ImageIcon, Printer, Share2, X } from 'lucide-react';
import type { Order, Settings } from './store';
import './receipt.css';

type Props = {
  order: Order;
  settings: Settings;
  paymentMethod: string;
  onClose: () => void;
};

const money = (v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const total = (o:Order)=>o.items.reduce((s,i)=>s+i.qty*i.unitPrice,0);
const paymentLabel:Record<string,string>={cash:'Dinheiro',pix:'PIX',credit_card:'Cartão de crédito',debit_card:'Cartão de débito',fiado:'Fiado / conta do cliente',other:'Outro'};

function receiptHtml(order:Order,settings:Settings,paymentMethod:string){
  const rows=order.items.map(i=>`<tr><td><span class="small">${new Date(i.createdAt||order.openedAt).toLocaleString('pt-BR')}</span><br>${i.qty}x ${i.name}<br><span class="small">${money(i.unitPrice)} cada</span></td><td style="text-align:right">${money(i.qty*i.unitPrice)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Conta ${order.label}</title><style>@page{size:80mm auto;margin:4mm}body{font-family:monospace;width:72mm;margin:0 auto;color:#111;font-size:12px}h1{font-size:18px;margin:0;text-align:center}p{margin:3px 0;text-align:center}.line{border-top:1px dashed #111;margin:8px 0}table{width:100%;border-collapse:collapse}td{padding:3px 0;vertical-align:top}.total{font-size:16px;font-weight:700;display:flex;justify-content:space-between}.small{font-size:10px}</style></head><body><h1>${settings.businessName}</h1><p>${settings.address||''}</p><p>${settings.whatsapp?`WhatsApp: ${settings.whatsapp}`:''}</p><div class="line"></div><p><strong>${order.label}</strong></p><p>${new Date().toLocaleString('pt-BR')}</p><table>${rows}</table><div class="line"></div><div class="total"><span>TOTAL</span><span>${money(total(order))}</span></div><p>Pagamento: ${paymentLabel[paymentMethod]||paymentMethod}</p><p class="small">Atendimento: ${order.closedByName||order.assignedName||'Equipe'}</p><div class="line"></div><p>Obrigado pela preferência!</p></body></html>`;
}

function wrapText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number){
  const words=text.split(' ');let line='';let py=y;
  for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,py);line=word;py+=lineHeight}else line=test}
  if(line)ctx.fillText(line,x,py);return py;
}

async function makeReceiptImage(order:Order,settings:Settings,paymentMethod:string){
  const width=720;const padding=48;const rowH=34;const height=330+order.items.length*rowH;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#0D1323';ctx.textAlign='center';ctx.font='700 34px Arial';ctx.fillText(settings.businessName,width/2,58);ctx.font='18px Arial';if(settings.address)ctx.fillText(settings.address,width/2,88);if(settings.whatsapp)ctx.fillText(`WhatsApp: ${settings.whatsapp}`,width/2,116);
  ctx.strokeStyle='#bbb';ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(padding,140);ctx.lineTo(width-padding,140);ctx.stroke();ctx.setLineDash([]);
  ctx.font='700 24px Arial';ctx.fillText(order.label,width/2,178);ctx.font='17px Arial';ctx.fillText(new Date().toLocaleString('pt-BR'),width/2,205);ctx.textAlign='left';let y=250;ctx.font='18px Arial';
  for(const item of order.items){wrapText(ctx,`${new Date(item.createdAt||order.openedAt).toLocaleString('pt-BR')} • ${item.qty}x ${item.name} • ${money(item.unitPrice)} cada`,padding,y,460,22);ctx.textAlign='right';ctx.fillText(money(item.qty*item.unitPrice),width-padding,y);ctx.textAlign='left';y+=rowH}
  ctx.strokeStyle='#bbb';ctx.beginPath();ctx.moveTo(padding,y);ctx.lineTo(width-padding,y);ctx.stroke();y+=38;ctx.font='700 28px Arial';ctx.fillText('TOTAL',padding,y);ctx.textAlign='right';ctx.fillText(money(total(order)),width-padding,y);ctx.textAlign='center';y+=38;ctx.font='18px Arial';ctx.fillText(`Pagamento: ${paymentLabel[paymentMethod]||paymentMethod}`,width/2,y);y+=34;ctx.font='16px Arial';ctx.fillText(`Atendimento: ${order.closedByName||order.assignedName||'Equipe'}`,width/2,y);y+=42;ctx.fillStyle='#FF6A00';ctx.font='700 18px Arial';ctx.fillText('Obrigado pela preferência!',width/2,y);
  return new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png',1));
}

export default function ReceiptModal({order,settings,paymentMethod,onClose}:Props){
  function printReceipt(){const w=window.open('','_blank','width=420,height=720');if(!w)return;w.document.open();w.document.write(receiptHtml(order,settings,paymentMethod));w.document.close();w.focus();setTimeout(()=>w.print(),250)}
  async function imageAction(share:boolean){const blob=await makeReceiptImage(order,settings,paymentMethod);if(!blob)return;const file=new File([blob],`conta-${order.label.replace(/\W+/g,'-').toLowerCase()}.png`,{type:'image/png'});if(share&&navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:`Conta ${order.label}`,text:`Conta fechada em ${settings.businessName}`,files:[file]});return}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  return <div className="receipt-backdrop" role="dialog" aria-modal="true"><div className="receipt-modal"><button className="receipt-close" onClick={onClose}><X/></button><div className="receipt-paper"><img src={settings.logoUrl||'/logo-meu-espetinho.svg'} alt={settings.businessName}/><h2>{settings.businessName}</h2><small>{settings.address}</small><hr/><strong>{order.label}</strong><small>{new Date().toLocaleString('pt-BR')}</small><div className="receipt-items">{order.items.map(i=><div key={i.productId}><span><small>{new Date(i.createdAt||order.openedAt).toLocaleString('pt-BR')}</small><br/>{i.qty}x {i.name} • {money(i.unitPrice)} cada</span><b>{money(i.qty*i.unitPrice)}</b></div>)}</div><hr/><div className="receipt-total"><span>Total</span><b>{money(total(order))}</b></div><small>Pagamento: {paymentLabel[paymentMethod]||paymentMethod}</small><small>Atendimento: {order.closedByName||order.assignedName||'Equipe'}</small><p>Obrigado pela preferência!</p></div><div className="receipt-actions"><button className="primary" onClick={printReceipt}><Printer/> Imprimir térmica</button><button onClick={()=>imageAction(true)}><Share2/> Compartilhar imagem</button><button onClick={()=>imageAction(false)}><Download/> Salvar imagem</button><span><ImageIcon/> Ideal para WhatsApp, apresentação ao cliente ou segunda via.</span></div></div></div>;
}
