
import { pool } from "../config/db.js";

export async function authentifierDirecteur(req, res, next) {
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
      String(utilisateur.role).toLowerCase() !==
      "directeur"
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès réservé au Directeur.",
      });
    }

    if (
      String(utilisateur.statut).toLowerCase() !==
      "actif"
    ) {
      return res.status(403).json({
        success: false,
        message: "Compte non actif.",
      });
    }

    req.directeurId = utilisateur.id;
    next();
  } catch (erreur) {
    console.error(
      "[AUTH DIRECTEUR]",
      erreur.message
    );

    return res.status(500).json({
      success: false,
      message: "Erreur de vérification des accès.",
    });
  }
}
