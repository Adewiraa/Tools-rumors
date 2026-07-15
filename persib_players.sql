-- SQL INSERTS UNTUK PEMAIN PERSIB BANDUNG
BEGIN;
DO $$
DECLARE
  v_club_id uuid := '1f7a7efa-d55e-4930-955e-46011e9e494b';
  v_club_season_id uuid := '7902480f-f527-480b-96b0-5c9986a80cbe';
  p_id uuid;
BEGIN
  -- Player: Adam Przybek
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Adam Przybek'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Adam Przybek', 'Adam Przybek', 'GB', 'Wales', 'https://flags.restcountries.com/v5/svg/gb.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 1, 'GK')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 1, position = 'GK';
  
  -- Player: Teja Paku Alam
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Teja Paku Alam'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Teja Paku Alam', 'Teja Paku Alam', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 14, 'GK')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 14, position = 'GK';
  
  -- Player: Fitrah Maulana
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Fitrah Maulana'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Fitrah Maulana', 'Fitrah Maulana', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 81, 'GK')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 81, position = 'GK';
  
  -- Player: M. Rhaka Bilhuda
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('M. Rhaka Bilhuda'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'M. Rhaka Bilhuda', 'M. Rhaka Bilhuda', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 60, 'GK')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 60, position = 'GK';
  
  -- Player: Layvin Kurzawa
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Layvin Kurzawa'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Layvin Kurzawa', 'Layvin Kurzawa', 'FR', 'France', 'https://flags.restcountries.com/v5/svg/fr.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 3, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 3, position = 'DF';
  
  -- Player: Júlio César
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Júlio César'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Júlio César', 'Júlio César', 'BR', 'Brazil', 'https://flags.restcountries.com/v5/svg/br.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 4, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 4, position = 'DF';
  
  -- Player: Kakang Rudianto
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Kakang Rudianto'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Kakang Rudianto', 'Kakang Rudianto', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 5, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 5, position = 'DF';
  
  -- Player: Henhen Herdiana
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Henhen Herdiana'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Henhen Herdiana', 'Henhen Herdiana', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 12, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 12, position = 'DF';
  
  -- Player: Achmad Jufriyanto
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Achmad Jufriyanto'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Achmad Jufriyanto', 'Achmad Jufriyanto', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 16, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 16, position = 'DF';
  
  -- Player: Alfeandra Dewangga
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Alfeandra Dewangga'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Alfeandra Dewangga', 'Alfeandra Dewangga', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 19, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 19, position = 'DF';
  
  -- Player: Zalnando
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Zalnando'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Zalnando', 'Zalnando', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 27, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 27, position = 'DF';
  
  -- Player: Al Hamra Hehanussa
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Al Hamra Hehanussa'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Al Hamra Hehanussa', 'Al Hamra Hehanussa', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 29, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 29, position = 'DF';
  
  -- Player: Dion Markx
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Dion Markx'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Dion Markx', 'Dion Markx', 'NL', 'Netherlands', 'https://flags.restcountries.com/v5/svg/nl.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 44, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 44, position = 'DF';
  
  -- Player: Patricio Matricardi
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Patricio Matricardi'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Patricio Matricardi', 'Patricio Matricardi', 'AR', 'Argentina', 'https://flags.restcountries.com/v5/svg/ar.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 48, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 48, position = 'DF';
  
  -- Player: Frans Putros
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Frans Putros'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Frans Putros', 'Frans Putros', 'IQ', 'Iraq', 'https://flags.restcountries.com/v5/svg/iq.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 55, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 55, position = 'DF';
  
  -- Player: Rezaldi Hehanussa
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Rezaldi Hehanussa'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Rezaldi Hehanussa', 'Rezaldi Hehanussa', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 56, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 56, position = 'DF';
  
  -- Player: Kevin M. Pasha
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Kevin M. Pasha'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Kevin M. Pasha', 'Kevin M. Pasha', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 66, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 66, position = 'DF';
  
  -- Player: Federico Barba
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Federico Barba'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Federico Barba', 'Federico Barba', 'IT', 'Italy', 'https://flags.restcountries.com/v5/svg/it.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 93, 'DF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 93, position = 'DF';
  
  -- Player: Eliano Reijnders
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Eliano Reijnders'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Eliano Reijnders', 'Eliano Reijnders', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 2, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 2, position = 'MF';
  
  -- Player: Robi Darwis
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Robi Darwis'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Robi Darwis', 'Robi Darwis', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 6, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 6, position = 'MF';
  
  -- Player: Beckham Putra
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Beckham Putra'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Beckham Putra', 'Beckham Putra', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 7, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 7, position = 'MF';
  
  -- Player: Luciano Guaycochea
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Luciano Guaycochea'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Luciano Guaycochea', 'Luciano Guaycochea', 'AR', 'Argentina', 'https://flags.restcountries.com/v5/svg/ar.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 8, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 8, position = 'MF';
  
  -- Player: Wiliam Marcilio
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Wiliam Marcilio'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Wiliam Marcilio', 'Wiliam Marcilio', 'BR', 'Brazil', 'https://flags.restcountries.com/v5/svg/br.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 10, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 10, position = 'MF';
  
  -- Player: Dedi Kusnandar
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Dedi Kusnandar'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Dedi Kusnandar', 'Dedi Kusnandar', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 11, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 11, position = 'MF';
  
  -- Player: Febri Hariyadi
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Febri Hariyadi'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Febri Hariyadi', 'Febri Hariyadi', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 13, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 13, position = 'MF';
  
  -- Player: Adam Alis
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Adam Alis'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Adam Alis', 'Adam Alis', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 18, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 18, position = 'MF';
  
  -- Player: Marc Klok
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Marc Klok'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Marc Klok', 'Marc Klok', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 23, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 23, position = 'MF';
  
  -- Player: Thom Haye
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Thom Haye'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Thom Haye', 'Thom Haye', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 33, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 33, position = 'MF';
  
  -- Player: Saddil Ramdani
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Saddil Ramdani'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Saddil Ramdani', 'Saddil Ramdani', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 67, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 67, position = 'MF';
  
  -- Player: Adzikry Fadlillah
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Adzikry Fadlillah'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Adzikry Fadlillah', 'Adzikry Fadlillah', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 71, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 71, position = 'MF';
  
  -- Player: Nazriel Alfaro
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Nazriel Alfaro'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Nazriel Alfaro', 'Nazriel Alfaro', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 85, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 85, position = 'MF';
  
  -- Player: Berguinho (Rosebergne da Silva)
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Berguinho (Rosebergne da Silva)'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Berguinho (Rosebergne da Silva)', 'Berguinho (Rosebergne da Silva)', 'BR', 'Brazil', 'https://flags.restcountries.com/v5/svg/br.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 97, 'MF')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 97, position = 'MF';
  
  -- Player: Dimas Drajad
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Dimas Drajad'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Dimas Drajad', 'Dimas Drajad', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 9, 'FW')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 9, position = 'FW';
  
  -- Player: Athaya Zahran
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Athaya Zahran'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Athaya Zahran', 'Athaya Zahran', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 36, 'FW')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 36, position = 'FW';
  
  -- Player: Zulkifli Lukmansyah
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Zulkifli Lukmansyah'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Zulkifli Lukmansyah', 'Zulkifli Lukmansyah', 'ID', 'Indonesia', 'https://flags.restcountries.com/v5/svg/id.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 73, 'FW')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 73, position = 'FW';
  
  -- Player: Andrew Jung
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Andrew Jung'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Andrew Jung', 'Andrew Jung', 'FR', 'France', 'https://flags.restcountries.com/v5/svg/fr.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 90, 'FW')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 90, position = 'FW';
  
  -- Player: Uilliam Barros Pereira
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Uilliam Barros Pereira'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Uilliam Barros Pereira', 'Uilliam Barros Pereira', 'BR', 'Brazil', 'https://flags.restcountries.com/v5/svg/br.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 94, 'FW')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 94, position = 'FW';
  
  -- Player: Ramon "Tanque" De Andrade Souza
  SELECT id INTO p_id FROM players WHERE LOWER(TRIM(full_name)) = LOWER(TRIM('Ramon "Tanque" De Andrade Souza'));
  IF p_id IS NULL THEN
    p_id := gen_random_uuid();
    INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
    VALUES (p_id, 'Ramon "Tanque" De Andrade Souza', 'Ramon "Tanque" De Andrade Souza', 'BR', 'Brazil', 'https://flags.restcountries.com/v5/svg/br.svg');
  END IF;
  
  -- Insert/Update Roster
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  VALUES (p_id, v_club_season_id, 98, 'FW')
  ON CONFLICT (player_id, club_season_id) DO UPDATE 
  SET shirt_number = 98, position = 'FW';
  
END $$;
COMMIT;
