import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  CalendarDays,
  CalendarPlus,
  RefreshCw,
  AlertCircle,
  Pencil,
  X,
  ShieldCheck,
  Users,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Ban,
  Search,
  ArrowUpRight,
  Save,
} from "lucide-react";

const moisCourant = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function cleMois(valeur) {
  return typeof valeur === "string" ? valeur.slice(0, 7) : "";
}

function libelleMois(mois) {
  const cle = cleMois(mois);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(cle)) return mois || "—";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${cle}-01T12:00:00Z`));
}

const nombreFR = (valeur) => {
  const n = Number(valeur);
  return Number.isFinite(n) ? n.toLocaleString("fr-FR") : "—";
};

function CarteQuota({ titre, valeur, description, Icone, couleur, fond }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-3 ${fond}`}>
          <Icone size={22} className={couleur} />
        </div>
        <ArrowUpRight size={18} className="text-slate-300 transition-colors group-hover:text-emerald-700" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{titre}</p>
      <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{valeur}</p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function QuotaModal({ quota, onFermer, onEnregistrer }) {
  const [mois, setMois] = useState(cleMois(quota?.mois) || moisCourant());
  const [montantTotal, setMontantTotal] = useState(String(quota?.montantTotal ?? ""));
  const [actif, setActif] = useState(quota?.actif ?? true);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const utilise = Number(quota?.montantUtilise ?? 0);
  const montant = Number(montantTotal);
  const formatValide = /^\d{4}-(0[1-9]|1[0-2])$/.test(mois);
  const limiteValide =
    montantTotal.trim() !== "" &&
    Number.isSafeInteger(montant) &&
    montant >= 0 &&
    montant <= 999999999999999 &&
    (!quota || montant >= utilise);

  async function soumettre(e) {
    e.preventDefault();
    if (envoi) return;
    if (!formatValide || !limiteValide) {
      setErreur(
        quota && montant < utilise
          ? "Le budget ne peut pas être inférieur aux prêts déjà approuvés."
          : "Saisissez un mois valide et un budget entier en FCFA."
      );
      return;
    }
    setErreur("");
    setEnvoi(true);
    try {
      await onEnregistrer({ mois, montantTotal: montant, actif }, Boolean(quota));
    } catch (err) {
      setErreur(err.message || "Impossible d'enregistrer le budget.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="titre-quota-modal" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              {quota ? <Pencil size={21} /> : <CalendarPlus size={21} />}
            </span>
            <div>
              <h2 id="titre-quota-modal" className="text-lg font-bold text-slate-900">
                {quota ? "Modifier le budget" : "Créer un budget mensuel"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">Enveloppe financière disponible pour le mois</p>
            </div>
          </div>
          <button type="button" onClick={onFermer} disabled={envoi} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-50"><X size={20} /></button>
        </div>
        <form onSubmit={soumettre} className="space-y-5 p-5 sm:p-6">
          <div>
            <label htmlFor="quota-mois" className="mb-2 block text-sm font-semibold text-slate-700">Mois concerné</label>
            <input id="quota-mois" type="month" value={mois} disabled={Boolean(quota) || envoi} onChange={(e) => setMois(e.target.value)} required className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
            {quota && <p className="mt-2 text-xs text-slate-500">Le mois ne peut pas être modifié après création.</p>}
          </div>
          <div>
            <label htmlFor="quota-limite" className="mb-2 block text-sm font-semibold text-slate-700">Budget mensuel (FCFA)</label>
            <input id="quota-limite" type="number" min="0" max="999999999999999" step="1" required value={montantTotal} onChange={(e) => setMontantTotal(e.target.value)} disabled={envoi} placeholder="Ex. : 1 000 000" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50" />
            {quota && <p className="mt-2 text-xs text-slate-500">Déjà engagés : {nombreFR(utilise)} FCFA ({nombreFR(quota.nombreDemandes)} demande(s) déposée(s))</p>}
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span>
              <span className="block text-sm font-semibold text-slate-800">Budget actif</span>
              <span className="mt-1 block text-xs text-slate-500">Autoriser les nouvelles demandes ce mois</span>
            </span>
            <input type="checkbox" checked={Boolean(actif)} onChange={(e) => setActif(e.target.checked)} disabled={envoi} className="h-5 w-5 accent-emerald-700" />
          </label>
          {erreur && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={onFermer} disabled={envoi} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
            <button type="submit" disabled={envoi || !formatValide || !limiteValide} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><Save size={17} />{envoi ? "Enregistrement..." : quota ? "Enregistrer" : "Créer le budget"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function GestionQuotas() {
  const [quotas, setQuotas] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [actualisation, setActualisation] = useState(0);
  const [selection, setSelection] = useState(undefined);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setChargement(true);
      setErreur("");
      try {
        const resp = await fetch("/api/admin/quotas", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.success) {
          throw new Error(data.message || `Erreur HTTP ${resp.status}`);
        }
        if (!controller.signal.aborted) {
          setQuotas(Array.isArray(data.quotas) ? data.quotas : []);
        }
      } catch (e) {
        if (e.name !== "AbortError" && !controller.signal.aborted) {
          setErreur(e.message || "Impossible de charger les quotas.");
        }
      } finally {
        if (!controller.signal.aborted) setChargement(false);
      }
    })();
    return () => controller.abort();
  }, [actualisation]);

  const courant = useMemo(() => quotas.find((q) => cleMois(q.mois) === moisCourant()), [quotas]);
  const restant = courant
    ? Math.max(0, Number(courant.montantTotal) - Number(courant.montantUtilise))
    : 0;
  const visibles = useMemo(() => {
    const texte = recherche.trim().toLocaleLowerCase("fr");
    return quotas.filter((q) => {
      const correspondRecherche =
        !texte || `${cleMois(q.mois)} ${libelleMois(q.mois)}`.toLocaleLowerCase("fr").includes(texte);
      const correspondStatut = filtre === "tous" || (filtre === "actif" ? Boolean(q.actif) : !q.actif);
      return correspondRecherche && correspondStatut;
    });
  }, [quotas, recherche, filtre]);

  async function enregistrer(donnees, modification) {
    const url = modification
      ? `/api/admin/quotas/${encodeURIComponent(donnees.mois)}`
      : "/api/admin/quotas";
    const resp = await fetch(url, {
      method: modification ? "PATCH" : "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donnees),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.success) {
      throw new Error(data.message || `Erreur HTTP ${resp.status}`);
    }
    setSelection(undefined);
    setMessage(data.message || "Budget enregistré.");
    setActualisation((n) => n + 1);
  }

  return (
    <div className="w-full space-y-7 pb-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-12 top-14 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50"><ShieldCheck size={15} /> Espace Administrateur</div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestion des budgets mensuels</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100">Définissez l'enveloppe mensuelle, suivez les montants engagés et contrôlez l'ouverture des demandes.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setActualisation((n) => n + 1)} disabled={chargement} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"><RefreshCw size={17} className={chargement ? "animate-spin" : ""} />Actualiser</button>
            <button type="button" onClick={() => { setMessage(""); setSelection(null); }} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"><CalendarPlus size={18} />Nouveau budget</button>
          </div>
        </div>
      </header>

      {erreur && <div role="alert" className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={19} />{erreur}</div>}
      {message && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"><CheckCircle2 size={19} />{message}</div>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Statistiques du budget actuel">
        <CarteQuota titre="Budget du mois" valeur={chargement ? "…" : courant ? `${nombreFR(courant.montantTotal)} FCFA` : "—"} description={libelleMois(moisCourant())} Icone={CalendarDays} couleur="text-emerald-700" fond="bg-emerald-50" />
        <CarteQuota titre="Demandes déposées" valeur={chargement ? "…" : courant ? nombreFR(courant.nombreDemandes) : "—"} description="Toutes les demandes reçues ce mois" Icone={Users} couleur="text-blue-700" fond="bg-blue-50" />
        <CarteQuota titre="Budget disponible" valeur={chargement ? "…" : courant ? (courant.actif ? `${nombreFR(restant)} FCFA` : "Suspendu") : "—"} description={courant?.actif ? "Solde après les prêts approuvés" : "Budget inactif ou non défini"} Icone={ChartNoAxesColumnIncreasing} couleur="text-amber-700" fond="bg-amber-50" />
      </section>

      {courant && !chargement && !erreur && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="font-bold text-slate-900">Consommation du budget actuel</h2><p className="mt-1 text-xs text-slate-500">{nombreFR(courant.montantUtilise)} FCFA engagés sur {nombreFR(courant.montantTotal)} FCFA · {nombreFR(courant.nombreDemandes)} demande(s) déposée(s)</p></div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${courant.actif ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{courant.actif ? "Actif" : "Suspendu"}</span>
          </div>
          <div role="progressbar" aria-label="Budget consommé" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, Math.round((Number(courant.montantUtilise) / Math.max(1, Number(courant.montantTotal))) * 100)))} className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, (Number(courant.montantUtilise) / Math.max(1, Number(courant.montantTotal))) * 100))}%` }} />
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div><h2 className="text-lg font-bold text-slate-900">Budgets enregistrés</h2><p className="mt-1 text-sm text-slate-500">Seuls les prêts approuvés et leurs statuts suivants sont pris en compte.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{quotas.length} budget(s)</span>
        </div>
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-5">
          <div className="relative min-w-[220px] flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" aria-label="Rechercher un mois" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un mois..." className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></div>
          <select aria-label="Filtrer les budgets par statut" value={filtre} onChange={(e) => setFiltre(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"><option value="tous">Tous les statuts</option><option value="actif">Actifs</option><option value="suspendu">Suspendus</option></select>
        </div>
        {chargement ? <p role="status" className="p-8 text-sm text-slate-500">Chargement des budgets...</p> : !erreur && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr>{["Mois", "Budget", "Engagé", "Demandes", "Disponible", "Statut", "Action"].map((titre) => <th key={titre} className="px-5 py-4 font-semibold">{titre}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((q) => <tr key={q.mois} className="hover:bg-emerald-50/40">
                  <td className="whitespace-nowrap px-5 py-4 font-semibold capitalize text-slate-900">{libelleMois(q.mois)}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{nombreFR(q.montantTotal)} FCFA</td>
                  <td className="px-5 py-4 text-slate-600">{nombreFR(q.montantUtilise)} FCFA</td>
                  <td className="px-5 py-4 text-slate-600">{nombreFR(q.nombreDemandes)}</td>
                  <td className="px-5 py-4 text-slate-600">{nombreFR(Math.max(0, Number(q.montantTotal) - Number(q.montantUtilise)))} FCFA</td>
                  <td className="px-5 py-4">{q.actif ? <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} />Actif</span> : <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"><Ban size={14} />Suspendu</span>}</td>
                  <td className="px-5 py-4"><button type="button" onClick={() => { setMessage(""); setSelection(q); }} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><Pencil size={15} />Modifier</button></td>
                </tr>)}
                {visibles.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">Aucun budget ne correspond à votre recherche.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs text-slate-500">Le budget disponible est calculé à partir des prêts approuvés pour le mois concerné.</div>
      </section>
      {selection !== undefined && <QuotaModal key={selection?.mois ?? "nouveau"} quota={selection} onFermer={() => setSelection(undefined)} onEnregistrer={enregistrer} />}
    </div>
  );
}
