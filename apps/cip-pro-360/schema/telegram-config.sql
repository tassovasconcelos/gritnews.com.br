begin;
create table public.cip_bot_config (
 id integer primary key check(id=1),token_secret_id uuid,webhook_secret_id uuid,bot_id text,username text,
 configured_by uuid references auth.users(id),configured_at timestamptz,lease_id uuid,lease_until timestamptz
);
alter table public.cip_bot_config enable row level security;
revoke all on public.cip_bot_config from public,anon,authenticated;
grant all on public.cip_bot_config to service_role;
create function public.cip_bot_config_begin(p_actor uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare lease uuid=gen_random_uuid();
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role='superadm') then raise exception 'superadmin_required';end if;
 insert into public.cip_bot_config(id) values(1) on conflict do nothing;
 update public.cip_bot_config set lease_id=lease,lease_until=now()+interval '2 minutes' where id=1 and (lease_until is null or lease_until<now());
 if not found then raise exception 'configuration_busy';end if;
 return lease;
end;$$;
create function public.cip_bot_config_finish(p_actor uuid,p_lease uuid,p_token text,p_secret text,p_bot_id text,p_username text) returns void language plpgsql security definer set search_path='' as $$
declare cfg public.cip_bot_config;token_id uuid;secret_id uuid;
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role='superadm') then raise exception 'superadmin_required';end if;
 select * into cfg from public.cip_bot_config where id=1 and lease_id=p_lease and lease_until>now() for update;
 if not found then raise exception 'configuration_lease_required';end if;
 if coalesce(p_token,'') !~ '^[0-9]+:[A-Za-z0-9_-]{20,}$' or char_length(p_token)>200 or char_length(coalesce(p_secret,'')) not between 32 and 256 or coalesce(p_secret,'') !~ '^[A-Za-z0-9_-]+$' or coalesce(p_bot_id,'') !~ '^[0-9]+$' or coalesce(p_username,'') !~ '^[A-Za-z0-9_]{5,32}$' then raise exception 'invalid_configuration';end if;
 token_id=cfg.token_secret_id;secret_id=cfg.webhook_secret_id;
 if token_id is null then token_id=vault.create_secret(p_token,'cip_telegram_bot_token_v1','CIP only: encrypted Telegram token');else perform vault.update_secret(token_id,p_token);end if;
 if secret_id is null then secret_id=vault.create_secret(p_secret,'cip_telegram_webhook_secret_v1','CIP only: encrypted webhook secret');else perform vault.update_secret(secret_id,p_secret);end if;
 if cfg.bot_id is distinct from p_bot_id then
  update public.cip_bot_bindings set active=false where active;
  update public.cip_bot_pair_codes set consumed=true where not consumed;
 end if;
 update public.cip_bot_config set token_secret_id=token_id,webhook_secret_id=secret_id,bot_id=p_bot_id,username=p_username,configured_by=p_actor,configured_at=now(),lease_id=null,lease_until=null where id=1;
end;$$;
create function public.cip_bot_config_release(p_lease uuid) returns void language sql security definer set search_path='' as $$
 update public.cip_bot_config set lease_id=null,lease_until=null where id=1 and lease_id=p_lease;
$$;
create function public.cip_bot_config_read() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('token',t.decrypted_secret,'secret',s.decrypted_secret,'bot_id',c.bot_id,'username',c.username,'configured_at',c.configured_at)
 from public.cip_bot_config c join vault.decrypted_secrets t on t.id=c.token_secret_id join vault.decrypted_secrets s on s.id=c.webhook_secret_id where c.id=1;
$$;
revoke all on function public.cip_bot_config_begin(uuid),public.cip_bot_config_finish(uuid,uuid,text,text,text,text),public.cip_bot_config_release(uuid),public.cip_bot_config_read() from public,anon,authenticated;
grant execute on function public.cip_bot_config_begin(uuid),public.cip_bot_config_finish(uuid,uuid,text,text,text,text),public.cip_bot_config_release(uuid),public.cip_bot_config_read() to service_role;
comment on table public.cip_bot_config is 'Service-only singleton. Credentials encrypted in Vault, never returned to browser. Configuration lease prevents concurrent setup.';
commit;
