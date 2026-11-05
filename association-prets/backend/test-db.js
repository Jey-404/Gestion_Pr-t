
import { pool } from "./config/db.js";

async function testerConnexion() {
  try {
    const [resultats] = await pool.query(
      "SELECT DATABASE() AS base, 1 AS connexion"
    );

    console.log("Connexion MySQL réussie.");
    console.log("Base connectée :", resultats[0].base);

const [colonnes] = await pool.query(`
  SELECT
    TABLE_SCHEMA,
    COLUMN_NAME
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'justificatifs'
  ORDER BY ORDINAL_POSITION
`);

console.table(colonnes);

    if (resultats[0].base !== "association_prets") {
      throw new Error(
        "La connexion ne cible pas association_prets."
      );
    }

    const [tables] = await pool.query(
      "SHOW TABLES"
    );

    console.log(
      "Nombre de tables accessibles :",
      tables.length
    );
  } catch (erreur) {
    console.error(
      "Échec de connexion MySQL :",
      erreur.code || erreur.message
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testerConnexion();
