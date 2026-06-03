-- ============================================================
-- MIGRATION : Catégories d'outils
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Table categories
CREATE TABLE IF NOT EXISTS public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Ajouter category_id aux outils
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. Supprimer la colonne notes des outils (remplacée par catégorie)
ALTER TABLE public.tools DROP COLUMN IF EXISTS notes;

-- 4. RLS pour categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les catégories
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

-- Seul superadmin peut créer/modifier/supprimer les catégories
CREATE POLICY "categories_all_superadmin" ON public.categories
  FOR ALL USING (public.get_my_role() = 'superadmin');
