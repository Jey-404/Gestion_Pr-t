import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AlertCircle, ArrowRight, Banknote, CheckCircle2, FileText, FileUp, Info, RefreshCw, Send, ShieldCheck, X } from "lucide-react";

function dateMoisFR(mois) {
  const texte = typeof mois === "string" ? mois.slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-01$/.test(texte)) return "ce mois";
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${texte}T12:00:00Z`));
}
const nombreFR = (v) => Number(v ?? 0).toLocaleString("fr-FR");
const champ = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";

export default function DemanderPret() {
  const [montant, setMontant] = useState("");
  const [nombreEcheances, setNombreEcheances] = useState("");
  const [datePremiereEcheance, setDatePremiereEcheance] = useState("");
  const [motif, setMotif] = useState("");
  const [description, setDescription] = useState("");
  const [justificatif, setJustificatif] = useState(null);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const fichierRef = useRef(null);
  const [quota, setQuota] = useState(null);
  const [quotaChargement, setQuotaChargement] = useState(true);
  const [quotaErreur, setQuotaErreur] = useState("");
  const [actualisationQuota, setActualisationQuota] = useState(0);

  const chargerQuota = useCallback(async (signal) => {
    setQuotaChargement(true);
    setQuotaErreur("");
    try {
      const reponse = await fetch("/api/membre/quota", { credentials: "same-origin", signal });
      const data = await reponse.json().catch(() => ({}));
      if (reponse.status === 401) {
        if (!signal?.aborted) setSessionExpiree(true);
        throw new Error("Session expirée.");
      }
      if (!reponse.ok || !data.success) throw new Error(data.message || "Impossible de charger le quota mensuel.");
      const brut = data.quota;
      if (!brut || typeof brut !== "object") throw new Error("Réponse du quota invalide.");
      const limite = Number(brut.limite), utilise = Number(brut.utilise), restant = Number(brut.restant);
      if (![limite, utilise, restant].every(n => Number.isSafeInteger(n) && n >= 0)) {
        throw new Error("Le serveur a renvoyé des valeurs de quota invalides.");
      }
      if (!signal?.aborted) {
        setQuota({ actif: brut.actif === true || brut.actif === 1, mois: brut.mois ?? null, limite, utilise, restant });
        setSessionExpiree(false);
      }
    } catch (e) {
      if (!signal?.aborted && e.name !== "AbortError") { setQuota(null); setQuotaErreur(e.message || "Serveur inaccessible."); }
    } finally { if (!signal?.aborted) setQuotaChargement(false); }
  }, []);

  useEffect(() => {
    const controleur = new AbortController();
    chargerQuota(controleur.signal);
    return () => controleur.abort();
  }, [chargerQuota, actualisationQuota]);

  const quotaDisponible = !quotaChargement && !quotaErreur && Boolean(quota?.actif) && Number(quota?.restant) > 0;
  const pourcentage = quota?.limite > 0 ? Math.min(100, (quota.utilise / quota.limite) * 100) : 0;
  const montantParEcheance = Number(montant) > 0 && Number(nombreEcheances) > 0
    ? Math.ceil(Number(montant) / Number(nombreEcheances))
    : 0;

  async function gererSoumission(event) {
    event.preventDefault();
    if (envoi || sessionExpiree) return;
    setErreur(""); setSucces("");
    const valeur = Number(montant);
    if (!Number.isSafeInteger(valeur) || valeur <= 0 || valeur > 999999999999) { setErreur("Saisissez un montant valide en FCFA."); return; }
    if (!quotaDisponible) { setErreur("Aucune place disponible dans le quota mensuel. Actualisez le quota."); return; }
    if (
      !Number.isInteger(Number(nombreEcheances)) ||
      Number(nombreEcheances) < 1 ||
      Number(nombreEcheances) > 60 ||
      Number(nombreEcheances) > valeur ||
      !/^\d{4}-\d{2}-\d{2}$/.test(datePremiereEcheance)
    ) {
      setErreur("Veuillez vérifier le nombre d’échéances et la date de première échéance.");
      return;
    }
    if (motif.trim().length < 3 || motif.trim().length > 150 || description.trim().length < 10 || description.trim().length > 2000) {
      setErreur("Motif : 3 à 150 caractères. Description : 10 à 2000 caractères."); return;
    }
    if (!justificatif || !["application/pdf", "image/jpeg", "image/png"].includes(justificatif.type) || justificatif.size > 5 * 1024 * 1024) {
      setErreur("Choisissez un PDF, JPG ou PNG de 5 Mo maximum."); return;
    }
    const donneesFormulaire = new FormData();
    donneesFormulaire.append("montant", String(valeur));
    donneesFormulaire.append("motif", motif.trim());
    donneesFormulaire.append("description", description.trim());
    donneesFormulaire.append("nombreEcheances", nombreEcheances);
    donneesFormulaire.append("datePremiereEcheance", datePremiereEcheance);
    donneesFormulaire.append("justificatif", justificatif);
    setEnvoi(true);
    try {
      const reponse = await fetch("/api/membre/prets", { method: "POST", credentials: "same-origin", body: donneesFormulaire });
      const donnees = await reponse.json().catch(() => null);
      if (reponse.status === 401) { setSessionExpiree(true); setErreur("Session expirée."); return; }
      if (!reponse.ok || !donnees?.success) {
        setErreur(donnees?.message || `Échec de la soumission (HTTP ${reponse.status}).`);
        if (reponse.status === 409) setActualisationQuota(n => n + 1);
        return;
      }
      setSucces(`Votre demande PR-${donnees.pret.id} et l’échéancier souhaité ont été transmis pour examen.`);
      setMontant(""); setMotif(""); setDescription(""); setNombreEcheances(""); setDatePremiereEcheance(""); setJustificatif(null);
      if (fichierRef.current) fichierRef.current.value = "";
      setActualisationQuota(n => n + 1);
    } catch {
      setErreur("Réponse indisponible. Vérifiez dans Mes prêts que la demande n'a pas déjà été enregistrée avant de réessayer.");
      setActualisationQuota(n => n + 1);
    } finally { setEnvoi(false); }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border border-white/15" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"><ShieldCheck size={15} /> Espace Membre</span>
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Demander un prêt</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100">Définissez votre échéancier souhaité. La direction l’examinera avec votre dossier avant toute mise en place.</p>
          </div>
          <Link to="/membre/mes-prets" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/25"><FileText size={18} /> Mes prêts <ArrowRight size={16} /></Link>
        </div>
      </header>

      

      <form onSubmit={gererSoumission} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Banknote size={21} className="text-emerald-700" /> Informations de la demande</h2><p className="mt-1 text-sm text-slate-500">Les champs marqués * sont obligatoires.</p></div>
        <div className="space-y-6 p-5 sm:p-7">
          <div><label htmlFor="montant-pret" className="mb-2 block text-sm font-semibold text-slate-700">Montant demandé (FCFA) *</label><input id="montant-pret" type="number" min="1" max="999999999999" step="1" required value={montant} onChange={e => setMontant(e.target.value)} placeholder="Exemple : 150000" className={champ} /></div>
          <section aria-labelledby="titre-echeancier" className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
            <div>
              <h3 id="titre-echeancier" className="font-bold text-slate-900">Échéancier souhaité</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Choisissez le nombre de mensualités et la date de la première. Cet échéancier sera transmis à la direction et au service comptable.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nombre-echeances" className="mb-2 block text-sm font-semibold text-slate-700">Nombre de mensualités *</label>
                <input id="nombre-echeances" type="number" min="1" max={montant ? Math.min(60, Number(montant)) : 60} step="1" required value={nombreEcheances} onChange={e => setNombreEcheances(e.target.value)} placeholder="Exemple : 6" className={champ} />
                <p className="mt-1 text-xs text-slate-500">De 1 à 60 mensualités, dans la limite du montant demandé en FCFA.</p>
              </div>
              <div>
                <label htmlFor="date-premiere-echeance" className="mb-2 block text-sm font-semibold text-slate-700">Date de la première mensualité *</label>
                <input id="date-premiere-echeance" type="date" required value={datePremiereEcheance} onChange={e => setDatePremiereEcheance(e.target.value)} className={champ} />
              </div>
            </div>
            {montantParEcheance > 0 && (
              <p className="text-sm font-medium text-emerald-900">
                Estimation indicative : environ {nombreFR(montantParEcheance)} FCFA par mensualité, hors validation du dossier.
              </p>
            )}
          </section>
          <div><label htmlFor="motif-pret" className="mb-2 block text-sm font-semibold text-slate-700">Motif du prêt *</label><input id="motif-pret" type="text" required minLength={3} maxLength={150} value={motif} onChange={e => setMotif(e.target.value)} placeholder="Exemple : Frais scolaires" className={champ} /></div>
          <div><div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="description-pret" className="text-sm font-semibold text-slate-700">Description de la demande *</label><span className="text-xs text-slate-400">{description.length}/2000</span></div><textarea id="description-pret" rows={5} required minLength={10} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} placeholder="Expliquez votre besoin et l'utilisation prévue du prêt..." className={`${champ} resize-y`} /></div>
          <div><label htmlFor="justificatif-pret" className="mb-2 block text-sm font-semibold text-slate-700">Pièce justificative *</label><div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-5 sm:p-6"><FileUp size={27} className="mb-3 text-emerald-700" /><input ref={fichierRef} id="justificatif-pret" type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={e => { setJustificatif(e.target.files?.[0] || null); setErreur(""); }} className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" /><p className="mt-3 text-xs text-slate-500">PDF, JPG ou PNG • 5 Mo maximum</p>{justificatif && <p className="mt-3 break-all text-sm font-semibold text-emerald-700">Fichier : {justificatif.name}</p>}</div></div>
          {erreur && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={19} className="shrink-0" /> {erreur}</div>}
          {succes && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 size={19} className="shrink-0" /><div>{succes}<Link to="/membre/mes-prets" className="mt-2 block underline">Voir mes prêts</Link></div></div>}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5"><p className="text-xs text-slate-500">Votre demande sera soumise à validation.</p><button type="submit" disabled={envoi || sessionExpiree || !quotaDisponible || !montant} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><Send size={18} />{envoi ? "Enregistrement..." : "Soumettre ma demande"}</button></div>
        </div>
      </form>
    </div>
  );
}
