# Meu Cuidador — inventário oficial de rotas e links

## Regra canônica

Domínio público: `https://meucuidadorapp.com.br`

Domínio legado/operacional: `https://meucuidador.gritnews.com.br`

O domínio legado não deve aparecer em canonical, sitemap, campanhas, QR Codes, redes sociais, e-mails ou CTAs públicos.

## Rotas que precisam existir e ser homologadas no frontend real

| Área | Rota esperada | Critério de homologação |
|---|---|---|
| Home | `/` | carrega em mobile/desktop, CTA funcional, canonical correto |
| Cadastro | `/cadastro` | permite escolher familiar/paciente ou profissional |
| Cadastro profissional | `/cadastro/profissional` | cria Auth + `mc_profiles`, preserva atribuição de lead/campanha |
| Cadastro família | `/cadastro/familia` | cria Auth + perfil correspondente |
| Login | `/login` | autentica e redireciona pelo tipo de usuário |
| Perfil | `/perfil` | leitura/edição do próprio perfil |
| Documentos | `/perfil/documentos` | upload e acompanhamento de certificados/documentos |
| Busca/Matching | `/buscar` | filtros por UF/cidade, necessidade e disponibilidade |
| ILPIs | `/ilpis` | listagem por UF com expansão por cidade |
| Conteúdo | `/conteudos` | hub indexável de artigos e orientações |
| Termos | `/termos` | público e indexável |
| Privacidade | `/privacidade` | público e indexável |
| Contato | `/contato` | formulário/WhatsApp com tracking |
| Gerencial | `/gerencial` | autenticado/admin |
| CRM | `/gerencial/leads` | base → CRM → contato → cadastro → homologação → ativo |
| Campanhas | `/gerencial/campanhas` | filas, status, compliance, tracking e métricas reais |

## Regras de links

1. Links internos devem ser relativos ao domínio canônico.
2. Nenhum CTA público deve apontar para `meucuidador.gritnews.com.br`.
3. Links externos devem usar HTTPS.
4. Toda rota pública deve retornar 200 ou redirecionamento 301 intencional; nunca 404 silencioso.
5. Rotas SPA devem funcionar também em acesso direto/reload.
6. Login/gerencial não devem ser indexados.
7. Privacidade, termos, conteúdo, ILPIs e páginas comerciais devem possuir title, description e canonical próprios.
8. Sitemap deve conter apenas rotas públicas reais e indexáveis.
9. `robots.txt` deve bloquear áreas autenticadas/gerenciais e liberar conteúdo público.
10. Toda campanha deve usar UTMs e preservar `lead_id`/token de atribuição até o cadastro.

## Estado atual

O frontend/deploy que serve `meucuidadorapp.com.br` ainda não foi localizado no monorepo principal. Este arquivo passa a ser o contrato de rotas para a correção e homologação assim que a origem do deploy for identificada.
