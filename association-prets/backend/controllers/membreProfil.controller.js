
import { pool } from "../config/db.js";

// ========================================
// OUTIL : FORMATER UN PROFIL MEMBRE
// ========================================

function formaterProfil(utilisateur) {
  return {
    id: String(utilisateur.id),
    numeroMembre: utilisateur.numero_membre,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    email: utilisateur.email,
    telephone: utilisateur.telephone,
    role: utilisateur.role,
    statut: utilisateur.statut,
    dateAdhesion: utilisateur.date_adhesion,
  };
}

// ========================================
// GET /api/membre/profil
// ========================================

export async function obtenirProfilMembre(req, res) {
  try {
    const [lignes] = await pool.execute(
      `SELECT
         id,
         numero_membre,
         nom,
         prenom,
         email,
         telephone,
         role,
         statut,
         date_adhesion
       FROM association_prets.utilisateurs
       WHERE id = ?
         AND statut = 'actif'
       LIMIT 1`,
      [req.membreId]
    );

    const utilisateur = lignes[0];

    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: "Profil membre introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      profil: formaterProfil(utilisateur),
    });
  } catch (erreur) {
    console.error(
      "[PROFIL MEMBRE - GET]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message: "Impossible de charger le profil.",
    });
  }
}

// ========================================
// PATCH /api/membre/profil
// ========================================

export async function modifierProfilMembre(req, res) {
  const champs = req.body;

  if (
    !champs ||
    typeof champs !== "object" ||
    Array.isArray(champs) ||
    Object.keys(champs).sort().join(",") !== "email,telephone"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Seuls le téléphone et l'e-mail peuvent être modifiés.",
    });
  }

  const { email, telephone } = champs;

  if (
    typeof email !== "string" ||
    typeof telephone !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Les informations fournies sont invalides.",
    });
  }

  const emailNettoye = email.trim().toLowerCase();
  const telephoneNettoye = telephone.trim();

  // Numéro ivoirien : dix chiffres.
  if (!/^\d{10}$/.test(telephoneNettoye)) {
    return res.status(400).json({
      success: false,
      message:
        "Le téléphone doit comporter exactement 10 chiffres.",
    });
  }

  // Validation de format simple ; MySQL conserve
  // sa contrainte UNIQUE sur l'adresse e-mail.
  if (
    emailNettoye.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNettoye)
  ) {
    return res.status(400).json({
      success: false,
      message: "Veuillez saisir une adresse e-mail valide.",
    });
  }

  try {
    const [resultat] = await pool.execute(
      `UPDATE association_prets.utilisateurs
       SET
         email = ?,
         telephone = ?
       WHERE id = ?
         AND statut = 'actif'`,
      [
        emailNettoye,
        telephoneNettoye,
        req.membreId,
      ]
    );

    if (resultat.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Profil introuvable ou compte non autorisé.",
      });
    }

    const [lignes] = await pool.execute(
      `SELECT
         id,
         numero_membre,
         nom,
         prenom,
         email,
         telephone,
         role,
         statut,
         date_adhesion
       FROM association_prets.utilisateurs
       WHERE id = ?
       LIMIT 1`,
      [req.membreId]
    );

    return res.status(200).json({
      success: true,
      message: "Votre profil a été mis à jour.",
      profil: formaterProfil(lignes[0]),
    });
  } catch (erreur) {
    // La contrainte UNIQUE de MySQL protège
    // contre les doublons, même simultanés.
    if (erreur.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Cette adresse e-mail est déjà utilisée par un autre compte.",
      });
    }

    console.error(
      "[PROFIL MEMBRE - PATCH]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible d'enregistrer les modifications.",
    });
  }
}
