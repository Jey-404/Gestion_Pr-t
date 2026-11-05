
import { pool } from "../config/db.js";

// GET /api/membre/quota

export async function consulterQuotaMembre(req, res) {
  try {
    // ======================================
    // 1. RECUPERER LE BUDGET DU MOIS
    // ======================================

    const [quotas] = await pool.execute(
      `SELECT
         id,
         mois,
         montant_total,
         actif
       FROM association_prets.quotas_mensuels
       WHERE mois = DATE_FORMAT(CURDATE(), '%Y-%m-01')
       LIMIT 1`
    );

    const quota = quotas[0];

    // ======================================
    // 2. VERIFIER SI LE QUOTA EST ACTIF
    // ======================================

    if (!quota || Number(quota.actif) !== 1) {
      return res.status(200).json({
        success: true,
        quota: {
          actif: false,
          mois: null,
          limite: 0,
          utilise: 0,
          restant: 0,
        },
      });
    }

    // ======================================
    // 3. CALCULER LES MONTANTS UTILISES
    // ======================================
    // On compte uniquement les prêts
    // approuvés et leurs statuts suivants.
    //
    // Les demandes soumises, en vérification,
    // en décision ou refusées ne consomment
    // aucun montant du budget.

    const [resultats] = await pool.execute(
      `SELECT
         COALESCE(SUM(montant), 0) AS total_utilise
       FROM association_prets.prets
       WHERE date_demande >=
         DATE_FORMAT(CURDATE(), '%Y-%m-01')
       AND date_demande <
         DATE_FORMAT(
           CURDATE() + INTERVAL 1 MONTH,
           '%Y-%m-01'
         )
       AND statut IN (
         'approuve',
         'decaisse',
         'en_remboursement',
         'rembourse'
       )`
    );

    // ======================================
    // 4. CALCULER LE BUDGET RESTANT
    // ======================================

    const limite = Number(quota.montant_total);

    const utilise = Number(
      resultats[0]?.total_utilise ?? 0
    );

    if (
      !Number.isFinite(limite) ||
      limite < 0 ||
      !Number.isFinite(utilise) ||
      utilise < 0
    ) {
      throw new Error(
        "Données financières du quota invalides."
      );
    }

    const restant = Math.max(
      0,
      limite - utilise
    );

    // ======================================
    // 5. RETOURNER LE RESULTAT
    // ======================================

    return res.status(200).json({
      success: true,
      quota: {
        actif: true,
        mois: quota.mois,
        limite,
        utilise,
        restant,
      },
    });

  } catch (erreur) {
    console.error("[QUOTA MEMBRE]", {
      code: erreur.code,
      message: erreur.sqlMessage || erreur.message,
    });

    return res.status(500).json({
      success: false,
      message:
        "Impossible de récupérer le budget mensuel.",
    });
  }
}
