ALTER TABLE association_prets.prets
  ADD COLUMN nombre_echeances_souhaitees SMALLINT UNSIGNED NULL,
  ADD COLUMN date_premiere_echeance_souhaitee DATE NULL;
