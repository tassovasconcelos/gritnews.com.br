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

let initialized = false;

function appendScript(src: string, id: string, attrs: Record<string,string> = {}) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  Object.entries(attrs).forEach(([k,v]) => script.setAttribute(k,v));
  document.head.appendChild(script);
}

export function initMarketing() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  if (cfg.gtm) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    appendScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(cfg.gtm)}`, 'meu-gtm');
  }

  if (cfg.ga4 || cfg.googleAds) {
    const primary = cfg.ga4 || cfg.googleAds!;
    appendScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primary)}`, 'meu-gtag');
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => { window.dataLayer!.push(args); };
    window.gtag('js', new Date());
    if (cfg.ga4) window.gtag('config', cfg.ga4, { anonymize_ip: true });
    if (cfg.googleAds) window.gtag('config', cfg.googleAds);
  }

  if (cfg.metaPixel) {
    const fbq = function(...args: unknown[]) {
      (fbq as any).callMethod ? (fbq as any).callMethod.apply(fbq, args) : (fbq as any).queue.push(args);
    } as any;
    fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
    window.fbq = fbq;
    appendScript('https://connect.facebook.net/pt_BR/fbevents.js', 'meu-meta-pixel');
    window.fbq('init', cfg.metaPixel);
    window.fbq('track', 'PageView');
  }

  if (cfg.adsense) {
    appendScript(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsense)}`, 'meu-adsense', { crossorigin: 'anonymous' });
  }
}

export function trackMarketing({ name, params = {} }: MarketingEvent) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
  window.gtag?.('event', name, params);
  const metaMap: Record<string,string> = {
    view_landing: 'ViewContent',
    click_whatsapp: 'Contact',
    start_trial: 'StartTrial',
    sign_up: 'CompleteRegistration',
    begin_checkout: 'InitiateCheckout',
    activation_paid: 'Purchase',
    subscription_started: 'Subscribe',
  };
  if (window.fbq && metaMap[name]) window.fbq('track', metaMap[name], params);
}

export function marketingConfigured() {
  return Boolean(cfg.gtm || cfg.ga4 || cfg.googleAds || cfg.metaPixel || cfg.adsense);
}
