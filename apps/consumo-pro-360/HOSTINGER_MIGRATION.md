# CONSUMO PRO 360 — Migração controlada para Hostinger (GRIT)

**Produto:** CONSUMO PRO 360 | Grupo Prohospital  
**Tecnologia:** GRIT Soluções e Negócios  
**Domínio final:** `https://consumo.gritnews.com.br`  
**Rotas:** `/gestao` e `/solicitar`  
**Código:** `apps/consumo-pro-360` no ramo `feature/consumo-pro-360-mvp`  
**Banco / Autenticação / Arquivos:** Supabase dedicado `xscxwazanootrdtyrumb` (não migrar o banco).  
**Hospedagem final:** subdomínio com pasta web própria na Hostinger.

## Estado verificado antes da migração

- O domínio gritnews.com.br usa DNS externo à Vercel (`orbit.dns-parking.com` e `horizon.dns-parking.com`).
- A Hostinger já possui um fluxo de deploy para o GRIT News principal na branch `main` (`.github/workflows/auto-deploy.yml`).
- A aplicação de consumo possui deploy Vercel separado que deve ser mantido como contingência até homologação.
- O subdomínio `consumo.gritnews.com.br` ainda está associado ao projeto Vercel, mas o DNS consultado na última auditoria não possuía o registro do subdomínio. **Não declarar que a Hostinger está publicada sem verificar DNS, HTTPS e login.**
- Contas, perfis, permissões e documentos existentes no Supabase devem ser preservados.

## Entregas preparadas no repositório

- `public/.htaccess`: SPA Apache/LiteSpeed com fallback para `index.html`, cabeçalhos de segurança, bloqueio de indexação e exceção para validação ACME/SSL.
- `public/robots.txt`: impedir indexação do aplicativo corporativo.
- `.github/workflows/consumo-pro-hostinger.yml`: compila o PWA isolado, confere o manifesto e gera artefato versionado.
- O envio via SSH/SCP só é executado após habilitação deliberada e confirmação do diretório exclusivo. Nenhum arquivo de produção é apagado automaticamente.
- O arquivo `release.json` registra o commit compilado para conferência da versão que chegou à hospedagem.

## Alternativa: criar o subdomínio pela API oficial (automatizado e controlado)

A Hostinger disponibiliza API oficial para consultar e criar subdomínios em sites de hospedagem compatíveis. O arquivo `scripts/provision_hostinger.py` foi criado com **modo somente consulta por padrão** e opção `--apply` para criar exclusivamente `consumo.gritnews.com.br` em pasta isolada. Antes de alterar qualquer recurso, ele consulta a lista de subdomínios, evita recriação e recusa um diretório raiz compartilhado. Não modifica DNS, portal GRIT News ou banco Supabase.

Configure **somente em GitHub Secrets**, nunca no código, as credenciais:

- `CONSUMO_HOSTINGER_API_TOKEN` — token de API de uma identidade Hostinger autorizada;
- `CONSUMO_HOSTINGER_HOSTING_USERNAME` — nome do usuário de hospedagem do site, por exemplo formato `u123456789` (não é e-mail).

O workflow de publicação inclui o job `provision`. **Ele não executa por padrão.** Para habilitar criação mediante push ao ramo do aplicativo, use temporariamente a variável GitHub Actions `CONSUMO_HOSTINGER_PROVISION=true` depois de configurar os dois Secrets e a proteção do Environment `consumo-pro-hostinger`. Desative essa variável assim que o subdomínio estiver criado e verificado.

A API de criação de subdomínio é específica de hospedagens que permitem adicionar subdomínios ao site pai. Caso o `gritnews.com.br` esteja instalado em um Website Builder que não admite esse endpoint, crie `consumo.gritnews.com.br` **como um site independente** pelo hPanel (método da seção a seguir); não force a chamada API contra recursos incompatíveis.

Referência oficial: https://developers.hostinger.com/api/hosting/v1/accounts/{username}/websites/{domain}/subdomains

**Importante:** um resultado de build `READY` na Vercel ou o commit criado no GitHub não comprovam criação/publicação na Hostinger. A migração está pendente até a verificação do `release.json` no subdomínio com DNS da Hostinger.

## 1. Preparar o subdomínio na Hostinger

No **hPanel da Hostinger**, entre na hospedagem vinculada ao gritnews.com.br e crie o subdomínio **consumo** com **document root exclusivo**, sem apontá-lo à raiz do site GRIT News.

O caminho dependerá do plano/estrutura real da conta. Exemplos de pastas exclusivas aceitas pelo workflow:

- `/home/USUARIO/domains/consumo.gritnews.com.br/public_html`
- `/home/USUARIO/domains/gritnews.com.br/public_html/consumo`

**Não reutilize `public_html` do site principal e não inclua credenciais neste documento.**

No Gerenciador de Arquivos da Hostinger, dentro da pasta exclusiva, crie o arquivo oculto `.consumo-pro-deploy-root` com uma linha exata:

```text
CONSUMO_PRO_360_HOSTINGER_ONLY
```

Esse arquivo impede que o pipeline publique no diretório errado. Ele não integra o build nem será incluído nas pastas do site GRIT News.

Ative SSH/SFTP no hPanel, quando disponível no plano. O deploy usa SSH com chave privada armazenada apenas nos segredos do GitHub e a chave pública cadastrada na Hostinger. A conexão ao servidor utiliza o fingerprint confiável previamente confirmado.

## 2. Configurar GitHub Secrets (não compartilhar valores no chat)

Em GitHub → repositório `tassovasconcelos/gritnews.com.br` → Settings → Secrets and variables → Actions, cadastrar:

| Secret | Uso |
|---|---|
| `CONSUMO_SUPABASE_PUBLISHABLE_KEY` | Chave pública do projeto dedicado para compilar o frontend. Jamais usar `service_role`. |
| `CONSUMO_HOSTINGER_SSH_HOST` | Host SSH fornecido pelo hPanel. |
| `CONSUMO_HOSTINGER_SSH_USER` | Usuário SSH exclusivo ou autorizado. |
| `CONSUMO_HOSTINGER_SSH_PORT` | Porta SSH informada pela Hostinger (se omitida, o fluxo usa 22). |
| `CONSUMO_HOSTINGER_SSH_PRIVATE_KEY` | Chave privada de deploy, sem senha de uso interativo, mantida somente em GitHub Secrets. |
| `CONSUMO_HOSTINGER_SSH_KNOWN_HOSTS` | Linha `known_hosts` do servidor SSH, com fingerprint conferido por fonte confiável antes de cadastrar. |
| `CONSUMO_HOSTINGER_DEPLOY_PATH` | Caminho **absoluto** da pasta exclusiva com o marcador de segurança. |

Recomendação: proteger o environment GitHub `consumo-pro-hostinger` com revisores obrigatórios, evitando publicações acidentais. Caso o plano não forneça SSH/SFTP, o artefato ZIP gerado pelo pipeline pode ser enviado manualmente pelo Gerenciador de Arquivos; nesse caso, **não** habilitar a publicação automática SSH.

## 3. Build e publicação

Workflow: [CONSUMO PRO 360 - Hostinger release](https://github.com/tassovasconcelos/gritnews.com.br/blob/feature/consumo-pro-360-mvp/.github/workflows/consumo-pro-hostinger.yml).

- Todo push na branch do aplicativo que modifica a pasta do CONSUMO PRO gera validação e pacote do PWA, sem tocar no portal principal.
- A tarefa de deploy é bloqueada por padrão. Para publicação automática, cadastrar a variável do repositório `CONSUMO_HOSTINGER_AUTO_DEPLOY=true` **somente após** confirmar SSH, diretório, HTTPS e homologação inicial. O marcador é sempre obrigatório.
- Também existe execução manual `workflow_dispatch` com parâmetro `deploy_hostinger`; a interface GitHub pode exigir que o workflow esteja presente na branch padrão antes de oferecer esse botão.
- No primeiro deploy, mantenha a variável de publicação automática desabilitada para revisar o ZIP e a pasta de destino.
- O workflow não realiza remoção automática de arquivos, não importa bancos, não modifica rotas do gritnews.com.br, não altera DNS e não mexe nos arquivos fiscais.

## 4. Configurar DNS e TLS

**Somente depois de os arquivos estarem na Hostinger**, configure a zona DNS de `gritnews.com.br` para que o host `consumo` aponte ao **IP / destino de subdomínio fornecido pela Hostinger**. Não copiar cegamente o IP do gritnews.com.br nem alterar os registros `@` ou `www`.

Se já existir CNAME/A de `consumo` apontando à Vercel, substitua **apenas esse registro**, após o novo host estar pronto. Em seguida, emitir/verificar certificado HTTPS para `consumo.gritnews.com.br` e validar:

- `https://consumo.gritnews.com.br/manifest.webmanifest` retorna manifesto válido.
- `https://consumo.gritnews.com.br/release.json` retorna o commit que foi publicado na Hostinger.
- Recarregar diretamente `/gestao` e `/solicitar` não retorna 404.
- Respostas incluem cabeçalhos de segurança e `X-Robots-Tag: noindex`.

O subdomínio só deve ser considerado migrado após o DNS apontar para a Hostinger e o `release.json` corresponder ao commit esperado.

Com HTTPS e DNS já operacionais, rode a verificação automatizada a partir da pasta `apps/consumo-pro-360`:

```bash
bash scripts/verify_hostinger.sh https://consumo.gritnews.com.br <COMMIT_PUBLICADO>
```

O teste verifica `/gestao`, `/solicitar`, PWA, assinatura Hostinger em `release.json` e cabeçalhos de segurança. Ele **não substitui** a homologação do login com usuários autorizados e de operações reais no celular.


## 5. Ajustar Supabase Auth sem perder a contingência

No painel Supabase do projeto dedicado:

1. Em Authentication → URL Configuration, adicionar `https://consumo.gritnews.com.br` como endereço de retorno permitido (Site URL quando for definitivamente o principal). Considerar os caminhos usados pelo aplicativo e pela recuperação de senha.
2. Manter temporariamente o URL Vercel anterior na lista de redirects durante a transição.
3. Conferir convite por e-mail, recuperação de senha, conta GRIT autenticada, sessão expirada, e papéis de solicitante/gestor/almoxarifado.
4. As Edge Functions `cp-activate-access` e `cp-invite-user` já foram ajustadas para aceitar a origem corporativa e **continuam exigindo JWT**; validar fluxo com navegador real.
5. Não divulgar nenhuma senha padrão, token de serviço, chave privada, credenciais SMTP ou dados de clientes no repositório.

## 6. Homologação móvel/operacional obrigatória

- Login de `gritsolucoes@gmail.com` com vínculo GRIT ativo e senha definida pelo titular.
- Solicitante com empresa e setor permitidos; usuário não consegue acessar dados de outra empresa.
- Criar solicitação → aprovar → reservar → entregar → conferir baixa física única e evento de auditoria.
- Recarregar a tela pelo celular, abrir `/solicitar`, adicionar aplicativo à tela inicial, recuperar sessão e verificar sincronismo de pedidos.
- Upload de NF-e XML e leitura estruturada; PDF/foto com armazenamento privado e conferência manual. **OCR automático não está homologado.**
- Validar SKU novo sugerido a partir da nota, conversão de embalagem e custo; confirmar que a NF não dá entrada automática sem conferência.
- Avaliar notificações: o aplicativo faz atualização periódica **somente enquanto aberto**, não possui push em segundo plano homologado.
- Confirmar que a marca oficial Prohospital foi enviada por ativo original, sem redesenho.

## 7. Rollback

Preservar o deploy Vercel e todos os dados Supabase até os testes de produção serem aprovados. Se o novo endereço falhar, reverter **somente o DNS do subdomínio** para a hospedagem anterior comprovadamente operacional. Não apagar as notas, pedidos, estoque, usuários ou banco. Após estabilizar, revisar a necessidade de manter ou remover o domínio customizado da Vercel.

### Ponto de controle

**Preparação em código não é publicação na Hostinger.** Sem acesso autenticado ao hPanel ou segredos SSH aprovados, não é possível executar o upload, criar o DNS externo ou confirmar que o site está funcionando. Os itens pendentes devem permanecer declarados como pendentes até evidência de execução e teste real.
