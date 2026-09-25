import {CommercialProduct,PlaybookOrder,SiteConfig} from '../types';

export interface CreateOrderParams{
  product:CommercialProduct;
  customerName:string;
  customerEmail:string;
  customerPhone:string;
  customerCpf?:string;
  paymentMethod:'pix'|'card'|'mercadopago_wallet';
  cardDetails?:{
    cardNumber:string;
    cardHolderName:string;
    cardExpiry:string;
    cardCvv:string;
    installments:number;
    brand:string;
  };
  couponCode?:string;
  discountAmount?:number;
  finalAmount:number;
  siteConfig:SiteConfig;
}

export interface CheckoutResult{
  success:boolean;
  order:PlaybookOrder;
  pixQrCodeDataUrl?:string;
  pixPayload?:string;
  mercadoPagoInitPoint?:string;
  mercadoPagoPaymentId?:string;
  message:string;
}

export function generateOrderId(prefix='GRIT'):string{
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
}

export function detectCardBrand(cardNumber:string):string{
  const clean=cardNumber.replace(/\D/g,'');
  if(/^4/.test(clean))return 'visa';
  if(/^(5[1-5]|2[2-7])/.test(clean))return 'mastercard';
  if(/^(34|37)/.test(clean))return 'amex';
  if(/^(606282|3841)/.test(clean))return 'hipercard';
  return 'card';
}

async function parseJson(response:Response){
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(String(data?.error||'Gateway de pagamento indisponível.'));
  return data;
}

/**
 * Credenciais privadas do Mercado Pago são configuradas exclusivamente no servidor.
 * O parâmetro legado é ignorado de propósito para impedir reintrodução de segredo no browser.
 */
export async function testMercadoPagoCredentials(_legacyAccessToken?:string):Promise<{
  success:boolean;
  accountName?:string;
  accountEmail?:string;
  environment?:string;
  message:string;
}>{
  return {
    success:false,
    message:'O Access Token é gerenciado exclusivamente no servidor e não pode ser testado ou exibido pelo navegador.',
  };
}

export async function checkMercadoPagoPaymentStatus(paymentId:string,_legacyAccessToken?:string):Promise<{
  status:'approved'|'pending'|'in_process'|'rejected'|'cancelled'|'refunded'|'unknown';
  statusDetail?:string;
}>{
  if(!/^\d{1,30}$/.test(String(paymentId||'')))return {status:'unknown'};
  try{
    const res=await fetch(`/api/mercadopago/payment/${encodeURIComponent(paymentId)}`,{
      method:'GET',
      credentials:'same-origin',
      headers:{Accept:'application/json'},
    });
    if(!res.ok)return {status:'unknown'};
    const data=await res.json();
    return {status:data.status||'unknown',statusDetail:data.status_detail};
  }catch{return {status:'unknown'}}
}

export async function processMercadoPagoCheckout(params:CreateOrderParams):Promise<CheckoutResult>{
  const {
    product,customerName,customerEmail,customerPhone,customerCpf,
    paymentMethod,couponCode,
  }=params;
  const now=new Date().toISOString();

  if(paymentMethod==='pix'){
    const response=await fetch('/api/mercadopago/payment',{
      method:'POST',
      credentials:'same-origin',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({
        productId:product.id,
        couponCode:couponCode||null,
        payment_method_id:'pix',
        payer:{
          email:customerEmail,
          first_name:customerName.split(' ')[0],
          last_name:customerName.split(' ').slice(1).join(' ')||'Cliente',
          cpf:customerCpf,
        },
      }),
    });
    const data=await parseJson(response);
    const paymentId=String(data.id||'');
    const amount=Number(data.amount);
    if(!/^\d{1,30}$/.test(paymentId)||!Number.isFinite(amount)||amount<=0||!data.qrCode){
      throw new Error('O gateway não retornou uma cobrança PIX válida.');
    }

    const order:PlaybookOrder={
      id:String(data.external_reference||generateOrderId()),
      productId:product.id,
      productTitle:product.title,
      productType:product.type,
      customerName,
      customerEmail,
      customerPhone,
      customerCpf,
      paymentMethod:'pix',
      amount,
      originalAmount:product.price,
      discountAmount:Math.max(0,Number((product.price-amount).toFixed(2))),
      couponCode:data.coupon_code||undefined,
      status:'PENDING_PIX',
      pixCode:String(data.qrCode),
      accessSent:false,
      downloadUrl:product.downloadUrl,
      mercadoPagoPaymentId:paymentId,
      securityHash:data.securityHash||undefined,
      createdAt:now,
      notes:`Cobrança PIX criada no Mercado Pago. ID: ${paymentId}. Acesso somente após confirmação do gateway.`,
    };

    return {
      success:true,
      order,
      pixPayload:String(data.qrCode),
      pixQrCodeDataUrl:data.qrCodeBase64?`data:image/png;base64,${data.qrCodeBase64}`:undefined,
      mercadoPagoPaymentId:paymentId,
      message:'Cobrança PIX gerada. O acesso será liberado somente após confirmação do Mercado Pago.',
    };
  }

  const response=await fetch('/api/mercadopago/preference',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({
      productId:product.id,
      couponCode:couponCode||null,
      payer:{name:customerName,email:customerEmail},
    }),
  });
  const data=await parseJson(response);
  const initPoint=String(data.init_point||'');
  const amount=Number(data.amount);
  if(!/^https:\/\//i.test(initPoint)||!Number.isFinite(amount)||amount<=0){
    throw new Error('O gateway não retornou um checkout seguro.');
  }

  const order:PlaybookOrder={
    id:String(data.external_reference||generateOrderId()),
    productId:product.id,
    productTitle:product.title,
    productType:product.type,
    customerName,
    customerEmail,
    customerPhone,
    customerCpf,
    paymentMethod,
    amount,
    originalAmount:product.price,
    discountAmount:Math.max(0,Number((product.price-amount).toFixed(2))),
    couponCode:data.coupon_code||undefined,
    status:'PROCESSING',
    accessSent:false,
    downloadUrl:product.downloadUrl,
    createdAt:now,
    notes:'Pagamento iniciado no Checkout Pro. Nenhum dado de cartão é coletado ou processado pelo GRIT News.',
  };

  return {
    success:true,
    order,
    mercadoPagoInitPoint:initPoint,
    message:'Checkout seguro criado. Conclua o pagamento no ambiente oficial do Mercado Pago.',
  };
}
