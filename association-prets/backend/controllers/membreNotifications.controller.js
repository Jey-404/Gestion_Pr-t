
import { pool } from "../config/db.js";

function identifierColonne(colonnes, candidats) {
  return candidats.find((nom) => colonnes.includes(nom)) || null;
}

function protegerNomSQL(nom) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nom)) {
    throw new Error("Nom de colonne SQL invalide.");
  }
  return `\`${nom}\``;
}

async function obtenirStructure() {
  const [lignes] = await pool.query(
    "SHOW COLUMNS FROM notifications"
  );

  const colonnes = lignes.map((ligne) => ligne.Field);

  const structure = {
    id: identifierColonne(colonnes, ["id"]),
    utilisateur: identifierColonne(colonnes, [
      "utilisateur_id",
      "membre_id",
      "destinataire_id",
    ]),
    titre: identifierColonne(colonnes, [
      "titre",
      "sujet",
    ]),
    message: identifierColonne(colonnes, [
      "message",
      "contenu",
    ]),
    type: identifierColonne(colonnes, [
      "type",
      "categorie",
    ]),
    date: identifierColonne(colonnes, [
      "date_creation",
      "date_envoi",
      "created_at",
      "date_notification",
    ]),
    lu: identifierColonne(colonnes, [
      "lu",
      "est_lue",
      "est_lu",
    ]),
    dateLecture: identifierColonne(colonnes, [
      "date_lecture",
      "lu_le",
    ]),
  };

  const indispensables = [
    "id",
    "utilisateur",
    "titre",
    "message",
  ];

  const manquantes = indispensables.filter(
    (cle) => !structure[cle]
  );

  if (manquantes.length > 0) {
    throw new Error(
      "Structure notifications incompatible : " +
      manquantes.join(", ") +
      ". Colonnes disponibles : " +
      colonnes.join(", ")
    );
  }

  if (!structure.lu && !structure.dateLecture) {
    throw new Error(
      "Aucune colonne de lecture trouvée : " +
      "lu, est_lue, est_lu, date_lecture ou lu_le."
    );
  }

  return structure;
}

function expressionLecture(s) {
  if (s.lu) {
    return `COALESCE(${protegerNomSQL(s.lu)}, 0) = 1`;
  }

  return `${protegerNomSQL(s.dateLecture)} IS NOT NULL`;
}

function miseAJourLecture(s) {
  const valeurs = [];

  if (s.lu) {
    valeurs.push(`${protegerNomSQL(s.lu)} = 1`);
  }

  if (s.dateLecture) {
    valeurs.push(
      `${protegerNomSQL(s.dateLecture)} = ` +
      `COALESCE(${protegerNomSQL(s.dateLecture)}, NOW())`
    );
  }

  return valeurs.join(", ");
}

function envoyerErreur(res, erreur) {
  console.error(
    "[NOTIFICATIONS MEMBRE]",
    erreur.code || erreur.message
  );

  return res.status(500).json({
    success: false,
    message:
      "Impossible d'effectuer cette opération sur les notifications.",
  });
}

// ========================================
// GET /api/membre/notifications
// ========================================

export async function listerNotificationsMembre(req, res) {
  try {
    const s = await obtenirStructure();

    const champ = (nom, alias) =>
      nom
        ? `${protegerNomSQL(nom)} AS ${alias}`
        : `NULL AS ${alias}`;

    const filtreUtilisateur = protegerNomSQL(s.utilisateur);
    const tri = s.date || s.id;

    const [notifications] = await pool.execute(
      `SELECT
         ${champ(s.id, "id")},
         ${champ(s.titre, "titre")},
         ${champ(s.message, "message")},
         ${champ(s.type, "type_notification")},
         ${champ(s.date, "date_notification")},
         (${expressionLecture(s)}) AS est_lue
       FROM notifications
       WHERE ${filtreUtilisateur} = ?
       ORDER BY ${protegerNomSQL(tri)} DESC,
                ${protegerNomSQL(s.id)} DESC
       LIMIT 100`,
      [req.membreId]
    );

    const [compteurs] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         COALESCE(
           SUM(NOT (${expressionLecture(s)})), 0
         ) AS non_lues
       FROM notifications
       WHERE ${filtreUtilisateur} = ?`,
      [req.membreId]
    );

    return res.status(200).json({
      success: true,
      compteurs: {
        total: Number(compteurs[0].total),
        nonLues: Number(compteurs[0].non_lues),
      },
      notifications: notifications.map((n) => ({
        id: String(n.id),
        titre: n.titre,
        message: n.message,
        type: n.type_notification || "info",
        date: n.date_notification,
        lu: Boolean(n.est_lue),
      })),
    });
  } catch (erreur) {
    return envoyerErreur(res, erreur);
  }
}

// ========================================
// PATCH /api/membre/notifications/:id/lue
// ========================================

export async function marquerNotificationLue(req, res) {
  const { id } = req.params;

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return res.status(400).json({
      success: false,
      message: "Identifiant de notification invalide.",
    });
  }

  try {
    const s = await obtenirStructure();

    const [resultat] = await pool.execute(
      `UPDATE notifications
       SET ${miseAJourLecture(s)}
       WHERE ${protegerNomSQL(s.id)} = ?
         AND ${protegerNomSQL(s.utilisateur)} = ?`,
      [id, req.membreId]
    );

    if (resultat.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable.",
      });
    }

    return res.json({
      success: true,
      message: "Notification marquée comme lue.",
    });
  } catch (erreur) {
    return envoyerErreur(res, erreur);
  }
}

// ========================================
// PATCH /api/membre/notifications/toutes-lues
// ========================================

export async function toutesNotificationsLues(req, res) {
  try {
    const s = await obtenirStructure();

    const [resultat] = await pool.execute(
      `UPDATE notifications
       SET ${miseAJourLecture(s)}
       WHERE ${protegerNomSQL(s.utilisateur)} = ?
         AND NOT (${expressionLecture(s)})`,
      [req.membreId]
    );

    return res.json({
      success: true,
      message: "Vos notifications ont été marquées comme lues.",
      nombreModifie: resultat.affectedRows,
    });
  } catch (erreur) {
    return envoyerErreur(res, erreur);
  }
}
