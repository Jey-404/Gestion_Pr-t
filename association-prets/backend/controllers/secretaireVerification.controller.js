
import { pool } from "../config/db.js";

import {
  notifierChangementStatut,
} from "../services/notificationsPrets.service.js";

// ===========================================
// POST /api/secretaire/prets/:id/verification
// Transmission du dossier au Directeur
// ===========================================

export async function validerVerificationSecretaire(req, res) {
  const { id } = req.params;
  const { action } = req.body || {};

  // 1. Vérifier l'identifiant du prêt.
  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return res.status(400).json({
      success: false,
      message: "Identifiant de prêt invalide.",
    });
  }

  // 2. Vérifier l'action demandée.
  if (action !== "transmettre_directeur") {
    return res.status(400).json({
      success: false,
      message: "Action non autorisée.",
    });
  }

  let connexion;
  let transactionOuverte = false;
  let commitTente = false;
  let pretTransmis = null;

  try {
    connexion = await pool.getConnection();

    await connexion.beginTransaction();
    transactionOuverte = true;

    // 3. Verrouiller le prêt pendant le traitement.
    const [lignes] = await connexion.execute(
      `SELECT
         id,
         utilisateur_id,
         statut
       FROM association_prets.prets
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    const pret = lignes[0];

    if (!pret) {
      await connexion.rollback();
      transactionOuverte = false;

      return res.status(404).json({
        success: false,
        message: "Dossier introuvable.",
      });
    }

    const ancienStatut = pret.statut;

    // 4. Seuls les dossiers en attente ou
    // en vérification peuvent être transmis.
    if (
      !["soumis", "en_verification"].includes(
        ancienStatut
      )
    ) {
      await connexion.rollback();
      transactionOuverte = false;

      return res.status(409).json({
        success: false,
        message:
          "Ce dossier ne peut plus être transmis. " +
          "Statut actuel : " +
          ancienStatut,
      });
    }

    // 5. Vérifier la présence d'un justificatif.
    const [documents] = await connexion.execute(
      `SELECT id
       FROM association_prets.justificatifs
       WHERE pret_id = ?
       LIMIT 1`,
      [id]
    );

    if (documents.length === 0) {
      await connexion.rollback();
      transactionOuverte = false;

      return res.status(409).json({
        success: false,
        message:
          "Impossible de transmettre : " +
          "aucun justificatif enregistré.",
      });
    }

    // 6. Modifier le statut dans MySQL.
    // Le Directeur retrouvera le dossier
    // au statut en_decision.
    const [resultat] = await connexion.execute(
      `UPDATE association_prets.prets
       SET
         statut = 'en_decision',
         date_modification = NOW()
       WHERE id = ?
         AND statut = ?`,
      [id, ancienStatut]
    );

    if (resultat.affectedRows !== 1) {
      await connexion.rollback();
      transactionOuverte = false;

      return res.status(409).json({
        success: false,
        message:
          "Le dossier a été modifié entre-temps. " +
          "Actualisez la liste.",
      });
    }

    // 7. Confirmer la transaction.
    commitTente = true;
    await connexion.commit();
    transactionOuverte = false;

    pretTransmis = {
      id: String(pret.id),
      utilisateurId: pret.utilisateur_id,
      ancienStatut,
      nouveauStatut: "en_decision",
    };
  } catch (erreur) {
    if (transactionOuverte && connexion) {
      try {
        await connexion.rollback();
      } catch (erreurRollback) {
        console.error(
          "[TRANSMISSION] Rollback :",
          erreurRollback.message
        );
      }
    }

    console.error(
      "[TRANSMISSION DIRECTEUR]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message: commitTente
        ? "Résultat de transmission incertain. " +
          "Vérifiez le statut du dossier dans MySQL."
        : "Impossible de transmettre le dossier au Directeur.",
    });
  } finally {
    connexion?.release();
  }

  // 8. Notification après confirmation MySQL.
  // Une erreur de notification ne doit pas
  // annuler la transmission déjà enregistrée.
  try {
    await notifierChangementStatut({
      utilisateurId: pretTransmis.utilisateurId,
      pretId: pretTransmis.id,
      ancienStatut: pretTransmis.ancienStatut,
      nouveauStatut: "en_decision",
    });
  } catch (erreurNotification) {
    console.error(
      "[TRANSMISSION] Notification :",
      erreurNotification.message
    );
  }

  console.log(
    "[TRANSMISSION DIRECTEUR] Dossier PR-" +
      pretTransmis.id +
      " : " +
      pretTransmis.ancienStatut +
      " -> en_decision"
  );

  // 9. Réponse de succès envoyée à React.
  return res.status(200).json({
    success: true,
    message:
      "Le dossier PR-" +
      pretTransmis.id +
      " a été transmis au Directeur.",
    pret: {
      id: pretTransmis.id,
      statut: "en_decision",
    },
  });
}
