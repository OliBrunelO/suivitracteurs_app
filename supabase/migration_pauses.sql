-- Migration : ajout table work_record_pauses
-- À exécuter dans l'éditeur SQL de Supabase

CREATE TABLE IF NOT EXISTS public.work_record_pauses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_record_id uuid NOT NULL REFERENCES public.work_records(id) ON DELETE CASCADE,
  paused_at      timestamptz NOT NULL,
  resumed_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_record_pauses_work_record_id_idx
  ON public.work_record_pauses(work_record_id);

ALTER TABLE public.work_record_pauses ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "pauses_select_all" ON public.work_record_pauses
  FOR SELECT USING (true);

-- Écriture : admin et superadmin uniquement
CREATE POLICY "pauses_insert_admin" ON public.work_record_pauses
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

CREATE POLICY "pauses_update_admin" ON public.work_record_pauses
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'superadmin'));

CREATE POLICY "pauses_delete_admin" ON public.work_record_pauses
  FOR DELETE USING (public.get_my_role() IN ('admin', 'superadmin'));
