
export const demandesDirecteur = [
  {
    id: 4,
    numeroPret: "PR-004",
    membre: "Serge Koffi",
    numeroMembre: "MB-003",
    motif: "Réparation de véhicule",
    description:
      "Financement de la réparation d'un véhicule professionnel.",
    montant: 175000,
    statut: "en_decision",

    // Aucun justificatif réel n'est encore connecté.
    justificatif: null,
  },
];

// Statistiques calculées à partir des dossiers disponibles.
export function calculerStatistiquesDirecteur(demandes) {
  return {
    aDecider: demandes.filter(
      (demande) => demande.statut === "en_decision"
    ).length,

    approuves: demandes.filter(
      (demande) => demande.statut === "approuve"
    ).length,

    refuses: demandes.filter(
      (demande) => demande.statut === "refuse"
    ).length,
  };
}
