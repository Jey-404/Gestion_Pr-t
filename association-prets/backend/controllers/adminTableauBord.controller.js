import { pool } from "../config/db.js";

export async function tableauBordAdmin(req, res) {
  try {
    const [[users], [loans], [recent]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN role = 'membre' THEN 1 ELSE 0 END), 0) AS membres,
        COALESCE(SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END), 0) AS actifs
        FROM utilisateurs`),
      pool.execute(`SELECT COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN statut IN ('soumis', 'en_verification', 'en_decision') THEN 1 ELSE 0 END), 0) AS enAttente,
        COALESCE(SUM(CASE WHEN statut = 'approuve' THEN 1 ELSE 0 END), 0) AS approuves,
        COALESCE(SUM(CASE WHEN statut IN ('rejete', 'refuse') THEN 1 ELSE 0 END), 0) AS refuses,
        COALESCE(SUM(CASE WHEN statut IN ('decaisse', 'en_remboursement', 'rembourse') THEN 1 ELSE 0 END), 0) AS decaisses
        FROM prets`),
      pool.execute(`SELECT p.id, p.montant, p.motif, p.statut, p.date_demande,
        u.nom, u.prenom FROM prets AS p
        INNER JOIN utilisateurs AS u ON u.id = p.utilisateur_id
        ORDER BY p.date_demande DESC, p.id DESC LIMIT 5`)
    ]);
    const u = users[0] || {};
    const p = loans[0] || {};
    return res.json({ success: true,
      statistiques: {
        utilisateurs: Number(u.total || 0), membres: Number(u.membres || 0),
        actifs: Number(u.actifs || 0), prets: Number(p.total || 0),
        enAttente: Number(p.enAttente || 0), approuves: Number(p.approuves || 0),
        refuses: Number(p.refuses || 0), decaisses: Number(p.decaisses || 0),
      },
      dernieresDemandes: recent.map(r => ({
        id: String(r.id), montant: Number(r.montant), motif: r.motif,
        statut: r.statut, dateDemande: r.date_demande,
        membre: { nom: r.nom, prenom: r.prenom }
      }))
    });
  } catch (err) {
    console.error('[ADMIN DASHBOARD]', err.code || err.message);
    return res.status(500).json({ success: false, message: "Chargement du tableau de bord impossible." });
  }
}
