# Search Console centralizado — GRIT

## Arquitetura
A propriedade principal recomendada é `sc-domain:gritnews.com.br`, pois uma propriedade de domínio cobre o domínio raiz e seus subdomínios. O inventário central fica em `ops/sites.json`.

Sites públicos usam `public_index: true`, `sitemap` e `search_console_property`. Sistemas internos como SAC e Oportunidades permanecem com `public_index: false` e não são enviados para indexação.

## Autenticação
O workflow usa uma conta de serviço do Google Cloud com o escopo `https://www.googleapis.com/auth/webmasters`.

1. No Google Cloud, crie ou selecione um projeto para a governança GRIT.
2. Ative a Google Search Console API.
3. Crie uma conta de serviço exclusiva, por exemplo `grit-search-console`.
4. Gere uma chave JSON somente se não houver Workload Identity Federation disponível.
5. No Search Console, abra a propriedade `gritnews.com.br` e conceda acesso ao `client_email` da conta de serviço.
6. No GitHub, em Settings > Secrets and variables > Actions, crie o secret `GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON` contendo o JSON completo da conta de serviço.
7. Execute manualmente o workflow `Site Governance` ou aguarde a execução agendada.

## Comportamento automático
O workflow roda a cada 6 horas e:

- testa disponibilidade dos sites inventariados;
- valida `robots.txt` e `sitemap.xml` dos sites públicos;
- inspeciona headers de segurança;
- autentica na Search Console API quando o secret está presente;
- lista as propriedades acessíveis à conta de serviço;
- confirma acesso à propriedade configurada;
- envia os sitemaps dos sites públicos pela API oficial;
- grava o resultado no resumo da execução do GitHub Actions.

## Segurança
Nunca grave a chave JSON no repositório, `.env`, documentação, issue ou log. O script não imprime o conteúdo do secret. Se uma chave for exposta, revogue-a no Google Cloud e gere outra.

Como evolução, prefira Workload Identity Federation entre GitHub Actions e Google Cloud para eliminar chaves JSON persistentes.
