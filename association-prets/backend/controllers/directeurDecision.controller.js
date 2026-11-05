
import { pool } from "../config/db.js";

import {
  notifierChangementStatut,
} from "../services/notificationsPrets.service.js";

// POST /api/directeur/dossiers/:id/decision

export async function deciderPretDirecteur(req, res) {
  const { id } = req.params;
  const decision = req.body?.decision;
  const observation = req.body?.observation;

  // Vérifier l'identifiant du prêt
  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return res.status(400).json({
      success: false,
      message: "Identifiant de prêt invalide.",
    });
  }

  // Vérifier la décision
  if (!["approuve", "rejete"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "Décision non autorisée.",
    });
  }

  // Observation obligatoire
  if (
    typeof observation !== "string" ||
    observation.trim().length < 10 ||
    observation.trim().length > 2000
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Le motif de décision doit contenir entre 10 et 2000 caractères.",
    });
  }

  if (!req.directeurId) {
    return res.status(401).json({
      success: false,
      message: "Session Directeur invalide.",
    });
  }

  let connexion;
  let transactionOuverte = false;
  let commitTente = false;
  let pretDecide = null;

  try {
    connexion = await pool.getConnection();

    await connexion.beginTransaction();
    transactionOuverte = true;

    // 1. Verrouiller le dossier
    const [lignes] = await connexion.execute(
      `SELECT id, utilisateur_id, statut
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

    // 2. Vérifier que le dossier attend une décision
    if (pret.statut !== "en_decision") {
      await connexion.rollback();
      transactionOuverte = false;

      return res.status(409).json({
        success: false,
        message:
          "Ce dossier n'est plus en attente de décision. " +
          "Statut actuel : " + pret.statut,
      });
    }

    // 3. Enregistrer la décision et son auteur
    //
    // Aucun contrôle de montant_total ici :
    // quotas_mensuels gère le nombre de demandes,
    // et non le budget financier.
    await connexion.execute(
      `INSERT INTO association_prets.decisions_directeur
       (
         pret_id,
         directeur_id,
         decision,
         observation
       )
       VALUES (?, ?, ?, ?)`,
      [
        id,
        req.directeurId,
        decision,
        observation.trim(),
      ]
    );

    // 4. Modifier le statut du prêt
    const [resultat] = await connexion.execute(
      `UPDATE association_prets.prets
       SET statut = ?,
           date_modification = NOW()
       WHERE id = ?
         AND statut = 'en_decision'`,
      [decision, id]
    );

    if (resultat.affectedRows !== 1) {
      throw new Error(
        "Le statut du dossier a changé pendant le traitement."
      );
    }

    // 5. Valider les deux opérations ensemble
    commitTente = true;
    await connexion.commit();
    transactionOuverte = false;

    pretDecide = {
      id: String(pret.id),
      utilisateurId: pret.utilisateur_id,
      statut: decision,
    };

  } catch (erreur) {
    if (transactionOuverte && connexion) {
      try {
        await connexion.rollback();
      } catch (erreurRollback) {
        console.error(
          "[DIRECTEUR ROLLBACK]",
          erreurRollback.message
        );
      }
    }

    console.error("[DIRECTEUR DECISION]", {
      code: erreur.code,
      message: erreur.sqlMessage || erreur.message,
    });

    if (erreur.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Une décision existe déjà pour ce dossier.",
      });
    }

    return res.status(500).json({
      success: false,
      message: commitTente
        ? "Résultat de décision incertain. " +
          "Vérifiez le dossier dans MySQL avant de réessayer."
        : "Impossible d'enregistrer la décision.",
    });

  } finally {
    connexion?.release();
  }

  // 6. Notifier le membre après la transaction
  try {
    await notifierChangementStatut({
      utilisateurId: pretDecide.utilisateurId,
      pretId: pretDecide.id,
      ancienStatut: "en_decision",
      nouveauStatut: pretDecide.statut,
    });
  } catch (erreurNotification) {
    console.error(
      "[DIRECTEUR NOTIFICATION]",
      erreurNotification.message
    );
  }

  // 7. Confirmer au frontend
  return res.status(200).json({
    success: true,
    message:
      decision === "approuve"
        ? `Le prêt PR-${id} a été approuvé.`
        : `Le prêt PR-${id} a été refusé.`,
    pret: {
      id: pretDecide.id,
      statut: pretDecide.statut,
    },
  });
}
