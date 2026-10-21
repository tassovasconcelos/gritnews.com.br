begin;
-- Keep the binding, role, company checks and service-only execution unchanged.
create or replace function public.cip_bot_remember(p_telegram text,p_chat text,p_kind text,p_query text) returns void language sql security definer set search_path='' as $$
 update public.cip_bot_bindings b set last_kind=p_kind,last_query=left(p_query,512),last_at=now()
 where telegram_id=p_telegram and chat_id=p_chat and active
 and p_kind in ('summary','missions','processes','knowledge','sales_mtd','inventory','aged_stock','no_sales_stock','growth_actions','stock_sources','stock_cd','stock_stores','stock_product','stock_quality','stock_priorities','stock_units')
 and cardinality(public.cip_report_companies(b.user_id))>0;
$$;
revoke all on function public.cip_bot_remember(text,text,text,text) from public,anon,authenticated;
grant execute on function public.cip_bot_remember(text,text,text,text) to service_role;
commit;
