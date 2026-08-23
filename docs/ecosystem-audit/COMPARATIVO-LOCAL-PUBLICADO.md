# Comparativo local x publicado

## Visão executiva

| Produto | Estado local na PR #76 | Estado publicado | Situação |
|---|---|---|---|
| GRIT News | Código completo na raiz e uma segunda versão em `apps/gritnews` | HTTP 200; bundle publicado com identidade GRIT | Publicado, porém com duplicidade e divergência interna |
| Meu Espetinho | App completo, documentos, migrations, growth e logos | HTTP 200; bundle e logo V3 publicados | Alinhado em escopo; validar build/deploy por commit |
| Sr. Padeiro | Apenas documentação operacional e roteamento | HTTP 200; bundle próprio, manifest e landing ativa | Lacuna crítica: fonte não versionada aqui |
| GRIT Propostas | README de produto e landing no portal | Landing pública | MVP ainda não existe como app |
| SAC ProH | Referência em `ops/sites.json` | HTTP 200 | Mantido fora deste repositório |
| Moacir Rocha | Referência operacional | HTTP 200 | Mantido fora deste repositório |
| Oportunidades Procirúrgica | Inventário sem domínio confirmado | Publicação não confirmada por este kit | Completar URL e health check |

## Evidências de produção

| URL | HTTP | Título observado |
|---|---:|---|
| `https://gritnews.com.br` | 200 | GRIT Soluções e Negócios — Inteligência Comercial, Tecnologia e SaaS |
| `https://meuespetinho.gritnews.com.br` | 200 | Meu Espetinho — Sistema para Espetinho, Comanda Digital e PDV |
| `https://srpadeiro.gritnews.com.br` | 200 | Sr. Padeiro — Gestão simples para padarias e mercadinhos |
| `https://apps.sacproh.gritnews.com.br` | 200 | SACPROH — Procirúrgica |
| `https://moacirrocha.adv.br` | 200 | Dr. Moacir Rocha — Advocacia e Consultoria |

## Divergência do portal GRIT

A raiz possui 91 arquivos em `src`; `apps/gritnews/src` possui 58. Há 34 arquivos exclusivos na raiz, um exclusivo no app duplicado e 25 arquivos comuns com conteúdo diferente. A raiz contém recursos adicionais de auditoria, oportunidades, pagamentos, notícias, imóveis, mercado, playbooks e checkout. `apps/gritnews` contém `AdminControlCenter.tsx`, ausente na raiz.

Decisão recomendada: declarar a raiz como app de produção e migrar o Control Center para ela; depois remover a duplicidade em mudança separada e revisada.

## Pendências de sincronização

1. Localizar e incorporar o código-fonte do Sr. Padeiro.
2. Registrar commit/deploy em `deploy-version.json` para todos os apps.
3. Confirmar domínio do Oportunidades Procirúrgica.
4. Transformar GRIT Propostas de especificação em app versionado.
5. Adicionar Sr. Padeiro ao health check após confirmar `robots.txt` e `sitemap.xml` no host.
