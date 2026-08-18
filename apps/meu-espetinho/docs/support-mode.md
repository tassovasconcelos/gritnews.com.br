# Modo suporte do Super Admin

O acesso iniciado pelo Cliente 360 usa `/app?support_tenant=<tenant_id>`.

Quando o usuário autenticado é Super Admin ativo e possui uma concessão de suporte válida para o tenant solicitado, o AppGate deve selecionar explicitamente esse tenant e entrar em `supportMode`.

No modo suporte, bloqueios comerciais do cliente não impedem a análise administrativa:

- pagamento de implantação pendente;
- implantação em preparação;
- ambiente suspenso;
- trial encerrado;
- assinatura inativa.

Esses estados continuam valendo para o proprietário e usuários normais. O Super Admin apenas os ignora durante uma sessão de suporte auditada e visualiza um banner específico de modo suporte. O acesso não altera status financeiro nem libera o ambiente ao cliente.