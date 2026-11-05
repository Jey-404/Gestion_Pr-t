import { pool } from "../config/db.js";

export async function listerPretsAdmin(req, res) {
  try {
    const [statsRows] = await pool.execute(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN statut IN ('soumis', 'en_verification', 'en_decision') THEN 1 ELSE 0 END), 0) AS a_traiter,
        COALESCE(SUM(CASE WHEN statut IN ('decaisse', 'en_remboursement', 'rembourse') THEN 1 ELSE 0 END), 0) AS en_suivi
      FROM association_prets.prets`);
    const [rows] = await pool.execute(`
      SELECT p.id, p.montant, p.motif, p.description, p.statut, p.date_demande,
        p.date_modification, u.nom, u.prenom, u.email, u.telephone,
        EXISTS(SELECT 1 FROM association_prets.justificatifs j WHERE j.pret_id = p.id) AS justificatif_present,
        EXISTS(SELECT 1 FROM association_prets.decaissements d WHERE d.pret_id = p.id) AS decaissement_present
      FROM association_prets.prets p
      JOIN association_prets.utilisateurs u ON u.id = p.utilisateur_id
      ORDER BY p.date_demande DESC, p.id DESC LIMIT 500`);
    const stats = statsRows[0];
    res.json({ success: true, limite: 500,
      statistiques: { total: Number(stats.total), aTraiter: Number(stats.a_traiter), enSuivi: Number(stats.en_suivi) },
      prets: rows.map(p => ({ id: String(p.id), montant: Number(p.montant), motif: p.motif,
        description: p.description, statut: p.statut, dateDemande: p.date_demande,
        dateModification: p.date_modification, justificatifPresent: !!p.justificatif_present,
        decaissementPresent: !!p.decaissement_present,
        membre: { nom: p.nom, prenom: p.prenom, email: p.email, telephone: p.telephone } })) });
  } catch (error) {
    console.error('[ADMIN PRETS]', error.code || error.message);
    res.status(500).json({ success: false, message: 'Impossible de charger les prêts.' });
  }
}
