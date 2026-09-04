# Meu Cuidador — inventário oficial de rotas e links

## Fonte de verdade

- Domínio público: `https://meucuidadorapp.com.br`
- Código/frontend: repositório privado `tassovasconcelos/meu-cuidador`
- Deploy: Hostinger via `.github/workflows/deploy-hostinger.yml`
- Domínio legado/operacional: `https://meucuidador.gritnews.com.br`

O domínio legado só pode existir na regra de redirecionamento 301/308 e em compatibilidade de links antigos; não deve aparecer em canonical, sitemap, campanhas, QR Codes, redes sociais, e-mails ou CTAs públicos.

## Rotas públicas confirmadas no código/configuração

As rotas abaixo são as superfícies públicas explicitamente tratadas pelo frontend atual e/ou sitemap. A árvore `app/` do repositório `tassovasconcelos/meu-cuidador` é a fonte de verdade final.

| Área | Rota/namespace | Regra |
|---|---|---|
| Home | `/` | pública, indexável, canonical oficial |
| Famílias | `/familias` | pública |
| Cuidadores | `/cuidadores` | pública |
| Profissionais | `/profissionais` | pública |
| Empresas | `/empresas` | pública |
| ILPI | `/ilpi` | pública |
| Oportunidades | `/oportunidades` e subrotas reais | pública |
| Formação | `/formacao` e subrotas | pública |
| Conteúdos | `/conteudos` e subrotas | pública |
| Segurança | `/seguranca` | pública |
| Ecossistema | `/ecossistema` | pública |
| Indicação | `/indique-um-cuidador` | pública |
| Brasil | `/brasil/...` | páginas nacionais/localizadas indexáveis quando possuírem conteúdo substancial |
| Termos | `/termos` | pública |
| Privacidade | `/privacidade` | pública |
| App | `/app` | área de aplicação; não indexável |
| Gerencial | `/app/gerencial/...` | autenticado/admin; não indexável |
| Admin legado | `/admin/...` | redireciona para `/app/gerencial` |

## Rotas funcionais do produto

Cadastro, login, perfil, documentos, matching, CRM, campanhas, pendências e relacionamento devem ser homologados pelos caminhos atualmente implementados na árvore `app/`. Não criar aliases públicos apenas para satisfazer documentação antiga; quando uma URL histórica precisar ser preservada, usar redirecionamento permanente/intencional para a rota vigente.

Fluxo funcional esperado permanece:

`BASE → CRM → CONTATO → CADASTRO → HOMOLOGAÇÃO → ATIVO`

## Regras de links e SEO

1. Links internos públicos devem usar o domínio canônico ou caminhos relativos.
2. Nenhum CTA público deve apontar para `meucuidador.gritnews.com.br`.
3. Links externos devem usar HTTPS.
4. Toda URL no sitemap precisa corresponder a página real/indexável; sitemap não pode publicar 404.
5. Áreas `/app/`, `/admin/` e `/api/` permanecem fora do rastreamento público.
6. Rotas gerenciais autenticadas devem emitir `noindex` também por header quando aplicável.
7. Páginas públicas estratégicas devem possuir title, description e canonical coerentes.
8. Páginas locais em escala só entram no sitemap quando houver conteúdo local substancial.
9. Toda campanha deve usar UTMs e preservar atribuição do lead até o cadastro.
10. O CI do frontend deve validar domínio canônico, rotas/sitemap, TypeScript e build antes do deploy.

## Estado validado em 04/09/2026

- repositório de produção localizado;
- CI e Deploy Hostinger da release atual concluídos com sucesso;
- marcador de produção: `mc-2026-09-04-process-recovery-v17`;
- redirecionamento do domínio legado para o oficial configurado em `next.config.mjs`;
- middleware redireciona `/admin/*` para `/app/gerencial` e protege `/app/gerencial/*`;
- `robots.ts` bloqueia `/api/`, `/admin/` e `/app/`;
- `sitemap.ts` usa o domínio oficial e lista as páginas públicas;
- PR #70 do repositório Meu Cuidador adiciona auditoria automática entre sitemap e páginas reais antes do build.
