-- Token is generated in academy-ingestion.sql and never embedded in source or browser.
select cron.schedule('cip-academy-ingestion','*/2 * * * *', $job$
 select net.http_post(
  url:='https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/cip-academy-ingest',
  headers:=jsonb_build_object('Content-Type','application/json','x-academy-worker-token',
   (select decrypted_secret from vault.decrypted_secrets where name='cip_academy_worker_token')),
  body:='{}'::jsonb,timeout_milliseconds:=120000);
$job$);
