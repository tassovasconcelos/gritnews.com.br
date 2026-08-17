-- Checks manuais/CI-friendly para a etapa Mobile V3.
-- Não altera dados de produção.
select to_regclass('public.inventory_movements') is not null as inventory_movements_exists;
select has_function_privilege('authenticated','public.customer_operation_history(uuid,uuid)','EXECUTE') as customer_history_authenticated;
select not has_function_privilege('anon','public.customer_operation_history(uuid,uuid)','EXECUTE') as customer_history_not_anon;
