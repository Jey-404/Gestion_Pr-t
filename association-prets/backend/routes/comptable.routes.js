
import { Router } from "express";
import {
  situationRemboursement,
  enregistrerRemboursement,
} from "../controllers/comptableRemboursement.controller.js";
import {
  authentifierComptable,
} from "../middlewares/authentifierComptable.js";
import {
  enregistrerDecaissement,
} from "../controllers/comptableDecaissement.controller.js";
import {
  listerPretsApprouves,
  listerPretsPourDecaissement,
  listerPretsARembourser,
  tableauBordComptable,
} from "../controllers/comptablePrets.controller.js";
const router = Router();

router.use(authentifierComptable);

// Liste des prêts éligibles au décaissement.
router.get(
  "/prets-approuves",
  listerPretsApprouves
);

router.get(
  "/prets-decaissement",
  listerPretsPourDecaissement
);
router.get(
  "/prets-remboursement",
  listerPretsARembourser
);
router.get(
  "/tableau-bord",
  tableauBordComptable
);
router.post(
  "/prets/:id/decaisser",
  enregistrerDecaissement
);
router.get(
  "/prets/:id/situation",
  situationRemboursement
);

router.post(
  "/prets/:id/rembourser",
  enregistrerRemboursement
);
export default router;
