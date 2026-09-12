-- Añade columnas para múltiples fotos y detalles enriquecidos a la tabla inspirations
alter table public.inspirations
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists description text,
  add column if not exists viral_trend text,
  add column if not exists category text,
  add column if not exists emoji text,
  add column if not exists opening_hours text[],
  add column if not exists website text,
  add column if not exists user_ratings_total integer;

-- Sincroniza image_urls con image_url existente (para filas viejas)
update public.inspirations
  set image_urls = array[image_url]
  where image_url is not null
    and (image_urls is null or array_length(image_urls, 1) is null);
