import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertCircle, CalendarDays, CheckCircle2, LockKeyhole, Mail, Pencil, Phone, Save, ShieldCheck, UserRound, X } from "lucide-react";
import ChangerMotDePasse from "../../components/membre/ChangerMotDePasse";

function afficherDate(valeur) {
  if (!valeur) return "Non renseignée";
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? "Non renseignée" : date.toLocaleDateString("fr-FR");
}
const styleChamp = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";
function Information({ Icone, label, children }) {
  return <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4"><div className="shrink-0 rounded-lg bg-white p-2.5 text-emerald-700 shadow-sm"><Icone size={18} /></div><div className="min-w-0 flex-1"><p className="mb-1 text-xs font-medium text-slate-500">{label}</p><div className="break-words text-sm font-semibold text-slate-900">{children}</div></div></div>;
}

export default function ProfilMembre() {
  const [profil, setProfil] = useState(null);
  const [formulaire, setFormulaire] = useState({ telephone: "", email: "" });
  const [modification, setModification] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const [actualisation, setActualisation] = useState(0);

  const chargerProfil = useCallback(async (signal) => {
    setChargement(true); setErreur(""); setSessionExpiree(false);
    try {
      const reponse = await fetch("/api/membre/profil", { method: "GET", credentials: "same-origin", signal });
      if (reponse.status === 401) { if (!signal?.aborted) setSessionExpiree(true); throw new Error("Session expirée."); }
      const donnees = await reponse.json().catch(() => ({}));
      if (!reponse.ok || !donnees.success || !donnees.profil) throw new Error(donnees.message || "Impossible de charger votre profil.");
      if (signal?.aborted) return;
      setProfil(donnees.profil);
      setFormulaire({ telephone: donnees.profil.telephone || "", email: donnees.profil.email || "" });
    } catch (e) { if (e.name !== "AbortError" && !signal?.aborted) setErreur(e.message || "Serveur inaccessible."); }
    finally { if (!signal?.aborted) setChargement(false); }
  }, []);

  useEffect(() => { const c = new AbortController(); chargerProfil(c.signal); return () => c.abort(); }, [chargerProfil, actualisation]);

  function commencerModification() {
    if (!profil) return;
    setFormulaire({ telephone: profil.telephone || "", email: profil.email || "" });
    setErreur(""); setSucces(""); setModification(true);
  }
  function annulerModification() {
    setFormulaire({ telephone: profil?.telephone || "", email: profil?.email || "" });
    setModification(false); setErreur("");
  }
  function gererChangement(event) { const { name, value } = event.target; setFormulaire(ancien => ({ ...ancien, [name]: value })); }

  async function enregistrerProfil(event) {
    event.preventDefault();
    if (enregistrement || sessionExpiree) return;
    setErreur(""); setSucces("");
    const telephone = formulaire.telephone.trim(), email = formulaire.email.trim();
    if (!/^\d{10}$/.test(telephone)) { setErreur("Veuillez saisir un téléphone à 10 chiffres."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErreur("Veuillez saisir une adresse e-mail valide."); return; }
    setEnregistrement(true);
    try {
      const reponse = await fetch("/api/membre/profil", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telephone, email }) });
      if (reponse.status === 401) { setSessionExpiree(true); throw new Error("Session expirée."); }
      const donnees = await reponse.json().catch(() => ({}));
      if (!reponse.ok || !donnees.success || !donnees.profil) throw new Error(donnees.message || "Impossible d'enregistrer les modifications.");
      setProfil(donnees.profil);
      setFormulaire({ telephone: donnees.profil.telephone || "", email: donnees.profil.email || "" });
      setModification(false); setSucces("Vos coordonnées ont été mises à jour.");
    } catch (e) { setErreur(e.message || "Enregistrement impossible."); }
    finally { setEnregistrement(false); }
  }

  if (chargement) return <div role="status" className="mx-auto max-w-4xl space-y-4 p-4"><div className="h-40 animate-pulse rounded-3xl bg-emerald-100" /><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /></div>;
  if (!profil) return <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6"><p role="alert" className="text-red-700">{erreur || "Profil indisponible."}</p>{!sessionExpiree && <button type="button" onClick={() => setActualisation(n => n + 1)} className="mt-3 font-semibold text-emerald-700 underline">Réessayer</button>}</div>;

  const nomComplet = [profil.prenom, profil.nom].filter(Boolean).join(" ") || "Membre";
  const initiales = [profil.prenom?.trim()?.[0], profil.nom?.trim()?.[0]].filter(Boolean).join("").toUpperCase() || "M";
  return <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8"><span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"><ShieldCheck size={15} /> Espace Membre</span><h1 className="mt-4 text-2xl font-bold sm:text-3xl">Mon profil</h1><p className="mt-2 text-sm text-emerald-100">Gérez vos coordonnées et la sécurité de votre compte.</p><div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-bold text-emerald-800">{initiales}</div><div className="min-w-0"><p className="break-words text-lg font-bold sm:text-xl">{nomComplet}</p><p className="mt-1 text-sm text-emerald-100">N° membre : {profil.numeroMembre || "Non attribué"}</p></div></div></header>
    {succes && <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={20} className="shrink-0" />{succes}</div>}
    {erreur && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={20} className="shrink-0" /><div>{erreur}</div></div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><UserRound size={20} className="text-emerald-700" /> Informations personnelles</h2><p className="mt-1 text-sm text-slate-500">Vos informations enregistrées dans l'association</p></div>{!modification && <button type="button" onClick={commencerModification} disabled={sessionExpiree} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"><Pencil size={17} /> Modifier</button>}</div>
      <form onSubmit={enregistrerProfil} className="space-y-5 p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><Information Icone={UserRound} label="Nom complet">{nomComplet}</Information><Information Icone={CalendarDays} label="Date d'adhésion">{afficherDate(profil.dateAdhesion)}</Information></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"><label htmlFor="telephone-membre" className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500"><Phone size={16} className="text-emerald-700" /> Téléphone</label>{modification ? <input id="telephone-membre" name="telephone" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} pattern="[0-9]{10}" required value={formulaire.telephone} onChange={gererChangement} className={styleChamp} /> : <p className="text-sm font-semibold text-slate-900">{profil.telephone || "Non renseigné"}</p>}</div><div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"><label htmlFor="email-membre" className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500"><Mail size={16} className="text-emerald-700" /> Adresse e-mail</label>{modification ? <input id="email-membre" name="email" type="email" autoComplete="email" maxLength={254} required value={formulaire.email} onChange={gererChangement} className={styleChamp} /> : <p className="break-all text-sm font-semibold text-slate-900">{profil.email || "Non renseignée"}</p>}</div></div>{modification && <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" disabled={enregistrement} onClick={annulerModification} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><X size={17} />Annuler</button><button type="submit" disabled={enregistrement || sessionExpiree} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"><Save size={17} />{enregistrement ? "Enregistrement..." : "Enregistrer"}</button></div>}</form>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><LockKeyhole size={20} className="text-emerald-700" /> Sécurité du compte</h2><p className="mt-3 text-sm leading-6 text-slate-600">Votre compte est protégé par votre session de connexion. Vous pouvez modifier votre mot de passe dans le formulaire ci-dessous.</p></section>
    <ChangerMotDePasse />
  </div>;
}
