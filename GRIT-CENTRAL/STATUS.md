# Status consolidado

| Sistema | Publicado | Código localizado | Leads/automação | Próxima ação |
|---|---:|---:|---:|---|
| GRIT News | sim | sim | ativo | acompanhar publicação do Centro de Controle V2 |
| Meu Cuidador | sim, `meucuidadorapp.com.br` | sim, repositório privado `tassovasconcelos/meu-cuidador` | backend/CRM ativo no Supabase; 907 leads e 727 ILPIs vinculadas | homologar páginas/links, SEO e fechar E2E cadastro→perfil→conversão |
| Meu Espetinho | sim | sim | estruturado | concluir credenciais Google/Meta |
| Sr. Padeiro | sim | sim, integrado ao monorepo | coletor protegido e ativo | validar jornada completa periodicamente |
| SAC ProH | sim | repositório separado | operação própria | manter integração consentida |
| Moacir Rocha | sim | repositório separado | funil separado | preservar segregação jurídica |
| GRIT Propostas | landing | especificação | captura de interesse | evoluir para MVP |
| Meu Orçamento | landing no portal | scaffold e schema | integrado ao funil | homologar DNS e deploy do subdomínio |
| Oportunidades Procirúrgica | domínio pendente | repositório separado | planejado | confirmar URL pública |

## Meu Cuidador — estado operacional

- domínio canônico público: `https://meucuidadorapp.com.br`;
- código: repositório privado `tassovasconcelos/meu-cuidador`;
- stack do frontend: Next.js;
- publicação Hostinger automatizada por `.github/workflows/deploy-hostinger.yml`;
- CI valida canonical, TypeScript e build;
- deploy valida marcador de release exato no domínio oficial;
- última release comprovada em produção em 04/09/2026: `mc-2026-09-04-process-recovery-v17`;
- `https://meucuidador.gritnews.com.br` tratado como legado/operacional e não deve ser divulgado publicamente;
- backend Supabase e CRM estão ativos;
- ponte cadastro → `mc_profiles` implantada no banco;
- importador ILPI protegido e deduplicação ativa;
- Centro-Oeste reconciliado;
- cargas Nordeste/Sudeste ainda dependem da recuperação das fontes íntegras;
- indexação pública e jornadas devem ser auditadas sobre as rotas reais do repositório.

## Segurança

- inserção direta pública em `leads` bloqueada;
- captura somente pelo backend validado;
- proteção contra senhas vazadas ativa;
- segredos mantidos fora do Git;
- importador temporário do Meu Cuidador não possui mais segredo fixo no código e exige autenticação;
- alterações de RLS e funções privilegiadas devem continuar sob auditoria antes da abertura de novos endpoints.

## Monitoramento atual

O Meu Cuidador já possui verificação própria de produção no workflow de deploy por marcador exato de release. Deve também ser incorporado ao health check consolidado do ecossistema para disponibilidade, rotas públicas, sitemap/robots e jornada de cadastro.

## Produção conferida

Os indicadores do Meu Cuidador devem sempre refletir dados reais do Supabase, sem contabilizar como implantadas bases que ainda não entraram no CRM.
