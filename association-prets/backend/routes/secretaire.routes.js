
import { Router } from "express";

import {
  listerPretsSecretaire,
  modifierStatutPretSecretaire,
} from "../controllers/secretairePrets.controller.js";

import {
  validerVerificationSecretaire,
} from "../controllers/secretaireVerification.controller.js";

import {
  authentifierSecretaire,
} from "../middlewares/authentifierSecretaire.js";

import {
  detailPretSecretaire,
  documentPretSecretaire,
} from "../controllers/secretaireDetail.controller.js";


const router = Router();

// Toutes les routes ci-dessous sont réservées
// aux comptes possédant le rôle "secretaire".
router.use(authentifierSecretaire);

// Récupérer les demandes réelles
router.get("/prets", listerPretsSecretaire);

router.patch(
  "/prets/:id/statut",
  modifierStatutPretSecretaire
);

// Consulter un dossier.
router.get(
  "/prets/:id",
  detailPretSecretaire
);

// Consulter un justificatif privé.
router.get(
  "/prets/:id/justificatifs/:documentId",
  documentPretSecretaire
);

router.post(
  "/prets/:id/verification",
  validerVerificationSecretaire
);

export default router;
