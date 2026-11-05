
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/db.js";

const dossierPrive = fileURLToPath(
  new URL("../private_uploads/", import.meta.url)
);

function idValide(id) {
  return typeof id === "string" &&
    /^[1-9]\d*$/.test(id) &&
    Number.isSafeInteger(Number(id));
}

// GET /api/secretaire/prets/:id
export async function detailPretSecretaire(req, res) {
  if (!idValide(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Identifiant invalide.",
    });
  }

  try {
    const [lignes] = await pool.execute(
      `SELECT
        p.id, p.utilisateur_id, p.montant,
        p.motif, p.description, p.statut,
        p.date_demande,
        u.nom, u.prenom, u.email, u.telephone
       FROM association_prets.prets AS p
       INNER JOIN association_prets.utilisateurs AS u
         ON u.id = p.utilisateur_id
       WHERE p.id = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (lignes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dossier introuvable.",
      });
    }

    const p = lignes[0];

    const [documents] = await pool.execute(
      `SELECT
         id, nom_original, type_mime,
         taille_octets, date_depot
       FROM association_prets.justificatifs
       WHERE pret_id = ?
       ORDER BY id DESC`,
      [req.params.id]
    );

    return res.json({
      success: true,
      pret: {
        id: String(p.id),
        montant: Number(p.montant),
        motif: p.motif,
        description: p.description,
        statut: p.statut,
        dateDemande: p.date_demande,
        membre: {
          nom: p.nom,
          prenom: p.prenom,
          email: p.email,
          telephone: p.telephone,
        },
        justificatifs: documents.map((d) => ({
          id: String(d.id),
          nom: d.nom_original,
          type: d.type_mime,
          taille: Number(d.taille_octets),
          url:
            "/api/secretaire/prets/" +
            encodeURIComponent(p.id) +
            "/justificatifs/" +
            encodeURIComponent(d.id),
        })),
      },
    });
  } catch (erreur) {
    console.error("[SECRETAIRE DETAIL]", erreur);

    return res.status(500).json({
      success: false,
      message: "Impossible de charger le dossier.",
    });
  }
}

// GET /api/secretaire/prets/:id/justificatifs/:documentId
export async function documentPretSecretaire(req, res) {
  if (
    !idValide(req.params.id) ||
    !idValide(req.params.documentId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Identifiant invalide.",
    });
  }

  try {
    const [documents] = await pool.execute(
      `SELECT
         j.nom_stockage,
         j.chemin_stockage,
         j.type_mime
       FROM association_prets.justificatifs AS j
       INNER JOIN association_prets.prets AS p
         ON p.id = j.pret_id
       WHERE j.id = ? AND p.id = ?
       LIMIT 1`,
      [req.params.documentId, req.params.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document introuvable.",
      });
    }

    const document = documents[0];

    if (
      ![
        "application/pdf",
        "image/jpeg",
        "image/png",
      ].includes(document.type_mime)
    ) {
      return res.status(415).json({
        success: false,
        message: "Format non autorisé.",
      });
    }

    const nom = document.chemin_stockage;

    // Le stockage actuel utilise seulement le nom
    // du fichier, sans sous-répertoire.
    if (
      !nom ||
      nom !== path.basename(nom) ||
      nom.includes("\\") ||
      nom !== document.nom_stockage
    ) {
      return res.status(500).json({
        success: false,
        message: "Chemin du document invalide.",
      });
    }

    const chemin = path.join(dossierPrive, nom);
    const info = await stat(chemin);

    if (!info.isFile()) {
      return res.status(404).json({
        success: false,
        message: "Fichier introuvable.",
      });
    }

    res.setHeader("Content-Type", document.type_mime);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    const flux = createReadStream(chemin);

    flux.on("error", (erreur) => {
      console.error("[SECRETAIRE FICHIER]", erreur.message);

      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy(erreur);
      }
    });

    flux.pipe(res);
  } catch (erreur) {
    console.error("[SECRETAIRE FICHIER]", erreur.message);

    if (res.headersSent) {
      return res.destroy();
    }

    return res.status(
      erreur.code === "ENOENT" ? 404 : 500
    ).json({
      success: false,
      message: "Impossible d'ouvrir le document.",
    });
  }
}
