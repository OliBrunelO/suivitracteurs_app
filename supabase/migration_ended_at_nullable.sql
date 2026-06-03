-- Rendre ended_at optionnel (travaux en cours)
ALTER TABLE public.work_records ALTER COLUMN ended_at DROP NOT NULL;
