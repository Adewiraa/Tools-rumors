alter table public.players
drop constraint if exists players_full_name_country_code_key;

alter table public.players
add constraint players_full_name_country_code_key unique (full_name, country_code);
