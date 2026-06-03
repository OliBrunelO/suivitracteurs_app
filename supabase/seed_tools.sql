-- ============================================================
-- IMPORT DES OUTILS MÉCANIQUES
-- Catégorie : mécanique uniquement (manuel exclu)
-- Source : tableau id_travaux
-- ============================================================

INSERT INTO public.tools (name, notes, active) VALUES
  ('Actisol',                 '3 h/ha',       true),
  ('Broyage',                 '2,85 h/ha',    true),
  ('Chasse terre',            '3 h/ha',       false),
  ('Chaussage',               '4 h/ha',       true),
  ('Complantation',           '3 h/ha',       true),
  ('Décavaillonage',          '7 h/ha',       true),
  ('Décavaillonage chenillard','0,5 h/ha',    true),
  ('Décompactage',            null,           false),
  ('Disquage',                '3 h/ha',       true),
  ('Disques émotteurs',       '4 h/ha',       true),
  ('Écimage',                 null,           false),
  ('Effeuillage',             '4 h/ha',       false),
  ('Épandage',                null,           true),
  ('Épareuse',                null,           false),
  ('Fertilisation / amendement', '5 h/ha',   true),
  ('Griffes',                 '2 h/ha',       true),
  ('Herse',                   null,           false),
  ('Lames',                   '3,15 h/ha',    true),
  ('Prétaillage',             '3,72 h/ha',    true),
  ('Rognage',                 null,           false),
  ('Rognage + tonte',         '4 h/ha',       true),
  ('Rognage / Kress / Émotteurs', '5 h/ha',  true),
  ('Rotavator',               null,           true),
  ('Rotofil',                 '7 h/ha',       true),
  ('Semis',                   '5 h/ha',       true),
  ('Sous-solage',             null,           false),
  ('Sous-sollage',            '3 h/ha',       true),
  ('Tondeuses interceps',     '7 h/ha',       true),
  ('Tonte des allées',        null,           false),
  ('Tonte parcelles',         '3 h/ha',       true),
  ('Traitement',              null,           false)
ON CONFLICT DO NOTHING;
