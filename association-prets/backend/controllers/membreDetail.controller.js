
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "../config/db.js";

const dossierBackend = fileURLToPath(
  new URL("../", import.meta.url)
);

const dossierPrive = path.join(
  dossierBackend,
  "private_uploads"
);

function identifiantValide(valeur) {
  return typeof valeur === "string" &&
    /^[1-9]\d*$/.test(valeur) &&
    Number.isSafeInteger(Number(valeur));
}

function premiereValeur(ligne, noms) {
  for (const nom of noms) {
    if (
      Object.hasOwn(ligne, nom) &&
      ligne[nom] !== null &&
      ligne[nom] !== undefined
    ) {
      return ligne[nom];
    }
  }

  return null;
}

function montantOuNull(valeur) {
  if (valeur === null || valeur === undefined) {
    return null;
  }

  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : null;
}

async function verifierProprietaire(req, res) {
  if (!identifiantValide(req.params.id)) {
    res.status(400).json({
      success: false,
      message: "Identifiant de prêt invalide.",
    });
    return null;
  }

  const [lignes] = await pool.execute(
    `SELECT
       id,
       utilisateur_id,
       montant,
       motif,
       description,
       nombre_echeances_souhaitees,
       DATE_FORMAT(
         date_premiere_echeance_souhaitee,
         '%Y-%m-%d'
       ) AS date_premiere_echeance_souhaitee,
       statut,
       date_demande
     FROM association_prets.prets
     WHERE id = ? AND utilisateur_id = ?
     LIMIT 1`,
    [req.params.id, req.membreId]
  );

  if (!lignes.length) {
    res.status(404).json({
      success: false,
      message: "Prêt introuvable.",
    });
    return null;
  }

  return lignes[0];
}

// -------------------------------------------
// GET /api/membre/prets/:id
// -------------------------------------------

export async function detailPretMembre(req, res) {
  try {
    const pret = await verifierProprietaire(req, res);
    if (!pret) return;

    const [justificatifs] = await pool.execute(
      `SELECT
         id,
         nom_original,
         type_mime,
         taille_octets,
         date_depot
       FROM association_prets.justificatifs
       WHERE pret_id = ?
       ORDER BY id DESC`,
      [pret.id]
    );

    return res.json({
      success: true,
      pret: {
        id: String(pret.id),
        montant: Number(pret.montant),
        motif: pret.motif,
        description: pret.description,
        nombreEcheances: Number(pret.nombre_echeances_souhaitees),
        datePremiereEcheance: pret.date_premiere_echeance_souhaitee,
        statut: pret.statut,
        dateDemande: pret.date_demande,
        justificatifs: justificatifs.map((fichier) => ({
          id: String(fichier.id),
          nom: fichier.nom_original,
          type: fichier.type_mime,
          taille: Number(fichier.taille_octets),
          dateDepot: fichier.date_depot,
          url:
            `/api/membre/prets/${pret.id}` +
            `/justificatifs/${fichier.id}`,
        })),
      },
    });
  } catch (erreur) {
    console.error("[DETAIL PRET]", erreur.code || erreur.message);

    return res.status(500).json({
      success: false,
      message: "Impossible de consulter ce dossier.",
    });
  }
}

// -------------------------------------------
// GET /api/membre/prets/:id/finances
// -------------------------------------------

export async function financesPretMembre(req, res) {
  try {
    const pret = await verifierProprietaire(req, res);
    if (!pret) return;

    // Ces tables appartiennent déjà au modèle MySQL.
    // L'accès reste filtré par le prêt dont on a
    // préalablement vérifié le propriétaire.
    const [decaissements] = await pool.execute(
      `SELECT * FROM association_prets.decaissements
       WHERE pret_id = ?
       ORDER BY id DESC`,
      [pret.id]
    );

    const [remboursements] = await pool.execute(
      `SELECT * FROM association_prets.remboursements
       WHERE pret_id = ?
       ORDER BY id DESC`,
      [pret.id]
    );

    const [echeances] = await pool.execute(
      `SELECT * FROM association_prets.echeances
       WHERE pret_id = ?
       ORDER BY id ASC`,
      [pret.id]
    );

    const decaissementsNormalises = decaissements.map((ligne) => ({
      id: String(ligne.id),
      montant: montantOuNull(
        premiereValeur(ligne, [
          "montant_verse",
          "montant_decaisse",
          "montant",
        ])
      ),
      date: premiereValeur(ligne, [
        "date_decaissement",
        "date_versement",
        "date_operation",
      ]),
      mode: premiereValeur(ligne, [
        "mode_paiement",
        "mode_versement",
      ]),
      reference: premiereValeur(ligne, [
        "reference_transaction",
        "reference",
      ]),
    }));

    const remboursementsNormalises = remboursements.map((ligne) => ({
      id: String(ligne.id),
      montant: montantOuNull(
        premiereValeur(ligne, [
          "montant_recu",
          "montant_rembourse",
          "montant_paye",
          "montant",
        ])
      ),
      date: premiereValeur(ligne, [
        "date_remboursement",
        "date_paiement",
        "date_operation",
      ]),
      mode: premiereValeur(ligne, [
        "mode_paiement",
        "mode_remboursement",
      ]),
      reference: premiereValeur(ligne, [
        "reference_transaction",
        "reference",
      ]),
    }));

    const echeancesNormalisees = echeances.map((ligne) => ({
      id: String(ligne.id),
      montant: montantOuNull(
        premiereValeur(ligne, [
          "montant_du",
          "montant_attendu",
          "montant_echeance",
          "montant",
        ])
      ),
      date: premiereValeur(ligne, [
        "date_echeance",
        "date_prevue",
      ]),
      statut: premiereValeur(ligne, ["statut"]),
    }));

    const montantTotal = (lignes) => {
      if (lignes.some((ligne) => ligne.montant === null)) {
        return null;
      }

      return lignes.reduce(
        (total, ligne) => total + ligne.montant,
        0
      );
    };

    const totalDecaisse = montantTotal(decaissementsNormalises);
    const totalRembourse = montantTotal(remboursementsNormalises);

    // Il s'agit d'un solde simple, hors intérêts,
    // frais ou ajustements éventuels.
    const solde = (
      totalDecaisse !== null &&
      totalRembourse !== null
    )
      ? Math.max(0, totalDecaisse - totalRembourse)
      : null;

    return res.json({
      success: true,
      finances: {
        totalDecaisse,
        totalRembourse,
        solde,
        decaissements: decaissementsNormalises,
        remboursements: remboursementsNormalises,
        echeances: echeancesNormalisees,
      },
    });
  } catch (erreur) {
    console.error("[FINANCES PRET]", erreur.code || erreur.message);

    return res.status(500).json({
      success: false,
      message: "Impossible de charger le suivi financier.",
    });
  }
}

// -------------------------------------------
// GET /api/membre/prets/:id/justificatifs/:justificatifId
// -------------------------------------------

export async function voirJustificatifMembre(req, res) {
  try {
    const pret = await verifierProprietaire(req, res);
    if (!pret) return;

    if (!identifiantValide(req.params.justificatifId)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant du justificatif invalide.",
      });
    }

    const [fichiers] = await pool.execute(
      `SELECT
         id,
         nom_stockage,
         chemin_stockage,
         type_mime
       FROM association_prets.justificatifs
       WHERE id = ? AND pret_id = ?
       LIMIT 1`,
      [req.params.justificatifId, pret.id]
    );

    const fichier = fichiers[0];

    if (!fichier) {
      return res.status(404).json({
        success: false,
        message: "Justificatif introuvable.",
      });
    }

    const typesAutorises = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!typesAutorises.includes(fichier.type_mime)) {
      return res.status(415).json({
        success: false,
        message: "Type de document non pris en charge.",
      });
    }

    const nom = fichier.chemin_stockage;

    // Aucun chemin absolu ou chemin avec répertoires
    // n'est accepté depuis la base.
    if (
      !nom ||
      nom !== path.basename(nom) ||
      nom.includes("\\") ||
      nom !== fichier.nom_stockage
    ) {
      return res.status(500).json({
        success: false,
        message: "Chemin du justificatif invalide.",
      });
    }

    const chemin = path.join(dossierPrive, nom);

    const informations = await stat(chemin);

    if (!informations.isFile()) {
      return res.status(404).json({
        success: false,
        message: "Fichier introuvable.",
      });
    }

    res.setHeader("Content-Type", fichier.type_mime);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    const flux = createReadStream(chemin);

    flux.on("error", (erreur) => {
      console.error("[FICHIER PRET]", erreur.message);

      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy(erreur);
      }
    });

    flux.pipe(res);
  } catch (erreur) {
    console.error("[JUSTIFICATIF]", erreur.code || erreur.message);

    if (res.headersSent) {
      return res.end();
    }

    return res.status(
      erreur.code === "ENOENT" ? 404 : 500
    ).json({
      success: false,
      message: "Impossible d'ouvrir ce justificatif.",
    });
  }
}
