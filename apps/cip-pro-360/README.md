# CIP PRO 360° — Shopping Prohospital + Distribuidora Prohospital

## Estado verificável (18/10/2026)
**Frontend:** login ligado ao Supabase GRIT, navegação com sessão autenticada, módulos Varejo/B2B segregados por perfil; telas de simulação, cadastro manual de cotações e Caderninho e cronograma. Projeto ainda não publicado em `cip.gritnews.com.br`: Hostinger hPanel / subdomínio / FTPS pendentes.

**Backend:** conectado ao projeto existente Supabase `gritnews` (ref `pcrwtoddavpvkaxwtstc`) como provedor de identidade compartilhado; a autenticação com senha preexistente usa Supabase Auth, **não armazena nem replica credenciais no CIP**. Banco isolado por tabelas prefixadas `cip_`, com políticas RLS por empresa. O usuário `gritsolucoes@gmail.com` já foi confirmado como `superadm` na tabela CIP por correspondência exata de conta Supabase existente e verificada.

**Banco criado:** 8 tabelas, 18 políticas RLS, 2 empresas, 6 marcos. Migrações registradas no Supabase como `cip_pro_360_foundation_shopping_distribuidora` (20261018071944) e `cip_restrict_company_and_authorship_mutations`. Acesso `anon` revogado das tabelas CIP. Usuário sem perfil CIP não consulta empresas. Autoria e identificador de empresa são imutáveis após criação de cotações/demandas.

**Testes de banco concluídos:** 
- Autenticação simulada no SQL com papel `authenticated`, em transação revertida: superadm acessa ambas empresas, 2 empresas e 6 etapas.
- Outra identidade sem autorização CIP: 0 empresas visíveis, acesso negado a Varejo e B2B.
- `anon`: SELECT negado por falta de privilégio (esperado).
- Inserção de cotação B2B em transação revertida gerou 1 registro de auditoria na transação; nada persistiu.
- Scripts de interface e módulo auth passaram na validação sintática. **Não substitui teste real de login com navegador.**

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
7. Habilitar `https://cip.gritnews.com.br/**` em **Supabase Auth → URL Configuration → Redirect URLs**, para recuperação de senha. Não alterar o `Site URL` principal do projeto GRIT sem análise de impacto.

**Importante:** os botões de aplicação usam o Supabase público (publishable key), mas **autorização é sempre validada no backend por RLS**. O cliente não contém `service_role`, token privado, senha ou chaves de FTP.

## Prioridades e pendências
- [x] Branch e PR draft isolados sem merge no portal existente.
- [x] Bancos CIP, superadm e segregação com testes RLS transacionais.
- [x] Telas operacionais para os dois módulos e navegação após login, cronograma e simulação.
- [x] Cadastro e leitura manual de cotações e demandas no frontend, condicionados à autenticação.
- [x] Workflow de validação e publicação manual Hostinger, com diretório permitido.
- [ ] Validar login por navegador no domínio publicado.
- [ ] Verificar responsividade mobile por teste de navegação real.
- [ ] Habilitar configuração de redirecionamento Supabase Auth para recuperação de senha.
- [ ] Provisionar fluxo seguro de convites e papéis de outros usuários no módulo Administração.
- [ ] Instalar **arquivo original aprovado** do logotipo oficial Grupo Prohospital; não redesenhar a marca.
- [ ] Criar/verificar subdomínio, SSL e pasta isolada na Hostinger.
- [ ] Configurar secrets FTPS e publicar; apresentar evidência pública real.
- [ ] Conectar Procfit/BI e reconciliar dados de estoque, precificação e conversão.
- [ ] Implementar preço por SKU, monitoração e aprovação; hoje é só interface.
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
