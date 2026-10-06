-- Applied to project pcrwtoddavpvkaxwtstc during the GRIT News P0 incident.
BEGIN;
ALTER POLICY admin_users_self_read ON public.admin_users TO authenticated
USING (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.admin_users FROM anon;
COMMIT;
