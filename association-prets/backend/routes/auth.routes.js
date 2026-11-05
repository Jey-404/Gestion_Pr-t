
import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
  connexion,
  sessionActuelle,
  deconnexion,
} from "../controllers/auth.controller.js";

import { changerMotDePasse } from "../controllers/motDePasse.controller.js";
const router = Router();

const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de tentatives. Réessayez plus tard.",
  },
});

router.post("/login", limiteConnexion, connexion);
router.get("/me", sessionActuelle);
router.post("/logout", deconnexion);
router.post("/changer-mot-de-passe", changerMotDePasse);

export default router;
