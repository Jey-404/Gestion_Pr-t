
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  ChevronDown,
  LogOut,
  ShieldCheck,
  UserRound,
  Mail,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const nomsRoles = {
  administrateur: "Administrateur",
  secretaire: "Secrétaire",
  directeur: "Directeur",
  comptable: "Comptable",
  membre: "Membre",
};

function MenuUtilisateur() {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();

  // Tous les hooks sont à l'intérieur du composant.
  const [ouvert, setOuvert] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] =
    useState(false);
  const [erreurDeconnexion, setErreurDeconnexion] =
    useState("");

  const menuRef = useRef(null);
  const boutonRef = useRef(null);

  // Fermer le menu avec Échap ou un clic extérieur.
  useEffect(() => {
    if (!ouvert) return;

    function gererClicExterieur(event) {
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
      gererClicExterieur
    );

    document.addEventListener(
      "keydown",
      gererClavier
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        gererClicExterieur
      );

      document.removeEventListener(
        "keydown",
        gererClavier
      );
    };
  }, [ouvert]);

  // Les hooks sont terminés.
  if (!utilisateur) {
    return null;
  }

  const nom =
    [utilisateur.prenom, utilisateur.nom]
      .filter(Boolean)
      .join(" ") || "Utilisateur";

  const email = utilisateur.email || "";

  const role =
    nomsRoles[utilisateur.role] ||
    utilisateur.role;

  // Déconnexion réelle via le backend Express.
  async function gererDeconnexion() {
    if (deconnexionEnCours) return;

    setErreurDeconnexion("");
    setDeconnexionEnCours(true);

    try {
      const resultat = await deconnexion();

      if (!resultat?.ok) {
        setErreurDeconnexion(
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
      setErreurDeconnexion(
        "Erreur de communication avec le serveur."
      );
    } finally {
      setDeconnexionEnCours(false);
    }
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      {/* Bouton du Header */}
      <button
        ref={boutonRef}
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        aria-haspopup="true"
        aria-controls="menu-compte-responsable"
        className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <UserRound
            size={21}
            className="text-green-700"
          />
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-900 max-w-40 truncate">
            {nom}
          </p>

          <p className="text-xs text-gray-500">
            {role}
          </p>
        </div>

        <ChevronDown
          size={16}
          className="text-gray-500"
        />
      </button>

      {/* Menu déroulant */}
      {ouvert && (
        <div
          id="menu-compte-responsable"
          className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {/* Informations utilisateur */}
          <div className="p-4 border-b border-gray-100">

            <div className="flex items-center gap-2 mb-2">
              <UserRound
                size={18}
                className="text-green-700"
              />

              <p className="font-semibold text-gray-900">
                {nom}
              </p>
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-500">
              <Mail
                size={16}
                className="shrink-0 mt-0.5"
              />

              <span className="break-all">
                {email}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
              <ShieldCheck size={17} />
              <span>{role}</span>
            </div>

          </div>

          {/* Déconnexion */}
          <div className="p-2">

            <button
              type="button"
              onClick={gererDeconnexion}
              disabled={deconnexionEnCours}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <LogOut size={19} />

              {deconnexionEnCours
                ? "Déconnexion en cours..."
                : "Se déconnecter"}
            </button>

            {erreurDeconnexion && (
              <p
                role="alert"
                className="p-3 text-sm text-red-700"
              >
                {erreurDeconnexion}
              </p>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default MenuUtilisateur;
