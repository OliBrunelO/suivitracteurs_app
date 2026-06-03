-- ============================================================
-- MIGRATION : Boîtiers GPS et affectations
-- À exécuter APRÈS schema.sql dans l'éditeur SQL Supabase
-- ============================================================

-- ============================================================
-- 1. TABLE DEVICES (boîtiers GPS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.devices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text UNIQUE NOT NULL,  -- numéro de série (AZP..., SOL...)
  notes         text,
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- 2. TABLE DEVICE_ASSIGNMENTS (association boîtier ↔ tracteur)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.device_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       uuid NOT NULL REFERENCES public.devices(id),
  tractor_id      uuid NOT NULL REFERENCES public.tractors(id),
  assigned_at     timestamptz NOT NULL DEFAULT now(),
  unassigned_at   timestamptz,          -- NULL = affectation en cours
  assigned_by     uuid REFERENCES public.profiles(id),
  unassigned_by   uuid REFERENCES public.profiles(id),
  notes           text,
  CONSTRAINT chk_dates CHECK (unassigned_at IS NULL OR unassigned_at > assigned_at)
);

-- Index unique : un boîtier ne peut être affecté qu'à un seul tracteur à la fois
CREATE UNIQUE INDEX IF NOT EXISTS device_one_active_assignment
  ON public.device_assignments(device_id)
  WHERE unassigned_at IS NULL;

-- ============================================================
-- 3. SUPPRIMER gps_device_id de tractors (remplacé par device_assignments)
-- ============================================================
-- (À exécuter seulement si la colonne existe déjà)
-- ALTER TABLE public.tractors DROP COLUMN IF EXISTS gps_device_id;

-- ============================================================
-- 4. VUE : tracteur avec son boîtier courant
-- ============================================================

CREATE OR REPLACE VIEW public.tractor_current_device AS
SELECT DISTINCT ON (da.tractor_id)
  da.tractor_id,
  d.id            AS device_id,
  d.serial_number AS serial_number,
  da.assigned_at,
  da.id           AS assignment_id
FROM public.device_assignments da
JOIN public.devices d ON d.id = da.device_id
WHERE da.unassigned_at IS NULL
ORDER BY da.tractor_id, da.assigned_at DESC;

-- ============================================================
-- 5. RLS pour les nouvelles tables
-- ============================================================

ALTER TABLE public.devices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_assignments ENABLE ROW LEVEL SECURITY;

-- Tous les rôles peuvent lire les boîtiers et affectations
CREATE POLICY "devices_select_all" ON public.devices
  FOR SELECT USING (true);

CREATE POLICY "assignments_select_all" ON public.device_assignments
  FOR SELECT USING (true);

-- admin ET superadmin peuvent modifier les boîtiers et les affectations
CREATE POLICY "devices_write_admin" ON public.devices
  FOR ALL USING (public.get_my_role() IN ('admin', 'superadmin'));

CREATE POLICY "assignments_write_admin" ON public.device_assignments
  FOR ALL USING (public.get_my_role() IN ('admin', 'superadmin'));

-- ============================================================
-- 6. IMPORT DES DONNÉES
-- ============================================================

-- 6a. Tracteurs
INSERT INTO public.tractors (name, active) VALUES
  ('VN1',         true),
  ('VN2',         true),
  ('VN3',         true),
  ('VN4',         true),
  ('Tecnoma 2',   true),
  ('VN2080',      true),
  ('1080',        true),
  ('FREMA 1',     true),
  ('FREMA 2',     true),
  ('VN5',         true),
  ('Tecnoma 1',   true),
  ('VN 2 bis',    true),
  ('VN 1 bis',    true),
  ('Tecnoma 2 bis', true)
ON CONFLICT DO NOTHING;

-- 6b. Boîtiers GPS (tous, y compris le non affecté AZP25280636)
INSERT INTO public.devices (serial_number) VALUES
  ('AZP25280655'),
  ('AZP25280626'),
  ('AZP25280661'),
  ('AZP25280610'),
  ('AZP25280639'),
  ('AZP25280613'),
  ('AZP25280646'),
  ('AZP25280631'),
  ('AZP25280637'),
  ('AZP25280629'),
  ('AZP25280636'),  -- boîtier non affecté
  ('AZP25080010'),
  ('SOL24070028'),
  ('SOL24410604'),
  ('SOL24410516')
ON CONFLICT (serial_number) DO NOTHING;

-- 6c. Affectations actuelles (toutes sauf AZP25280636 qui n'est pas affecté)
WITH
  d AS (SELECT id, serial_number FROM public.devices),
  t AS (SELECT id, name FROM public.tractors)
INSERT INTO public.device_assignments (device_id, tractor_id, assigned_at)
SELECT d.id, t.id, now()
FROM (VALUES
  ('AZP25280655', 'VN1'),
  ('AZP25280626', 'VN2'),
  ('AZP25280661', 'VN3'),
  ('AZP25280610', 'VN4'),
  ('AZP25280639', 'Tecnoma 2'),
  ('AZP25280613', 'VN2080'),
  ('AZP25280646', '1080'),
  ('AZP25280631', 'FREMA 1'),
  ('AZP25280637', 'FREMA 2'),
  ('AZP25280629', 'VN5'),
  ('AZP25080010', 'Tecnoma 1'),
  ('SOL24070028', 'VN 2 bis'),
  ('SOL24410604', 'VN 1 bis'),
  ('SOL24410516', 'Tecnoma 2 bis')
) AS pairs(sn, tname)
JOIN d ON d.serial_number = pairs.sn
JOIN t ON t.name = pairs.tname
ON CONFLICT DO NOTHING;
