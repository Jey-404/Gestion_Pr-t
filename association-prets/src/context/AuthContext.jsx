
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const fetchOriginal = window.fetch;

    async function fetchAvecExpiration(...args) {
      const reponse = await fetchOriginal.apply(window, args);
      const entree = args[0];
      const urlRequete =
        typeof entree === "string" || entree instanceof URL
          ? entree.toString()
          : entree.url;
      const chemin = new URL(urlRequete, window.location.href).pathname;

      if (
        reponse.status === 401 &&
        chemin.startsWith("/api/") &&
        chemin !== "/api/auth/login"
      ) {
        window.dispatchEvent(new Event("association:session-expired"));
      }

      return reponse;
    }

    function gererExpirationSession() {
      setUtilisateur(null);
      navigate("/connexion", { replace: true });
    }

    window.fetch = fetchAvecExpiration;
    window.addEventListener(
      "association:session-expired",
      gererExpirationSession
    );

    return () => {
      window.removeEventListener(
        "association:session-expired",
        gererExpirationSession
      );
      if (window.fetch === fetchAvecExpiration) {
        window.fetch = fetchOriginal;
      }
    };
  }, [navigate]);

  // Retrouver la session lorsque React démarre.
  useEffect(() => {
    let actif = true;

    async function verifierSession() {
      try {
        const reponse = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
        });

        if (!reponse.ok) {
          if (actif) setUtilisateur(null);
          return;
        }

        const donnees = await reponse.json();

        if (actif) {
          setUtilisateur(
            donnees.success ? donnees.utilisateur : null
          );
        }
      } catch (erreur) {
        console.error("Vérification de session impossible.");

        if (actif) {
          setUtilisateur(null);
        }
      } finally {
        if (actif) {
          setChargement(false);
        }
      }
    }

    verifierSession();

    return () => {
      actif = false;
    };
  }, []);

  // Connexion réelle.
  async function connexion(email, motDePasse) {
    try {
      const reponse = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          motDePasse,
        }),
      });

      const donnees = await reponse.json();

      if (!reponse.ok || !donnees.success) {
        return {
          ok: false,
          message:
            donnees.message ||
            "Impossible de se connecter.",
        };
      }

      const compte = donnees.utilisateur;

      const destinations = {
        membre: "/membre/accueil",
        secretaire: "/secretaire",
        directeur: "/directeur",
        comptable: "/comptable",
        administrateur: "/admin",
      };

      if (!compte || !destinations[compte.role]) {
        return {
          ok: false,
          message: "Rôle du compte non reconnu.",
        };
      }

      setUtilisateur(compte);

      return {
        ok: true,
        destination: destinations[compte.role],
      };
    } catch {
      return {
        ok: false,
        message:
          "Le serveur est inaccessible. Vérifiez que le backend est démarré.",
      };
    }
  }

  // Déconnexion réelle.
  async function deconnexion() {
    try {
      const reponse = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!reponse.ok) {
        return {
          ok: false,
          message: "Impossible de fermer la session.",
        };
      }

      setUtilisateur(null);

      return { ok: true };
    } catch {
      return {
        ok: false,
        message: "Connexion au serveur impossible.",
      };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        utilisateur,
        chargement,
        connexion,
        deconnexion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexte = useContext(AuthContext);

  if (!contexte) {
    throw new Error(
      "useAuth doit être utilisé dans AuthProvider."
    );
  }

  return contexte;
}
