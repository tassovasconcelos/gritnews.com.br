# Gestão de acesso e acompanhamento dos clientes

Entrega de 29/10/2026 para Meu Espetinho e Sr. Padeiro.

## Operação do Super Admin

Na ficha do cliente, a seção **Contas e senhas temporárias** permite criar uma conta com perfil Proprietário, Gerente, Caixa e, conforme o aplicativo, Atendente, Estoque ou Consulta. Proprietário é um perfil do estabelecimento e não concede administração da plataforma. Alterações de perfil e bloqueios permanecem disponíveis nas seções de equipe existentes.

O operador informa nome, e-mail, perfil, motivo e confirma que verificou a identidade e o endereço de e-mail. A criação administrativa não dispara mensagem automática. Contas já existentes não têm a senha substituída por uma tentativa de criação: devem ser vinculadas pela equipe e, quando necessário, redefinidas pela ação específica.

A senha temporária é aleatória, tem validade de 24 horas e aparece apenas na resposta da criação ou redefinição. O painel a oculta após dois minutos, troca de cliente ou fechamento. Não é armazenada no navegador, banco de auditoria ou relatórios. O Auth mantém seu próprio verificador; o módulo guarda somente um SHA-256 da credencial temporária aleatória para impedir sua reutilização como senha pessoal.

Redefinição requer motivo, confirmação da identidade e ciência de que a senha pertence à conta global, inclusive quando há vínculos em outros aplicativos. Contas administrativas da plataforma e a própria conta do operador são protegidas. A redefinição não reativa um vínculo bloqueado nem altera o perfil da pessoa.

## Primeiro acesso e proteção de sessão

- Após entrar com a senha temporária, a pessoa define sua senha pessoal com pelo menos 12 caracteres. Ela deve ser diferente da temporária.
- A exigência é mantida no servidor. O middleware de pré-requisição bloqueia REST/RPC; políticas restritivas protegem as tabelas operacionais, Realtime e Storage. O serviço de cobrança também verifica a exigência e a sessão antes de chamar o provedor.
- A prova de sessão usa o identificador do JWT já validado pelo Auth e a data de criação em `auth.sessions`. Sessões anteriores à redefinição não podem concluir a troca nem voltar a operar depois que a senha pessoal é salva.
- A marca de troca obrigatória em app_metadata é controlada pelo servidor. Campos editáveis de user_metadata não concedem permissões.
- Operações concorrentes sobre a mesma conta usam uma concessão temporária; finalização compara a referência da redefinição. Falhas parciais preservam o bloqueio. Se uma conta tiver sido criada sem concluir o vínculo, o suporte deve vinculá-la pela equipe e gerar outra senha, em vez de criar duplicatas.
- Os eventos registram ator, cliente, ação, motivo e referência da redefinição, sem conteúdo de senha. O serviço de administração mantém validação JWT e consulta Super Admin ativo no banco.

O primeiro acesso por convite e a recuperação de senha do Sr. Padeiro também passaram a abrir a definição de senha. O retorno preserva o estabelecimento. As telas de login oferecem confirmação de e-mail para contas com cadastro pendente. Marketing externo não é inicializado nas rotas de autenticação, administração e operação.

## Acompanhamento e resultados

Na visão geral da padaria e na ficha Cliente 360 do Meu Espetinho, o novo painel mostra vendas fechadas nos últimos 30 dias, os 30 dias anteriores, quantidade de vendas, ticket médio, catálogo ativo, modalidades pendentes, saldos de estoque e último registro de venda. Vendas a prazo compõem as vendas fechadas; esse total não deve ser apresentado como recebimento em caixa.

As próximas ações usam essas informações: primeiro acesso pendente, preparo do catálogo, modalidades indefinidas, contagem de estoque, reposição, treinamento e revisão de vendas. O Super Admin pode registrar uma meta de referência para 30 dias, a próxima ação combinada, o responsável e a data de acompanhamento. O plano é auditado e separado por aplicativo e estabelecimento. Não há metas ou saldos inventados.

## Validações

- 38 testes: 20 compartilhados, 15 administrativos/gateways e três fiscais. Cobrem escopo, proteção de administradores, credenciais existentes, falha parcial, concorrência, sessão antiga, expiração, troca obrigatória, digest, bloqueio antes do provedor, períodos dos indicadores e autorização do plano.
- Compilação TypeScript/Vite e verificações de disponibilidade dos dois aplicativos. Os pacotes grandes mantêm o aviso de tamanho já existente.
- Banco real, com rollback: indicadores da padaria (102 produtos, 72 ativos, 30 a conferir), gravação auditada do plano, bloqueio de REST/RPC e RLS com exigência de senha, negação de funções exclusivas do servidor e manutenção do bloqueio de sessão antiga após a conclusão da troca.
- HTTP: pré-requisição anônima responde 204; administração de contas sem JWT responde 401. Advisors não apontaram novos endpoints públicos SECURITY DEFINER.
- Nenhuma conta de cliente foi criada, teve senha redefinida ou recebeu mensagem durante os testes. Não foi feita confirmação manual de e-mail de cliente nesta entrega.

Os fluxos Auth foram testados com cliente simulado e as regras de banco com PostgreSQL local e remoto. Criação e primeiro acesso de uma pessoa real, entrega da credencial, aparelhos e impressoras físicas ainda exigem homologação assistida. Não se deve marcar essas etapas como concluídas apenas porque o build passou.

## Implantação

Aplicar as migrações `managed_accounts_and_client_success` e `managed_account_session_revocation`, publicar `ops-admin-accounts` e os guards das funções de cobrança antes de liberar as interfaces. O projeto não possuía outro pre-request hook na inspeção; a migração recusa substituição silenciosa caso um hook diferente exista.

O checkout da hospedagem deve conter o monorepositório e instalar o pacote operacional local conforme os arquivos `.npmrc`. A publicação usa GitHub/Hostinger. Conferir o JavaScript servido em cada domínio antes de afirmar que a interface foi atualizada.

Na padaria, 72 itens foram conferidos visualmente contra o cardápio original e liberados no catálogo de homologação. Os 30 itens sem modalidade explícita permanecem inativos. Variantes de salgados passaram a identificar a categoria, e a caixa de mini empadas identifica 100 unidades. Nenhum saldo de estoque foi criado. Estoque físico, modalidades restantes, usuários reais, impressora e emissão fiscal oficial continuam sendo etapas distintas de implantação.
