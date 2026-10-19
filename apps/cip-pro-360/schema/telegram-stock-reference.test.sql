begin;
do $$
declare actor uuid=gen_random_uuid();r jsonb;s jsonb;count_before integer;
begin
 insert into auth.users(id,email) values(actor,'telegram-stock-test@example.invalid');
 insert into public.cip_profiles(user_id,role,active) values(actor,'diretoria',true);
 insert into public.cip_memberships(user_id,company_id,role,active) values(actor,'shopping_prohospital','diretoria',true);
 insert into public.cip_bot_bindings(user_id,telegram_id,chat_id,company_id) values(actor,'999000000000009','999000000000009','shopping_prohospital');
 r=public.cip_bot_stock_reference('999000000000009','999000000000009','shopping_prohospital');
 if (r->>'available')::boolean is not true or jsonb_array_length(r->'sources')<>2 then raise exception 'reference_sources_failed';end if;
 for s in select value from jsonb_array_elements(r->'sources') loop
  if s->>'status'<>'reference_unreconciled' or jsonb_array_length(s->'items')>5 then raise exception 'status_or_bound_failed';end if;
  if s->>'scope'='cd100_partial' and (s->'summary'->>'potential' is not null or s->>'reference_date' is not null) then raise exception 'invented_cd_fields';end if;
 end loop;
 r=public.cip_bot_stock_reference('999000000000009','999000000000009','shopping_prohospital','stores_only_partial','','5');
 if jsonb_array_length(r->'sources')<>1 or (r->'sources'->0->'summary'->>'stores')::integer<>1 then raise exception 'store_filter_failed';end if;
 r=public.cip_bot_stock_reference('999000000000009','999000000000009','shopping_prohospital','both','NONEXISTENT_TEST_SKU_999');
 if exists(select 1 from jsonb_array_elements(r->'sources') x where (x->'summary'->>'rows')::integer<>0) then raise exception 'query_filter_failed';end if;
 begin perform public.cip_bot_stock_reference('999000000000009','999000000000009','distribuidora_prohospital');raise exception 'foreign_company_allowed';exception when others then if SQLERRM='foreign_company_allowed' then raise;end if;end;
 begin perform public.cip_bot_stock_reference('999000000000009','999000000000008','shopping_prohospital');raise exception 'foreign_chat_allowed';exception when others then if SQLERRM='foreign_chat_allowed' then raise;end if;end;
 s=public.cip_bot_stock_subscribe('999000000000009','999000000000009',null);if (s->>'enabled')::boolean then raise exception 'auto_opt_in';end if;
 s=public.cip_bot_stock_subscribe('999000000000009','999000000000009',true);if (s->>'enabled')::boolean is not true then raise exception 'subscribe_failed';end if;
 perform public.cip_bot_stock_subscribe('999000000000009','999000000000009',false);
 update public.cip_profiles set active=false where user_id=actor;
 begin perform public.cip_bot_stock_reference('999000000000009','999000000000009','shopping_prohospital');raise exception 'suspended_allowed';exception when others then if SQLERRM='suspended_allowed' then raise;end if;end;
 if has_function_privilege('authenticated','public.cip_bot_stock_reference(text,text,text,text,text,text,text,integer)','EXECUTE') or has_function_privilege('anon','public.cip_bot_stock_daily_claim()','EXECUTE') then raise exception 'service_grants_failed';end if;
end;$$;
select 'PASS: real source integrity, private chat, company filters, CD missing data, bounded rows, query/store filtering, explicit opt-in and suspension; rollback' as result;
rollback;
