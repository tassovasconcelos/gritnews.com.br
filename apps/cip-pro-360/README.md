## Estado consolidado — publicação e evolução (18/10/2026)
**A versão inicial do CIP já foi publicada e conferida no domínio `https://cip.gritnews.com.br/`** pela execução manual FTPS `39145361980`, commit `fc41b2343de691521c8bc31ecb9fca08c964c6e5`; todos os arquivos retornaram HTTPS 200 e SHA-256 esperado, com logo oficial preservado. As referências abaixo a “não publicado” descrevem etapas anteriores e **não são mais o status vigente**.

**Evolução desta rodada:** navegação mobile com sobreposição, botão acessível, fechamento por Escape/toque fora e limpeza no logout; Doquita lê somente o histórico **manual** das empresas autorizadas, produz alertas explicáveis de revisão de preços, cotações e procuras não atendidas com próxima ação humana. Novo módulo `doquita-insights.mjs` incluído no manifesto e nos testes. **Sem integração com Procfit, sem execução autônoma ou dados reais de ERP.** Novo pacote aguardando validação e verificação FTPS de publicação.

**Pendências críticas:** homologação autenticada em navegador (login, logout, RLS entre perfis restritos, responsividade em aparelhos reais), Procfit/BI, gestão de usuários, aprovação de preço com alçadas e comprovação das fontes operacionais.

---

# CIP PRO 360° — Shopping Prohospital + Distribuidora Prohospital


## Identidade oficial — atualização de 18/10/2026
A tela de login, navegação e favicon do CIP foram adaptados à identidade **vermelho/amarelo/branco do Grupo Prohospital** e passam a usar `./logo-grupo-prohospital.jpg` no lugar do símbolo provisório. A imagem oficial foi reenviada diretamente pelo usuário em 18/10/2026 e incorporada byte a byte em `apps/cip-pro-360/logo-grupo-prohospital.jpg`, sem edição ou redesenho, com SHA-256 `1bdf5e051a137268d2aad2a6db750f53faecf1e590e673c9ed5d3a4e87c29d79`.

**Logomarca original incorporada à branch:** JPG de 61.775 bytes, preservado sem alteração. O hash acima corresponde ao arquivo reenviado nesta conversa e substitui a referência de hash da entrega anterior. O workflow exige esse arquivo exato para publicar. A publicação em `cip.gritnews.com.br` continua **não confirmada**; hPanel/DNS/SSL/FTPS e homologação real seguem pendentes.

## Estado verificável (18/10/2026)
**Frontend:** login ligado ao Supabase GRIT, navegação com sessão autenticada, módulos Varejo/B2B segregados por perfil; telas de simulação, análises manuais de preços, cadastro de cotações e Caderninho e cronograma. Projeto ainda não publicado em `cip.gritnews.com.br`: Hostinger hPanel / subdomínio / FTPS pendentes.

**Backend:** conectado ao projeto existente Supabase `gritnews` (ref `pcrwtoddavpvkaxwtstc`) como provedor de identidade compartilhado; a autenticação com senha preexistente usa Supabase Auth, **não armazena nem replica credenciais no CIP**. Banco isolado por tabelas prefixadas `cip_`, com políticas RLS por empresa. O usuário `gritsolucoes@gmail.com` já foi confirmado como `superadm` na tabela CIP por correspondência exata de conta Supabase existente e verificada.

**Banco criado:** 9 tabelas, 22 políticas RLS, 2 empresas, 6 marcos. Migrações registradas no Supabase como `cip_pro_360_foundation_shopping_distribuidora` (20261018071944) e `cip_restrict_company_and_authorship_mutations`, além de `cip_shopping_marca_passo_manual_reviews`. Acesso `anon` revogado das tabelas CIP. Usuário sem perfil CIP não consulta empresas. Autoria e identificador de empresa são imutáveis após criação de cotações/demandas.

**Testes de banco concluídos:** 
- Autenticação simulada no SQL com papel `authenticated`, em transação revertida: superadm acessa ambas empresas, 2 empresas e 6 etapas.
- Outra identidade sem autorização CIP: 0 empresas visíveis, acesso negado a Varejo e B2B.
- `anon`: SELECT negado por falta de privilégio (esperado).
- Inserção de cotação B2B em transação revertida gerou 1 registro de auditoria na transação; nada persistiu.
- Inserção de análise de preço em transação revertida gerou 1 registro de auditoria; nada persistiu.
- Scripts de interface e módulo auth passaram na validação sintática. **Não substitui teste real de login com navegador.**

## Retomada em 18/10/2026
- Recuperação usa a página exclusiva `https://cip.gritnews.com.br/recuperar.html`, com identidade GRIT, nova senha e confirmação, sem abrir painel administrativo. O formulário só aparece com link de recuperação e identidade validada pelo Supabase; sessão de recuperação não é persistida, e os campos são apagados após o envio. URL adicionada à allowlist preservando Site URL e callbacks existentes. Assunto e nome do remetente compartilhados padronizados como GRIT. Links anteriores conservam o destino anterior; solicitar novo e-mail após a configuração.
- O CDN do CIP transformava a logo, embora a origem mantivesse o arquivo original. Compressão WebP e otimização inteligente foram desativadas somente no CIP para preservar os bytes públicos; a comparação HTTPS continua bloqueando qualquer transformação.
- Após atualização privada da senha, o FTPS autenticou, mas o publicador antigo interrompeu no canal de dados (`ECONNRESET`). Sua dependência basic-ftp 5.0.5 precede correções de retomada TLS para Node atual. O workflow agora usa basic-ftp 6.2.3 com versão e integridade fixadas em `deploy/package-lock.json`, TLS validado pelo certificado Hostinger, destino conferido por `PWD`, upload temporário e releitura de bytes antes da substituição. Não exclui arquivos ou pastas; HTML e manifesto são substituídos por último. A homologação HTTPS permanece obrigatória após o envio.
- Confirmados no Supabase existente: nove tabelas CIP com RLS ativo, 22 políticas, duas empresas, seis marcos e perfil superadm ativo com e-mail confirmado. Isso não substitui login real.
- hPanel lista CIP como site separado. A conta FTP dedicada informa pasta de upload `public_html`, sob `domains/cip.gritnews.com.br`. SSL Lifetime ativo no painel. O workflow admite essa raiz somente com conta FTP dedicada ao site CIP, mantendo os caminhos anteriores.
- Dispatch manual na branch funcionou sem alterar main: validação `39132324388`, commit `98e4cd35c60d7da1d49225be164d7d9c0f18dee1`, publicação desativada.
- Environment `cip-production` criado com três parâmetros FTPS. Falta cadastrar a senha existente diretamente no segredo; nenhuma senha foi lida ou redefinida.
- Corrigidos cartões de empresas, motivo de cotação perdida, erro de recuperação e limites de simulações. Três testes unitários adicionais não substituem homologação real.
- DNS autoritativo respondeu ao CIP; resolvedor local e navegador ainda retornaram nome não resolvido durante a verificação. HTTP 200, conteúdo publicado, login, segregação real e mobile seguem pendentes.

## Escopo
- **Shopping Prohospital:** estoque inteligente, cobertura, simulação de capital e marca-passo de preços. Baseline de Rufino permanece estimativa **não conciliada**.
- **Distribuidora Prohospital:** cotações manuais com fluxo de status, Caderninho Inteligente e análise futura de perdas e conversão.
- **Transversal:** cronograma, Doquita, administração e integração Procfit/BI somente leitura no futuro.

## Domínio Hostinger — instruções objetivas para Work
1. Entrar no hPanel do domínio `gritnews.com.br`; verificar o plano correto e nomes de servidores.
2. Criar o subdomínio **cip** com pasta exclusiva **cip**, sem alterar o diretório raiz do portal nem outros subdomínios.
3. Confirmar DNS e certificado SSL ativo em `cip.gritnews.com.br`.
4. Configurar, **em segredos do GitHub**, `CIP_FTPS_HOST`, `CIP_FTPS_USER`, `CIP_FTPS_PASSWORD`, `CIP_FTPS_DIR`. O último deve apontar estritamente para a pasta CIP, uma das opções autorizadas no workflow. Jamais escrever credenciais no código, issue, chat ou log.
5. Executar manualmente o workflow `.github/workflows/cip-pro360.yml` com parâmetro `publish=true` **apenas após** DNS, SSL, permissões e aprovação da equipe responsável. O workflow recusa caminhos FTP fora da pasta CIP e não executa limpeza.
6. Homologar: HTTP 200 no site e `/health.json`; login real com `gritsolucoes@gmail.com` e senha da identidade GRIT já existente, sem compartilhar a senha; acesso às duas empresas, consulta a etapas e teste de criação/edição B2B. Depois testar usuário sem perfil CIP e comportamento mobile.
7. A recuperação usa `https://cip.gritnews.com.br/recuperar.html`, habilitada em **Supabase Auth → URL Configuration → Redirect URLs**. O e-mail deve manter `{{ .ConfirmationURL }}` para validação do token e retorno à página exclusiva. Não alterar o `Site URL` principal compartilhado.

### Verificação da release
- O workflow deve publicar somente a branch `feat/cip-pro360-shopping-distribuidora`, com execução manual `publish=true`, usando o environment `cip-production`.
- A preparação gera `release-manifest.json` com SHA completo do commit e SHA-256 de cada arquivo. O publish exige o JPG original com SHA-256 `1bdf5e051a137268d2aad2a6db750f53faecf1e590e673c9ed5d3a4e87c29d79`; outro JPEG não atende ao aceite.
- O teste após upload exige TLS válido, HTTP 200 sem redirecionamento e os mesmos bytes da release para HTML, JavaScript, JPG, health, robots e manifesto. `.htaccess` é incluído no pacote, mas seu conteúdo não deve ser servido publicamente.
- Esses testes comprovam os arquivos publicados. Login, autorização por empresa, persistência e mobile exigem homologação real de navegador, separadamente.
- No hPanel, registrar o document root exclusivo e conciliar `CIP_FTPS_DIR` com o diretório inicial da conta FTPS. A lista de caminhos do workflow não comprova esse mapeamento sozinha. Configurar os quatro segredos no environment `cip-production`, sem incluí-los em arquivos ou comandos com valores literais.
- Conferir que o workflow está disponível para execução manual pelo GitHub. Não adicionar arquivos em `main` apenas para habilitar o dispatch: o workflow `auto-deploy.yml` do portal dispara em pushes para `main` e pode publicar outro site.

**Importante:** os botões de aplicação usam o Supabase público (publishable key), mas **autorização é sempre validada no backend por RLS**. O cliente não contém `service_role`, token privado, senha ou chaves de FTP.

## Prioridades e pendências
- [x] Branch e PR draft isolados sem merge no portal existente.
- [x] Bancos CIP, superadm e segregação com testes RLS transacionais.
- [x] Telas operacionais para os dois módulos e navegação após login, cronograma e simulação.
- [x] Cadastro e leitura manual de cotações e demandas no frontend, condicionados à autenticação.
- [x] Workflow de validação e publicação manual Hostinger, com diretório permitido.
- [ ] Validar login por navegador no domínio publicado.
- [ ] Verificar responsividade mobile por teste de navegação real.
- [x] Habilitar rota exclusiva de recuperação GRIT no Supabase e publicar formulário dedicado.
- [ ] Provisionar fluxo seguro de convites e papéis de outros usuários no módulo Administração.
- [x] Adaptar código HTML/CSS ao logotipo e às cores oficiais do Grupo Prohospital.
- [x] Adicionar binário original `logo-grupo-prohospital.jpg` à branch, preservando os bytes do anexo reenviado.
- [ ] Validar renderização da logomarca no navegador e no domínio publicado.
- [ ] Criar/verificar subdomínio, SSL e pasta isolada na Hostinger.
- [ ] Configurar secrets FTPS e publicar; apresentar evidência pública real.
- [ ] Conectar Procfit/BI e reconciliar dados de estoque, precificação e conversão.
- [x] Registrar e consultar análises manuais do Marca-passo por SKU, custo, despesa%, margem-alvo, referência e status, sem alterar ERP.
- [ ] Integrar tabelas reais de preço/custo/tributos e workflow de aprovação com alçadas.
- [ ] Homologar com usuários reais e critérios executivos.

## Cronograma
18–24/out/2026: Fundação, autenticação e documentação;
25/out–07/nov: contrato Procfit e conciliação;
08–21/nov: Estoque e Marca-passo;
22/nov–05/dez: funil B2B;
06–19/dez: Doquita;
20/dez–16/jan/2027: piloto e homologação.

## Política de números
Estoque informado R$ 6 mi; vendas médias R$ 3 mi/mês; CMV 47%; cobertura estimada 128 dias; 90 dias equivale a estoque teórico de R$ 4,23 mi e capital teoricamente liberável de R$ 1,77 mi. **São valores informados e não validados por ERP**. No app devem permanecer rotulados como simulação, jamais dado operacional confirmado.
