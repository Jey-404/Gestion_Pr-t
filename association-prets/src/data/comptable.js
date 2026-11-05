
export const pretsComptable = [
  {
    id: 6,
    numeroPret: "PR-006",
    membre: "Fatou Diallo",
    numeroMembre: "MB-004",
    motif: "Projet agricole",
    montant: 250000,
    statut: "approuve",
  },
  {
    id: 7,
    numeroPret: "PR-007",
    membre: "Emmanuel Konan",
    numeroMembre: "MB-005",
    motif: "Équipement professionnel",
    montant: 300000,
    statut: "decaisse",
  },
  {
    id: 8,
    numeroPret: "PR-008",
    membre: "Grâce N'Dri",
    numeroMembre: "MB-006",
    motif: "Urgence familiale",
    montant: 80000,
    statut: "en_remboursement",
    
totalDu: 80000,
remboursements: [
  {
    id: "REM-DEMO-001",
    montant: 20000,
    date: "2026-10-20",
    modePaiement: "mobile_money",
    reference: "DEMO-MM-001",
  },
],
echeances: null,

  },
  {
    id: 9,
    numeroPret: "PR-009",
    membre: "Grâce N'Dri",
    numeroMembre: "MB-006",
    motif: "Achat matériel",
    montant: 150000,
    statut: "rembourse",
    
totalDu: 150000,
remboursements: [
  {
    id: "REM-DEMO-002",
    montant: 150000,
    date: "2026-10-22",
    modePaiement: "virement",
    reference: "DEMO-VIR-002",
  },
],
echeances: null,

  },
];

// Calculer les statistiques depuis la liste.
export function calculerStatistiquesComptable(prets) {
  return {
    aDecaisser: prets.filter(
      (pret) => pret.statut === "approuve"
    ).length,

    decaisses: prets.filter(
      (pret) => pret.statut === "decaisse"
    ).length,

    enRemboursement: prets.filter(
      (pret) => pret.statut === "en_remboursement"
    ).length,

    rembourses: prets.filter(
      (pret) => pret.statut === "rembourse"
    ).length,
  };
}
