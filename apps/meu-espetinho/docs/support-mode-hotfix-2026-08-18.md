# Hotfix — Modo Suporte

## Sintoma confirmado

Ao abrir `/app?support_tenant=<tenant>`, a URL apontava para um estabelecimento, mas a tela carregava outro cliente e podia exibir cobrança de implantação. Isso evidencia frontend publicado defasado e, no comportamento antigo, seleção do primeiro tenant retornado pelo contexto.

## Correção de compatibilidade aplicada no backend

`current_user_tenants()` agora prioriza o tenant com concessão de suporte ativa mais recente para o Super Admin. Assim, mesmo que o frontend hospedado ainda esteja temporariamente em uma versão anterior, o clique em **Abrir operação com suporte** deve resolver primeiro o estabelecimento recém-selecionado.

Também existe `admin_support_context(p_tenant_id)` para a versão atual do frontend resolver explicitamente o tenant solicitado.

Nenhuma dessas correções altera pagamento, assinatura, trial, permuta ou status operacional do cliente.
