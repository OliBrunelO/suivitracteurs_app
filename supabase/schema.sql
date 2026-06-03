-- ============================================================
-- SCHEMA COMPLET - Application Suivi Tracteurs
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- Table profiles (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   text UNIQUE NOT NULL,
  full_name  text NOT NULL,
  role       text NOT NULL CHECK (role IN ('superadmin', 'admin', 'driver')),
  created_at timestamptz DEFAULT now()
);

-- Table tractors
CREATE TABLE IF NOT EXISTS public.tractors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  gps_device_id text,
  notes         text,
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- Table tools
CREATE TABLE IF NOT EXISTS public.tools (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  notes      text,
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table work_records
CREATE TABLE IF NOT EXISTS public.work_records (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL,
  ended_at   timestamptz NOT NULL,
  tractor_id uuid NOT NULL REFERENCES public.tractors(id),
  driver_id  uuid NOT NULL REFERENCES public.profiles(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  notes      text,
  created_at timestamptz DEFAULT now()
);

-- Table work_record_tools (liaison N-N)
CREATE TABLE IF NOT EXISTS public.work_record_tools (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_record_id uuid NOT NULL REFERENCES public.work_records(id) ON DELETE CASCADE,
  tool_id        uuid NOT NULL REFERENCES public.tools(id)
);

-- ============================================================
-- TRIGGER : créer automatiquement un profil à l'inscription
-- (utilisé lors de la création manuelle via Supabase Auth API)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Le profil est créé manuellement, ce trigger est un filet de sécurité
  -- Si le profil n'existe pas déjà
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, full_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tractors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_record_tools ENABLE ROW LEVEL SECURITY;

-- Fonction utilitaire : obtenir le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- Politiques PROFILES
-- ============================================================

-- Chaque utilisateur lit son propre profil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- superadmin et admin lisent tous les profils
CREATE POLICY "profiles_select_all_admins" ON public.profiles
  FOR SELECT USING (public.get_my_role() IN ('superadmin', 'admin'));

-- superadmin peut tout faire
CREATE POLICY "profiles_all_superadmin" ON public.profiles
  FOR ALL USING (public.get_my_role() = 'superadmin');

-- ============================================================
-- Politiques TRACTORS
-- ============================================================

-- Tout le monde peut lire les tracteurs
CREATE POLICY "tractors_select_all" ON public.tractors
  FOR SELECT USING (true);

-- admin ET superadmin peuvent créer, modifier, supprimer
CREATE POLICY "tractors_insert_admin" ON public.tractors
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

CREATE POLICY "tractors_update_admin" ON public.tractors
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'superadmin'));

CREATE POLICY "tractors_delete_admin" ON public.tractors
  FOR DELETE USING (public.get_my_role() IN ('admin', 'superadmin'));

-- ============================================================
-- Politiques TOOLS
-- ============================================================

CREATE POLICY "tools_select_all" ON public.tools
  FOR SELECT USING (true);

-- admin ET superadmin peuvent créer, modifier, supprimer
CREATE POLICY "tools_insert_admin" ON public.tools
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

CREATE POLICY "tools_update_admin" ON public.tools
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'superadmin'));

CREATE POLICY "tools_delete_admin" ON public.tools
  FOR DELETE USING (public.get_my_role() IN ('admin', 'superadmin'));

-- ============================================================
-- Politiques WORK_RECORDS
-- ============================================================

-- driver : ses propres enregistrements uniquement
CREATE POLICY "work_records_select_driver" ON public.work_records
  FOR SELECT USING (
    public.get_my_role() = 'driver' AND driver_id = auth.uid()
  );

CREATE POLICY "work_records_insert_driver" ON public.work_records
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'driver' AND driver_id = auth.uid()
  );

CREATE POLICY "work_records_update_driver" ON public.work_records
  FOR UPDATE USING (
    public.get_my_role() = 'driver' AND driver_id = auth.uid()
  );

-- admin et superadmin : accès total
CREATE POLICY "work_records_all_admin" ON public.work_records
  FOR ALL USING (public.get_my_role() IN ('admin', 'superadmin'));

-- ============================================================
-- Politiques WORK_RECORD_TOOLS
-- ============================================================

-- driver : ses propres (via work_record)
CREATE POLICY "wrt_select_driver" ON public.work_record_tools
  FOR SELECT USING (
    public.get_my_role() = 'driver' AND
    work_record_id IN (SELECT id FROM public.work_records WHERE driver_id = auth.uid())
  );

CREATE POLICY "wrt_insert_driver" ON public.work_record_tools
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'driver' AND
    work_record_id IN (SELECT id FROM public.work_records WHERE driver_id = auth.uid())
  );

CREATE POLICY "wrt_delete_driver" ON public.work_record_tools
  FOR DELETE USING (
    public.get_my_role() = 'driver' AND
    work_record_id IN (SELECT id FROM public.work_records WHERE driver_id = auth.uid())
  );

-- admin et superadmin : accès total
CREATE POLICY "wrt_all_admin" ON public.work_record_tools
  FOR ALL USING (public.get_my_role() IN ('admin', 'superadmin'));

-- ============================================================
-- DONNÉES DE TEST (optionnel — à commenter en production)
-- ============================================================

-- Exemple de tracteur et outil de test
-- INSERT INTO public.tractors (name, gps_device_id, notes) VALUES ('Tracteur 1', 'GPS-001', 'John Deere 6130R');
-- INSERT INTO public.tools (name, notes) VALUES ('Charrue', 'Charrue 4 socs'), ('Herse rotative', '3m'), ('Semoir', 'Semoir 6 rangs');
