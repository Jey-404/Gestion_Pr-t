# Corrections apportées

- `package.json` racine remis en cohérence avec Vite / React / Tailwind (il contenait uniquement argon2, et le lockfile était celui de `database-tools`).
- Ajout de `GET /api/comptable/tableau-bord`, protégé par le middleware Comptable, avec statistiques MySQL globales et cinq derniers prêts tous statuts.
- Tableau de bord Comptable connecté à MySQL et sans bouton de décaissement.
- Gestion des décaissements conserve la liste des prêts approuvés réels et l'ouverture de la préparation.
- Fenêtre de préparation : date prévue pouvant être postérieure à aujourd'hui, sans prétendre exécuter un paiement.

## Installation

1. Conservez **votre** fichier `backend/.env` sur votre PC : il ne figure pas dans cette archive. Utilisez `.env.example` en modèle si nécessaire.
2. Dans le dossier racine, lancez `npm install` puis `npm run dev`. La commande `npm install` recrée `package-lock.json`.
3. Dans un autre terminal, lancez `cd backend`, `npm install`, puis `npm run dev`.
4. Reconnectez-vous avec le compte Comptable si le serveur a redémarré.

## Limites non simulées

Les versements réels ne sont pas encore codés : la structure SQL de `decaissements` et le traitement des échéances sont inconnus. Cette version ne déclare pas un versement réussi sans écriture MySQL. Les tests avec une base réelle, l'authentification réelle et le build complet nécessitent un environnement disposant de toutes les dépendances natives installées sur la machine cible.
