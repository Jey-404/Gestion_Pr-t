
import { pool } from "../config/db.js";

export async function authentifierSecretaire(req, res, next) {
  try {
    const utilisateurId = req.session?.utilisateurId;

    if (!utilisateurId) {
      return res.status(401).json({
        success: false,
        message:
          "Vous devez vous connecter pour accéder à cette page.",
      });
    }

    const [utilisateurs] = await pool.execute(
      `SELECT id, role, statut
       FROM association_prets.utilisateurs
       WHERE id = ?
       LIMIT 1`,
      [utilisateurId]
    );

    const utilisateur = utilisateurs[0];

    if (!utilisateur || utilisateur.statut !== "actif") {
      return res.status(401).json({
        success: false,
        message: "Session invalide ou compte inactif.",
      });
    }

    if (utilisateur.role !== "secretaire") {
      return res.status(403).json({
        success: false,
        message: "Accès réservé au Secrétaire.",
      });
    }

    req.secretaireId = utilisateur.id;

    return next();
  } catch (erreur) {
    console.error(
      "[AUTH SECRETAIRE]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message: "Erreur de vérification des autorisations.",
    });
  }
}
