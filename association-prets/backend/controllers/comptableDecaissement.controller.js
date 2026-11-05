
import { pool } from "../config/db.js";
import {
  creerEcheancesPret,
  echeancierValide,
} from "../services/echeancier.service.js";

const MODES_AUTORISES = new Set([
  "especes",
  "virement",
  "mobile_money",
]);

export async function enregistrerDecaissement(req, res) {
  const pretId = Number(req.params.id);
  const comptableId = req.comptableId;

  const {
    modePaiement,
    reference,
    observation,
  } = req.body || {};

  // Vérifications des données reçues
  if (!Number.isSafeInteger(pretId) || pretId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Identifiant du prêt invalide.",
    });
  }

  if (!comptableId) {
    return res.status(401).json({
      success: false,
      message: "Compte Comptable non authentifié.",
    });
  }

  if (!MODES_AUTORISES.has(modePaiement)) {
    return res.status(400).json({
      success: false,
      message: "Mode de paiement non autorisé.",
    });
  }

  const referencePropre =
    typeof reference === "string"
      ? reference.trim()
      : "";

  const observationPropre =
    typeof observation === "string"
      ? observation.trim()
      : "";

  if (
    referencePropre.length < 3 ||
    referencePropre.length > 100
  ) {
    return res.status(400).json({
      success: false,
      message:
        "La référence doit contenir entre 3 et 100 caractères.",
    });
  }

  if (observationPropre.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "L'observation est trop longue.",
    });
  }

  let connexion;
  let transactionDemarree = false;

  try {
    connexion = await pool.getConnection();

    await connexion.beginTransaction();
    transactionDemarree = true;

    // Verrouiller le prêt pour empêcher
    // deux décaissements simultanés.
    const [prets] = await connexion.execute(
      `SELECT
         id,
         montant,
         statut,
         nombre_echeances_souhaitees,
         DATE_FORMAT(
           date_premiere_echeance_souhaitee,
           '%Y-%m-%d'
         ) AS date_premiere_echeance_souhaitee
       FROM association_prets.prets
       WHERE id = ?
       FOR UPDATE`,
      [pretId]
    );

    if (prets.length === 0) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(404).json({
        success: false,
        message: "Prêt introuvable.",
      });
    }

    const pret = prets[0];

    if (pret.statut !== "approuve") {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(409).json({
        success: false,
        message:
          "Seul un prêt approuvé peut être décaissé.",
      });
    }

    // Vérifier l'absence de décaissement antérieur.
    const [decaissementsExistants] =
      await connexion.execute(
        `SELECT id
         FROM association_prets.decaissements
         WHERE pret_id = ?
         LIMIT 1`,
        [pretId]
      );

    if (decaissementsExistants.length > 0) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(409).json({
        success: false,
        message:
          "Ce prêt a déjà fait l'objet d'un décaissement.",
      });
    }

    const montant = Number(pret.montant);

    if (
      !Number.isFinite(montant) ||
      montant <= 0
    ) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(422).json({
        success: false,
        message: "Montant du prêt invalide.",
      });
    }

    const nombreEcheances = Number(
      pret.nombre_echeances_souhaitees
    );
    const datePremiereEcheance =
      pret.date_premiere_echeance_souhaitee;

    if (
      !echeancierValide({
        montant,
        nombreEcheances,
        datePremiereEcheance,
      })
    ) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(409).json({
        success: false,
        message:
          "L'échéancier choisi par le membre est absent ou invalide. Le décaissement ne peut pas être enregistré.",
      });
    }

    const [echeancesExistantes] = await connexion.execute(
      `SELECT id
       FROM association_prets.echeances
       WHERE pret_id = ?
       LIMIT 1`,
      [pretId]
    );

    if (echeancesExistantes.length > 0) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(409).json({
        success: false,
        message:
          "Un échéancier existe déjà pour ce prêt.",
      });
    }

    // Le montant provient de MySQL, jamais du navigateur.
    const [resultat] = await connexion.execute(
      `INSERT INTO association_prets.decaissements
       (
         pret_id,
         comptable_id,
         montant,
         mode_paiement,
         reference_operation,
         observation,
         date_decaissement
       )
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        pretId,
        comptableId,
        pret.montant,
        modePaiement,
        referencePropre,
        observationPropre || null,
      ]
    );

    // Modifier le statut dans la même transaction.
    const [miseAJour] = await connexion.execute(
      `UPDATE association_prets.prets
       SET statut = 'decaisse',
           date_modification = NOW()
       WHERE id = ?
         AND statut = 'approuve'`,
      [pretId]
    );

    if (miseAJour.affectedRows !== 1) {
      throw new Error(
        "Impossible de mettre à jour le statut du prêt."
      );
    }

    await creerEcheancesPret(connexion, {
      pretId,
      montant,
      nombreEcheances,
      datePremiereEcheance,
    });

    await connexion.commit();
    transactionDemarree = false;

    return res.status(201).json({
      success: true,
      message:
        "Le décaissement a été enregistré dans MySQL.",
      decaissement: {
        id: String(resultat.insertId),
        pretId: String(pretId),
        montant,
        modePaiement,
        reference: referencePropre,
        statutPret: "decaisse",
      },
    });
  } catch (erreur) {
    if (transactionDemarree && connexion) {
      try {
        await connexion.rollback();
      } catch (rollbackErreur) {
        console.error(
          "[ROLLBACK DECAISSEMENT]",
          rollbackErreur.message
        );
      }
    }

    console.error("[DECAISSEMENT COMPTABLE]", {
      code: erreur.code,
      message: erreur.message,
    });

    if (erreur.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Un décaissement existe déjà pour ce prêt.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Impossible d'enregistrer le décaissement.",
    });
  } finally {
    if (connexion) {
      connexion.release();
    }
  }
}
