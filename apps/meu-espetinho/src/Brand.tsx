export function Brand({ light = false }: { light?: boolean }) {
  return <div className={`me-brand me-brand-official ${light ? 'light' : ''}`} aria-label="Meu Espetinho — Seu negócio no controle">
    <img src="/logo-meu-espetinho.svg" alt="Meu Espetinho — Seu negócio no controle" />
  </div>;
}
