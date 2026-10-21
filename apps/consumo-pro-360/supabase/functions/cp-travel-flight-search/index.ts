import {createClient} from "npm:@supabase/supabase-js@2.57.0";

// AERO flight data gateway: user-scoped, company-scoped, provider credentials server-side only.
// No payment, booking, ticket issuance, PNR, or automatic purchases.
const HOST="https://api.amadeus.com";
const ALLOWED_ROLES=["group_admin","director","controller","finance","buyer","manager","grit_superadmin"];
const corsHeaders=(origin:string)=>({
 "Content-Type":"application/json",
 "Cache-Control":"private, no-store, max-age=0",
 "Vary":"Origin",
 "Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
});
const reply=(body:unknown,status:number,origin:string)=>
 new Response(JSON.stringify(body),{status,headers:corsHeaders(origin)});
const str=(x:unknown)=>typeof x==="string"?x.trim():"";
const dateOk=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T12:00:00Z"));
const iataOk=(s:string)=>/^[A-Z]{3}$/.test(s);
const hours=(iso:unknown)=>{
 if(typeof iso!=="string")return null;
 const match=/^P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso);
 if(!match)return null;
 return Number(match[1]||0)+Number(match[2]||0)/60;
};
type Legs={from:string;to:string;date:string};
Deno.serve(async(req)=>{
 const origin=req.headers.get("origin")||"";
 const allowed=(Deno.env.get("APP_ALLOWED_ORIGINS")||"https://consumo.gritnews.com.br,https://consumo-pro-360-grit.vercel.app")
   .split(",").map(s=>s.trim()).filter(Boolean);
 const preview=/^https:\/\/consumo-pro-360-grit-[a-z0-9-]+-tassos-projects-167133f0\.vercel\.app$/.test(origin);
 if(origin&&!allowed.includes(origin)&&!preview)return reply({error:"Origem não autorizada"},403,"");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(origin)});
 if(req.method!=="POST")return reply({error:"Método não permitido"},405,origin);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 const projectUrl=Deno.env.get("SUPABASE_URL"),publicKey=Deno.env.get("SUPABASE_ANON_KEY");
 if(!token||!projectUrl||!publicKey)return reply({error:"Autenticação obrigatória"},401,origin);
 const caller=createClient(projectUrl,publicKey,{
  global:{headers:{Authorization:"Bearer "+token}},
  auth:{persistSession:false,autoRefreshToken:false}
 });
 try{
  const {data:{user},error}=await caller.auth.getUser(token);
  if(error||!user||!user.email_confirmed_at)return reply({error:"Conta não verificada"},401,origin);
  const input=await req.json();
  const companyId=str(input.company_id);
  const legs:Legs[]=Array.isArray(input.legs)?input.legs.map((p:Record<string,unknown>)=>({
   from:str(p.from).toUpperCase(),to:str(p.to).toUpperCase(),date:str(p.date)
  })):[];
  const adults=Number(input.adults||1);
  if(!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(companyId)||
   legs.length<1||legs.length>5||!Number.isInteger(adults)||adults<1||adults>4||
   legs.some(l=>!iataOk(l.from)||!iataOk(l.to)||l.from===l.to||!dateOk(l.date)||
     Date.parse(l.date+"T23:59:59Z")<Date.now()||
     Date.parse(l.date+"T00:00:00Z")>Date.now()+240*86400000))
   return reply({error:"Parâmetros de viagem inválidos; máximo de cinco datas por pesquisa"},400,origin);
  const {data:company,error:cError}=await caller.from("cp_companies").select("id,organization_id")
   .eq("id",companyId).eq("active",true).maybeSingle();
  if(cError||!company)return reply({error:"Empresa fora do escopo autorizado"},403,origin);
  const {data:links,error:memberError}=await caller.from("cp_memberships").select("role,organization_id,company_id,active")
   .eq("user_id",user.id).eq("active",true).eq("organization_id",company.organization_id);
  if(memberError||!(links||[]).some(m=>ALLOWED_ROLES.includes(m.role)&&(!m.company_id||m.company_id===companyId)))
   return reply({error:"Perfil sem autorização para pesquisa corporativa"},403,origin);
  const id=Deno.env.get("AMADEUS_CLIENT_ID");
  const secret=Deno.env.get("AMADEUS_CLIENT_SECRET");
  if(Deno.env.get("AMADEUS_ENV")!=="production"||!id||!secret)
   return reply({error:"Fonte aérea não conectada: configure a API Amadeus de produção. Sem cotações simuladas.",provider_status:"not_configured"},503,origin);
  const tokenRequest=new URLSearchParams({grant_type:"client_credentials",client_id:id,client_secret:secret});
  const authRes=await fetch(HOST+"/v1/security/oauth2/token",{
   method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
   body:tokenRequest,signal:AbortSignal.timeout(10000)
  });
  if(!authRes.ok)return reply({error:"Autenticação do provedor de tarifas indisponível"},502,origin);
  const authData=await authRes.json();
  const access=authData.access_token as string|undefined;
  if(!access)return reply({error:"Provedor de tarifas não retornou autorização"},502,origin);
  const searches=await Promise.all(legs.map(async(l)=>{
   const p=new URLSearchParams({
    originLocationCode:l.from,destinationLocationCode:l.to,
    departureDate:l.date,adults:String(adults),currencyCode:"BRL",max:"8"
   });
   const response=await fetch(HOST+"/v2/shopping/flight-offers?"+p,{
    headers:{Authorization:"Bearer "+access,Accept:"application/json"},
    signal:AbortSignal.timeout(16000)
   });
   if(!response.ok)return {...l,status:"unavailable",offers:[]};
   const payload=await response.json();
   const offers=(Array.isArray(payload.data)?payload.data:[]).map((offer:Record<string,any>)=>{
    const price=Number(offer.price?.grandTotal||offer.price?.total);
    const fareCurrency=String(offer.price?.currency||"");
    const itinerary=offer.itineraries?.[0];
    return {
     quote_id:String(offer.id||"").slice(0,90),
     price:price>0&&Number.isFinite(price)&&fareCurrency==="BRL"?price:null,
     currency:fareCurrency,
     duration_hours:hours(itinerary?.duration),
     carrier_codes:Array.isArray(offer.validatingAirlineCodes)?offer.validatingAirlineCodes.slice(0,4):[],
     segments_count:Array.isArray(itinerary?.segments)?itinerary.segments.length:0,
     seats:Number.isFinite(Number(offer.numberOfBookableSeats))?Number(offer.numberOfBookableSeats):null,
     baggageIncluded:"Verificar na tarifa final",
     offer_expires:"Não garantido até reprecificação",
     source:"Amadeus Flight Offers Search"
    };
   }).filter((o:Record<string,unknown>)=>o.price!==null).sort((a:Record<string,any>,b:Record<string,any>)=>a.price-b.price).slice(0,8);
   return {...l,status:offers.length?"quoted":"not_found",offers};
  }));
  return reply({
   provider:"Amadeus Production",checked_at:new Date().toISOString(),currency:"BRL",
   status:"observed_not_booked",results:searches,
   warning:"Tarifas de consulta são voláteis. Verifique regras, taxas, bagagem e disponibilidade diretamente com o emissor antes da compra."
  },200,origin);
 }catch(err){
  const isTimeout=err instanceof Error&&(err.name==="TimeoutError"||err.name==="AbortError");
  return reply({error:isTimeout?"Pesquisa demorou demais; tente um período menor":"Pesquisa não concluída; consulte novamente o fornecedor"},isTimeout?504:502,origin);
 }
});
