
import { Router } from "express";
import {
  consulterQuotaMembre,
} from "../controllers/membreQuota.controller.js";
import {
  deciderPretDirecteur,
} from "../controllers/directeurDecision.controller.js";

import {
  authentifierDirecteur,
} from "../middlewares/authentifierDirecteur.js";

import {
  listerDossiersDirecteur,
  tableauBordDirecteur,
} from "../controllers/directeurPrets.controller.js";

const router = Router();

// ==========================================
// LISTE DES DOSSIERS TRANSMIS AU DIRECTEUR
// ==========================================

router.get(
  "/dossiers",
  authentifierDirecteur,
  listerDossiersDirecteur
);

// ==========================================
// TABLEAU DE BORD DIRECTEUR
// ==========================================

router.get(
  "/tableau-bord",
  authentifierDirecteur,
  tableauBordDirecteur
);

// ==========================================
// APPROUVER OU REFUSER UN PRET
// ==========================================

router.post(
  "/dossiers/:id/decision",
  authentifierDirecteur,
  deciderPretDirecteur
);
router.get(
  "/quota",
  consulterQuotaMembre
);
export default router;
