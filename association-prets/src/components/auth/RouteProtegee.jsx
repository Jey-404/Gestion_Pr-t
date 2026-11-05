
import { Navigate, Outlet } from "react-router";

import { useAuth } from "../../context/AuthContext";

const accueilParRole = {
  membre: "/membre/accueil",
  secretaire: "/secretaire",
  directeur: "/directeur",
  comptable: "/comptable",
  administrateur: "/admin",
};

function RouteProtegee({ roleAutorise }) {
  const { utilisateur, chargement } = useAuth();

  // Ne pas rediriger tant que le serveur
  // vérifie la session.
  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Vérification de la session...
        </p>
      </div>
    );
  }

  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

  const rolesAutorisesEspaceMembre = [
    "secretaire",
    "comptable",
    "directeur",
  ];

  if (
    utilisateur.role !== roleAutorise &&
    !(
      roleAutorise === "membre" &&
      rolesAutorisesEspaceMembre.includes(utilisateur.role)
    )
  ) {
    return (
      <Navigate
        to={
          accueilParRole[utilisateur.role] ||
          "/connexion"
        }
        replace
      />
    );
  }

  return <Outlet />;
}

export default RouteProtegee;
