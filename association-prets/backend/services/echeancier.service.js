function dateValide(texte) {
  if (
    typeof texte !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(texte)
  ) {
    return false;
  }

  const date = new Date(`${texte}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === texte;
}

function ajouterMois(dateInitiale, nombreMois) {
  const [annee, mois, jour] = dateInitiale.split("-").map(Number);
  const premierJour = new Date(Date.UTC(annee, mois - 1 + nombreMois, 1, 12));
  const anneeCible = premierJour.getUTCFullYear();
  const moisCible = premierJour.getUTCMonth();
  const dernierJour = new Date(
    Date.UTC(anneeCible, moisCible + 1, 0, 12)
  ).getUTCDate();

  return new Date(
    Date.UTC(anneeCible, moisCible, Math.min(jour, dernierJour), 12)
  ).toISOString().slice(0, 10);
}

export function echeancierValide({
  montant,
  nombreEcheances,
  datePremiereEcheance,
}) {
  return (
    Number.isSafeInteger(Number(montant)) &&
    Number(montant) > 0 &&
    Number.isInteger(Number(nombreEcheances)) &&
    Number(nombreEcheances) >= 1 &&
    Number(nombreEcheances) <= 60 &&
    Number(nombreEcheances) <= Number(montant) &&
    dateValide(datePremiereEcheance)
  );
}

export async function creerEcheancesPret(
  connexion,
  { pretId, montant, nombreEcheances, datePremiereEcheance }
) {
  if (!echeancierValide({ montant, nombreEcheances, datePremiereEcheance })) {
    throw new Error("Échéancier demandé invalide.");
  }

  const montantEntier = Number(montant);
  const nombre = Number(nombreEcheances);
  const montantBase = Math.floor(montantEntier / nombre);
  const reste = montantEntier % nombre;
  const echeances = [];

  for (let index = 0; index < nombre; index += 1) {
    const montantPrevu = montantBase + (index < reste ? 1 : 0);
    const dateEcheance = ajouterMois(datePremiereEcheance, index);
    const [resultat] = await connexion.execute(
      `INSERT INTO association_prets.echeances
       (pret_id, numero_echeance, montant_prevu, date_echeance)
       VALUES (?, ?, ?, ?)`,
      [pretId, index + 1, montantPrevu, dateEcheance]
    );

    echeances.push({
      id: String(resultat.insertId),
      numero: index + 1,
      montantPrevu,
      dateEcheance,
    });
  }

  return echeances;
}
