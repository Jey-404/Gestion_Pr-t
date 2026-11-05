
import { Routes, Route, Navigate } from "react-router";

import { useAuth } from "./context/AuthContext";
import Connexion from "./pages/auth/Connexion";
import RouteProtegee from "./components/auth/RouteProtegee";
import ResponsableLayout from "./components/responsables/ResponsableLayout";

// Membre


import MembreLayout from "./components/membre/MembreLayout";

import AccueilMembre from "./pages/membre/AccueilMembre";
import DemanderPret from "./pages/membre/DemanderPret";
import MesPrets from "./pages/membre/MesPrets";
import DetailPret from "./pages/membre/DetailPret";
import ProfilMembre from "./pages/membre/ProfilMembre";
import Notifications from "./pages/membre/Notifications";



// Administrateur
import TableauBordAdmin from "./pages/admin/TableauBordAdmin";
import GestionUtilisateurs from "./pages/admin/GestionUtilisateurs";
import GestionPrets from "./pages/admin/GestionPrets";
import GestionQuotas from "./pages/admin/GestionQuotas";
import ParametresAdmin from "./pages/admin/ParametresAdmin";
import ParametresResponsable from "./pages/responsables/ParametresResponsable";

// Secrétaire
import TableauBordSecretaire from "./pages/secretaire/TableauBordSecretaire";
import VerificationDemandes from "./pages/secretaire/VerificationDemandes";

// Directeur
import TableauBordDirecteur from "./pages/directeur/TableauBordDirecteur";
import ExamenDemandes from "./pages/directeur/ExamenDemandes";

// Comptable
import TableauBordComptable from "./pages/comptable/TableauBordComptable";
import GestionDecaissements from "./pages/comptable/GestionDecaissements";
import GestionRemboursements from "./pages/comptable/GestionRemboursements";

function PageEnConstruction({ titre }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h2 className="text-xl font-bold">{titre}</h2>
      <p className="text-gray-500 mt-2">
        Cette page sera développée prochainement.
      </p>
    </div>
  );
}


function RedirectionAccueil() {
  const { utilisateur, chargement } = useAuth();

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Vérification de la session...
      </div>
    );
  }

  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

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


function PageMembreEnConstruction({ titre }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h1 className="text-xl font-bold text-gray-900">
        {titre}
      </h1>

      <p className="text-gray-500 mt-3">
        Cette fonctionnalité sera reconstruite
        progressivement.
      </p>
    </section>
  );
}

function App() {
  return (
    <Routes>

      {/* Connexion publique */}
      <Route
        path="/connexion"
        element={<Connexion />}
      />

      {/* Accueil automatique */}
      <Route
        path="/"
        element={<RedirectionAccueil />}
      />

      

{/* Espace Membre */}
<Route element={<RouteProtegee roleAutorise="membre" />}>
  <Route path="/membre" element={<MembreLayout />}>
    <Route index element={<Navigate to="accueil" replace />} />

    <Route path="accueil" element={<AccueilMembre />} />

    <Route
      path="demander-pret"
      element={<DemanderPret />}
    />

    <Route
      path="mes-prets"
      element={<MesPrets />}
    />

    <Route
      path="mes-prets/:id"
      element={<DetailPret />}
    />

    <Route
      path="profil"
      element={<ProfilMembre />}
    />

    <Route
      path="notifications"
      element={<Notifications />}
    />

    <Route
      path="historique"
      element={
        <PageEnConstruction titre="Historique" />
      }
    />
  </Route>
</Route>



      {/* Espace Administrateur */}
      <Route
        element={
          <RouteProtegee roleAutorise="administrateur" />
        }
      >
        <Route
          path="/admin"
          element={
            <ResponsableLayout role="administrateur" />
          }
        >
          <Route index element={<TableauBordAdmin />} />
          <Route
            path="utilisateurs"
            element={<GestionUtilisateurs />}
          />
          <Route
            path="prets"
            element={<GestionPrets />}
          />
          <Route
            path="quotas"
            element={<GestionQuotas />}
          />
          <Route
            path="parametres"
            element={<ParametresAdmin />}
          />
        </Route>
      </Route>

      {/* Espace Secrétaire */}
      <Route
        element={
          <RouteProtegee roleAutorise="secretaire" />
        }
      >
        <Route
          path="/secretaire"
          element={<ResponsableLayout role="secretaire" />}
        >
          <Route
            index
            element={<TableauBordSecretaire />}
          />
          <Route
            path="demandes"
            element={<VerificationDemandes />}
          />
          <Route
            path="parametres"
            element={<ParametresResponsable role="secretaire" />}
          />
        </Route>
      </Route>

      {/* Espace Directeur */}
      <Route
        element={
          <RouteProtegee roleAutorise="directeur" />
        }
      >
        <Route
          path="/directeur"
          element={<ResponsableLayout role="directeur" />}
        >
          <Route
            index
            element={<TableauBordDirecteur />}
          />
          <Route
            path="demandes"
            element={<ExamenDemandes />}
          />
          <Route
            path="parametres"
            element={<ParametresResponsable role="directeur" />}
          />
        </Route>
      </Route>

      {/* Espace Comptable */}
      <Route
        element={
          <RouteProtegee roleAutorise="comptable" />
        }
      >
        <Route
          path="/comptable"
          element={<ResponsableLayout role="comptable" />}
        >
          <Route
            index
            element={<TableauBordComptable />}
          />
          <Route
            path="decaissements"
            element={<GestionDecaissements />}
          />
          <Route
            path="remboursements"
            element={<GestionRemboursements />}
          />
          <Route
            path="parametres"
            element={<ParametresResponsable role="comptable" />}
          />
        </Route>
      </Route>

      {/* Route inconnue */}
      <Route
        path="*"
        element={<RedirectionAccueil />}
      />

    </Routes>
  );
}

export default App;
