
import { pool } from "../config/db.js";

export async function authentifierComptable(req, res, next) {
  const utilisateurId = req.session?.utilisateurId;

  if (!utilisateurId) {
    return res.status(401).json({
      success: false,
      message: "Vous devez vous connecter.",
    });
  }

  try {
    const [lignes] = await pool.execute(
      `SELECT id, role, statut
       FROM association_prets.utilisateurs
       WHERE id = ?
       LIMIT 1`,
      [utilisateurId]
    );

    const utilisateur = lignes[0];

    if (!utilisateur) {
      return res.status(401).json({
        success: false,
        message: "Compte introuvable.",
      });
    }

    if (
      String(utilisateur.role).toLowerCase() !== "comptable"
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès réservé au Comptable.",
      });
    }

    if (
      String(utilisateur.statut).toLowerCase() !== "actif"
    ) {
      return res.status(403).json({
        success: false,
        message: "Votre compte n'est pas actif.",
      });
    }

    req.comptableId = utilisateur.id;
    return next();
  } catch (erreur) {
    console.error(
      "[AUTH COMPTABLE]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message: "Impossible de vérifier les autorisations.",
    });
  }
}
