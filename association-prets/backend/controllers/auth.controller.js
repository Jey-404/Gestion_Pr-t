
import argon2 from "argon2";
import { pool } from "../config/db.js";

const champsPublics = [
  "id",
  "nom",
  "prenom",
  "email",
  "role",
  "statut",
];

function utilisateurPublic(compte) {
  const resultat = {};

  for (const champ of champsPublics) {
    resultat[champ] = compte[champ];
  }

  return resultat;
}

// POST /api/auth/login
export async function connexion(req, res) {
  try {
    const { email, motDePasse } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof motDePasse !== "string" ||
      !email.trim() ||
      !motDePasse ||
      email.length > 254 ||
      motDePasse.length > 1024
    ) {
      return res.status(400).json({
        success: false,
        message: "Identifiants invalides.",
      });
    }

    const emailNormalise = email.trim().toLowerCase();

    const [lignes] = await pool.execute(
      `SELECT
         id,
         nom,
         prenom,
         email,
         mot_de_passe_hash,
         role,
         statut
       FROM utilisateurs
       WHERE email = ?
       LIMIT 1`,
      [emailNormalise]
    );

    const compte = lignes[0];

    // Ne pas révéler si un email existe.
    if (
      !compte ||
      typeof compte.mot_de_passe_hash !== "string" ||
      !compte.mot_de_passe_hash.startsWith("$argon2id$")
    ) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect.",
      });
    }

    const motDePasseCorrect = await argon2.verify(
      compte.mot_de_passe_hash,
      motDePasse
    );

    if (!motDePasseCorrect) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect.",
      });
    }

    if (compte.statut !== "actif") {
      return res.status(403).json({
        success: false,
        message: "Ce compte n'est pas autorisé à se connecter.",
      });
    }

    const utilisateur = utilisateurPublic(compte);

    // Régénérer l'identifiant de session après connexion.
    req.session.regenerate((erreur) => {
      if (erreur) {
        console.error("Erreur de session :", erreur.message);

        return res.status(500).json({
          success: false,
          message: "Impossible de créer la session.",
        });
      }

      req.session.utilisateurId = String(compte.id);

      req.session.save((erreurSauvegarde) => {
        if (erreurSauvegarde) {
          console.error(
            "Erreur d'enregistrement de session :",
            erreurSauvegarde.message
          );

          return res.status(500).json({
            success: false,
            message: "Impossible d'enregistrer la session.",
          });
        }

        return res.json({
          success: true,
          message: "Connexion réussie.",
          utilisateur,
        });
      });
    });
  } catch (erreur) {
    console.error(
      "Erreur d'authentification :",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// GET /api/auth/me
export async function sessionActuelle(req, res) {
  try {
    const id = req.session?.utilisateurId;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié.",
      });
    }

    // Relire le rôle et le statut depuis MySQL.
    const [lignes] = await pool.execute(
      `SELECT
         id,
         nom,
         prenom,
         email,
         role,
         statut
       FROM utilisateurs
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    const compte = lignes[0];

    if (!compte || compte.statut !== "actif") {
      return req.session.destroy(() => {
        res.clearCookie("association.sid");

        res.status(401).json({
          success: false,
          message: "Session non autorisée.",
        });
      });
    }

    return res.json({
      success: true,
      utilisateur: utilisateurPublic(compte),
    });
  } catch (erreur) {
    console.error("Erreur session :", erreur.message);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// POST /api/auth/logout
export function deconnexion(req, res) {
  if (!req.session) {
    return res.json({
      success: true,
      message: "Déconnexion réussie.",
    });
  }

  req.session.destroy((erreur) => {
    if (erreur) {
      return res.status(500).json({
        success: false,
        message: "Impossible de fermer la session.",
      });
    }

    res.clearCookie("association.sid", {
      path: "/",
    });

    return res.json({
      success: true,
      message: "Déconnexion réussie.",
    });
  });
}
