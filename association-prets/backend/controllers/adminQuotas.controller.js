import { pool } from "../config/db.js";

const moisOk = (mois) =>
  typeof mois === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mois);

const montantOk = (montant) =>
  Number.isSafeInteger(montant) &&
  montant >= 0 &&
  montant <= 999999999999999;

const dateDebut = (mois) => `${mois}-01`;

const moisSuivant = (mois) => {
  const [annee, moisNumero] = mois.split("-").map(Number);
  return new Date(Date.UTC(annee, moisNumero, 1))
    .toISOString()
    .slice(0, 10);
};

const moisPourReponse = (mois) =>
  mois instanceof Date
    ? mois.toISOString().slice(0, 7)
    : String(mois).slice(0, 7);

const statutsFinances = [
  "approuve",
  "decaisse",
  "en_remboursement",
  "rembourse",
];

async function obtenirConsommation(execute, mois) {
  const [rows] = await execute(
    `SELECT
       COALESCE(SUM(
         CASE WHEN statut IN (?, ?, ?, ?) THEN montant ELSE 0 END
       ), 0) AS montant_utilise,
       COUNT(*) AS nombre_demandes
     FROM association_prets.prets
     WHERE date_demande >= ? AND date_demande < ?`,
    [
      ...statutsFinances,
      dateDebut(mois),
      moisSuivant(mois),
    ]
  );

  return rows[0];
}

export async function listerQuotasAdmin(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
         q.mois,
         q.montant_total,
         q.actif,
         COALESCE((
           SELECT SUM(p.montant)
           FROM association_prets.prets AS p
           WHERE p.date_demande >= q.mois
             AND p.date_demande < DATE_ADD(q.mois, INTERVAL 1 MONTH)
             AND p.statut IN (?, ?, ?, ?)
         ), 0) AS montant_utilise,
         (
           SELECT COUNT(*)
           FROM association_prets.prets AS p
           WHERE p.date_demande >= q.mois
             AND p.date_demande < DATE_ADD(q.mois, INTERVAL 1 MONTH)
         ) AS nombre_demandes
       FROM association_prets.quotas_mensuels AS q
       ORDER BY q.mois DESC
       LIMIT 120`,
      statutsFinances
    );

    return res.json({
      success: true,
      quotas: rows.map((quota) => ({
        mois: moisPourReponse(quota.mois),
        montantTotal: Number(quota.montant_total),
        montantUtilise: Number(quota.montant_utilise),
        nombreDemandes: Number(quota.nombre_demandes),
        actif: Boolean(quota.actif),
      })),
    });
  } catch (error) {
    console.error(
      "[ADMIN QUOTAS LISTE]",
      error.code || error.message,
      error.sqlMessage || ""
    );
    return res.status(500).json({
      success: false,
      message: "Impossible de charger les budgets mensuels.",
    });
  }
}

export async function creerQuotaAdmin(req, res) {
  const { mois, montantTotal, actif } = req.body || {};
  if (
    !moisOk(mois) ||
    !montantOk(montantTotal) ||
    typeof actif !== "boolean"
  ) {
    return res.status(400).json({
      success: false,
      message: "Mois, budget ou statut invalide.",
    });
  }

  let connexion;
  try {
    connexion = await pool.getConnection();
    await connexion.beginTransaction();

    const [existing] = await connexion.execute(
      `SELECT mois
       FROM association_prets.quotas_mensuels
       WHERE mois = ?
       FOR UPDATE`,
      [dateDebut(mois)]
    );
    if (existing.length) {
      await connexion.rollback();
      return res.status(409).json({
        success: false,
        message: "Un budget existe déjà pour ce mois.",
      });
    }

    const consommation = await obtenirConsommation(
      connexion.execute.bind(connexion),
      mois
    );
    if (montantTotal < Number(consommation.montant_utilise)) {
      await connexion.rollback();
      return res.status(422).json({
        success: false,
        message:
          "Le budget ne peut pas être inférieur aux prêts déjà approuvés pour ce mois.",
      });
    }

    await connexion.execute(
      `INSERT INTO association_prets.quotas_mensuels
         (mois, montant_total, actif)
       VALUES (?, ?, ?)`,
      [dateDebut(mois), montantTotal, actif ? 1 : 0]
    );
    await connexion.commit();
    return res.status(201).json({
      success: true,
      message: "Budget mensuel créé.",
    });
  } catch (error) {
    if (connexion) {
      try {
        await connexion.rollback();
      } catch (rollbackError) {
        console.error(
          "[ADMIN BUDGET CREATION - ROLLBACK]",
          rollbackError.code || rollbackError.message
        );
      }
    }
    console.error(
      "[ADMIN BUDGET CREATION]",
      error.code || error.message,
      error.sqlMessage || ""
    );
    return res
      .status(error.code === "ER_DUP_ENTRY" ? 409 : 500)
      .json({
        success: false,
        message:
          error.code === "ER_DUP_ENTRY"
            ? "Un budget existe déjà pour ce mois."
            : "Impossible de créer le budget mensuel.",
      });
  } finally {
    connexion?.release();
  }
}

export async function modifierQuotaAdmin(req, res) {
  const { mois } = req.params;
  const { montantTotal, actif } = req.body || {};
  if (
    !moisOk(mois) ||
    !montantOk(montantTotal) ||
    typeof actif !== "boolean"
  ) {
    return res.status(400).json({
      success: false,
      message: "Mois, budget ou statut invalide.",
    });
  }

  let connexion;
  try {
    connexion = await pool.getConnection();
    await connexion.beginTransaction();

    const [existing] = await connexion.execute(
      `SELECT mois
       FROM association_prets.quotas_mensuels
       WHERE mois = ?
       FOR UPDATE`,
      [dateDebut(mois)]
    );
    if (!existing.length) {
      await connexion.rollback();
      return res.status(404).json({
        success: false,
        message: "Budget mensuel introuvable.",
      });
    }

    const consommation = await obtenirConsommation(
      connexion.execute.bind(connexion),
      mois
    );
    if (montantTotal < Number(consommation.montant_utilise)) {
      await connexion.rollback();
      return res.status(422).json({
        success: false,
        message:
          "Le budget ne peut pas être inférieur aux prêts déjà approuvés pour ce mois.",
      });
    }

    await connexion.execute(
      `UPDATE association_prets.quotas_mensuels
       SET montant_total = ?, actif = ?
       WHERE mois = ?`,
      [montantTotal, actif ? 1 : 0, dateDebut(mois)]
    );
    await connexion.commit();
    return res.json({
      success: true,
      message: "Budget mensuel mis à jour.",
    });
  } catch (error) {
    if (connexion) {
      try {
        await connexion.rollback();
      } catch (rollbackError) {
        console.error(
          "[ADMIN BUDGET MODIFICATION - ROLLBACK]",
          rollbackError.code || rollbackError.message
        );
      }
    }
    console.error(
      "[ADMIN BUDGET MODIFICATION]",
      error.code || error.message,
      error.sqlMessage || ""
    );
    return res.status(500).json({
      success: false,
      message: "Impossible de modifier le budget mensuel.",
    });
  } finally {
    connexion?.release();
  }
}
