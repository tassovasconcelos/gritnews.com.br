import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { parseCatalog, decimal, catalogTemplate } from "../src/catalog.ts";
import { saleCatalog, storeInventory, catalogReadiness } from '../../../apps/sr-padeiro/src/lib/salesCatalog.ts';
import { resolveOperationScope, preserveOperationSession } from '../src/scope.ts';
import {
  defaultPreferences,
  receiptLines,
  renderReceipt,
} from "../src/receipt.ts";
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const owner = id(1),
  other = id(2),
  staff = id(3),
  admin = id(4),
  newuser = id(5),
  scope = id(10),
  foreign = id(11);
const migration = new URL(
  "../../../apps/meu-espetinho/supabase/migrations/20261029141711_shared_operations_settings_catalog_team.sql",
  import.meta.url,
);
test('link direto: mantém a empresa solicitada e recusa outra empresa sem trocar de operação', () => {
  const tenants=[{id:scope,name:'Cliente A'},{id:foreign,name:'Cliente B'}];
  assert.equal(resolveOperationScope(tenants,foreign)?.name,'Cliente B');
  assert.equal(resolveOperationScope(tenants,id(999)),null);
  assert.equal(resolveOperationScope(tenants,null)?.id,scope);
  assert.equal(resolveOperationScope([],scope),null);
  assert.equal(preserveOperationSession('',true),true);
  assert.equal(preserveOperationSession('',false),false);
  assert.equal(preserveOperationSession('?utm_source=teste',false),false);
  assert.equal(preserveOperationSession(`?operation_scope=${scope}`,false),true);
});
test('reprodução: 102 produtos importados, 30 pendentes, liberação explícita e saldo por loja', () => {
  const imported=Array.from({length:102},(_,n)=>({id:String(n),active:false,sale_price:1,fulfillment:n<30?'confirmar':n<75?'encomenda':'pronta_entrega'}));
  assert.equal(saleCatalog(imported).length,0);
  assert.deepEqual(catalogReadiness(imported,[],'loja-a'),{total:102,inactive:102,pending:30,available:0,reason:'release'});
  const released=imported.map(p=>({...p,active:p.fulfillment!=='confirmar'}));
  assert.equal(saleCatalog(released).length,72);
  assert.equal(catalogReadiness(released,[],'loja-a').reason,'stock');
  const inventory=[{store_id:'loja-b',product_id:'30',quantity:100},{store_id:'loja-a',product_id:'30',quantity:2}];
  assert.equal(storeInventory(inventory,'loja-a')[0].quantity,2);
  assert.equal(catalogReadiness(released,inventory,'loja-a').reason,'ready');
  assert.equal(catalogReadiness(released,inventory,'loja-c').available,0);
});
async function fixture() {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema private;create schema storage;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now());
 create table public.profiles(id uuid primary key,full_name text);
 create table public.admin_users(user_id uuid primary key,active boolean,role text);
 create table public.fiscal_settings(tenant_id uuid primary key);alter table public.fiscal_settings enable row level security;
 create table public.tenants(id uuid primary key,owner_user_id uuid,name text);
 create table public.tenant_users(tenant_id uuid,user_id uuid,role text,active boolean,primary key(tenant_id,user_id));
 create table public.srp_organizations(id uuid primary key,owner_user_id uuid,name text);
 create table public.srp_members(organization_id uuid,user_id uuid,role text,active boolean,primary key(organization_id,user_id));
 create table public.support_access_grants(tenant_id uuid,admin_user_id uuid,expires_at timestamptz,revoked_at timestamptz);
 create function private.start_support_access(t uuid,r text) returns jsonb language plpgsql as $$begin insert into public.support_access_grants values(t,auth.uid(),now()+interval '1 hour',null);return '{}'::jsonb;end$$;
 create table public.categories(id uuid primary key default gen_random_uuid(),tenant_id uuid,name text);
 create table public.products(id uuid primary key default gen_random_uuid(),tenant_id uuid,name text,price numeric(12,2),cost numeric(12,2),category_id uuid,stock_qty numeric,active boolean);
 create table public.srp_categories(id uuid primary key default gen_random_uuid(),organization_id uuid,name text);
 create table public.srp_products(id uuid primary key default gen_random_uuid(),organization_id uuid,name text,variant text not null default '',fulfillment text not null default 'confirmar',sale_price numeric(12,2),cost_price numeric(12,2),category_id uuid,unit text,active boolean);
 create table public.srp_stores(id uuid primary key,organization_id uuid,active boolean,created_at timestamptz default now());
 create table public.srp_inventory(organization_id uuid,store_id uuid,product_id uuid,quantity numeric,minimum_quantity numeric,primary key(organization_id,store_id,product_id));
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema public,private,auth,storage to authenticated;
 grant select,insert,update,delete on public.tenant_users to authenticated;
 grant select,insert,update on storage.objects to authenticated;
 alter table public.tenant_users enable row level security;
 create policy "tenant memberships" on public.tenant_users for all to authenticated using(true) with check(true);
 insert into auth.users(id,email) values('${owner}','owner@example.com'),('${other}','other@example.com'),('${staff}','staff@example.com'),('${admin}','admin@example.com'),('${newuser}','new@example.com');
 insert into admin_users values('${admin}',true,'superadmin');
 insert into tenants values('${scope}','${owner}','Espetinhos'),('${foreign}','${other}','Outra');
 insert into srp_organizations values('${scope}','${owner}','Padaria'),('${foreign}','${other}','Outra padaria');
 insert into tenant_users values('${scope}','${staff}','attendant',true);
 insert into srp_members values('${scope}','${staff}','cashier',true);
 insert into srp_stores(id,organization_id,active) values('${id(20)}','${scope}',true),('${id(21)}','${foreign}',true);`);
  await db.exec(await readFile(migration, "utf8"));
  return db;
}

test('central: libera produtos conferidos sem criar estoque e protege outras empresas', async () => {
  const db = await fixture();
  try {
    await db.exec(await readFile(new URL('../../../apps/meu-espetinho/supabase/migrations/20261029152119_operations_access_and_catalog_release.sql', import.meta.url), 'utf8'));
    await db.exec(`insert into srp_products(id,organization_id,name,sale_price,active,fulfillment) values
      ('${id(70)}','${scope}','Pão',1,false,'pronta_entrega'),
      ('${id(71)}','${scope}','Bolo',10,false,'confirmar'),
      ('${id(72)}','${foreign}','Outro',2,false,'encomenda');`);
    await as(db, staff);
    await assert.rejects(rpc(db,'ops_release_products',{s:scope,ids:[id(70)]}),/forbidden/);
    await as(db, owner);
    await assert.rejects(rpc(db,'ops_release_products',{s:scope,ids:[id(70),id(71)]}),/review_price/);
    await assert.rejects(rpc(db,'ops_release_products',{s:scope,ids:[id(70),id(72)]}),/review_price/);
    await db.exec('reset role');
    assert.equal((await db.query(`select active from srp_products where id='${id(70)}'`)).rows[0].active,false);
    await as(db, owner);
    assert.equal(await rpc(db,'ops_release_products',{s:scope,ids:[id(70)]}),1);
    assert.equal(await rpc(db,'ops_release_products',{s:scope,ids:[id(70)]}),0);
    await db.exec('reset role');
    assert.equal((await db.query(`select active from srp_products where id='${id(70)}'`)).rows[0].active,true);
    assert.equal((await db.query('select count(*)::int as n from srp_inventory')).rows[0].n,0);
  } finally { await db.close(); }
});

test('central: mudança de função é auditada e protege proprietário, própria conta e outra empresa', async () => {
  const db=await fixture();
  try {
    await db.exec(await readFile(new URL('../../../apps/meu-espetinho/supabase/migrations/20261029152119_operations_access_and_catalog_release.sql',import.meta.url),'utf8'));
    const args={a:'meu-espetinho',s:scope,u:staff,member_role:'cashier'};
    await as(db,staff);await assert.rejects(rpc(db,'ops_set_role',args),/forbidden/);
    await as(db,owner);
    await assert.rejects(rpc(db,'ops_set_role',{...args,u:owner}),/protected_user/);
    await assert.rejects(rpc(db,'ops_set_role',{...args,member_role:'owner'}),/invalid_role/);
    await assert.rejects(rpc(db,'ops_set_role',{...args,s:foreign}),/forbidden/);
    await rpc(db,'ops_set_role',args);
    await rpc(db,'ops_set_role',{...args,a:'sr-padeiro',member_role:'stockist'});
    await db.exec('reset role');
    assert.equal((await db.query(`select role from tenant_users where user_id='${staff}'`)).rows[0].role,'cashier');
    assert.equal((await db.query(`select role from srp_members where user_id='${staff}'`)).rows[0].role,'stockist');
    assert.equal((await db.query("select count(*)::int as n from operation_audit where action='member_role_changed'")).rows[0].n,2);
  } finally {await db.close();}
});

test('central: permuta de 12 meses, renovação, motivo e autorização nas duas operações', async () => {
  const db = await fixture();
  try {
    await db.exec(`alter table tenants add column courtesy_ends_at timestamptz,add column courtesy_started_at timestamptz,add column courtesy_type text,add column courtesy_granted_by uuid,add column setup_status text default 'approved';
      create table srp_access_control(organization_id uuid primary key,access_mode text,trial_starts_at timestamptz,trial_ends_at timestamptz,barter_until timestamptz,manual_release boolean,released_by uuid,released_at timestamptz,notes text,updated_at timestamptz default now());`);
    await db.exec(await readFile(new URL('../../../apps/meu-espetinho/supabase/migrations/20261029152119_operations_access_and_catalog_release.sql', import.meta.url), 'utf8'));
    const args={a:'meu-espetinho',s:scope,mode:'barter',amount:12,unit:'months',reason:'Contrato de permuta anual',renew:false};
    await as(db, owner);
    await assert.rejects(rpc(db,'ops_grant_access',args),/forbidden/);
    await as(db, admin);
    await assert.rejects(rpc(db,'ops_grant_access',{...args,amount:13}),/invalid_access/);
    await assert.rejects(rpc(db,'ops_grant_access',{...args,reason:''}),/invalid_access/);
    for(const a of ['meu-espetinho','sr-padeiro']) {
      const result=await rpc(db,'ops_grant_access',{...args,a});
      const span=(await db.query('select $1::timestamptz = $2::timestamptz + interval \'12 months\' as ok',[result.ends_at,result.starts_at])).rows[0].ok;
      assert.equal(span,true);
      const renewed=await rpc(db,'ops_grant_access',{...args,a,renew:true});
      assert.equal(new Date(renewed.starts_at).getTime(),new Date(result.ends_at).getTime());
    }
    await db.exec(`reset role;update tenants set setup_status='suspended' where id='${scope}'`);
    await as(db, admin);
    await rpc(db,'ops_grant_access',args);
    await db.exec('reset role');
    assert.equal((await db.query(`select setup_status from tenants where id='${scope}'`)).rows[0].setup_status,'suspended');
    assert.equal((await db.query("select count(*)::int as n from operation_audit where action='access_granted'")).rows[0].n,5);
  } finally { await db.close(); }
});
async function as(db, user, role = "authenticated") {
  await db.exec(
    `reset role;select set_config('request.jwt.claim.sub','${user || ""}',false);set role ${role};`,
  );
}
const rpc = async (db, name, args) => {
  const keys = Object.keys(args);
  return (
    await db.query(
      `select public.${name}(${keys.map((key, i) => key+" => $" + (i + 1)).join(",")}) as result`,
      Object.values(args),
    )
  ).rows[0].result;
};

test("catalog parser: Brazilian decimals, Excel TSV, quotes, invalid values and duplicates", () => {
  assert.equal(decimal("R$ 1.234,56"), 1234.56);
  assert.ok(Number.isNaN(decimal("1e5")));
  assert.equal(parseCatalog(catalogTemplate(true)).rows[0].unit, "KG");
  assert.equal(parseCatalog("nome\tpreco\nPão\t12,50").rows[0].price, 12.5);
  assert.equal(
    parseCatalog('nome;preco\n"Pão; especial";12,50').rows[0].name,
    "Pão; especial",
  );
  assert.equal(parseCatalog("nome;preco\nPão;10\npão;11").errors.length, 1);
  for (const s of [
    "nome;preco\nPão;-2",
    "nome;preco\nPão;abc",
    'nome;preco\n"Pão;2',
    "nome;preco\nPão;0",
  ])
    assert.ok(parseCatalog(s).errors.length);
});
test("receipt customization: toggles, paper, copies, escape, totals and permanent fiscal warning", () => {
  const prefs = {
    ...defaultPreferences,
    businessName: "<script>Loja</script>",
    address: "Rua A",
    showAddress: false,
    showPhone: false,
    footer: "Volte sempre!",
    paperWidth: 58,
    copies: 2,
  };
  const data = {
    label: "Balcão",
    date: "2026-10-29T12:00:00Z",
    payment: "PIX",
    total: 9,
    items: [{ name: "Pão", quantity: 0.5, unit: "KG", unitPrice: 18 }],
  };
  assert.ok(!receiptLines(data, prefs).includes("Rua A"));
  const html = renderReceipt(data, prefs);
  assert.match(html, /58mm/);
  assert.match(html, /Volte sempre!/);
  assert.match(html, /RECIBO NÃO FISCAL/);
  assert.match(html, /Não substitui a NFC-e obrigatória/);
  assert.doesNotMatch(html, /<script>/);
  assert.equal((html.match(/<section>/g) || []).length, 2);
});
test("database: settings isolation, role escalation blocked, temporary support, logo scope and audit", async () => {
  const db = await fixture();
  try {
    await as(db, owner);
    const prefs = { ...defaultPreferences, businessName: "Loja" };
    await assert.rejects(
      db.query(
        "insert into operation_preferences(app,scope_id,preferences) values($1,$2,$3)",
        ["meu-espetinho", scope, { ...prefs, footer: 42 }],
      ),
      /invalid_preference_types/,
    );
    await db.query(
      "insert into operation_preferences(app,scope_id,preferences) values($1,$2,$3)",
      ["meu-espetinho", scope, prefs],
    );
    await as(db, other);
    assert.equal(
      (await db.query("select * from operation_preferences")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("insert into operation_preferences values($1,$2,$3,now())", [
        "sr-padeiro",
        scope,
        prefs,
      ]),
      /row-level security/,
    );
    await as(db, staff);
    assert.equal(
      (await db.query("select * from operation_preferences")).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "update operation_preferences set preferences='{}' returning scope_id",
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(`update tenant_users set role='owner' where user_id='${staff}'`),
      /permission denied/,
    );
    await assert.rejects(
      rpc(db, "ops_start_support", {
        a: "meu-espetinho",
        s: scope,
        reason: "Teste",
      }),
      /forbidden/,
    );
    await as(db, admin);
    assert.equal(
      await rpc(db, "ops_support_context", { a: "meu-espetinho", s: scope }),
      false,
    );
    await rpc(db, "ops_start_support", {
      a: "meu-espetinho",
      s: scope,
      reason: "Configuração solicitada",
    });
    assert.equal(
      await rpc(db, "ops_support_context", { a: "meu-espetinho", s: scope }),
      true,
    );
    await db.query(
      "insert into storage.objects(bucket_id,name) values($1,$2)",
      ["operation-logos", `meu-espetinho/${scope}/logo.png`],
    );
    await assert.rejects(
      db.query("update storage.objects set name=$1", [
        `meu-espetinho/${foreign}/logo.png`,
      ]),
      /row-level security/,
    );
    await assert.rejects(
      db.query("insert into storage.objects(bucket_id,name) values($1,$2)", [
        "operation-logos",
        `meu-espetinho/${foreign}/logo.png`,
      ]),
      /row-level security/,
    );
    await rpc(db, "ops_end_support", { a: "meu-espetinho", s: scope });
    assert.equal(
      await rpc(db, "ops_support_context", { a: "meu-espetinho", s: scope }),
      false,
    );
    await rpc(db, "ops_start_support", {
      a: "sr-padeiro",
      s: scope,
      reason: "Configuração da padaria",
    });
    await db.exec("reset role");
    await db.exec(
      "update operation_support_sessions set expires_at=now()-interval '1 second'",
    );
    await as(db, admin);
    assert.equal(
      await rpc(db, "ops_support_context", { a: "sr-padeiro", s: scope }),
      false,
    );
    await as(db, null, "anon");
    await assert.rejects(
      db.query("select * from operation_preferences"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
test("database: imports are atomic and idempotent, preserve stock and isolate the two segments", async () => {
  const db = await fixture();
  try {
    await as(db, owner);
    const rows = [
      {
        name: "Carne",
        price: 12,
        category: "Espetinhos",
        unit: "UN",
        stock: 50,
        cost: 5,
      },
    ];
    const request = id(30);
    const args = {
      a: "meu-espetinho",
      s: scope,
      r: request,
      rows,
      mode: "skip",
    };
    assert.equal((await rpc(db, "ops_import_catalog", args)).created, 1);
    assert.equal((await rpc(db, "ops_import_catalog", args)).created, 1);
    await rpc(db, "ops_import_catalog", {
      ...args,
      r: id(31),
      mode: "update",
      rows: [{ ...rows[0], price: 15, stock: 999 }],
    });
    await db.exec("reset role");
    const p = (await db.query("select * from products")).rows;
    assert.equal(p.length, 1);
    assert.equal(Number(p[0].price), 15);
    assert.equal(Number(p[0].stock_qty), 50);
    await as(db, owner);
    await assert.rejects(
      rpc(db, "ops_import_catalog", {
        ...args,
        r: id(32),
        rows: [
          { ...rows[0], name: "Frango" },
          { ...rows[0], name: "Inválido", price: -1 },
        ],
      }),
      /invalid_product/,
    );
    await db.exec("reset role");
    assert.equal((await db.query("select * from products")).rows.length, 1);
    await as(db, owner);
    await rpc(db, "ops_import_catalog", {
      a: "sr-padeiro",
      s: scope,
      r: id(33),
      rows: [
        {
          name: "Pão",
          price: 18.9,
          category: "Pães",
          unit: "KG",
          stock: 20,
          cost: 9,
        },
      ],
      mode: "skip",
    });
    await as(db, staff);
    await assert.rejects(
      rpc(db, "ops_import_catalog", { ...args, r: id(34) }),
      /forbidden/,
    );
    await as(db, owner);
    await rpc(db, "ops_import_catalog", {
      a: "sr-padeiro",
      s: scope,
      r: id(36),
      mode: "skip",
      rows: [
        {
          name: "Bolo",
          variant: "Pequeno",
          fulfillment: "pronta_entrega",
          price: 20,
          category: "Bolos",
          unit: "UN",
          stock: 2,
          cost: 8,
        },
        {
          name: "Bolo",
          variant: "Grande",
          fulfillment: "encomenda",
          price: 40,
          category: "Bolos",
          unit: "UN",
          stock: 1,
          cost: 16,
        },
      ],
    });
    await db.exec("reset role");
    const variants = (
      await db.query(
        "select variant,active from srp_products where name='Bolo' order by variant",
      )
    ).rows;
    assert.equal(variants.length, 2);
    assert.ok(variants.every((v) => v.active));
    assert.equal(
      (await db.query("select active from srp_products where name='Pão'"))
        .rows[0].active,
      false,
    );
    await as(db, other);
    await assert.rejects(
      rpc(db, "ops_import_catalog", { ...args, r: id(35) }),
      /forbidden/,
    );
    await db.exec("reset role");
    assert.equal(
      (await db.query("select unit from srp_products")).rows[0].unit,
      "KG",
    );
    assert.equal(
      Number(
        (await db.query("select quantity from srp_inventory")).rows[0].quantity,
      ),
      20,
    );
  } finally {
    await db.close();
  }
});
test("database: invites bind to verified email, cannot grant owner, and protect owner/self", async () => {
  const db = await fixture();
  try {
    await as(db, owner);
    await assert.rejects(
      rpc(db, "ops_invite", {
        a: "meu-espetinho",
        s: scope,
        email: "new@example.com",
        full_name: "Nova Pessoa",
        member_role: "owner",
      }),
      /invalid_role/,
    );
    const token = await rpc(db, "ops_invite", {
      a: "sr-padeiro",
      s: scope,
      email: "new@example.com",
      full_name: "Nova Pessoa",
      member_role: "stockist",
    });
    await as(db, other);
    await assert.rejects(
      rpc(db, "ops_accept_invite", { token }),
      /invalid_or_expired_invite/,
    );
    await as(db, newuser);
    await db.exec("reset role");
    await db.exec(
      `update auth.users set email_confirmed_at=null where id='${newuser}'`,
    );
    await as(db, newuser);
    await assert.rejects(
      rpc(db, "ops_accept_invite", { token }),
      /invalid_or_expired_invite/,
    );
    await db.exec("reset role");
    await db.exec(
      `update auth.users set email_confirmed_at=now() where id='${newuser}'`,
    );
    await as(db, newuser);
    assert.equal(
      (await rpc(db, "ops_accept_invite", { token })).scope_id,
      scope,
    );
    await rpc(db, "ops_accept_invite", { token });
    await as(db, owner);
    const team = await rpc(db, "ops_team", { a: "sr-padeiro", s: scope });
    assert.equal(team.members.filter((m) => m.user_id === newuser).length, 1);
    assert.equal(
      team.members.find((m) => m.user_id === newuser).name,
      "Nova Pessoa",
    );
    await assert.rejects(
      rpc(db, "ops_set_member", {
        a: "sr-padeiro",
        s: scope,
        u: owner,
        enabled: false,
      }),
      /owner_or_self_locked/,
    );
    await rpc(db, "ops_set_member", {
      a: "sr-padeiro",
      s: scope,
      u: newuser,
      enabled: false,
    });
    await as(db, newuser);
    await assert.rejects(
      rpc(db, "ops_team", { a: "sr-padeiro", s: scope }),
      /forbidden/,
    );
    await as(db, owner);
    const canceled = await rpc(db, "ops_invite", {
      a: "meu-espetinho",
      s: scope,
      email: "new@example.com",
      full_name: "Pessoa",
      member_role: "attendant",
    });
    const pending = (
      await rpc(db, "ops_team", { a: "meu-espetinho", s: scope })
    ).invites[0];
    await rpc(db, "ops_revoke_invite", {
      a: "meu-espetinho",
      s: scope,
      i: pending.id,
    });
    await as(db, newuser);
    await assert.rejects(
      rpc(db, "ops_accept_invite", { token: canceled }),
      /invalid_or_expired_invite/,
    );
  } finally {
    await db.close();
  }
});
