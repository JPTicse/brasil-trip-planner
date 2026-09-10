-- Añadir imagen a actividades
alter table public.activities add column if not exists image_url text;

-- Crear bucket para imágenes de actividades si no existe
insert into storage.buckets (id, name, public)
values ('activity-images', 'activity-images', true)
on conflict (id) do nothing;

-- Políticas RLS para el bucket de imágenes
drop policy if exists "Anyone can read activity images" on storage.objects;
create policy "Anyone can read activity images"
  on storage.objects for select to public
  using (bucket_id = 'activity-images');

drop policy if exists "Authenticated users can upload activity images" on storage.objects;
create policy "Authenticated users can upload activity images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'activity-images');

drop policy if exists "Users can update their own activity images" on storage.objects;
create policy "Users can update their own activity images"
  on storage.objects for update to authenticated
  using (bucket_id = 'activity-images' and owner = auth.uid());
