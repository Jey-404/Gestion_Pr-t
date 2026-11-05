
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Wallet,
  Bell,
  BriefcaseBusiness,
  ArrowLeft,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import MenuMembre from "./MenuMembre";

export default function MembreHeader() {
  const { utilisateur } = useAuth();

  const [nombreNonLues, setNombreNonLues] = useState(0);

  // Notifications réelles depuis MySQL
  useEffect(() => {
    let actif = true;

    async function chargerNotifications() {
      try {
        const reponse = await fetch(
          "/api/membre/notifications",
          {
            credentials: "same-origin",
          }
        );

        const donnees = await reponse.json();

        if (
          actif &&
          reponse.ok &&
          donnees.success
        ) {
          setNombreNonLues(
            Number(donnees.compteurs?.nonLues ?? 0)
          );
        }
      } catch (erreur) {
        // Une erreur de notification ne doit
        // pas empêcher le header de s'afficher.
        console.error(
          "[NOTIFICATIONS HEADER]",
          erreur.message
        );
      }
    }

    chargerNotifications();

    const interval = setInterval(
      chargerNotifications,
      30000
    );

    return () => {
      actif = false;
      clearInterval(interval);
    };
  }, [utilisateur?.id]);

  const lienRetour =
    ({
      secretaire: "/secretaire",
      comptable: "/comptable",
      directeur: "/directeur",
    }[utilisateur?.role] || null);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">

        <div className="flex items-center justify-between gap-4">

          {/* LOGO ET IDENTITE */}

          <Link
            to="/membre/accueil"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <Wallet size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                MonEspace
              </h1>

              <p className="text-xs text-slate-500">
                Espace personnel
              </p>
            </div>
          </Link>

          {/* ACTIONS */}

          <div className="flex items-center gap-2 sm:gap-3">

            {/* NOTIFICATIONS */}

            <Link
              to="/membre/notifications"
              aria-label={`Notifications : ${nombreNonLues} non lues`}
              title="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Bell size={21} />

              {nombreNonLues > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {nombreNonLues > 99
                    ? "99+"
                    : nombreNonLues}
                </span>
              )}
            </Link>

            {/* PROFIL + MENU DEROULANT */}

            <MenuMembre />

          </div>
        </div>

        {/* RETOUR ESPACE PROFESSIONNEL */}

        {lienRetour && (
          <Link
            to={lienRetour}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            <ArrowLeft size={17} />
            <BriefcaseBusiness size={17} />
            Retour à mon espace professionnel
          </Link>
        )}

      </div>
    </header>
  );
}
