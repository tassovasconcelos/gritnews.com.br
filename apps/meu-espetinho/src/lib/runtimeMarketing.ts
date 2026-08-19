import { supabase } from './supabase';

declare global {
 interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[])=>void;
  fbq?: any;
  __meuMarketing?: Record<string,string|undefined>;
 }
}

let loading:Promise<Record<string,string|undefined>>|null=null;
function addScript(src:string,id:string){if(document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.async=true;s.src=src;document.head.appendChild(s)}
function googleQueue(){window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||((...args:unknown[])=>window.dataLayer!.push(args))}

export async function loadRuntimeMarketing(){
 if(window.__meuMarketing)return window.__meuMarketing;
 if(loading)return loading;
 loading=(async()=>{
  const fallback:Record<string,string|undefined>={};
  if(!supabase)return fallback;
  const{data,error}=await supabase.rpc('get_marketing_runtime_config');
  if(error||!data)return fallback;
  const raw=data as any;
  const cfg={
   gtm:raw.gtm_id||undefined,ga4:raw.ga4_id||undefined,googleAds:raw.google_ads_id||undefined,
   googleAdsStartTrialLabel:raw.google_ads_start_trial_label||undefined,googleAdsSignupLabel:raw.google_ads_signup_label||undefined,
   googleAdsActivationLabel:raw.google_ads_activation_label||undefined,googleAdsSubscriptionLabel:raw.google_ads_subscription_label||undefined,
   metaPixel:raw.meta_pixel_id||undefined,adsense:raw.adsense_client_id||undefined,
  };
  window.__meuMarketing=cfg;return cfg;
 })();return loading;
}

export async function initRuntimeMarketing(){
 const cfg=await loadRuntimeMarketing();
 if(cfg.gtm){window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(cfg.gtm)}`,'meu-runtime-gtm')}
 if(cfg.ga4||cfg.googleAds){const primary=cfg.ga4||cfg.googleAds!;googleQueue();addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primary)}`,'meu-runtime-gtag');window.gtag?.('js',new Date());if(cfg.ga4)window.gtag?.('config',cfg.ga4,{send_page_view:true});if(cfg.googleAds)window.gtag?.('config',cfg.googleAds)}
 if(cfg.metaPixel&&!window.fbq){const fbq:any=function(...args:unknown[]){fbq.callMethod?fbq.callMethod.apply(fbq,args):fbq.queue.push(args)};fbq.push=fbq;fbq.loaded=true;fbq.version='2.0';fbq.queue=[];window.fbq=fbq;addScript('https://connect.facebook.net/pt_BR/fbevents.js','meu-runtime-meta');fbq('init',cfg.metaPixel);fbq('track','PageView')}
 if(cfg.adsense)addScript(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsense)}`,'meu-runtime-adsense');
 return cfg;
}

export function runtimeGoogleAdsDestination(event:string){const c=window.__meuMarketing||{};const label=event==='start_trial'?c.googleAdsStartTrialLabel:event==='sign_up'?c.googleAdsSignupLabel:event==='activation_paid'?c.googleAdsActivationLabel:event==='subscription_started'?c.googleAdsSubscriptionLabel:undefined;return c.googleAds&&label?`${c.googleAds}/${label}`:undefined}
