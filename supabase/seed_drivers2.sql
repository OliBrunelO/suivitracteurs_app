-- ============================================================
-- IMPORT CHAUFFEURS — lot 2
-- Mot de passe temporaire commun : Tracteur2024
-- ============================================================

DO $$
DECLARE
  pwd TEXT := 'Tracteur2024';
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    username || '@internal.app',
    crypt(pwd, gen_salt('bf')),
    now(),
    jsonb_build_object('username', username, 'full_name', full_name, 'role', 'driver'),
    now(), now()
  FROM (VALUES
    ('anacletopinto.paulo',    'ANACLETO PINTO Paulo'),
    ('bustosvazquez.miguel',   'BUSTOS VAZQUEZ Miguel'),
    ('duchaussoy.jerome',      'DUCHAUSSOY Jérôme'),
    ('ferrero.jonathan',       'FERRERO Jonathan'),
    ('guiraud.mathieu',        'GUIRAUD Mathieu'),
    ('monnet.federico',        'MONNET Federico'),
    ('morlier.loic',           'MORLIER Loïc'),
    ('mouillevois.geoffrey',   'MOUILLEVOIS Geoffrey')
  ) AS t(username, full_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.email = t.username || '@internal.app'
  );
END $$;

-- Vérification
SELECT username, full_name, role
FROM public.profiles
WHERE role = 'driver'
ORDER BY full_name;
