
import { pool } from "../config/db.js";

// ==========================================
// GET /api/comptable/prets-approuves
// Prêts approuvés par le Directeur
// ==========================================

export async function listerPretsApprouves(req, res) {
  try {
    const [lignes] = await pool.execute(
      `SELECT
         p.id,
         p.utilisateur_id,
         p.montant,
         p.motif,
         p.description,
         p.nombre_echeances_souhaitees,
         DATE_FORMAT(
           p.date_premiere_echeance_souhaitee,
           '%Y-%m-%d'
         ) AS date_premiere_echeance_souhaitee,
         p.statut,
         p.date_demande,
         p.date_modification,
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
       WHERE p.statut = 'approuve'
       ORDER BY p.date_modification ASC, p.id ASC
       LIMIT 100`
    );

    return res.status(200).json({
      success: true,
      total: lignes.length,
      prets: lignes.map((pret) => ({
        id: String(pret.id),
        utilisateurId: String(pret.utilisateur_id),
        montant: Number(pret.montant),
        motif: pret.motif,
        description: pret.description,
        nombreEcheances: Number(pret.nombre_echeances_souhaitees),
        datePremiereEcheance: pret.date_premiere_echeance_souhaitee,
        statut: pret.statut,
        dateDemande: pret.date_demande,
        dateModification: pret.date_modification,
        justificatifPresent:
          Boolean(pret.justificatif_present),
        membre: {
          nom: pret.nom,
          prenom: pret.prenom,
          email: pret.email,
          telephone: pret.telephone,
        },
      })),
    });
  } catch (erreur) {
    console.error(
      "[COMPTABLE - PRETS APPROUVES]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les prêts approuvés.",
    });
  }
}

// Tableau de bord comptable: statistiques globales et cinq derniers prêts.
export async function tableauBordComptable(req, res) {
  try {
    const [agregats] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN statut = 'approuve' THEN 1 ELSE 0 END) AS aDecaisser,
         SUM(CASE WHEN statut IN ('decaisse','en_remboursement','rembourse') THEN 1 ELSE 0 END) AS enSuivi,
         COALESCE(SUM(CASE WHEN statut = 'approuve' THEN montant ELSE 0 END), 0) AS montantEnAttente
       FROM association_prets.prets`
    );
    const [lignes] = await pool.execute(
      `SELECT p.id, p.montant, p.motif,
              p.nombre_echeances_souhaitees,
              DATE_FORMAT(
                p.date_premiere_echeance_souhaitee,
                '%Y-%m-%d'
              ) AS date_premiere_echeance_souhaitee,
              p.statut, p.date_demande,
              u.nom, u.prenom
       FROM association_prets.prets p
       INNER JOIN association_prets.utilisateurs u ON u.id = p.utilisateur_id
       ORDER BY p.date_demande DESC, p.id DESC
       LIMIT 5`
    );
    const stats = agregats[0] || {};
    return res.status(200).json({
      success: true,
      statistiques: {
        total: Number(stats.total || 0),
        aDecaisser: Number(stats.aDecaisser || 0),
        enSuivi: Number(stats.enSuivi || 0),
        montantEnAttente: Number(stats.montantEnAttente || 0),
      },
      dernieresDemandes: lignes.map(p => ({
        id: String(p.id), montant: Number(p.montant), motif: p.motif,
        nombreEcheances: Number(p.nombre_echeances_souhaitees),
        datePremiereEcheance: p.date_premiere_echeance_souhaitee,
        statut: p.statut, dateDemande: p.date_demande,
        membre: { nom: p.nom, prenom: p.prenom },
      })),
    });
  } catch (erreur) {
    console.error('[COMPTABLE - TABLEAU DE BORD]', erreur.code || erreur.message);
    return res.status(500).json({ success: false, message: 'Impossible de charger le tableau de bord du Comptable.' });
  }
}

// GET /api/comptable/prets-remboursement
// Exclut par construction les demandes refusées et non décaissées.
export async function listerPretsRemboursement(req, res) {
  try {
    const [lignes] = await pool.execute(
      `SELECT p.id, p.utilisateur_id, p.montant, p.motif,
              p.description, p.statut, p.date_demande,
              u.nom, u.prenom, u.email, u.telephone
       FROM association_prets.prets AS p
       INNER JOIN association_prets.utilisateurs AS u
         ON u.id = p.utilisateur_id
       WHERE p.statut IN ('decaisse', 'en_remboursement', 'rembourse')
       ORDER BY p.date_demande DESC, p.id DESC
       LIMIT 100`
    );

    return res.status(200).json({
      success: true,
      total: lignes.length,
      prets: lignes.map((pret) => ({
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
      })),
    });
  } catch (erreur) {
    console.error("[COMPTABLE - REMBOURSEMENTS]", erreur.code || erreur.message);
    return res.status(500).json({
      success: false,
      message: "Impossible de charger les prêts à rembourser.",
    });
  }
}

export async function listerPretsPourDecaissement(req, res) {
  try {
    const [lignes] = await pool.execute(
      `SELECT
         p.id,
         p.utilisateur_id,
         p.montant,
         p.motif,
         p.description,
         p.nombre_echeances_souhaitees,
         DATE_FORMAT(
           p.date_premiere_echeance_souhaitee,
           '%Y-%m-%d'
         ) AS date_premiere_echeance_souhaitee,
         p.statut,
         p.date_demande,
         p.date_modification,
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
       WHERE p.statut IN ('approuve', 'rejete', 'refuse')
       ORDER BY p.date_modification DESC, p.id DESC
       LIMIT 100`
    );

    return res.status(200).json({
      success: true,
      total: lignes.length,
      prets: lignes.map((pret) => ({
        id: String(pret.id),
        utilisateurId: String(pret.utilisateur_id),
        montant: Number(pret.montant),
        motif: pret.motif,
        description: pret.description,
        nombreEcheances: Number(pret.nombre_echeances_souhaitees),
        datePremiereEcheance: pret.date_premiere_echeance_souhaitee,
        statut: pret.statut,
        dateDemande: pret.date_demande,
        dateModification: pret.date_modification,
        justificatifPresent: Boolean(
          pret.justificatif_present
        ),
        membre: {
          nom: pret.nom,
          prenom: pret.prenom,
          email: pret.email,
          telephone: pret.telephone,
        },
      })),
    });
  } catch (erreur) {
    console.error(
      "[COMPTABLE - LISTE DECAISSEMENT]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les dossiers de décaissement.",
    });
  }
}

export async function listerPretsARembourser(req, res) {
  try {
    const [lignes] = await pool.execute(
      `SELECT
         p.id,
         p.utilisateur_id,
         p.montant,
         p.motif,
         p.description,
         p.nombre_echeances_souhaitees,
         p.date_premiere_echeance_souhaitee,
         p.statut,
         p.date_demande,
         u.nom,
         u.prenom,
         u.email,
         u.telephone
       FROM association_prets.prets AS p
       INNER JOIN association_prets.utilisateurs AS u
         ON u.id = p.utilisateur_id
       WHERE p.statut IN ('decaisse', 'en_remboursement')
         AND EXISTS (
           SELECT 1
           FROM association_prets.decaissements AS d
           WHERE d.pret_id = p.id
         )
       ORDER BY p.id DESC
       LIMIT 100`
    );

    return res.status(200).json({
      success: true,
      total: lignes.length,
      prets: lignes.map((pret) => ({
        id: String(pret.id),
        utilisateurId: String(pret.utilisateur_id),
        montant: Number(pret.montant),
        motif: pret.motif,
        description: pret.description,
        nombreEcheances: Number(pret.nombre_echeances_souhaitees),
        datePremiereEcheance: pret.date_premiere_echeance_souhaitee,
        statut: pret.statut,
        dateDemande: pret.date_demande,
        membre: {
          nom: pret.nom,
          prenom: pret.prenom,
          email: pret.email,
          telephone: pret.telephone,
        },
      })),
    });
  } catch (erreur) {
    console.error(
      "[COMPTABLE - REMBOURSEMENTS]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de récupérer les prêts à rembourser.",
    });
  }
}
