-- Exécuter UNE SEULE FOIS, après sauvegarde de la base.
-- Préserve nombre_max et les anciennes données jusqu'à migration confirmée.
USE association_prets;
ALTER TABLE quotas_mensuels ADD COLUMN montant_total DECIMAL(15,0) NOT NULL DEFAULT 0;
-- INITIALISER les montants avec des budgets réellement validés par l'association.
-- Les budgets existants restent à 0 pour éviter toute approbation non provisionnée.
-- Exemple (ADAPTER le montant au budget validé pour ce mois) :
-- UPDATE quotas_mensuels SET montant_total = 1000000 WHERE mois = '2026-10-01';
-- Les nouveaux mois seront créés depuis l'espace Administrateur.
