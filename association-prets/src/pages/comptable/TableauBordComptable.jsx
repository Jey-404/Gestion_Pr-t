
import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
  RefreshCw,
  Wallet,
  Clock3,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ==========================================
// STATUTS
// ==========================================

const STATUTS = {
  soumis: {
    label: "Soumis",
    couleur: "bg-gray-100 text-gray-700",
  },
  en_verification: {
    label: "En vérification",
    couleur: "bg-blue-50 text-blue-700",
  },
  en_decision: {
    label: "En décision",
    couleur: "bg-purple-50 text-purple-700",
  },
  approuve: {
    label: "Approuvé",
    couleur: "bg-green-50 text-green-700",
  },
  rejete: {
    label: "Rejeté",
    couleur: "bg-red-50 text-red-700",
  },
  refuse: {
    label: "Refusé",
    couleur: "bg-red-50 text-red-700",
  },
  decaisse: {
    label: "Décaissé",
    couleur: "bg-emerald-50 text-emerald-700",
  },
  en_remboursement: {
    label: "En remboursement",
    couleur: "bg-yellow-50 text-yellow-800",
  },
  rembourse: {
    label: "Remboursé",
    couleur: "bg-green-100 text-green-800",
  },
};

// ==========================================
// FORMATAGE
// ==========================================

function dateFR(valeur) {
  if (!valeur) return "—";

  const date = new Date(valeur);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fr-FR");
}

function montantFR(valeur) {
  const montant = Number(valeur);

  return Number.isFinite(montant)
    ? `${montant.toLocaleString("fr-FR")} FCFA`
    : "—";
}

function nombreValide(valeur) {
  const nombre = Number(valeur);

  return Number.isFinite(nombre) ? nombre : 0;
}

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

import { UserRound, ArrowRight, ShieldCheck } from "lucide-react";

function EnteteComptable({ titre, description, actualiser, chargement, enfants }) {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute right-8 bottom-[-80px] h-52 w-52 rounded-full bg-white/5" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
            <Wallet size={15} /> Espace Comptable
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{titre}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {enfants}
          <button type="button" onClick={actualiser} disabled={chargement}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50">
            <RefreshCw size={17} className={chargement ? "animate-spin" : ""} /> Actualiser
          </button>
        </div>
      </div>
    </header>
  );
}

function CarteComptable({ label, valeur, description, icone: Icone, couleur = "emerald" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className={`inline-flex rounded-xl p-3 ${styles[couleur] || styles.emerald}`}><Icone size={23} /></div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{valeur}</p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function AlerteComptable({ erreur, succes }) {
  return (
    <>
      {erreur && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:p-5">
        <AlertCircle size={20} className="mt-0.5 shrink-0" />
        <div className="min-w-0"><p className="font-semibold">Une erreur s'est produite</p><p className="mt-1 break-words text-sm">{erreur}</p>
        </div>
      </div>}
      {succes && <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        <CheckCircle2 size={19} className="shrink-0" />{succes}
      </div>}
    </>
  );
}

function SqueletteComptable() {
  return <div role="status" aria-label="Chargement des données" className="space-y-3 p-5">
    {[0,1,2,3].map(n => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
  </div>;
}

function NomMembre({ membre }) {
  const nom = [membre?.prenom, membre?.nom].filter(Boolean).join(" ") || "Non renseigné";
  const initiales = [membre?.prenom?.trim()?.[0], membre?.nom?.trim()?.[0]].filter(Boolean).join("").toUpperCase() || "M";
  return <div className="flex items-center gap-3">
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">{initiales}</span>
    <div className="min-w-0"><p className="font-semibold text-slate-800">{nom}</p><p className="max-w-48 truncate text-xs text-slate-400">{membre?.email || "—"}</p></div>
  </div>;
}

export default function TableauBordComptable() {
  const [statistiques, setStatistiques] = useState({
    aDecaisser: 0,
    enSuivi: 0,
    montantEnAttente: 0,
  });

  const [dernieres, setDernieres] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [sessionExpiree, setSessionExpiree] =
    useState(false);

  const [actualisation, setActualisation] =
    useState(0);

  // ========================================
  // CHARGEMENT DEPUIS MYSQL
  // ========================================

  useEffect(() => {
    const controleur = new AbortController();

    async function chargerTableauBord() {
      setChargement(true);
      setErreur("");
      setSessionExpiree(false);

      try {
        const reponse = await fetch(
          "/api/comptable/tableau-bord",
          {
            method: "GET",
            credentials: "same-origin",
            signal: controleur.signal,
          }
        );

        if (reponse.status === 401) {
          setSessionExpiree(true);

          throw new Error(
            "Session expirée."
          );
        }

        if (reponse.status === 403) {
          throw new Error(
            "Accès réservé au compte Comptable."
          );
        }

        const typeContenu =
          reponse.headers.get("content-type") || "";

        if (!typeContenu.includes("application/json")) {
          throw new Error(
            "Le serveur n'a pas retourné une réponse JSON. Vérifiez la route /api/comptable/tableau-bord."
          );
        }

        const donnees = await reponse.json();

        if (!reponse.ok || donnees.success !== true) {
          throw new Error(
            donnees.message ||
              `Erreur serveur (${reponse.status}).`
          );
        }

        if (controleur.signal.aborted) return;

        if (
          !donnees.statistiques ||
          typeof donnees.statistiques !== "object" ||
          !Array.isArray(donnees.dernieresDemandes)
        ) {
          throw new Error(
            "La réponse de l'API Comptable est incomplète."
          );
        }

        setStatistiques({
          aDecaisser: nombreValide(
            donnees.statistiques.aDecaisser
          ),
          enSuivi: nombreValide(
            donnees.statistiques.enSuivi
          ),
          montantEnAttente: nombreValide(
            donnees.statistiques.montantEnAttente
          ),
        });

        setDernieres(
          donnees.dernieresDemandes.slice(0, 5)
        );
      } catch (e) {
        if (
          e.name !== "AbortError" &&
          !controleur.signal.aborted
        ) {
          setErreur(
            e.message ||
              "Impossible de contacter le serveur."
          );
        }
      } finally {
        if (!controleur.signal.aborted) {
          setChargement(false);
        }
      }
    }

    chargerTableauBord();

    return () => controleur.abort();
  }, [actualisation]);

  // ========================================
  // STATISTIQUES
  // ========================================

  const cartes = [
    {
      titre: "Prêts à décaisser",
      valeur: statistiques.aDecaisser,
      description: "Demandes approuvées en attente",
      Icone: Clock3,
    },
    {
      titre: "Prêts en suivi financier",
      valeur: statistiques.enSuivi,
      description: "Prêts décaissés ou en remboursement",
      Icone: FileText,
    },
    {
      titre: "Montant en attente",
      valeur: montantFR(
        statistiques.montantEnAttente
      ),
      description: "Total des prêts approuvés à décaisser",
      Icone: Wallet,
    },
  ];

  // ========================================
  // AFFICHAGE
  // ========================================


  return (
    <div className="w-full space-y-7 pb-8">
      <EnteteComptable
        titre="Tableau de bord"
        description="Les opérations de décaissement et de remboursement sont réunies dans cet espace pour assurer un suivi clair et fiable."
        actualiser={() => setActualisation(n => n + 1)} chargement={chargement}
        enfants={<Link to="/membre/accueil" state={{ retourEspace: "/comptable" }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50">
          <UserRound size={17} /> Mode Membre <ArrowRight size={16} />
        </Link>}
      />
      <AlerteComptable erreur={erreur} />
      {chargement ? <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(n =>
        <div key={n} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}</div> : !erreur && <>
        <section aria-label="Indicateurs financiers" className="grid gap-4 md:grid-cols-3">
          <CarteComptable label="Prêts à décaisser" valeur={statistiques.aDecaisser.toLocaleString("fr-FR")}
            description="Prêts approuvés et disponibles au décaissement" icone={Clock3} couleur="amber" />
          <CarteComptable label="Prêts en suivi financier" valeur={statistiques.enSuivi.toLocaleString("fr-FR")}
            description="Prêts décaissés ou en remboursement" icone={FileText} couleur="blue" />
          <CarteComptable label="Montant en attente" valeur={montantFR(statistiques.montantEnAttente)}
            description="Montant total des prêts restant à décaisser" icone={Wallet} couleur="emerald" />
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FileText size={20} className="text-emerald-700" /> Les 5 dernières demandes</h2>
              <p className="mt-1 text-sm text-slate-500">Toutes les demandes, tous statuts confondus.</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Consultation uniquement</span>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
              {['Référence','Membre','Montant','Motif','Date','Statut'].map(t => <th key={t} className="px-5 py-4 font-semibold">{t}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{dernieres.map(pret => {
              const info = STATUTS[pret.statut] || {label:pret.statut || "Inconnu",couleur:"bg-slate-100 text-slate-700"};
              return <tr key={pret.id} className="hover:bg-emerald-50/40">
                <td className="whitespace-nowrap px-5 py-4 font-bold text-emerald-800">PR-{pret.id}</td>
                <td className="px-5 py-4"><NomMembre membre={pret.membre} /></td>
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{montantFR(pret.montant)}</td>
                <td className="max-w-48 truncate px-5 py-4 text-slate-600" title={pret.motif || ""}>{pret.motif || "—"}</td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-500">{dateFR(pret.dateDemande)}</td>
                <td className="px-5 py-4"><span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${info.couleur}`}>{info.label}</span></td>
              </tr>;
            })}{dernieres.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Aucune demande enregistrée.</td></tr>}</tbody>
          </table></div>
        </section>
       
      </>}
    </div>
  );
}
