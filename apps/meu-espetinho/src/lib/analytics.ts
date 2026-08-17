type MarketingEvent = {
  name: string;
  params?: Record<string, string | number | boolean | undefined>;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const cfg = {
  gtm: import.meta.env.VITE_GTM_ID as string | undefined,
  ga4: import.meta.env.VITE_GA4_ID as string | undefined,
  googleAds: import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined,
  metaPixel: import.meta.env.VITE_META_PIXEL_ID as string | undefined,
  adsense: import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined,
};

const ATTR_KEY='meu-espetinho-attribution';
let initialized = false;
const pending: MarketingEvent[]=[];

function appendScript(src: string, id: string, attrs: Record<string,string> = {}) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  Object.entries(attrs).forEach(([k,v]) => script.setAttribute(k,v));
  document.head.appendChild(script);
}

function readAttribution():Record<string,string>{
  try{return JSON.parse(localStorage.getItem(ATTR_KEY)||'{}')}catch{return {}}
}

export function captureAttribution(){
  if(typeof window==='undefined')return;
  const p=new URLSearchParams(window.location.search);
  const current={
    utm_source:p.get('utm_source')||'',utm_medium:p.get('utm_medium')||'',utm_campaign:p.get('utm_campaign')||'',utm_content:p.get('utm_content')||'',utm_term:p.get('utm_term')||'',gclid:p.get('gclid')||'',fbclid:p.get('fbclid')||'',landing_path:window.location.pathname,first_seen:new Date().toISOString()
  };
  if(Object.values(current).some(Boolean)){
    const old=readAttribution();
    localStorage.setItem(ATTR_KEY,JSON.stringify({...current,first_seen:old.first_seen||current.first_seen}));
  }
}

function sendEvent({name,params={}}:MarketingEvent){
  const attribution=readAttribution();
  const enriched={...attribution,...params};
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push({event:name,...enriched});
  window.gtag?.('event',name,enriched);
  const metaMap:Record<string,string>={view_landing:'ViewContent',click_whatsapp:'Contact',click_consulting:'Contact',start_trial:'StartTrial',sign_up:'CompleteRegistration',begin_checkout:'InitiateCheckout',activation_paid:'Purchase',subscription_started:'Subscribe'};
  const metaEvent=metaMap[name];
  if(metaEvent)window.fbq?.('track',metaEvent,enriched);
}

export function initMarketing() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  captureAttribution();

  if (cfg.gtm) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    appendScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(cfg.gtm)}`, 'meu-gtm');
  }

  if (cfg.ga4 || cfg.googleAds) {
    const primary = cfg.ga4 || cfg.googleAds!;
    appendScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primary)}`, 'meu-gtag');
    window.dataLayer = window.dataLayer || [];
    const gtag = (...args: unknown[]) => { window.dataLayer!.push(args); };
    window.gtag = gtag;
    gtag('js', new Date());
    if (cfg.ga4) gtag('config', cfg.ga4, { anonymize_ip: true, send_page_view: true });
    if (cfg.googleAds) gtag('config', cfg.googleAds);
  }

  if (cfg.metaPixel) {
    const fbq = function(...args: unknown[]) {(fbq as any).callMethod ? (fbq as any).callMethod.apply(fbq,args) : (fbq as any).queue.push(args);} as any;
    fbq.push=fbq;fbq.loaded=true;fbq.version='2.0';fbq.queue=[];window.fbq=fbq;
    appendScript('https://connect.facebook.net/pt_BR/fbevents.js','meu-meta-pixel');
    fbq('init',cfg.metaPixel);fbq('track','PageView');
  }

  if (cfg.adsense) appendScript(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsense)}`,'meu-adsense',{crossorigin:'anonymous'});
  pending.splice(0).forEach(sendEvent);
}

export function trackMarketing(event:MarketingEvent){
  captureAttribution();
  if(!initialized){pending.push(event);window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:event.name,...readAttribution(),...(event.params||{})});return;}
  sendEvent(event);
}

export function marketingConfigured(){return Boolean(cfg.gtm||cfg.ga4||cfg.googleAds||cfg.metaPixel||cfg.adsense)}
export function marketingStatus(){return {gtm:Boolean(cfg.gtm),ga4:Boolean(cfg.ga4),googleAds:Boolean(cfg.googleAds),metaPixel:Boolean(cfg.metaPixel),adsense:Boolean(cfg.adsense)}}
