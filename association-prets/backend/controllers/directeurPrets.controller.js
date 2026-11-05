
import { pool } from "../config/db.js";

// GET /api/directeur/dossiers
// Afficher uniquement les dossiers transmis
// au Directeur par le Secrétaire.

export async function listerDossiersDirecteur(req, res) {
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
       WHERE p.statut = 'en_decision'
       ORDER BY p.date_demande ASC, p.id ASC
       LIMIT 100`
    );

    return res.status(200).json({
      success: true,
      total: lignes.length,
      dossiers: lignes.map((p) => ({
        id: String(p.id),
        utilisateurId: String(p.utilisateur_id),
        montant: Number(p.montant),
        motif: p.motif,
        description: p.description,
        nombreEcheances: Number(p.nombre_echeances_souhaitees),
        datePremiereEcheance: p.date_premiere_echeance_souhaitee,
        statut: p.statut,
        dateDemande: p.date_demande,
        justificatifPresent: Boolean(
          p.justificatif_present
        ),
        membre: {
          nom: p.nom,
          prenom: p.prenom,
          email: p.email,
          telephone: p.telephone,
        },
      })),
    });
  } catch (erreur) {
    console.error(
      "[DIRECTEUR - DOSSIERS]",
      erreur.code || erreur.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les dossiers du Directeur.",
    });
  }
}

export async function tableauBordDirecteur(req, res) {
  try {
    const [lignes] = await pool.execute(
      `SELECT
         p.id,
         p.montant,
         p.motif,
         p.nombre_echeances_souhaitees,
         DATE_FORMAT(
           p.date_premiere_echeance_souhaitee,
           '%Y-%m-%d'
         ) AS date_premiere_echeance_souhaitee,
         p.statut,
         p.date_demande,
         u.nom,
         u.prenom
       FROM association_prets.prets AS p
       INNER JOIN association_prets.utilisateurs AS u
         ON u.id = p.utilisateur_id
       ORDER BY p.date_demande DESC, p.id DESC
       LIMIT 5`
    );

    return res.status(200).json({
      success: true,
      dernieresDemandes: lignes.map((pret) => ({
        id: String(pret.id),
        montant: Number(pret.montant),
        motif: pret.motif,
        nombreEcheances: Number(pret.nombre_echeances_souhaitees),
        datePremiereEcheance: pret.date_premiere_echeance_souhaitee,
        statut: pret.statut,
        dateDemande: pret.date_demande,
        membre: {
          nom: pret.nom,
          prenom: pret.prenom,
        },
      })),
    });
  } catch (erreur) {
    console.error(
      "[DIRECTEUR - TABLEAU DE BORD]",
      erreur.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger le tableau de bord du Directeur.",
    });
  }
}
