begin;
CREATE OR REPLACE FUNCTION cip_market_private.evidence_ready(own jsonb, criteria jsonb, o jsonb, u text, seller text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
 select coalesce((cip_market_private.quality(own,criteria,o,u,seller)->>'basic_eligible')::boolean,false)
 and coalesce(length(btrim(o->>'quote'))>=5,false)
 and coalesce(u~'^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(/|$)',false)
 and coalesce(split_part(u,'/',3)!~'(^|\.)(localhost|local|internal|test|invalid|example|onion)$',false)
 and coalesce(u!~*'^https://[^/]+/(marcas|busca|search|pesquisa|loja|categorias?|collections)(/|[?]|$)',false)
 and coalesce(u!~*'\.(pdf|csv|xlsx?|jpg|png)([?#]|$)',false)
 and coalesce(u!~*'[?&][^=&]*(token|secret|password|credential|signature|session)[^=&]*=',false)
 and coalesce(lower(seller)!~'pronut|prohospital|anunciante individual|desconhecido|unknown|not identified|unidentified|not available|n[aã]o identificado|diversos vendedores|v[aá]rios vendedores',false)
$function$;

notify pgrst,'reload schema';
commit;
