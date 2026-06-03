-- ============================================================
-- IMPORT DES CHAUFFEURS (Tractoristes uniquement)
-- À exécuter dans Supabase SQL Editor
--
-- Mot de passe temporaire commun : Tracteur2024
-- À communiquer aux chauffeurs pour leur première connexion.
-- Identifiant de connexion = colonne "username" ci-dessous.
-- ============================================================

DO $$
DECLARE
  pwd TEXT := 'Tracteur2024';
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    username || '@internal.app',
    crypt(pwd, gen_salt('bf')),
    now(),
    jsonb_build_object(
      'username',  username,
      'full_name', full_name,
      'role',      'driver'
    ),
    now(),
    now()
  FROM (VALUES
    ('privat.stephane',     'PRIVAT Stéphane'),
    ('turkowsky.stephane',  'TURKOWSKY Stéphane'),
    ('urbino.christophe',   'URBINO Christophe'),
    ('potier.franck',       'POTIER Franck'),
    ('viollet.cedric',      'VIOLLET Cédric'),
    ('sementery.guillaume', 'SEMENTERY Guillaume'),
    ('guinaud.damien',      'GUINAUD Damien'),
    ('lasserre.fabrice',    'LASSERRE Fabrice'),
    ('baron.mickael',       'BARON Mickael')
  ) AS t(username, full_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.email = t.username || '@internal.app'
  );
END $$;

-- Vérification : liste les profils créés
SELECT username, full_name, role, created_at
FROM public.profiles
WHERE role = 'driver'
ORDER BY full_name;
