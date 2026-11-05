
import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import {
  LockKeyhole,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function Connexion() {
  const [envoi, setEnvoi] = useState(false);
  const navigate = useNavigate();

const {
  utilisateur,
  chargement,
  connexion,
} = useAuth();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] =
    useState(false);
  const [erreur, setErreur] = useState("");

  
if (chargement) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">
        Vérification de la session...
      </p>
    </div>
  );
}

if (utilisateur) {
  const destinations = {
    membre: "/membre/accueil",
    secretaire: "/secretaire",
    directeur: "/directeur",
    comptable: "/comptable",
    administrateur: "/admin",
  };

  return (
    <Navigate
      to={destinations[utilisateur.role] || "/connexion"}
      replace
    />
  );
}

 
async function gererConnexion(event) {
  event.preventDefault();

  if (envoi) return;

  setErreur("");
  setEnvoi(true);

  try {
    const resultat = await connexion(
      email,
      motDePasse
    );

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }

    navigate(resultat.destination, {
      replace: true,
    });
  } finally {
    setEnvoi(false);
  }
}

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">

      {/* PARTIE GAUCHE */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">

          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-6">
            <LockKeyhole
              size={27}
              className="text-green-700"
            />
          </div>

          <p className="text-sm font-semibold text-green-700">
            Association · Gestion des prêts
          </p>

          <h1 className="text-3xl font-bold text-gray-900 mt-3">
            Bienvenue
          </h1>

          <p className="text-gray-500 mt-3 mb-8">
            Connectez-vous pour accéder à votre espace
            personnel.
          </p>

          <form
            onSubmit={gererConnexion}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email-connexion"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse email
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email-connexion"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="votre@email.com"
                  className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="mot-de-passe-connexion"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mot de passe
              </label>

              <div className="relative">
                <Lock
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="mot-de-passe-connexion"
                  type={afficherMotDePasse ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={motDePasse}
                  onChange={(event) =>
                    setMotDePasse(event.target.value)
                  }
                  placeholder="Votre mot de passe"
                  className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-12 outline-none focus:ring-2 focus:ring-green-600"
                />

                <button
                  type="button"
                  onClick={() =>
                    setAfficherMotDePasse(!afficherMotDePasse)
                  }
                  aria-label={
                    afficherMotDePasse
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  {afficherMotDePasse
                    ? <EyeOff size={19} />
                    : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {erreur && (
              <p
                role="alert"
                className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm"
              >
                {erreur}
              </p>
            )}

           
<button
  type="submit"
  disabled={envoi}
  className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl cursor-pointer"
>
  {envoi ? "Connexion en cours..." : "Se connecter"}
</button>


          </form>

         

        </div>
      </div>

      {/* PARTIE DROITE */}
      <div className="hidden lg:flex bg-green-800 text-white p-12 flex-col justify-center">

        <div className="max-w-lg mx-auto">
          <ShieldCheck
            size={55}
            className="text-green-200"
          />

          <h2 className="text-4xl font-bold leading-tight mt-8">
            Une plateforme pour gérer les prêts
            de votre association.
          </h2>

          <p className="text-green-100 text-lg mt-6 leading-8">
            Retrouvez les demandes, les validations,
            les décaissements et les remboursements
            dans un environnement adapté à votre rôle.
          </p>

          <div className="mt-10 border-t border-green-600 pt-6">
            <p className="text-green-100 text-sm">
              Un seul accès. Un espace adapté
              à chaque utilisateur.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Connexion;
