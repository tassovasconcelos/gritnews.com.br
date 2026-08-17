import { useEffect, useState } from 'react';
import { bootstrapMarketingConsent, initMarketing, updateMarketingConsent } from './lib/analytics';

const KEY = 'meu-espetinho-marketing-consent';

export default function MarketingConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    bootstrapMarketingConsent();
    const value = localStorage.getItem(KEY);
    if (value === 'accepted') {
      updateMarketingConsent(true);
      initMarketing();
      return;
    }
    if (value === 'essential') {
      updateMarketingConsent(false);
      return;
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-consent">
      <div>
        <strong>Privacidade e experiência</strong>
        <span>
          Usamos métricas para entender a navegação, medir campanhas e melhorar o Meu Espetinho. Você pode aceitar ou continuar apenas com recursos essenciais.
        </span>
      </div>
      <div>
        <button
          className="cookie-secondary"
          onClick={() => {
            localStorage.setItem(KEY, 'essential');
            updateMarketingConsent(false);
            setVisible(false);
          }}
        >
          Só essenciais
        </button>
        <button
          onClick={() => {
            localStorage.setItem(KEY, 'accepted');
            updateMarketingConsent(true);
            initMarketing();
            setVisible(false);
          }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
