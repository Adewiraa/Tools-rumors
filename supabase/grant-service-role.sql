grant usage on schema public to service_role;

grant all privileges on public.competitions to service_role;
grant all privileges on public.seasons to service_role;
grant all privileges on public.clubs to service_role;
grant all privileges on public.club_seasons to service_role;
grant all privileges on public.players to service_role;
grant all privileges on public.club_rosters to service_role;

grant usage, select, update on sequence public.competitions_id_seq to service_role;
grant usage, select, update on sequence public.seasons_id_seq to service_role;
grant usage, select, update on sequence public.clubs_id_seq to service_role;
grant usage, select, update on sequence public.club_seasons_id_seq to service_role;
grant usage, select, update on sequence public.players_id_seq to service_role;
grant usage, select, update on sequence public.club_rosters_id_seq to service_role;
