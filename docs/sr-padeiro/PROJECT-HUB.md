# Sr. Padeiro — Project Hub

## Produto
Micro-SaaS mobile-first da GRIT para padarias, mercadinhos, mercearias e conveniências.
Posicionamento: **Simples para quem vende. Poderoso para quem administra.**
Domínio: `https://srpadeiro.gritnews.com.br`
Comercial: `contato@gritnews.com.br` | WhatsApp `+55 85 92171-6546`
Oferta atual: implantação R$ 199 + manutenção R$ 99/mês; trial 7 dias.

## Operação V1
- PDV/vendas
- produtos
- estoque
- caixa
- despesas
- clientes/fiado
- conta por WhatsApp / imagem
- relatórios
- personalização de logo/cor
- usuários e permissões
- trial / ativo / permuta / suspensão
- área gerencial
- PWA/mobile-first

## Marca — estrutura oficial
Arquivos devem viver em `apps/sr-padeiro/public/brand/`:
- `logo/sr-padeiro-horizontal.svg` — master vetorial
- `logo/sr-padeiro-horizontal.png` — uso digital
- `logo/sr-padeiro-simbolo.svg` — ícone/símbolo
- `logo/sr-padeiro-simbolo.png`
- `icons/favicon.svg`
- `applications/` — exemplos aprovados
- `brand-guidelines.md` — regras de aplicação

### Paleta
- Laranja principal: `#F79D1E`
- Creme: `#FFF8EC`
- Navy/grafite: `#1E2A3A`
- Marrom de apoio: `#5A3E2B`

Regras: preservar proporção e área de proteção; não distorcer, recolorir arbitrariamente ou recriar a marca por texto; materiais comerciais devem usar o arquivo master oficial.

## Materiais
Pacote produzido:
- Kit Comercial
- Guia Rápido
- Manual de Uso
- PDFs oficiais com marca

Organização recomendada: `docs/sr-padeiro/{brand,commercial,manuals,security,qa,seo}`.

## SEO / aquisição orgânica
Rotas comerciais:
- `/sistema-para-padaria`
- `/sistema-para-mercadinho`
- `/pdv-simples`
- `/controle-de-estoque`
- `/controle-de-caixa`
- `/controle-de-fiado`
- `/gestao-pelo-celular`
- `/planos`

Infra: `robots.txt`, `sitemap.xml`, canonical/title/description por página. Próximo passo: conteúdo informacional + FAQ/schema + Search Console + validação de indexação.

## Segurança — gate obrigatório
- Supabase Auth como fonte de identidade
- senha nunca em tabela de negócio/código
- `service_role` nunca no frontend
- RLS por tenant/organização em todas as tabelas operacionais
- teste negativo: usuário A não lê/escreve organização B
- Super Admin somente em área administrativa, nunca em conteúdo comercial
- MFA recomendado para contas administrativas
- audit log para liberação, suspensão, permuta, alteração de plano, usuário/permissão e ações sensíveis
- rate limit/anti-spam em formulários públicos
- validação server-side de operações sensíveis
- backup/restore testado
- dependências e secrets scanning no CI
- CSP, HSTS e headers de segurança em produção
- LGPD: consentimento, finalidade, retenção e atendimento de exclusão/exportação

## QA antes de escalar mídia
1. domínio/SSL
2. home e 8 páginas SEO HTTP 200
3. mobile 360/390/412 px
4. formulário cria lead uma única vez
5. WhatsApp correto
6. Auth/recovery
7. onboarding
8. primeira venda
9. estoque após venda
10. caixa/fechamento
11. conta WhatsApp/imagem
12. isolamento RLS
13. perfis/permissões
14. trial/expiração/liberação
15. sitemap/robots/canonical
16. analytics/UTM/gclid/fbclid

## Área gerencial Sr. Padeiro
Visões: Hoje, Comercial, Clientes, Assinaturas, Uso, Financeiro, Segurança, Saúde do App.
KPIs: leads, trials, ativados D0/D1/D3/D7, clientes ativos, permutas, suspensos, MRR, implantação, churn, último acesso, vendas processadas, erros, domínio/SSL e indexação.

# GRIT Control Center — próxima camada
Objetivo: uma central transversal de todos os apps, com drill-down por produto.

## Hierarquia
**GRIT Geral → Centro por App → Funil/Oportunidades → Cliente/Tenant → Eventos/Auditoria**

## Produtos iniciais
- Sr. Padeiro
- Meu Espetinho
- SAC 4.0
- OportunidadesPro
- demais produtos registrados no SaaS Factory

## Funil unificado
`new → contacted → qualified → demo → trial → proposal → won/lost`

Campos mínimos: `product_key`, lead, empresa, telefone/email, origem, source/medium/campaign/content/term, gclid/fbclid, score, responsável, próxima ação, valor potencial, status, timestamps.

## Dashboard geral
- leads hoje / 7d / 30d
- leads válidos e MQL
- oportunidades abertas
- trials
- clientes ganhos/perdidos
- conversão por app e canal
- receita de implantação
- MRR por app e consolidado
- churn
- CPL/CAC quando mídia estiver conectada
- SLA de primeiro contato
- leads sem próxima ação
- tenants em risco

## Centros por app
Cada card abre um centro com: funil, clientes, receita, uso, campanhas, SEO, saúde técnica e alertas.

## Princípio de dados
Não duplicar leads em bancos isolados. Evoluir para contrato central de leads/eventos com `product_key` e isolamento adequado. Dados operacionais específicos continuam nos verticais.
