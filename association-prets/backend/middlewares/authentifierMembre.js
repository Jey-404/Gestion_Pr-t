
import { pool } from "../config/db.js";

const ROLES_AUTORISES = new Set([
  "membre",
  "secretaire",
  "comptable",
  "directeur",
]);

export async function authentifierMembre(req, res, next) {
  const utilisateurId = req.session?.utilisateurId;

  if (!utilisateurId) {
    return res.status(401).json({
      success: false,
      message: "Vous devez vous connecter.",
    });
  }

  try {
    const [lignes] = await pool.execute(
      `SELECT
         id,
         role,
         statut
       FROM association_prets.utilisateurs
       WHERE id = ?
       LIMIT 1`,
      [utilisateurId]
    );

    const utilisateur = lignes[0];

    if (!utilisateur) {
      return res.status(401).json({
        success: false,
        message: "Compte utilisateur introuvable.",
      });
    }

    if (utilisateur.statut !== "actif") {
      return res.status(403).json({
        success: false,
        message: "Votre compte n'est pas actif.",
      });
    }

    if (!ROLES_AUTORISES.has(utilisateur.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Vous n'avez pas accès à l'espace Membre.",
      });
    }

    // Le même utilisateur conserve son identité.
    // Ses prêts restent liés à son identifiant MySQL.
    req.membreId = utilisateur.id;
    req.membreRole = utilisateur.role;

    next();
  } catch (erreur) {
    console.error("[AUTH MEMBRE]", {
      code: erreur.code,
      message: erreur.message,
    });

    return res.status(500).json({
      success: false,
      message:
        "Impossible de vérifier votre accès à l'espace Membre.",
    });
  }
}
