import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bell, BellOff, CheckCircle2, Clock3, RefreshCw, ShieldCheck } from "lucide-react";

function dateFR(valeur) { if (!valeur) return ""; const d = new Date(valeur); return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("fr-FR"); }
export default function Notifications() {
  const [items, setItems] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [lectureEnCours, setLectureEnCours] = useState(null);

  const charger = useCallback(async (signal) => {
    try {
      const r = await fetch("/api/membre/notifications", { credentials: "same-origin", signal });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.message || "Erreur de chargement");
      if (!signal?.aborted) { setItems(Array.isArray(d.notifications) ? d.notifications : []); setErreur(""); }
    } catch (e) { if (e.name !== "AbortError" && !signal?.aborted) setErreur(e.message || "Serveur inaccessible."); }
    finally { if (!signal?.aborted) setChargement(false); }
  }, []);

  useEffect(() => {
    const controleur = new AbortController();
    charger(controleur.signal);
    const interval = setInterval(() => charger(controleur.signal), 30000);
    return () => { controleur.abort(); clearInterval(interval); };
  }, [charger, refresh]);

  async function lire(id) {
    if (lectureEnCours !== null) return;
    setLectureEnCours(id);
    try {
      const r = await fetch(`/api/membre/notifications/${encodeURIComponent(id)}/lue`, { method: "PATCH", credentials: "same-origin" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.message || "Erreur de mise à jour");
      await charger();
    } catch (e) { setErreur(e.message || "Impossible de marquer comme lue."); }
    finally { setLectureEnCours(null); }
  }
  const nonLues = items.filter(n => !n.lu).length;
  return <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"><ShieldCheck size={15} /> Espace Membre</span><h1 className="mt-4 text-2xl font-bold sm:text-3xl">Mes notifications</h1><p className="mt-2 text-sm text-emerald-100">Suivez les mises à jour et les décisions relatives à vos demandes.</p></div><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"><Bell size={31} /></div></div></header>
    <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"><Bell size={23} /></div><p className="mt-4 text-sm font-medium text-slate-500">Notifications reçues</p><p className="mt-1 text-3xl font-bold text-slate-900">{chargement ? "…" : items.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="inline-flex rounded-xl bg-amber-50 p-3 text-amber-700"><Clock3 size={23} /></div><p className="mt-4 text-sm font-medium text-slate-500">Non lues</p><p className="mt-1 text-3xl font-bold text-slate-900">{chargement ? "…" : nonLues}</p></div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Bell className="text-emerald-700" size={21} /> Centre de notifications</h2><p className="mt-1 text-sm text-slate-500">Actualisation automatique toutes les 30 secondes.</p></div><button type="button" disabled={chargement} onClick={() => { setChargement(true); setRefresh(n => n + 1); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} className={chargement ? "animate-spin" : ""} /> Actualiser</button></div>
      {erreur && <div role="alert" className="m-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" /> {erreur}</div>}
      {chargement ? <div role="status" className="space-y-3 p-5">{[1,2,3].map(n => <div key={n} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div> : items.length === 0 ? <div className="flex flex-col items-center gap-3 px-5 py-16 text-center"><div className="rounded-full bg-emerald-50 p-5"><BellOff size={30} className="text-emerald-600" /></div><p className="font-semibold text-slate-800">Aucune notification pour le moment</p><p className="text-sm text-slate-500">Les nouvelles informations sur vos prêts apparaîtront ici.</p></div> : <div className="space-y-3 p-5 sm:p-6">{items.map(n => <article key={n.id} className={`rounded-2xl border p-5 transition-colors ${n.lu ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50/70"}`}><div className="flex items-start gap-3"><div className={`shrink-0 rounded-xl p-2.5 ${n.lu ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}><Bell size={19} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{n.titre || "Notification"}</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${n.lu ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-800"}`}>{n.lu ? "Lue" : "Nouvelle"}</span></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{n.message}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={14} />{dateFR(n.date)}</span>{!n.lu && <button type="button" disabled={lectureEnCours !== null} onClick={() => lire(n.id)} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-50"><CheckCircle2 size={16} />{lectureEnCours === n.id ? "Enregistrement..." : "Marquer comme lue"}</button>}</div></div></div></article>)}</div>}
    </section>
  </div>;
}
