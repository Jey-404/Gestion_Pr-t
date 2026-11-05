
import { Link } from "react-router";

import {
  Bell,
  UserRound,
  FileText,
  CalendarDays,
  CirclePlus,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

// ==========================================
// ACCES RAPIDES
// ==========================================

const raccourcis = [
  {
    titre: "Mes demandes",
    description: "Suivre mes prêts",
    chemin: "/membre/mes-prets",
    Icone: FileText,
  },
  {
    titre: "Échéances",
    description: "Consulter mes remboursements",
    // Le suivi des échéances est accessible
    // depuis le détail d'un prêt.
    chemin: "/membre/mes-prets",
    Icone: CalendarDays,
  },
  {
    titre: "Notifications",
    description: "Voir mes messages",
    chemin: "/membre/notifications",
    Icone: Bell,
  },
  {
    titre: "Mon profil",
    description: "Mes informations",
    chemin: "/membre/profil",
    Icone: UserRound,
  },
];

// ==========================================
// PAGE ACCUEIL MEMBRE
// ==========================================

export default function AccueilMembre() {
  const { utilisateur } = useAuth();

  const prenom =
    utilisateur?.prenom?.trim() || "Membre";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-8">

      {/* ====================================
          PETIT EN-TETE
      ==================================== */}

      

      {/* ====================================
          CARTE DE BIENVENUE
      ==================================== */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 px-6 py-9 text-white shadow-md sm:px-9 sm:py-12">

        {/* DECORATION */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-8 top-12 h-32 w-32 rounded-full bg-white/5"
        />

        {/* CONTENU */}

        <div className="relative z-10">

          <p className="text-sm font-medium text-emerald-100">
            Bonjour {prenom}
          </p>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Bienvenue dans votre espace
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-6 text-emerald-50 sm:text-base">
            Votre parcours de prêt, en toute clarté. Consultez vos demandes, suivez leur avancement et retrouvez les informations utiles dans un espace conçu pour vous accompagner.
          </p>

        </div>

      </section>

      {/* ====================================
          BOUTON DEMANDER UN PRET
      ==================================== */}

      <Link
        to="/membre/demander-pret"
        className="group flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-5 py-6 text-center text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >

        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:scale-110">
          <CirclePlus size={27} />
        </span>

        <span className="text-base font-bold sm:text-lg">
          Demander un prêt
        </span>

      </Link>

      {/* ====================================
          LES QUATRE ACCES RAPIDES
      ==================================== */}

      <nav
        aria-label="Navigation rapide du membre"
        className="grid grid-cols-2 gap-3 sm:gap-4"
      >

        {raccourcis.map(
          ({ titre, description, chemin, Icone }) => (

            <Link
              key={titre}
              to={chemin}
              className="group flex min-h-[125px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >

              {/* ICONE */}

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                <Icone size={23} />
              </div>

              {/* LIBELLE */}

              <div>
                <p className="text-sm font-bold text-slate-800 transition-colors group-hover:text-emerald-800 sm:text-base">
                  {titre}
                </p>

                <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                  {description}
                </p>
              </div>

            </Link>

          )
        )}

      </nav>

    </div>
  );
}
