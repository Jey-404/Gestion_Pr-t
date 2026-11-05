import { Link } from "react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ChangerMotDePasse from "../../components/membre/ChangerMotDePasse";

const configuration = {
  administrateur: {
    titre: "Paramètres d'administration",
    description: "Gérez votre compte et retrouvez les réglages de l'association.",
    liens: [
      {
        titre: "Budgets mensuels",
        description: "Définir les montants disponibles pour les prêts.",
        chemin: "/admin/quotas",
      },
      {
        titre: "Utilisateurs et rôles",
        description: "Gérer les comptes et les accès à l'application.",
        chemin: "/admin/utilisateurs",
      },
      {
        titre: "Gestion des prêts",
        description: "Consulter et gérer les demandes de prêt.",
        chemin: "/admin/prets",
      },
    ],
  },
  directeur: {
    titre: "Mes paramètres",
    description: "Gérez votre compte et retrouvez rapidement vos dossiers.",
    liens: [
      {
        titre: "Demandes à examiner",
        description: "Retrouver les dossiers transmis à la direction.",
        chemin: "/directeur/demandes",
      },
    ],
  },
  secretaire: {
    titre: "Mes paramètres",
    description: "Gérez votre compte et retrouvez rapidement vos dossiers.",
    liens: [
      {
        titre: "Demandes à vérifier",
        description: "Retrouver les dossiers en attente de vérification.",
        chemin: "/secretaire/demandes",
      },
    ],
  },
  comptable: {
    titre: "Mes paramètres",
    description: "Gérez votre compte et retrouvez rapidement vos opérations.",
    liens: [
      {
        titre: "Décaissements",
        description: "Retrouver les prêts à décaisser.",
        chemin: "/comptable/decaissements",
      },
      {
        titre: "Remboursements",
        description: "Retrouver le suivi des remboursements.",
        chemin: "/comptable/remboursements",
      },
    ],
  },
};

export default function ParametresResponsable({ role }) {
  const { utilisateur } = useAuth();
  const page = configuration[role];

  if (!page) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
        Les paramètres de cet espace sont indisponibles.
      </p>
    );
  }

  const nom = [utilisateur?.prenom, utilisateur?.nom]
    .filter(Boolean)
    .join(" ") || "Utilisateur";

  return (
    <div className="mx-auto w-full  space-y-6 pb-8">
      <header >
       
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {page.titre}
        </h1>
       
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <UserRound size={21} />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Mon compte</h2>
            <p className="text-sm text-slate-500">
              Vos informations de connexion
            </p>
          </div>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">Nom</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
              {nom}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">Adresse e-mail</dt>
            <dd className="mt-1 break-all text-sm font-semibold text-slate-900">
              {utilisateur?.email || "Non renseignée"}
            </dd>
          </div>
        </dl>
        {role !== "administrateur" && (
          <Link
            to="/membre/profil"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
          >
            <UserRound size={17} />
            Modifier mes coordonnées
            <ArrowRight size={16} />
          </Link>
        )}
      </section>

      {page.liens.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <BriefcaseBusiness size={21} />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">Réglages et outils de travail</h2>
              <p className="text-sm text-slate-500">
                Accédez directement aux fonctions de votre espace
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {page.liens.map((lien) => (
              <Link
                key={lien.chemin}
                to={lien.chemin}
                className="group rounded-xl border border-slate-200 p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="flex items-center justify-between gap-3 font-semibold text-slate-900">
                  {lien.titre}
                  <ArrowRight
                    size={17}
                    className="shrink-0 text-slate-400 group-hover:text-emerald-700"
                  />
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {lien.description}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-3 px-1">
          <LockKeyhole size={20} className="text-emerald-700" />
          <div>
            <h2 className="font-bold text-slate-900">Sécurité du compte</h2>
            <p className="text-sm text-slate-500">
              Utilisez un mot de passe que vous n’employez pas ailleurs.
            </p>
          </div>
        </div>
        <ChangerMotDePasse />
      </section>
    </div>
  );
}
