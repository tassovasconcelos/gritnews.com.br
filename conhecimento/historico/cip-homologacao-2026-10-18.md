## Retomada — diagnóstico atualizado
- A comparação anterior do e-mail no navegador era inconclusiva: valores de campos são mascarados. A conclusão histórica de e-mail incorreto está retirada.
- Integradas as melhorias remotas até 177971f sem sobrescrever alterações. Commit 4083b7805b9ce902ec6c558f1dd5f6901a64f97e; 30 testes locais aprovados.
- Login distingue invalid_credentials, mantém aviso de perfil não autorizado, limpa a senha após tentativa e oferece Mostrar senha para conferência privada.
- Recuperação mostra a conta validada pelo servidor. Login real e homologação autenticada continuam pendentes.
# CIP PRO 360 — situação verificada em 18/10/2026

## Atualização — tratamento de senha já atual
- Publicado fc41b2343de691521c8bc31ecb9fca08c964c6e5, workflow https://github.com/tassovasconcelos/gritnews.com.br/actions/runs/39145361980, validate e publish success, 23 testes aprovados.
- A falha de gravação relatada foi identificada nos logs reais como same_password (422): o valor submetido na recuperação já era a senha atual, não uma divergência na confirmação. A página passou a explicar isso, oferecer retorno ao login e não afirmar que houve alteração.
- Tentativa posterior de login recebeu invalid_credentials antes da consulta de permissões. Na aba do CIP, a comparação do campo e-mail com a conta autorizada retornou false. O campo foi corrigido para gritsolucoes@gmail.com sem ler ou modificar a senha; usuário orientado a tentar novamente.
- Nenhuma senha foi solicitada no chat, lida pelo agente ou redefinida nesta correção. Login real segue aguardando confirmação do usuário.

## Estado atual — publicação concluída, homologação autenticada pendente
- URL: https://cip.gritnews.com.br/.
- Commit publicado: 74e1ba6856bcd7d3bb9f546861683bc7b128db34.
- Workflow: https://github.com/tassovasconcelos/gritnews.com.br/actions/runs/39145003485 — validate e publish success; 22 testes aprovados.
- Verificação independente local também passou: TLS válido, HTTP 200 e bytes idênticos ao pacote CI para index.html, cip-auth.js, recuperar.html, grit-recovery.js, robots.txt, health.json, logo e manifesto.
- FTPS modernizado, versão e integridade fixadas; cada arquivo é enviado temporariamente e relido para comparação antes de substituição. Sem limpeza total. Main permanece inalterada.
- Logo pública: 61775 bytes, SHA-256 oficial 1bdf5e051a137268d2aad2a6db750f53faecf1e590e673c9ed5d3a4e87c29d79. Transformações WebP e otimização inteligente desativadas apenas no CDN CIP, seguido de limpeza do cache desse site.
- Cache de HTML/JS/JSON alterado para revalidação. Scripts de recuperação com identificador de versão para impedir uso de cópias antigas pelo navegador.
- Recuperação agora usa página exclusiva https://cip.gritnews.com.br/recuperar.html. Formulário só aparece com link válido e usuário confirmado; sessão temporária, sem navegação automática para administração. Sucesso real de alteração de senha ainda depende do usuário.
- Modelo de e-mail compartilhado padronizado em português com assunto Redefinição de senha | GRIT, nome do remetente GRIT e ConfirmationURL original. Transporte SMTP e senha preservados.
- Allowlist final mantém callback preexistente Meu Espetinho e acrescenta somente a página exclusiva CIP. A rota administrativa GRIT adicionada nesta execução foi removida. Site URL compartilhado preservado.
- Novo e-mail solicitado pelo script atualizado do CIP, confirmado pelo Supabase em 18/10/2026 16:27:53 UTC (13:27:53 São Paulo). Usar somente o e-mail mais recente; anteriores têm destinos antigos.
- Login real superadm, segregação por usuários restritos, CRUD/persistência/auditoria e navegação autenticada mobile continuam pendentes. Existe apenas o perfil superadm CIP; não foram criados usuários ou alteradas permissões.

As entradas abaixo registram a evolução anterior e são superadas por este estado atual.

## Retomada após confirmação do usuário
- Nova execução publish=true: https://github.com/tassovasconcelos/gritnews.com.br/actions/runs/39142445499. Validação passou, publicação novamente recusada por `530 Login incorrect`; sem upload.
- Host e usuário FTP comparados com o hPanel e confirmados; segredo CIP_FTPS_PASSWORD ainda indicava última alteração às 11:15 em São Paulo. Tela correta de Update secret aberta para preenchimento privado.
- Usuário solicitou configurar a senha padrão GRIT para o superadm. O valor não é conhecido nem foi solicitado no chat.
- Conta compartilhada confirmada, senha configurada, sem evidência de banimento. Portal GRIT já tem recuperação funcional e formulário de atualização, evitando alteração de código ou duplicação de conta.
- Recuperação solicitada pelo portal GRIT para gritsolucoes@gmail.com; Supabase confirmou recovery_sent_at em 18/10/2026 15:55:12 UTC. Usuário deve abrir o link recebido e definir/confirmar a senha diretamente. Nenhuma senha foi redefinida pelo agente.
- Alteração da identidade compartilhada se aplica aos apps que usam a mesma conta Supabase. Nenhuma mudança de usuários, permissões, DNS ou main nesta retomada.

## Atualização às 11:20 (São Paulo)
- CIP_FTPS_PASSWORD foi cadastrado pelo usuário e sua presença confirmada sem ler o valor.
- Workflow manual com publish=true: https://github.com/tassovasconcelos/gritnews.com.br/actions/runs/39135242765, HEAD 698ed6fb59f4c0ffca086252421b7d7fa9ab08a4.
- validate passou; publish passou por manifesto, logo, isolamento e preflight HTTPS, mas falhou no login FTP: `530 Login incorrect`. Nenhum upload foi realizado por essa execução. Usuário orientado a corrigir somente a credencial FTP dedicada do CIP e atualizar o segredo correspondente.
- Resolução normal do domínio agora funciona; HTTPS público retorna 200, e os navegadores Chrome e do aplicativo abrem a tela de login com logo original carregada.
- Manifesto público permanece no commit anterior 98e4cd3. A release nova ainda difere do HTML público, como esperado após falha anterior ao upload.
- Tela de login verificada em larguras 360, 390 e 780 px: layout em uma coluna, sem overflow horizontal e logo carregada. Evidências: cip-login-mobile-evidence.json e cip-login-390.png. Navegação autenticada mobile ainda não verificada.
- Há apenas um perfil CIP ativo, superadm, e nenhuma associação ativa de usuários restritos. Teste real de acesso cruzado depende de contas de homologação autorizadas para os dois perfis restritos.
- Login real solicitado ao usuário diretamente no navegador, sem senha no chat; ainda não confirmado.

As seções abaixo registram a etapa anterior; esta atualização prevalece quanto a DNS e presença do segredo.

## Código e publicação
- Branch preservada: feat/cip-pro360-shopping-distribuidora.
- HEAD recuperado: 98e4cd35c60d7da1d49225be164d7d9c0f18dee1.
- Correções entregues: 698ed6fb59f4c0ffca086252421b7d7fa9ab08a4, PR #137.
- CI: https://github.com/tassovasconcelos/gritnews.com.br/actions/runs/39132586972 — validate success; publish skipped; 14 testes aprovados.
- Dispatch manual comprovado na branch: execução 39132324388, publish=false. Nenhuma mudança em main; main permaneceu 90739ac0333ec9857e2d4fb5f3b666b778b3e7c4.
- Origem Hostinger já contém versão anterior, declarada no manifesto como 98e4cd35c60d7da1d49225be164d7d9c0f18dee1. Esta execução não fez esse upload.
- Acesso direto à origem com hostname/SNI correto e validação TLS habilitada retornou HTTP 200 para HTML, JavaScript, manifesto, robots, health e JPG.
- Arquivos da origem coincidem com o manifesto servido. Textos correspondem ao commit anterior após normalizar CRLF/LF, mas não byte a byte com os blobs Git. A logo coincide byte a byte com Git e com o hash oficial.
- DNS autoritativo respondeu; resolvedor padrão local e ambos navegadores disponíveis retornaram ERR_NAME_NOT_RESOLVED. Não foi ignorado aviso de certificado nem alterado DNS existente.

## Hostinger e segredos
- Sessão hPanel autenticada; hospedagem Cloud Startup, site separado cip.gritnews.com.br, pasta de upload public_html sob domínio CIP, SSL Lifetime ativo no painel.
- Nameservers autoritativos consultados: orbit.dns-parking.com e horizon.dns-parking.com.
- Environment cip-production criado. Host, usuário e diretório cadastrados como segredos. Senha FTPS ausente; usuário orientado a cadastrar senha existente diretamente no GitHub, sem chat. Nenhuma senha foi recuperada ou redefinida.
- Validação de diretório atualizada para raiz da conta dedicada ao site CIP, mantendo isolamento e sem limpeza total.

## Backend e aplicação
- Supabase existente consultado: nove tabelas com RLS, 22 políticas, duas empresas e seis marcos.
- Conta existente gritsolucoes@gmail.com tem e-mail confirmado e perfil superadm ativo. Nenhum usuário recriado.
- Corrigidos cartões iniciais por permissão, motivo de perda em cotações, erro retornado na recuperação e limites de simulações; histórico recarrega após salvar.
- Hash oficial da logo preservado: 1bdf5e051a137268d2aad2a6db750f53faecf1e590e673c9ed5d3a4e87c29d79; 61775 bytes.

## Pendências reais
1. Cadastro privado de CIP_FTPS_PASSWORD.
2. Publicação do novo HEAD pelo workflow com publish=true e comparação pública completa da release de CI.
3. Resolução normal do domínio nesta conexão.
4. Login real do superadm, acesso às duas empresas e usuários restritos reais para tentativas cruzadas. Não foram pedidas senhas no chat.
5. Navegação, persistência, auditoria, revisão humana, cronograma e mobile 360/390/780 px e desktop por navegador autenticado.
6. Redirect de recuperação no Supabase, gestão de convites e integração Procfit/BI continuam sem homologação.

Não declarar publicado e homologado. Evidência técnica da origem: cip-origin-evidence.json. Pacote novo de CI: cip-release-ci-698ed6f.


Publicação da retomada concluída: workflow 39178601012 success; commit 4083b7805b9ce902ec6c558f1dd5f6901a64f97e. Verificação independente confirmou HTTPS/200/SHA-256 de todos os nove recursos públicos. Tela de login atualizada conferida no navegador; login real ainda pendente.

Diagnóstico confirmado da mensagem Contate o administrador: Auth /recover retornou over_email_send_rate_limit (HTTP 429) em 00:01:20, 00:01:25 e 00:01:38 UTC de 19/10, após pedido aceito às 00:00:47 UTC. Correção b6a8360073ebc32d828b94f3d02f20520f65c339 explica limite, impede pedidos simultâneos e pausa botão por 60s após sucesso/429. 32 testes locais aprovados. Isso não comprova login nem entrega na caixa de entrada.

Acesso real confirmado em navegador após usuário informar que entrou: sessão gritsolucoes@gmail.com com perfil superadm. Doquita consultou registros e exibiu amostra vazia sem erro; Cotações, Caderninho, Preços e Cronograma carregaram. Salva uma simulação de referência (estoque 6000000, vendas 3000000, CMV 47%, alvo 90 dias); após recarregar, sessão continuou ativa e registro apareceu no histórico. Evidência: output/cip-authenticated-stock.png. Não equivale a CRUD completo nem homologação de usuários restritos, mobile autenticado ou ERP. Nenhuma senha lida ou redefinida pelo agente.
