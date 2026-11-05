
import { pool } from "../config/db.js";

function chercherColonne(colonnes, possibilites) {
  return possibilites.find((nom) => colonnes.has(nom)) || null;
}

function protegerColonne(nom) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nom)) {
    throw new Error("Nom de colonne invalide.");
  }

  return `\`${nom}\``;
}

export async function creerNotificationAutomatique({
  utilisateurId,
  pretId,
  titre,
  message,
}) {
  const [structure] = await pool.query(
    "SHOW COLUMNS FROM association_prets.notifications"
  );

  const colonnes = new Map(
    structure.map((colonne) => [colonne.Field, colonne])
  );

  const noms = new Set(colonnes.keys());

  const destinataire = chercherColonne(noms, [
    "utilisateur_id",
    "membre_id",
    "destinataire_id",
  ]);

  const colonneTitre = chercherColonne(noms, [
    "titre",
    "sujet",
  ]);

  const colonneMessage = chercherColonne(noms, [
    "message",
    "contenu",
  ]);

  const colonnePret = chercherColonne(noms, [
    "pret_id",
  ]);

  const colonneLecture = chercherColonne(noms, [
    "lu",
    "est_lue",
    "est_lu",
  ]);

  const colonneType = chercherColonne(noms, [
    "type",
    "categorie",
  ]);

  if (!destinataire || !colonneTitre || !colonneMessage) {
    throw new Error(
      "Colonnes indispensables absentes dans notifications."
    );
  }

  const champs = [];
  const valeurs = [];

  function ajouter(nom, valeur) {
    if (!nom) return;

    champs.push(protegerColonne(nom));
    valeurs.push(valeur);
  }

  ajouter(destinataire, utilisateurId);
  ajouter(colonneTitre, titre);
  ajouter(colonneMessage, message);
  ajouter(colonnePret, pretId);
  ajouter(colonneLecture, 0);

  if (colonneType) {
    const definition = colonnes.get(colonneType).Type;

    if (definition.startsWith("enum(")) {
      const options = [
        ...definition.matchAll(/'([^']+)'/g),
      ].map((match) => match[1]);

      const type = options.includes("success")
        ? "success"
        : options.includes("info")
          ? "info"
          : options[0];

      if (type) ajouter(colonneType, type);
    } else {
      ajouter(colonneType, "success");
    }
  }

  const parametres = champs.map(() => "?").join(", ");

  const sql = `
    INSERT INTO association_prets.notifications
    (${champs.join(", ")})
    VALUES (${parametres})
  `;

  const [resultat] = await pool.execute(sql, valeurs);

  console.log(
    "[NOTIFICATION] Créée :",
    resultat.insertId
  );

  return resultat.insertId;
}

export async function notifierMembreSansBloquer(parametres) {
  try {
    return await creerNotificationAutomatique(parametres);
  } catch (erreur) {
    console.error(
      "[NOTIFICATION] Échec :",
      erreur.code || erreur.message
    );

    return null;
  }
}
