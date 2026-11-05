import { Router } from "express";

import { authentifierMembre } from "../middlewares/authentifierMembre.js";
import { uploadJustificatif } from "../middlewares/uploadJustificatif.js";
import { creerPretMembre , listerPretsMembre,} from "../controllers/membrePrets.controller.js";
import {
  listerNotificationsMembre,
  marquerNotificationLue,
  toutesNotificationsLues,
} from "../controllers/membreNotifications.controller.js";
import {
  obtenirProfilMembre,
  modifierProfilMembre,
} from "../controllers/membreProfil.controller.js";

import {
  detailPretMembre,
  financesPretMembre,
  voirJustificatifMembre,
} from "../controllers/membreDetail.controller.js";
import {
  consulterQuotaMembre,
} from "../controllers/membreQuota.controller.js";
import {budgetMembre} from "../controllers/budgetMembre.controller.js";
const router = Router();
router.get("/budget",authentifierMembre,budgetMembre);

router.get(
  "/prets",
  authentifierMembre,
  listerPretsMembre
);

// Les soumissions doivent provenir du frontend local authentifié.
// La protection CSRF complète reste nécessaire avant mise en production.
router.post("/prets", authentifierMembre, (req, res, next) => {
  const origine = req.get("origin");
  const originesLocales = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
  if (!origine || !originesLocales.has(origine)) {
    return res.status(403).json({
      success: false,
      message: "Origine de la requête non autorisée.",
    });
  }
  uploadJustificatif(req, res, (erreur) => {
    if (!erreur) return next();
    return res.status(400).json({
      success: false,
      message: erreur.code === "LIMIT_FILE_SIZE"
        ? "Justificatif trop volumineux (maximum 5 Mo)."
        : "Fichier ou formulaire invalide.",
    });
  });
}, creerPretMembre);

router.get(
  "/prets/:id",
  authentifierMembre,
  detailPretMembre
);

router.get(
  "/prets/:id/finances",
  authentifierMembre,
  financesPretMembre
);

router.get(
  "/prets/:id/justificatifs/:justificatifId",
  authentifierMembre,
  voirJustificatifMembre
);

// Consulter le profil connecté.
router.get(
  "/profil",
  authentifierMembre,
  obtenirProfilMembre
);

// Modifier le téléphone et l'e-mail.
router.patch(
  "/profil",
  authentifierMembre,
  modifierProfilMembre
);
router.get(
  "/notifications",
  authentifierMembre,
  listerNotificationsMembre
);
router.patch(
  "/notifications/toutes-lues",
  authentifierMembre,
  toutesNotificationsLues
);
router.patch(
  "/notifications/:id/lue",
  authentifierMembre,
  marquerNotificationLue
);
router.get(
  "/quota",
  authentifierMembre,
  consulterQuotaMembre
);
export default router;
