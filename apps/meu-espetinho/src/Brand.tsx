export function Brand({ light = false }: { light?: boolean }) {
  return <div className={`me-brand me-brand-official ${light ? 'light' : ''}`} aria-label="Meu Espetinho — Seu negócio no controle">
    <img src="/logo-meu-espetinho-v3.svg" alt="Meu Espetinho" />
  </div>;
}
