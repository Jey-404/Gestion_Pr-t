
export const demandesSecretaire = [
  {
    id: 1,
    numeroPret: "PR-001",
    membre: "Jean Kouassi",
    numeroMembre: "MB-001",
    motif: "Frais médicaux",
    montant: 150000,
    statut: "soumis",
    justificatif: {
      nom: "justificatif-exemple.pdf",
      type: "application/pdf",
      url: "/demo/justificatif-exemple.pdf",
},

  },
  {
    id: 2,
    numeroPret: "PR-002",
    membre: "Awa Coulibaly",
    numeroMembre: "MB-002",
    motif: "Frais scolaires",
    montant: 120000,
    statut: "soumis",
    justificatif: null,
  },
  {
    id: 3,
    numeroPret: "PR-003",
    membre: "Awa Coulibaly",
    numeroMembre: "MB-002",
    motif: "Activité commerciale",
    montant: 200000,
    statut: "en_verification",
    justificatif: null,
  },
];

// Les statistiques sont calculées depuis les données.
// Nous évitons de saisir des nombres fixes.
export function calculerStatistiquesSecretaire(demandes) {
  const aVerifier = demandes.filter(
    (demande) => demande.statut === "soumis"
  ).length;

  const enVerification = demandes.filter(
    (demande) => demande.statut === "en_verification"
  ).length;

  return {
    aVerifier,
    enVerification,
    totalASuivre: aVerifier + enVerification,
  };
}
