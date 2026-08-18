# Compatibilidade do suporte no backend

O backend mantém duas proteções complementares para o acesso administrativo:

- `admin_support_context(p_tenant_id)`: resolve explicitamente o tenant solicitado quando existe concessão válida para o Super Admin autenticado;
- `current_user_tenants()`: prioriza a concessão de suporte ativa mais recente, evitando que frontends antigos selecionem outro tenant por ordenação alfabética.

As duas funções apenas resolvem contexto de acesso. Não alteram cobrança, implantação, assinatura, trial ou permuta.
