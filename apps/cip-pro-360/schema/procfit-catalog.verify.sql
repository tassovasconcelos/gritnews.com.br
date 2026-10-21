-- Run against the CIP database; every fixture is rolled back.
begin;
do $$
declare bid uuid:=gen_random_uuid(); packet jsonb; r jsonb;
begin
 packet:=jsonb_build_object('batch_id',bid);
 perform public.cip_procfit_catalog_receive(packet||jsonb_build_object('action','begin','captured_at',now(),'products',1,'eans',1));
 begin
  perform public.cip_procfit_catalog_receive(packet||jsonb_build_object('action','finish'));
  raise exception 'test_failed_incomplete_publication';
 exception when raise_exception then if SQLERRM<>'count_mismatch' then raise; end if; end;
 perform public.cip_procfit_catalog_receive(packet||jsonb_build_object('action','products','rows',jsonb_build_array(jsonb_build_object('COD_PRODUTO','90001','NOME_PRODUTO','Fixture only','MARCA','Teste'))));
 perform public.cip_procfit_catalog_receive(packet||jsonb_build_object('action','eans','rows',jsonb_build_array(jsonb_build_object('REGISTRO','90001','COD_PRODUTO','90002','EAN','0000000000001'))));
 begin
  perform public.cip_procfit_catalog_receive(packet||jsonb_build_object('action','finish'));
  raise exception 'test_failed_orphan_publication';
 exception when raise_exception then if SQLERRM<>'orphan_ean' then raise; end if; end;
 perform public.cip_procfit_catalog_receive(packet||jsonb_build_object('action','eans','rows',jsonb_build_array(jsonb_build_object('REGISTRO','90001','COD_PRODUTO','90001','EAN','0000000000001'))));
 r:=public.cip_procfit_catalog_receive(packet||jsonb_build_object('action','finish'));
 if r->>'published'<>'true' then raise exception 'test_failed_publish'; end if;
 perform public.cip_procfit_catalog_receive(packet||jsonb_build_object('action','products','rows',jsonb_build_array(jsonb_build_object('COD_PRODUTO','90001','NOME_PRODUTO','changed'))));
 if (select name from public.cip_procfit_catalog_products where batch_id=bid and code='90001')<>'Fixture only' then raise exception 'test_failed_immutable_published_batch'; end if;
end $$;
rollback;
