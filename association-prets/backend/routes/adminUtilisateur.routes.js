import { Router } from "express";
import { authentifierAdmin } from "../middlewares/authentifierAdmin.js";
import {
  listerUtilisateursAdmin, creerUtilisateurAdmin, modifierUtilisateurAdmin,
  changerStatutUtilisateurAdmin, reinitialiserMotDePasseAdmin,
} from "../controllers/adminUtilisateurs.controller.js";

const router = Router();
router.use(authentifierAdmin);
router.get("/", listerUtilisateursAdmin);
router.post("/", creerUtilisateurAdmin);
router.patch("/:id", modifierUtilisateurAdmin);
router.patch("/:id/statut", changerStatutUtilisateurAdmin);
router.post("/:id/reinitialiser-mot-de-passe", reinitialiserMotDePasseAdmin);
export default router;
