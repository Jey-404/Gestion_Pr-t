
import { pool } from "../config/db.js";

import {
  notifierChangementStatut,
} from "../services/notificationsPrets.service.js";

// ============================================
// GET /api/secretaire/prets
// Récupérer les prêts depuis MySQL
// ============================================

export async function listerPretsSecretaire(req, res) {
  try {
    const [prets] = await pool.execute(
      `SELECT
         p.id,
         p.utilisateur_id,
         p.montant,
         p.motif,
         p.description,
         p.statut,
         p.date_demande,
         u.nom,
         u.prenom,
         u.email,
         u.telephone,
         EXISTS (
           SELECT 1
           FROM association_prets.justificatifs AS j
           WHERE j.pret_id = p.id
         ) AS justificatif_present
       FROM association_prets.prets AS p
       INNER JOIN association_prets.utilisateurs AS u
         ON u.id = p.utilisateur_id
       ORDER BY p.date_demande DESC, p.id DESC
       LIMIT 100`
    );

    return res.status(200).json({
      success: true,
      total: prets.length,
      prets: prets.map((pret) => ({
        id: String(pret.id),
        utilisateurId: String(pret.utilisateur_id),
        montant: Number(pret.montant),
        motif: pret.motif,
        description: pret.description,
        statut: pret.statut,
        dateDemande: pret.date_demande,
        membre: {
          nom: pret.nom,
          prenom: pret.prenom,
          email: pret.email,
          telephone: pret.telephone,
        },
        justificatifPresent:
          Boolean(pret.justificatif_present),
      })),
    });
  } catch (erreur) {
    console.error(
      "[SECRETAIRE - LISTE PRETS]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de récupérer les demandes de prêt.",
    });
  }
}

// ============================================
// PATCH /api/secretaire/prets/:id/statut
//
// Cette route permet seulement de commencer
// la vérification.
//
// La transmission au Directeur doit passer
// obligatoirement par :
// POST /api/secretaire/prets/:id/verification
// ============================================

export async function modifierStatutPretSecretaire(req, res) {
  const { id } = req.params;
  const nouveauStatut = req.body?.statut;

  // ========================================
  // VALIDATION DE L'IDENTIFIANT
  // ========================================

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return res.status(400).json({
      success: false,
      message: "Identifiant de prêt invalide.",
    });
  }

  // ========================================
  // LIMITER LES ACTIONS DU SECRETAIRE
  // ========================================

  if (nouveauStatut !== "en_verification") {
    return res.status(400).json({
      success: false,
      message:
        "Cette route permet uniquement de commencer " +
        "la vérification. Pour transmettre au Directeur, " +
        "utilisez la fiche de vérification.",
    });
  }

  let connexion;
  let transactionOuverte = false;
  let commitTente = false;
  let pretModifie = null;

  try {
    connexion = await pool.getConnection();

    await connexion.beginTransaction();
    transactionOuverte = true;

    // ======================================
    // VERROUILLER LE PRET
    // ======================================

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
        message: "Prêt introuvable.",
      });
    }

    const ancienStatut = pret.statut;

    // ======================================
    // VERIFIER LA TRANSITION
    // ======================================

    if (ancienStatut !== "soumis") {
      await connexion.rollback();
      transactionOuverte = false;

      return res.status(409).json({
        success: false,
        message:
          "Seul un prêt au statut 'soumis' peut " +
          "passer en vérification. Statut actuel : " +
          ancienStatut,
      });
    }

    // ======================================
    // MISE A JOUR MYSQL
    // ======================================

    const [resultat] = await connexion.execute(
      `UPDATE association_prets.prets
       SET statut = 'en_verification'
       WHERE id = ?
         AND statut = 'soumis'`,
      [id]
    );

    if (resultat.affectedRows !== 1) {
      await connexion.rollback();
      transactionOuverte = false;

      return res.status(409).json({
        success: false,
        message:
          "Le dossier a changé entre-temps. " +
          "Actualisez la liste.",
      });
    }

    // ======================================
    // VALIDER LA TRANSACTION
    // ======================================

    commitTente = true;
    await connexion.commit();
    transactionOuverte = false;

    pretModifie = {
      id: String(pret.id),
      utilisateurId: pret.utilisateur_id,
      ancienStatut,
      nouveauStatut: "en_verification",
    };
  } catch (erreur) {
    if (transactionOuverte && connexion) {
      try {
        await connexion.rollback();
      } catch (erreurRollback) {
        console.error(
          "[SECRETAIRE] Rollback :",
          erreurRollback.message
        );
      }
    }

    console.error(
      "[SECRETAIRE] Modification de statut :",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message: commitTente
        ? "Résultat de modification incertain. " +
          "Vérifiez le statut du dossier avant de réessayer."
        : "Impossible de commencer la vérification.",
    });
  } finally {
    connexion?.release();
  }

  // ========================================
  // NOTIFICATION APRES LE COMMIT
  // ========================================

  await notifierChangementStatut({
    utilisateurId: pretModifie.utilisateurId,
    pretId: pretModifie.id,
    ancienStatut: pretModifie.ancienStatut,
    nouveauStatut: pretModifie.nouveauStatut,
  });

  console.log(
    "[SECRETAIRE] Prêt",
    pretModifie.id,
    ":",
    pretModifie.ancienStatut,
    "->",
    pretModifie.nouveauStatut
  );

  return res.status(200).json({
    success: true,
    message: "La vérification du dossier a commencé.",
    pret: {
      id: pretModifie.id,
      statut: "en_verification",
    },
  });
}
