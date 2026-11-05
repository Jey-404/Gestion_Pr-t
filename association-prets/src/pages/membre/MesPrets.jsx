import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertCircle, CheckCircle2, Clock3, Eye, FileText, Filter, Plus, RefreshCw, Search, ShieldCheck, Wallet } from "lucide-react";

const STATUTS = {
  brouillon: ["Brouillon", "bg-slate-100 text-slate-700"],
  soumis: ["Soumis", "bg-blue-50 text-blue-700"],
  en_verification: ["En vérification", "bg-amber-50 text-amber-700"],
  en_decision: ["En décision", "bg-violet-50 text-violet-700"],
  rejete: ["Rejeté", "bg-red-50 text-red-700"],
  refuse: ["Refusé", "bg-red-50 text-red-700"],
  approuve: ["Approuvé", "bg-emerald-50 text-emerald-700"],
  decaisse: ["Décaissé", "bg-cyan-50 text-cyan-700"],
  en_remboursement: ["En remboursement", "bg-indigo-50 text-indigo-700"],
  rembourse: ["Remboursé", "bg-green-100 text-green-800"],
};
const monnaie = valeur => { const n = Number(valeur); return Number.isFinite(n) ? `${n.toLocaleString("fr-FR")} FCFA` : "—"; };
const dateFR = valeur => { const d = new Date(valeur); return valeur && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("fr-FR") : "—"; };
function Badge({ statut }) { const [titre, couleur] = STATUTS[statut] || [statut || "Inconnu", "bg-slate-100 text-slate-600"]; return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${couleur}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{titre}</span>; }
function Carte({ titre, valeur, Icone, couleur }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`inline-flex rounded-xl p-3 ${couleur}`}><Icone size={22} /></div><p className="mt-4 text-sm font-medium text-slate-500">{titre}</p><p className="mt-1 text-3xl font-bold text-slate-900">{valeur}</p></div>; }

export default function MesPrets() {
  const [prets, setPrets] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("tous");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const [actualisation, setActualisation] = useState(0);

  useEffect(() => {
    const controleur = new AbortController();
    async function chargerPrets() {
      setChargement(true); setErreur(""); setSessionExpiree(false);
      try {
        const reponse = await fetch("/api/membre/prets", { method: "GET", credentials: "same-origin", signal: controleur.signal });
        const donnees = await reponse.json().catch(() => ({}));
        if (reponse.status === 401) { if (!controleur.signal.aborted) setSessionExpiree(true); throw new Error("Session expirée."); }
        if (!reponse.ok || !donnees.success) throw new Error(donnees.message || "Impossible de charger vos prêts.");
        if (!controleur.signal.aborted) setPrets(Array.isArray(donnees.prets) ? donnees.prets : []);
      } catch (e) { if (e.name !== "AbortError" && !controleur.signal.aborted) setErreur(e.message || "Serveur inaccessible."); }
      finally { if (!controleur.signal.aborted) setChargement(false); }
    }
    chargerPrets(); return () => controleur.abort();
  }, [actualisation]);

  const filtres = useMemo(() => prets.filter(p => {
    const texte = [p.id, `PR-${p.id}`, p.motif, p.description].filter(Boolean).join(" ").toLowerCase();
    return texte.includes(recherche.trim().toLowerCase()) && (statut === "tous" || statut === p.statut);
  }), [prets, recherche, statut]);
  const enCours = prets.filter(p => ["soumis", "en_verification", "en_decision"].includes(p.statut)).length;
  const approuves = prets.filter(p => ["approuve", "decaisse", "en_remboursement", "rembourse"].includes(p.statut)).length;

  return <div className="w-full space-y-6 pb-8">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8"><div className="relative flex flex-wrap items-center justify-between gap-4"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"><ShieldCheck size={15} /> Espace Membre</span><h1 className="mt-4 text-2xl font-bold sm:text-3xl">Mes prêts</h1><p className="mt-2 text-sm text-emerald-100">Consultez toutes vos demandes et suivez chaque étape de traitement.</p></div><Link to="/membre/demander-pret" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"><Plus size={18} /> Nouvelle demande</Link></div></header>
    {!erreur && <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Carte titre="Mes demandes" valeur={chargement ? "…" : prets.length} Icone={FileText} couleur="bg-emerald-50 text-emerald-700" /><Carte titre="En cours de traitement" valeur={chargement ? "…" : enCours} Icone={Clock3} couleur="bg-amber-50 text-amber-700" /><Carte titre="Approuvées / financées" valeur={chargement ? "…" : approuves} Icone={CheckCircle2} couleur="bg-blue-50 text-blue-700" /></div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Wallet className="text-emerald-700" size={21} /> Historique de mes demandes</h2><p className="mt-1 text-sm text-slate-500">Vos demandes sont classées de la plus récente à la plus ancienne.</p></div><button type="button" disabled={chargement} onClick={() => setActualisation(n => n + 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} className={chargement ? "animate-spin" : ""} />Actualiser</button></div>
      <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-[1fr_220px]"><div className="relative"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" aria-label="Rechercher un prêt" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Référence, motif, description..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></div><div className="relative"><Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select aria-label="Filtrer par statut" value={statut} onChange={e => setStatut(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-500"><option value="tous">Tous les statuts</option>{Object.entries(STATUTS).map(([cle, info]) => <option key={cle} value={cle}>{info[0]}</option>)}</select></div></div>
      {erreur && <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><div className="flex items-start gap-2"><AlertCircle size={18} className="shrink-0" /><span>{erreur}</span></div>{!sessionExpiree && <button type="button" className="mt-2 font-semibold underline" onClick={() => setActualisation(n => n + 1)}>Réessayer</button>}</div>}
      {chargement ? <div role="status" className="space-y-3 p-5">{[1,2,3].map(n => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div> : !erreur && <><p className="px-5 py-3 text-xs text-slate-500">{filtres.length} demande(s) affichée(s) sur {prets.length}</p><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Référence", "Motif", "Montant", "Date", "Statut", "Justificatif", "Action"].map(t => <th key={t} className="px-5 py-4 font-semibold">{t}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtres.map(p => <tr key={p.id} className="hover:bg-emerald-50/30"><td className="whitespace-nowrap px-5 py-4 font-bold text-emerald-800">PR-{p.id}</td><td className="max-w-[190px] truncate px-5 py-4 text-slate-700" title={p.motif || ""}>{p.motif || "—"}</td><td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{monnaie(p.montant)}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{dateFR(p.dateDemande)}</td><td className="px-5 py-4"><Badge statut={p.statut} /></td><td className="px-5 py-4">{p.justificatifPresent ? <span className="text-xs font-medium text-emerald-700">Déposé</span> : <span className="text-xs text-amber-700">Absent</span>}</td><td className="px-5 py-4"><Link to={`/membre/mes-prets/${p.id}`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><Eye size={15} /> Détails</Link></td></tr>)}{filtres.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-sm text-slate-500">{prets.length ? "Aucune demande ne correspond aux filtres." : "Vous n'avez encore aucune demande de prêt."}</td></tr>}</tbody></table></div></>}
    </section>
  </div>;
}
