import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UsersRound,
  ClipboardCheck,
} from "lucide-react";

const STATUTS = {
  brouillon: { label: "Brouillon", style: "bg-slate-100 text-slate-700" },
  soumis: { label: "Soumis", style: "bg-blue-50 text-blue-700" },
  en_verification: { label: "En vérification", style: "bg-amber-50 text-amber-800" },
  en_decision: { label: "En décision", style: "bg-violet-50 text-violet-700" },
  approuve: { label: "Approuvé", style: "bg-emerald-50 text-emerald-800" },
  rejete: { label: "Rejeté", style: "bg-rose-50 text-rose-700" },
  refuse: { label: "Refusé", style: "bg-rose-50 text-rose-700" },
  decaisse: { label: "Décaissé", style: "bg-cyan-50 text-cyan-800" },
  en_remboursement: { label: "En remboursement", style: "bg-indigo-50 text-indigo-700" },
  rembourse: { label: "Remboursé", style: "bg-green-50 text-green-800" },
};

function dateFR(valeur) {
  if (!valeur) return "—";
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}

function nombreFR(valeur) {
  return Number(valeur || 0).toLocaleString("fr-FR");
}

function BadgeStatut({ statut }) {
  const info = STATUTS[statut] || {
    label: statut || "Non renseigné",
    style: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${info.style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {info.label}
    </span>
  );
}

function CarteStatistique({ titre, valeur, description, Icone, fond, couleur }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className={`rounded-xl p-3 ${fond}`}><Icone size={23} className={couleur} /></div>
        <ArrowUpRight size={18} className="text-slate-300" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{titre}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{nombreFR(valeur)}</p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

export default function TableauBordSecretaire() {
  const [prets, setPrets] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const [actualisation, setActualisation] = useState(0);

  useEffect(() => {
    const controleur = new AbortController();
    async function charger() {
      setChargement(true);
      setErreur("");
      setSessionExpiree(false);
      try {
        const reponse = await fetch("/api/secretaire/prets", {
          credentials: "same-origin",
          signal: controleur.signal,
        });
        if (reponse.status === 401) {
          if (!controleur.signal.aborted) setSessionExpiree(true);
          throw new Error("Session expirée.");
        }
        if (reponse.status === 403) throw new Error("Accès réservé au Secrétaire.");
        const donnees = await reponse.json().catch(() => ({}));
        if (!reponse.ok || !donnees.success) {
          throw new Error(donnees.message || "Impossible de charger les demandes.");
        }
        if (!controleur.signal.aborted) {
          setPrets(Array.isArray(donnees.prets) ? donnees.prets : []);
        }
      } catch (e) {
        if (!controleur.signal.aborted && e.name !== "AbortError") {
          setErreur(e.message || "Serveur inaccessible.");
        }
      } finally {
        if (!controleur.signal.aborted) setChargement(false);
      }
    }
    charger();
    return () => controleur.abort();
  }, [actualisation]);

  const dernieresDemandes = useMemo(() => [...prets]
    .sort((a, b) => {
      const da = new Date(a.dateDemande).getTime() || 0;
      const db = new Date(b.dateDemande).getTime() || 0;
      return db - da || Number(b.id) - Number(a.id);
    })
    .slice(0, 5), [prets]);

  const enAttente = prets.filter((p) => p.statut === "soumis").length;
  const enVerification = prets.filter((p) => p.statut === "en_verification").length;

  const cartes = [
    { titre: "Total des demandes", valeur: prets.length, description: "Demandes visibles dans votre espace", Icone: FileText, fond: "bg-emerald-50", couleur: "text-emerald-700" },
    { titre: "Nouvelles demandes", valeur: enAttente, description: "Dossiers nouvellement soumis", Icone: Clock3, fond: "bg-amber-50", couleur: "text-amber-700" },
    { titre: "En vérification", valeur: enVerification, description: "Dossiers en cours de contrôle", Icone: ClipboardCheck, fond: "bg-blue-50", couleur: "text-blue-700" },
  ];

  return (
    <div className="w-full space-y-7 pb-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/15" />
        <div className="pointer-events-none absolute right-8 top-12 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
              <ShieldCheck size={15} /> Espace Secrétaire
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Tableau de bord</h1>
            <p className="mt-3 text-sm leading-6 text-emerald-100">
              Retrouvez les demandes à vérifier et leur suivi dans un espace conçu pour vous aider à traiter chaque dossier avec rigueur.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/membre/accueil"
              state={{ retourEspace: "/secretaire" }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-50"
            >
              <UserRound size={18} /> Passer en mode Membre
            </Link>
            <button
              type="button"
              onClick={() => setActualisation((n) => n + 1)}
              disabled={chargement}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/25 disabled:opacity-50"
            >
              <RefreshCw size={17} className={chargement ? "animate-spin" : ""} /> Actualiser
            </button>
          </div>
        </div>
      </header>

      {erreur && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <AlertCircle size={21} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Chargement impossible</p>
            <p className="mt-1 text-sm">{erreur}</p>
          </div>
        </div>
      )}

      {chargement ? (
        <div role="status" aria-label="Chargement des données" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-12 w-12 rounded-xl bg-slate-100" />
              <div className="mt-5 h-4 w-32 rounded bg-slate-100" />
              <div className="mt-3 h-9 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !erreur && (
        <>
          <section aria-label="Statistiques des demandes" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cartes.map((carte) => <CarteStatistique key={carte.titre} {...carte} />)}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <FileText size={21} className="text-emerald-700" /> Les 5 dernières demandes
                </h2>
                <p className="mt-2 text-sm text-slate-500">Vue d'ensemble, tous les statuts confondus.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <UsersRound size={14} /> Consultation
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[710px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Référence</th>
                    <th className="px-5 py-4 font-semibold">Membre</th>
                    <th className="px-5 py-4 font-semibold">Montant</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dernieresDemandes.map((pret) => (
                    <tr key={pret.id} className="transition-colors hover:bg-emerald-50/40">
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-emerald-800">PR-{pret.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <UserRound size={17} />
                          </div>
                          <span className="font-medium text-slate-800">
                            {[pret.membre?.prenom, pret.membre?.nom].filter(Boolean).join(" ") || "Non renseigné"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{nombreFR(pret.montant)} FCFA</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">{dateFR(pret.dateDemande)}</td>
                      <td className="px-5 py-4"><BadgeStatut statut={pret.statut} /></td>
                    </tr>
                  ))}
                  {dernieresDemandes.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Aucune demande enregistrée.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500">
              Consultez les dossiers ici et effectuez les vérifications dans la page dédiée.
            </div>
          </section>

          
        </>
      )}
    </div>
  );
}
