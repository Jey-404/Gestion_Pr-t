
import { pool } from "../config/db.js";

const MODES_AUTORISES = new Set([
  "especes",
  "virement",
  "mobile_money",
]);

function convertirMontant(valeur) {
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : NaN;
}

async function chargerEcheances(connexion, pretId) {
  const [lignes] = await connexion.execute(
    `SELECT
       e.id,
       e.numero_echeance,
       e.montant_prevu,
       e.date_echeance,
       COALESCE((
         SELECT SUM(r.montant_verse)
         FROM association_prets.remboursements AS r
         WHERE r.echeance_id = e.id
       ), 0) AS montant_verse
     FROM association_prets.echeances AS e
     WHERE e.pret_id = ?
     ORDER BY e.numero_echeance ASC, e.id ASC`,
    [pretId]
  );

  return lignes.map((ligne) => {
    const montantPrevu = convertirMontant(
      ligne.montant_prevu
    );
    const montantVerse = convertirMontant(
      ligne.montant_verse
    );

    return {
      id: String(ligne.id),
      numero: Number(ligne.numero_echeance),
      dateEcheance: ligne.date_echeance,
      montantPrevu,
      montantVerse,
      restant: Math.max(
        0,
        Math.round((montantPrevu - montantVerse) * 100) / 100
      ),
    };
  });
}

function construireSituation(pret, echeances) {
  const montantTotal = echeances.reduce(
    (somme, e) => somme + e.montantPrevu,
    0
  );

  const montantRembourse = echeances.reduce(
    (somme, e) => somme + e.montantVerse,
    0
  );

  const montantRestant = echeances.reduce(
    (somme, e) => somme + e.restant,
    0
  );

  const prochaineEcheance =
    echeances.find((e) => e.restant > 0) || null;

  return {
    pretId: String(pret.id),
    statut: pret.statut,
    montantPret: Number(pret.montant),
    montantTotal,
    montantRembourse,
    montantRestant,
    prochaineEcheance,
    nombreEcheances: echeances.length,
    echeances,
  };
}

// ==========================================
// GET /api/comptable/prets/:id/situation
// ==========================================

export async function situationRemboursement(req, res) {
  const pretId = Number(req.params.id);

  if (!Number.isSafeInteger(pretId) || pretId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Identifiant de prêt invalide.",
    });
  }

  try {
    const [prets] = await pool.execute(
      `SELECT p.id, p.montant, p.statut
       FROM association_prets.prets AS p
       WHERE p.id = ?
         AND p.statut IN ('decaisse', 'en_remboursement')
         AND EXISTS (
           SELECT 1
           FROM association_prets.decaissements AS d
           WHERE d.pret_id = p.id
         )
       LIMIT 1`,
      [pretId]
    );

    if (prets.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Ce prêt n'est pas disponible pour remboursement.",
      });
    }

    const echeances = await chargerEcheances(
      pool,
      pretId
    );

    const situation = construireSituation(
      prets[0],
      echeances
    );

    return res.json({
      success: true,
      situation,
    });
  } catch (erreur) {
    console.error("[SITUATION REMBOURSEMENT]", {
      code: erreur.code,
      message: erreur.message,
    });

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger la situation du prêt.",
    });
  }
}

// ==========================================
// POST /api/comptable/prets/:id/rembourser
// ==========================================

export async function enregistrerRemboursement(req, res) {
  const pretId = Number(req.params.id);
  const comptableId = req.comptableId;

  const {
    montant,
    modePaiement,
    reference,
    observation,
  } = req.body || {};

  const montantNumerique = Number(montant);

  const referencePropre =
    typeof reference === "string"
      ? reference.trim()
      : "";

  const observationPropre =
    typeof observation === "string"
      ? observation.trim()
      : "";

  if (!Number.isSafeInteger(pretId) || pretId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Identifiant du prêt invalide.",
    });
  }

  if (!comptableId) {
    return res.status(401).json({
      success: false,
      message: "Session Comptable invalide.",
    });
  }

  // Versements en FCFA entiers.
  if (
    !Number.isSafeInteger(montantNumerique) ||
    montantNumerique <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Le remboursement doit être un montant entier positif.",
    });
  }

  if (!MODES_AUTORISES.has(modePaiement)) {
    return res.status(400).json({
      success: false,
      message: "Mode de paiement non autorisé.",
    });
  }

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
      message: "Observation trop longue.",
    });
  }

  let connexion;
  let transactionDemarree = false;

  try {
    connexion = await pool.getConnection();

    await connexion.beginTransaction();
    transactionDemarree = true;

    // Verrou commun pour sérialiser les remboursements
    // d'un même prêt.
    const [prets] = await connexion.execute(
      `SELECT id, montant, statut
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

    if (
      !["decaisse", "en_remboursement"].includes(
        pret.statut
      )
    ) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(409).json({
        success: false,
        message:
          "Le prêt n'est pas disponible pour remboursement.",
      });
    }

    const [decaissements] = await connexion.execute(
      `SELECT id
       FROM association_prets.decaissements
       WHERE pret_id = ?
       LIMIT 1`,
      [pretId]
    );

    if (decaissements.length === 0) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(409).json({
        success: false,
        message:
          "Aucun décaissement enregistré pour ce prêt.",
      });
    }

    const echeances = await chargerEcheances(
      connexion,
      pretId
    );

    if (echeances.length === 0) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(409).json({
        success: false,
        message:
          "Aucun échéancier n'a été créé pour ce prêt.",
      });
    }

    const situation = construireSituation(
      pret,
      echeances
    );

    const echeance = situation.prochaineEcheance;

    if (!echeance) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(409).json({
        success: false,
        message:
          "Toutes les échéances sont déjà remboursées.",
      });
    }

    if (montantNumerique > echeance.restant) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(422).json({
        success: false,
        message:
          "Le montant dépasse le solde restant de la prochaine échéance.",
      });
    }

    const [referenceExistante] =
      await connexion.execute(
        `SELECT id
         FROM association_prets.remboursements
         WHERE reference_operation = ?
         LIMIT 1`,
        [referencePropre]
      );

    if (referenceExistante.length > 0) {
      await connexion.rollback();
      transactionDemarree = false;

      return res.status(409).json({
        success: false,
        message:
          "Cette référence de remboursement existe déjà.",
      });
    }

    const [resultat] = await connexion.execute(
      `INSERT INTO association_prets.remboursements
       (
         echeance_id,
         comptable_id,
         montant_verse,
         mode_paiement,
         reference_operation,
         observation,
         date_paiement
       )
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        echeance.id,
        comptableId,
        montantNumerique,
        modePaiement,
        referencePropre,
        observationPropre || null,
      ]
    );

    const nouveauRestant =
      Math.round(
        (situation.montantRestant - montantNumerique) *
          100
      ) / 100;

    const nouveauStatut =
      nouveauRestant <= 0
        ? "rembourse"
        : "en_remboursement";

    await connexion.execute(
      `UPDATE association_prets.prets
       SET statut = ?,
           date_modification = NOW()
       WHERE id = ?`,
      [nouveauStatut, pretId]
    );

    await connexion.commit();
    transactionDemarree = false;

    return res.status(201).json({
      success: true,
      message:
        "Le remboursement a été enregistré avec succès.",
      remboursement: {
        id: String(resultat.insertId),
        pretId: String(pretId),
        echeanceId: echeance.id,
        montant: montantNumerique,
        reference: referencePropre,
        montantRestant: nouveauRestant,
        statutPret: nouveauStatut,
      },
    });
  } catch (erreur) {
    if (transactionDemarree && connexion) {
      try {
        await connexion.rollback();
      } catch (e) {
        console.error(
          "[ROLLBACK REMBOURSEMENT]",
          e.message
        );
      }
    }

    console.error("[REMBOURSEMENT COMPTABLE]", {
      code: erreur.code,
      message: erreur.message,
    });

    if (erreur.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Cette référence de paiement a déjà été utilisée.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Impossible d'enregistrer le remboursement.",
    });
  } finally {
    if (connexion) {
      connexion.release();
    }
  }
}
