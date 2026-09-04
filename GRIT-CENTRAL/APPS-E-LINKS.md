# Apps e links do ecossistema

## Produtos publicados

| App | Produção | Código/local | Operação |
|---|---|---|---|
| GRIT News / Soluções | [Abrir](https://gritnews.com.br) | `src/` e `public/` | [Admin](https://gritnews.com.br/admin) |
| Meu Cuidador | [Abrir](https://meucuidadorapp.com.br) | origem do frontend/deploy ainda não localizada neste monorepo | backend/CRM no Supabase `gritnews`; domínio legado `meucuidador.gritnews.com.br` não deve ser usado como link público |
| Meu Espetinho | [Abrir](https://meuespetinho.gritnews.com.br) | `apps/meu-espetinho/` | [Admin](https://meuespetinho.gritnews.com.br/admin) |
| Sr. Padeiro | [Abrir](https://srpadeiro.gritnews.com.br) | origem pendente, issue #92 | landing, trial e leads |
| SAC ProH | [Abrir](https://apps.sacproh.gritnews.com.br) | `tassovasconcelos/sacproh` | aplicação operacional |
| Moacir Rocha | [Abrir](https://moacirrocha.adv.br) | `tassovasconcelos/moacirrocha-adv-br` | funil jurídico separado |

## Produtos em desenvolvimento

| Produto | Link | Estado |
|---|---|---|
| GRIT Propostas | [Landing](https://gritnews.com.br/produtos/grit-propostas/) | especificação e captura de interesse |
| Oportunidades Procirúrgica | sem domínio confirmado | repositório `tassovasconcelos/procirurgica-revenue-ops` |
| Meu Espetinho — produto | [Página institucional](https://gritnews.com.br/produtos/meu-espetinho/) | publicado |
| SAC 4.0 | [Página institucional](https://gritnews.com.br/produtos/sac-4-0/) | catálogo GRIT |
| Oportunidades Pro | [Página institucional](https://gritnews.com.br/produtos/oportunidadespro/) | catálogo GRIT |

## Meu Cuidador — links canônicos e regras

- Domínio público canônico: `https://meucuidadorapp.com.br`.
- O domínio `https://meucuidador.gritnews.com.br` é legado/operacional e não deve ser usado em CTAs, campanhas, canonical, sitemap, redes sociais ou materiais públicos.
- Toda página pública do Meu Cuidador deve apontar canonical para `meucuidadorapp.com.br`.
- Links de cadastro, login, perfil, busca/matching, conteúdo, termos, privacidade, contato, ILPI e gerencial devem ser validados contra o deploy real antes de publicação em campanha.
- O frontend/deploy que serve `meucuidadorapp.com.br` ainda precisa ser localizado e versionado no GitHub para permitir auditoria e homologação E2E.
- Issue operacional central: #131.

## Dados, automações e código

| Sistema | Link |
|---|---|
| Supabase `gritnews` | [Dashboard](https://supabase.com/dashboard/project/pcrwtoddavpvkaxwtstc) |
| Leads | [Table Editor](https://supabase.com/dashboard/project/pcrwtoddavpvkaxwtstc/editor) |
| Edge Functions | [Funções](https://supabase.com/dashboard/project/pcrwtoddavpvkaxwtstc/functions) |
| Advisors | [Segurança e performance](https://supabase.com/dashboard/project/pcrwtoddavpvkaxwtstc/advisors/security) |
| GitHub | [Repositório](https://github.com/tassovasconcelos/gritnews.com.br) |
| Remote Ops Kit | [PR #76](https://github.com/tassovasconcelos/gritnews.com.br/pull/76) |
| Fonte Sr. Padeiro | [Issue #92](https://github.com/tassovasconcelos/gritnews.com.br/issues/92) |
| Consolidação GRIT News | [Issue #93](https://github.com/tassovasconcelos/gritnews.com.br/issues/93) |
| Meu Cuidador E2E | [Issue #131](https://github.com/tassovasconcelos/gritnews.com.br/issues/131) |

## Google

| Sistema | Link |
|---|---|
| Google Ads | [Conta de anúncios](https://ads.google.com/) |
| Google Cloud | [Projeto PROJETO SAC 4](https://console.cloud.google.com/home/dashboard?project=gen-lang-client-0354992661) |
| Google Ads API | [Biblioteca da API](https://console.cloud.google.com/apis/library/googleads.googleapis.com?project=gen-lang-client-0354992661) |
| OAuth | [Clientes OAuth](https://console.cloud.google.com/auth/clients?project=gen-lang-client-0354992661) |
| Search Console | [Propriedades](https://search.google.com/search-console) |
| Analytics | [Google Analytics](https://analytics.google.com/) |
| Tag Manager | [Google Tag Manager](https://tagmanager.google.com/) |

## Meta e WhatsApp

| Sistema | Link |
|---|---|
| Meta Business Suite | [Grit Soluções](https://business.facebook.com/latest/settings/?business_id=1357021259351813) |
| Contas de anúncios | [Configurações](https://business.facebook.com/latest/settings/ad_accounts?business_id=1357021259351813) |
| Gerenciador de Eventos | [Pixels e eventos](https://business.facebook.com/events_manager2/) |
| WhatsApp Manager | [Gerenciador](https://business.facebook.com/wa/manage/) |
| Instagram | [@grit.solucoes](https://www.instagram.com/grit.solucoes/) |

## Hospedagem

| Sistema | Link |
|---|---|
| Hostinger | [hPanel](https://hpanel.hostinger.com/) |
| Status GRIT | `ops/remote/check-health.ps1` |

Nenhum link contém token, senha ou segredo embutido.
