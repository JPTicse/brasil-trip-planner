-- Añadir columnas para photo_concepts y metadata de fotos trending
-- Estas columnas faltaban y causaban que saveInspirations fallara silenciosamente

alter table public.inspirations
  add column if not exists photo_concepts jsonb not null default '[]'::jsonb,
  add column if not exists instagram_score numeric(3, 1),
  add column if not exists difficulty smallint,
  add column if not exists best_time text;
