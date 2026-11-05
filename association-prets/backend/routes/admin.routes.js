
import { Router } from "express";

import {
  authentifierAdmin,
} from "../middlewares/authentifierAdmin.js";

import {
  tableauBordAdmin,
} from "../controllers/adminTableauBord.controller.js";

import {
  listerUtilisateursAdmin,
  creerUtilisateurAdmin,
  modifierUtilisateurAdmin,
  changerStatutUtilisateurAdmin,
  reinitialiserMotDePasseAdmin,
} from "../controllers/adminUtilisateurs.controller.js";
import { listerPretsAdmin } from "../controllers/adminPrets.controller.js";
import { listerQuotasAdmin, creerQuotaAdmin, modifierQuotaAdmin } from "../controllers/adminQuotas.controller.js";

const router = Router();

// ======================================
// PROTECTION ADMINISTRATEUR
// ======================================

router.use(authentifierAdmin);

// ======================================
// TABLEAU DE BORD
// ======================================

router.get(
  "/tableau-bord",
  tableauBordAdmin
);

// ======================================
// GESTION DES UTILISATEURS
// ======================================

// Afficher les utilisateurs
router.get(
  "/utilisateurs",
  listerUtilisateursAdmin
);

// Créer un compte
router.post(
  "/utilisateurs",
  creerUtilisateurAdmin
);

// Modifier les informations et le rôle
router.patch(
  "/utilisateurs/:id",
  modifierUtilisateurAdmin
);

// Activer ou suspendre un compte
router.patch(
  "/utilisateurs/:id/statut",
  changerStatutUtilisateurAdmin
);

// Réinitialiser le mot de passe
router.post(
  "/utilisateurs/:id/reinitialiser-mot-de-passe",
  reinitialiserMotDePasseAdmin
);
// Consultation des prets : aucune decision de pret ici.
router.get("/prets", listerPretsAdmin);

// Gestion des quotas mensuels.
router.get("/quotas", listerQuotasAdmin);
router.post("/quotas", creerQuotaAdmin);
router.patch("/quotas/:mois", modifierQuotaAdmin);

export default router;
