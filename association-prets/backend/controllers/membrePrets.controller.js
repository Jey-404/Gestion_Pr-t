
import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "../config/db.js";
import { verifierFichier } from "../middlewares/uploadJustificatif.js";

import {
  notifierMembreSansBloquer,
} from "../services/notifications.service.js";

// ==========================================
// REPERTOIRE DES JUSTIFICATIFS PRIVES
// ==========================================

const repertoireBackend = fileURLToPath(
  new URL("../", import.meta.url)
);

const repertoirePrive = path.join(
  repertoireBackend,
  "private_uploads"
);

// ==========================================
// CREER UNE DEMANDE DE PRET
// ==========================================

export async function creerPretMembre(req, res) {
  const texteMontant = req.body?.montant;

  const montant =
    typeof texteMontant === "string" &&
    /^\d+$/.test(texteMontant.trim())
      ? Number(texteMontant.trim())
      : NaN;

  const motif =
    typeof req.body?.motif === "string"
      ? req.body.motif.trim()
      : "";

  const description =
    typeof req.body?.description === "string"
      ? req.body.description.trim()
      : "";

  const nombreEcheancesSouhaitees = Number(
    req.body?.nombreEcheances
  );
  const datePremiereEcheanceSouhaitee =
    req.body?.datePremiereEcheance;

  // ========================================
  // 1. VALIDATION DES INFORMATIONS
  // ========================================

  if (
    !Number.isSafeInteger(montant) ||
    montant <= 0 ||
    montant > 999999999999 ||
    motif.length < 3 ||
    motif.length > 150 ||
    description.length < 10 ||
    description.length > 2000 ||
    !Number.isInteger(nombreEcheancesSouhaitees) ||
    nombreEcheancesSouhaitees < 1 ||
    nombreEcheancesSouhaitees > 60 ||
    nombreEcheancesSouhaitees > montant ||
    typeof datePremiereEcheanceSouhaitee !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(datePremiereEcheanceSouhaitee) ||
    Number.isNaN(
      Date.parse(`${datePremiereEcheanceSouhaitee}T12:00:00Z`)
    ) ||
    new Date(`${datePremiereEcheanceSouhaitee}T12:00:00Z`)
      .toISOString()
      .slice(0, 10) !== datePremiereEcheanceSouhaitee
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Vérifiez le montant, le motif, la description et l'échéancier souhaité.",
    });
  }

  // ========================================
  // 2. VALIDATION DU JUSTIFICATIF
  // ========================================

  if (
    !req.file ||
    req.file.size > 5 * 1024 * 1024 ||
    !verifierFichier(req.file)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Justificatif invalide : PDF, JPG ou PNG, maximum 5 Mo.",
    });
  }

  const extensions = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
  };

  const extension = extensions[req.file.mimetype];

  if (!extension) {
    return res.status(400).json({
      success: false,
      message: "Type de fichier non autorisé.",
    });
  }

  const nomStocke = randomUUID() + extension;

  const cheminAbsolu = path.join(
    repertoirePrive,
    nomStocke
  );

  const nomOriginal = req.file.originalname
    .replace(/[\\/]/g, "_")
    .slice(0, 255);

  const empreinte = createHash("sha256")
    .update(req.file.buffer)
    .digest("hex");

  let connexion = null;
  let transactionOuverte = false;
  let fichierEcrit = false;
  let commitTente = false;
  let etape = "connexion";

  try {
    // ======================================
    // 3. OUVRIR UNE SEULE CONNEXION MYSQL
    // ======================================

    connexion = await pool.getConnection();

    await connexion.beginTransaction();
    transactionOuverte = true;

    // ======================================
    // 4. VERIFIER LE BUDGET MENSUEL
    // ======================================
    // Le budget doit être configuré et actif.
    //
    // IMPORTANT :
    // On ne retire aucun montant à la
    // soumission de la demande.
    //
    // Le Directeur vérifiera le solde
    // et engagera le montant à l'approbation.

    etape = "vérification quota mensuel";

    const [quotas] = await connexion.execute(
      `SELECT
         id,
         montant_total,
         actif
       FROM association_prets.quotas_mensuels
       WHERE mois = DATE_FORMAT(
         CURDATE(),
         '%Y-%m-01'
       )
       LIMIT 1`
    );

    const quota = quotas[0];

    if (!quota || Number(quota.actif) !== 1) {
      await connexion.rollback();
      transactionOuverte = false;

      return res.status(409).json({
        success: false,
        message:
          "Aucun budget mensuel actif pour ce mois.",
      });
    }

    const budgetMensuel = Number(
      quota.montant_total
    );

    if (
      quota.montant_total === null ||
      !Number.isFinite(budgetMensuel) ||
      budgetMensuel < 0
    ) {
      throw new Error(
        "Configuration du budget mensuel invalide."
      );
    }

    // ======================================
    // 5. ENREGISTRER LE FICHIER
    // ======================================

    etape = "écriture du justificatif";

    await mkdir(repertoirePrive, {
      recursive: true,
    });

    await writeFile(
      cheminAbsolu,
      req.file.buffer,
      {
        flag: "wx",
      }
    );

    fichierEcrit = true;

    // ======================================
    // 6. INSERER LA DEMANDE DE PRET
    // ======================================

    etape = "INSERT prets";

    const [insertionPret] =
      await connexion.execute(
        `INSERT INTO association_prets.prets
         (
           utilisateur_id,
           montant,
           motif,
           description,
           nombre_echeances_souhaitees,
           date_premiere_echeance_souhaitee,
           statut
         )
         VALUES (?, ?, ?, ?, ?, ?, 'soumis')`,
        [
          req.membreId,
          montant,
          motif,
          description,
          nombreEcheancesSouhaitees,
          datePremiereEcheanceSouhaitee,
        ]
      );

    const pretId = insertionPret.insertId;

    // ======================================
    // 7. INSERER LE JUSTIFICATIF
    // ======================================

    etape = "INSERT justificatifs";

    await connexion.execute(
      `INSERT INTO association_prets.justificatifs
       (
         pret_id,
         nom_original,
         nom_stockage,
         chemin_stockage,
         type_mime,
         taille_octets,
         empreinte_sha256
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pretId,
        nomOriginal,
        nomStocke,
        nomStocke,
        req.file.mimetype,
        req.file.size,
        empreinte,
      ]
    );

    // ======================================
    // 8. VALIDER LA TRANSACTION
    // ======================================

    etape = "COMMIT";
    commitTente = true;

    await connexion.commit();
    transactionOuverte = false;

    console.log(
      "[soumission] Prêt enregistré :",
      pretId
    );

    // ======================================
    // 9. NOTIFIER LE MEMBRE
    // ======================================
    // Une erreur de notification ne doit pas
    // annuler le prêt déjà enregistré.

    try {
      await notifierMembreSansBloquer({
        utilisateurId: req.membreId,
        pretId,
        titre: "Demande de prêt enregistrée",
        message:
          `Votre demande de prêt PR-${pretId} ` +
          "a été enregistrée avec succès. " +
          "Elle est en attente de traitement.",
      });
    } catch (erreurNotification) {
      console.error(
        "[soumission] Notification :",
        erreurNotification.message
      );
    }

    // ======================================
    // 10. REPONSE AU FRONTEND
    // ======================================

    return res.status(201).json({
      success: true,

      message:
        "Demande de prêt enregistrée avec succès.",

      pret: {
        id: String(pretId),
        montant,
        motif,
        description,
        nombreEcheances: nombreEcheancesSouhaitees,
        datePremiereEcheance: datePremiereEcheanceSouhaitee,
        statut: "soumis",
      },

      // Aucun montant n'est déduit ici.
      // Le quota affiché est récupéré par
      // GET /api/membre/quota.
    });

  } catch (erreur) {
    // ======================================
    // 11. ANNULER EN CAS D'ERREUR
    // ======================================

    let annulationConfirmee = false;

    if (transactionOuverte && connexion) {
      try {
        await connexion.rollback();

        // Si COMMIT a été tenté, son résultat
        // peut être incertain : on conserve
        // donc le fichier justificatif.
        annulationConfirmee = !commitTente;

      } catch (erreurRollback) {
        console.error(
          "[soumission] Rollback :",
          erreurRollback.message
        );
      }
    }

    // Supprimer le fichier seulement si
    // l'annulation est confirmée.

    if (
      fichierEcrit &&
      annulationConfirmee
    ) {
      try {
        await unlink(cheminAbsolu);
      } catch (erreurFichier) {
        console.error(
          "[soumission] Nettoyage fichier :",
          erreurFichier.message
        );
      }
    }

    console.error(
      "[soumission] ÉTAPE :",
      etape
    );

    console.error(
      "[soumission] SQL :",
      erreur.sqlMessage || erreur.message
    );

    console.error(
      "[soumission] CODE :",
      erreur.code || "inconnu"
    );

    return res.status(500).json({
      success: false,

      message: commitTente
        ? "Le résultat de la soumission est incertain. " +
          "Vérifiez dans Mes prêts avant de réessayer."
        : "Impossible d'enregistrer la demande. " +
          "Vérifiez le terminal backend.",
    });

  } finally {
    connexion?.release();
  }
}

// ==========================================
// LISTER LES PRETS DU MEMBRE
// ==========================================

export async function listerPretsMembre(req, res) {
  try {
    const membreId = req.membreId;

    const [prets] = await pool.execute(
      `SELECT
         p.id,
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

         EXISTS (
           SELECT 1
           FROM association_prets.justificatifs AS j
           WHERE j.pret_id = p.id
         ) AS justificatif_present

       FROM association_prets.prets AS p

       WHERE p.utilisateur_id = ?

       ORDER BY
         p.date_demande DESC,
         p.id DESC`,
      [membreId]
    );

    return res.status(200).json({
      success: true,
      total: prets.length,

      prets: prets.map((pret) => ({
        id: String(pret.id),
        montant: Number(pret.montant),
        motif: pret.motif,
        description: pret.description,
        nombreEcheances: Number(pret.nombre_echeances_souhaitees),
        datePremiereEcheance: pret.date_premiere_echeance_souhaitee,
        statut: pret.statut,
        dateDemande: pret.date_demande,
        justificatifPresent: Boolean(
          pret.justificatif_present
        ),
      })),
    });

  } catch (erreur) {
    console.error(
      "[MES PRETS] Erreur :",
      erreur.code || erreur.message,
      erreur.sqlMessage || ""
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de récupérer vos demandes de prêts.",
    });
  }
}
