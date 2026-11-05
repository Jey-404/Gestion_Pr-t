import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft, FileText, Clock3, Wallet, CalendarDays,
  ShieldCheck, Paperclip, RefreshCw, AlertCircle,
  CheckCircle2, ArrowRight, Info, ClipboardList,
} from "lucide-react";

import ApercuJustificatif from "../../components/membre/ApercuJustificatif";
import SuiviFinancierMembre from "../../components/membre/SuiviFinancierMembre";

const STATUTS = {
  soumis: { label: "Soumis", style: "bg-slate-100 text-slate-700", etape: 1 },
  en_verification: { label: "En vérification", style: "bg-amber-50 text-amber-700", etape: 2 },
  en_decision: { label: "En décision", style: "bg-violet-50 text-violet-700", etape: 3 },
  approuve: { label: "Approuvé", style: "bg-emerald-50 text-emerald-700", etape: 4 },
  rejete: { label: "Rejeté", style: "bg-rose-50 text-rose-700", etape: 3 },
  refuse: { label: "Refusé", style: "bg-rose-50 text-rose-700", etape: 3 },
  decaisse: { label: "Décaissé", style: "bg-blue-50 text-blue-700", etape: 5 },
  en_remboursement: { label: "En remboursement", style: "bg-cyan-50 text-cyan-700", etape: 5 },
  rembourse: { label: "Remboursé", style: "bg-emerald-50 text-emerald-800", etape: 5 },
};
const ETAPES = ["Soumission", "Vérification", "Décision", "Approbation", "Suivi financier"];

function dateFR(valeur) {
  if (!valeur) return "—";
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}
function montantFR(valeur) {
  const montant = Number(valeur);
  return Number.isFinite(montant) ? `${montant.toLocaleString("fr-FR")} FCFA` : "—";
}
function BadgeStatut({ statut }) {
  const info = STATUTS[statut] || { label: statut || "Inconnu", style: "bg-slate-100 text-slate-700" };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${info.style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{info.label}
    </span>
  );
}
function BlocInfo({ titre, children, Icone }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icone size={15} className="text-emerald-700" />{titre}
      </div>
      <div className="mt-2 break-words text-sm font-semibold leading-6 text-slate-900">{children}</div>
    </div>
  );
}

export default function DetailPret() {
  const { id } = useParams();
  const [pret, setPret] = useState(null);
  const [finances, setFinances] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [erreurFinances, setErreurFinances] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const [actualisation, setActualisation] = useState(0);

  useEffect(() => {
    const controleur = new AbortController();
    async function charger() {
      setChargement(true);
      setErreur("");
      setErreurFinances("");
      setSessionExpiree(false);
      setPret(null);
      setFinances(null);

      try {
        const reponse = await fetch(`/api/membre/prets/${encodeURIComponent(id)}`, {
          credentials: "same-origin", signal: controleur.signal,
        });
        const donnees = await reponse.json().catch(() => ({}));
        if (reponse.status === 401) {
          setSessionExpiree(true);
          throw new Error("Session expirée.");
        }
        if (!reponse.ok || !donnees.success || !donnees.pret) {
          throw new Error(donnees.message || "Dossier introuvable.");
        }
        if (controleur.signal.aborted) return;
        setPret(donnees.pret);

        // Le suivi financier reste indépendant du chargement du dossier.
        try {
          const responseFinances = await fetch(
            `/api/membre/prets/${encodeURIComponent(id)}/finances`,
            { credentials: "same-origin", signal: controleur.signal }
          );
          const donneesFinances = await responseFinances.json().catch(() => ({}));
          if (responseFinances.status === 401) setSessionExpiree(true);
          if (!responseFinances.ok || !donneesFinances.success) {
            throw new Error(donneesFinances.message || "Suivi financier indisponible.");
          }
          if (!controleur.signal.aborted) setFinances(donneesFinances.finances);
        } catch (e) {
          if (e.name !== "AbortError" && !controleur.signal.aborted) {
            setErreurFinances(e.message || "Suivi financier indisponible.");
          }
        }
      } catch (e) {
        if (e.name !== "AbortError" && !controleur.signal.aborted) {
          setErreur(e.message || "Impossible de charger ce dossier.");
        }
      } finally {
        if (!controleur.signal.aborted) setChargement(false);
      }
    }
    charger();
    return () => controleur.abort();
  }, [id, actualisation]);

  const rafraichir = useCallback(() => setActualisation(n => n + 1), []);

  if (chargement) {
    return (
      <div role="status" className="mx-auto max-w-6xl space-y-5 animate-pulse">
        <div className="h-40 rounded-3xl bg-emerald-100" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-72 rounded-2xl bg-slate-100" />
          <div className="h-72 rounded-2xl bg-slate-100" />
        </div>
        <span className="sr-only">Chargement du dossier...</span>
      </div>
    );
  }

  if (erreur || !pret) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-7 shadow-sm">
        <AlertCircle className="text-red-600" size={28} />
        <h1 className="mt-3 text-xl font-bold text-slate-900">Impossible d'afficher ce dossier</h1>
        <p role="alert" className="mt-2 text-sm text-red-700">{erreur || "Dossier indisponible."}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/membre/mes-prets"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
            <ArrowLeft size={17} />Retour à mes prêts
          </Link>
          {!sessionExpiree && <button onClick={rafraichir} type="button" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50">Réessayer</button>}
        </div>
      </div>
    );
  }

  const statut = STATUTS[pret.statut] || { etape: 0 };
  const estRefuse = ["rejete", "refuse"].includes(pret.statut);
  const progression = statut.etape ? Math.round((statut.etape / ETAPES.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/membre/mes-prets" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800">
          <ArrowLeft size={17} /> Retour à mes prêts
        </Link>
        <button type="button" onClick={rafraichir} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw size={17} /> Actualiser
        </button>
      </div>

      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-7 top-9 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
              <ShieldCheck size={15} /> Espace Membre
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Dossier PR-{pret.id}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-100">
              <CalendarDays size={16} /> Demande déposée le {dateFR(pret.dateDemande)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs text-emerald-100">Montant demandé</p>
            <p className="mt-1 break-words text-2xl font-bold">{montantFR(pret.montant)}</p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock3 size={20} className="text-emerald-700" />
            <h2 className="font-bold text-slate-900">État de ma demande</h2>
          </div>
          <BadgeStatut statut={pret.statut} />
        </div>
        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar"
          aria-valuenow={progression} aria-valuemin={0} aria-valuemax={100} aria-label="Progression indicative du dossier">
          <div className={`h-full rounded-full transition-all ${estRefuse ? "bg-rose-500" : "bg-emerald-600"}`} style={{ width: `${progression}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {ETAPES.map((etape, index) => (
            <div key={etape} className={`rounded-lg px-2 py-2 text-center text-xs font-medium ${index < statut.etape ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-400"}`}>
              {etape}
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
          <Info size={15} className="mt-0.5 shrink-0" />
          Ces étapes représentent le parcours général de la demande. Elles ne remplacent pas un historique des décisions.
          {estRefuse ? " Cette demande a été refusée." : ""}
        </p>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><ClipboardList size={21} /></span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Informations du dossier</h2>
              <p className="text-xs text-slate-500">Détails de votre demande de prêt</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BlocInfo titre="Montant demandé" Icone={Wallet}>{montantFR(pret.montant)}</BlocInfo>
            <BlocInfo titre="Date de dépôt" Icone={CalendarDays}>{dateFR(pret.dateDemande)}</BlocInfo>
          </div>
          <BlocInfo titre="Motif" Icone={FileText}>{pret.motif || "Non renseigné"}</BlocInfo>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-slate-500"><FileText size={15} className="text-emerald-700" /> Description</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{pret.description || "Non renseignée."}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Paperclip size={21} /></span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pièce justificative</h2>
              <p className="text-xs text-slate-500">Document joint à votre demande</p>
            </div>
          </div>
          <div className="mt-5"><ApercuJustificatif justificatifs={pret.justificatifs || []} /></div>
        </section>
      </div>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
        <h2 className="font-bold text-slate-900">Échéancier souhaité</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {pret.nombreEcheances
            ? `${pret.nombreEcheances} mensualité(s), à partir du ${dateFR(pret.datePremiereEcheance)}. Cet échéancier est soumis à l’examen de la direction.`
            : "Aucun échéancier n’a été enregistré pour cette demande."}
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Wallet size={21} /></span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Suivi financier</h2>
              <p className="text-xs text-slate-500">Décaissement, échéances et remboursements</p>
            </div>
          </div>
          {finances && <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 size={15} /> Données chargées</span>}
        </div>
        <div className="p-5 sm:p-6">
          {erreurFinances && (
            <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle size={19} className="shrink-0" />
              <div>{erreurFinances}</div>
            </div>
          )}
          {finances ? (
            <SuiviFinancierMembre finances={finances} />
          ) : !erreurFinances ? (
            <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Aucune information financière à afficher pour le moment.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
