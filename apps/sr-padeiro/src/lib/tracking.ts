export function initTracking(){
  const ga=import.meta.env.VITE_GA4_ID; const meta=import.meta.env.VITE_META_PIXEL_ID; const w=window as any;
  if(ga){const s=document.createElement('script');s.async=true;s.src=`https://www.googletagmanager.com/gtag/js?id=${ga}`;document.head.appendChild(s);w.dataLayer=w.dataLayer||[];w.gtag=(...args:any[])=>w.dataLayer.push(args);w.gtag('js',new Date());w.gtag('config',ga)}
  if(meta){if(!w.fbq){w.fbq=function(){w.fbq.callMethod?w.fbq.callMethod.apply(w.fbq,arguments):w.fbq.queue.push(arguments)};w.fbq.queue=[];w.fbq.loaded=true;w.fbq.version='2.0';const s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s)}w.fbq('init',meta);w.fbq('track','PageView')}
}
export function track(name:string,params:Record<string,unknown>={}){const w=window as any;if(w.gtag)w.gtag('event',name,params);if(w.fbq)w.fbq('trackCustom',name,params)}