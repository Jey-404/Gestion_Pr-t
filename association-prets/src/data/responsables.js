
import {
  LayoutDashboard,
  Users,
  Wallet,
  ShieldCheck,
  CalendarCheck,
  HandCoins,
  CalendarDays,
  ClipboardCheck,
  Settings, 
} from "lucide-react";


export const responsables = {
  administrateur: {
    titre: "Administration",
    nom: "David N'Guessan",

    menu: [
      {
        label: "Tableau de bord",
        icon: LayoutDashboard,
        path: "/admin",
      },
      
{
  label: "Utilisateurs",
  icon: Users,
  path: "/admin/utilisateurs",
},


{
  label: "Prêts",
  icon: HandCoins,
  path: "/admin/prets",
},


{
  label: "Quotas mensuels",
  icon: CalendarDays,
  path: "/admin/quotas",
},

{
  label: "Paramètres",
  icon: Settings,
  path: "/admin/parametres",
},

    ],
  },

  secretaire: {
    titre: "Espace Secrétaire",
    nom: "Mariam Kone",
    menu: [
      {
        label: "Tableau de bord",
        icon: LayoutDashboard,
         path: "/secretaire",
      },
      
{
  label: "Vérifier les demandes",
  icon: ClipboardCheck,
  path: "/secretaire/demandes",
},

{
  label: "Paramètres",
  icon: Settings,
  path: "/secretaire/parametres",
},

    ],
  },

 
directeur: {
  titre: "Espace Directeur",
  nom: "Patrick Yao",

  menu: [
    {
      label: "Tableau de bord",
      icon: LayoutDashboard,
      path: "/directeur",
    },
    
{
  label: "Examiner les demandes",
  icon: ShieldCheck,
  path: "/directeur/demandes",
},
{
  label: "Paramètres",
  icon: Settings,
  path: "/directeur/parametres",
},

  ],
},


  comptable: {
    titre: "Espace Comptable",
    nom: "Aminata Traoré",
    menu: [
      
      {
        label: "Tableau de bord",
        icon: LayoutDashboard,
        path: "/comptable",
      },


{
  label: "Décaissements",
  icon: Wallet,
  path: "/comptable/decaissements",
},

    

{
  label: "Remboursements",
  icon: CalendarCheck,
  path: "/comptable/remboursements",
},

{
  label: "Paramètres",
  icon: Settings,
  path: "/comptable/parametres",
},

    ],
  },
};
