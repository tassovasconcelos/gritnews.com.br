(() => {
  const ENDPOINT = 'https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/commercial-lead';
  const params = new URLSearchParams(window.location.search);
  const qs = (key) => params.get(key) || '';
  const forms = document.querySelectorAll('[data-commercial-lead]');

  forms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const status = form.querySelector('[data-lead-status]');
      const data = new FormData(form);
      const consentChannels = [];
      if (data.get('whatsapp')) consentChannels.push('whatsapp');
      if (data.get('email')) consentChannels.push('email');
      const payload = {
        name: data.get('name'),
        email: data.get('email'),
        whatsapp: data.get('whatsapp'),
        business_name: data.get('business_name'),
        city: data.get('city'),
        message: data.get('message'),
        website: data.get('website'),
        product: form.dataset.product || 'grit',
        source: qs('utm_source') || form.dataset.source || 'gritnews',
        medium: qs('utm_medium') || 'organic',
        campaign: qs('utm_campaign') || form.dataset.campaign || 'commercial_hub',
        content: qs('utm_content'),
        utm_term: qs('utm_term'),
        gclid: qs('gclid'),
        fbclid: qs('fbclid'),
        referral_code: qs('ref') || qs('referral_code'),
        landing_page: window.location.href.slice(0, 500),
        consent_lgpd: data.get('consent_lgpd') === 'on',
        consent_channels: consentChannels,
        consent_version: 'grit-leads-v1',
        privacy_notice_url: 'https://gritnews.com.br/privacidade',
        source_type: 'website_form',
        source_form_id: form.id || `${form.dataset.product || 'grit'}:${form.dataset.campaign || 'commercial_hub'}`,
      };

      if (button) button.disabled = true;
      if (status) status.textContent = 'Enviando...';
      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('lead_capture_failed');
        form.reset();
        if (status) status.textContent = form.dataset.success || 'Recebemos seus dados. Nossa equipe entrará em contato.';
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'lead_created', product: payload.product, source: payload.source, campaign: payload.campaign });
      } catch (_) {
        if (status) status.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
      } finally {
        if (button) button.disabled = false;
      }
    });
  });
})();
