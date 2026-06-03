-- ============================================================
-- PATCH RLS — Correction des politiques tractors et tools
-- À exécuter dans Supabase SQL Editor si la suppression
-- d'outils ou de tracteurs ne fonctionne pas.
-- ============================================================

-- Supprimer les anciennes politiques (nom "superadmin")
DROP POLICY IF EXISTS "tractors_insert_superadmin" ON public.tractors;
DROP POLICY IF EXISTS "tractors_update_superadmin" ON public.tractors;
DROP POLICY IF EXISTS "tractors_delete_superadmin" ON public.tractors;
DROP POLICY IF EXISTS "tools_insert_superadmin"    ON public.tools;
DROP POLICY IF EXISTS "tools_update_superadmin"    ON public.tools;
DROP POLICY IF EXISTS "tools_delete_superadmin"    ON public.tools;

-- Recréer proprement pour admin ET superadmin
-- (idempotent : IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tractors' AND policyname = 'tractors_insert_admin'
  ) THEN
    CREATE POLICY "tractors_insert_admin" ON public.tractors
      FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tractors' AND policyname = 'tractors_update_admin'
  ) THEN
    CREATE POLICY "tractors_update_admin" ON public.tractors
      FOR UPDATE USING (public.get_my_role() IN ('admin', 'superadmin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tractors' AND policyname = 'tractors_delete_admin'
  ) THEN
    CREATE POLICY "tractors_delete_admin" ON public.tractors
      FOR DELETE USING (public.get_my_role() IN ('admin', 'superadmin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tools' AND policyname = 'tools_insert_admin'
  ) THEN
    CREATE POLICY "tools_insert_admin" ON public.tools
      FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tools' AND policyname = 'tools_update_admin'
  ) THEN
    CREATE POLICY "tools_update_admin" ON public.tools
      FOR UPDATE USING (public.get_my_role() IN ('admin', 'superadmin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tools' AND policyname = 'tools_delete_admin'
  ) THEN
    CREATE POLICY "tools_delete_admin" ON public.tools
      FOR DELETE USING (public.get_my_role() IN ('admin', 'superadmin'));
  END IF;
END $$;

-- Vérification : liste les politiques actives sur ces deux tables
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('tractors', 'tools')
ORDER BY tablename, policyname;
