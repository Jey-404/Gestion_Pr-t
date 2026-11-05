
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  UserRound,
  ChevronDown,
  ChevronRight,
  LogOut,
  Mail,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function MenuMembre() {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();

  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const menuRef = useRef(null);
  const boutonRef = useRef(null);

  // ========================================
  // FERMETURE DU MENU
  // ========================================

  useEffect(() => {
    if (!ouvert) return;

    function fermerExterieur(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOuvert(false);
      }
    }

    function gererClavier(event) {
      if (event.key === "Escape") {
        setOuvert(false);
        boutonRef.current?.focus();
      }
    }

    document.addEventListener(
      "pointerdown",
      fermerExterieur
    );

    document.addEventListener(
      "keydown",
      gererClavier
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        fermerExterieur
      );

      document.removeEventListener(
        "keydown",
        gererClavier
      );
    };
  }, [ouvert]);

  // Tous les hooks sont déclarés avant
  // le retour conditionnel.

  if (!utilisateur) {
    return null;
  }

  // ========================================
  // INFORMATIONS DU MEMBRE
  // ========================================

  const nom =
    [utilisateur.prenom, utilisateur.nom]
      .filter(Boolean)
      .join(" ") || "Membre";

  const initiales = (
    (utilisateur.prenom?.trim()?.[0] || "") +
    (utilisateur.nom?.trim()?.[0] || "")
  ).toUpperCase() || "M";

  const libellesRoles = {
    membre: "Membre",
    secretaire: "Secrétaire",
    comptable: "Comptable",
    directeur: "Directeur",
    administrateur: "Administrateur",
  };

  const roleAffiche =
    libellesRoles[utilisateur.role] || "Membre";

  // ========================================
  // DECONNEXION SECURISEE
  // ========================================

  async function gererDeconnexion() {
    if (enCours) return;

    setErreur("");
    setEnCours(true);

    try {
      // Conserver le système de déconnexion
      // existant dans AuthContext.
      const resultat = await deconnexion();

      if (!resultat?.ok) {
        setErreur(
          resultat?.message ||
          "Impossible de se déconnecter."
        );
        return;
      }

      setOuvert(false);

      navigate("/connexion", {
        replace: true,
      });
    } catch {
      setErreur(
        "Le serveur est inaccessible. Réessayez."
      );
    } finally {
      setEnCours(false);
    }
  }

  function ouvrirOuFermerMenu() {
    if (enCours) return;

    setErreur("");
    setOuvert((ancien) => !ancien);
  }

  function fermerMenu() {
    setOuvert(false);
    setErreur("");
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >

      {/* ====================================
          BOUTON AVATAR
      ==================================== */}

      <button
        ref={boutonRef}
        type="button"
        onClick={ouvrirOuFermerMenu}
        disabled={enCours}
        aria-label="Ouvrir le menu de mon compte"
        aria-expanded={ouvert}
        aria-haspopup="true"
        aria-controls={
          ouvert
            ? "menu-compte-membre"
            : undefined
        }
        className="
          group flex items-center gap-2
          rounded-full p-1
          transition-colors
          hover:bg-emerald-50
          focus-visible:outline
          focus-visible:outline-2
          focus-visible:outline-emerald-600
          disabled:opacity-50
        "
      >

        <span
          className="
            flex h-10 w-10 items-center
            justify-center rounded-full
            bg-emerald-100
            text-sm font-bold text-emerald-800
            ring-2 ring-white
            transition-colors
            group-hover:bg-emerald-200
          "
        >
          {initiales}
        </span>

        <ChevronDown
          size={16}
          className={`
            text-slate-500
            transition-transform duration-200
            ${ouvert ? "rotate-180" : ""}
          `}
        />

      </button>

      {/* ====================================
          MENU DEROULANT
      ==================================== */}

      {ouvert && (
        <div
          id="menu-compte-membre"
          className="
            absolute right-0 top-full z-50
            mt-3 w-72
            max-w-[calc(100vw-2rem)]
            overflow-hidden rounded-2xl
            border border-slate-200
            bg-white shadow-2xl
          "
        >

          {/* INFORMATIONS DU COMPTE */}

          <div className="border-b border-slate-100 bg-slate-50/70 p-4">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-12 w-12
                  shrink-0 items-center
                  justify-center rounded-full
                  bg-emerald-100
                  text-base font-bold
                  text-emerald-800
                "
              >
                {initiales}
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate font-bold text-slate-900">
                  {nom}
                </p>

                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <ShieldCheck size={14} />
                  {roleAffiche}
                </p>

              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <Mail
                size={15}
                className="mt-0.5 shrink-0"
              />

              <span className="break-all">
                {utilisateur.email || "Aucun e-mail"}
              </span>
            </div>

          </div>

          {/* ACTIONS */}

          <div className="space-y-1 p-2">

            {/* MON PROFIL */}

            <Link
              to="/membre/profil"
              onClick={fermerMenu}
              className="
                group flex w-full items-center
                gap-3 rounded-xl px-3 py-3
                text-sm font-semibold
                text-slate-700
                transition-colors
                hover:bg-emerald-50
                hover:text-emerald-800
              "
            >

              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <UserRound size={19} />
              </span>

              <span className="flex-1 text-left">
                Mon profil
              </span>

              <ChevronRight
                size={17}
                className="text-slate-400 group-hover:text-emerald-700"
              />

            </Link>

            {/* SEPARATEUR */}

            <div className="mx-3 border-t border-slate-100" />

            {/* DECONNEXION */}

            <button
              type="button"
              onClick={gererDeconnexion}
              disabled={enCours}
              className="
                flex w-full items-center
                gap-3 rounded-xl px-3 py-3
                text-left text-sm font-semibold
                text-red-700
                transition-colors
                hover:bg-red-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                {enCours ? (
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <LogOut size={19} />
                )}
              </span>

              {enCours
                ? "Déconnexion en cours..."
                : "Se déconnecter"}

            </button>

            {/* ERREUR */}

            {erreur && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700"
              >
                {erreur}
              </p>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
