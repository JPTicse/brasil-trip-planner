-- Añade columnas de país y ciudad a trips para contexto del viaje
alter table public.trips
  add column if not exists country text,
  add column if not exists city text;

-- Sincroniza destination viejo: intenta dividir en city, country
update public.trips
  set city = split_part(destination, ',', 1),
      country = nullif(trim(split_part(destination, ',', 2)), '')
  where destination is not null
    and country is null;
