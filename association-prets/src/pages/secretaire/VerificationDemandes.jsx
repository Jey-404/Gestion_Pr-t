import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Search, RefreshCw, ClipboardCheck, AlertCircle, CheckCircle2,
  Loader2, ShieldCheck, FileText, Clock3, UsersRound,
  ArrowUpRight, Filter, Inbox, UserRound, Info,
} from "lucide-react";
import FicheVerificationModal from "../../components/secretaire/FicheVerificationModal";

const STATUTS = {
  soumis: { label: "Soumis", style: "bg-blue-50 text-blue-700 ring-blue-100" },
  en_verification: { label: "En vérification", style: "bg-amber-50 text-amber-700 ring-amber-100" },
};

function dateFR(valeur) {
  if (!valeur) return "—";
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}
function montantFR(valeur) {
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? `${nombre.toLocaleString("fr-FR")} FCFA` : "—";
}
function nomMembre(membre) {
  return [membre?.prenom, membre?.nom].filter(Boolean).join(" ") || "Membre non renseigné";
}
function initiales(membre) {
  return `${membre?.prenom?.trim()?.[0] || ""}${membre?.nom?.trim()?.[0] || ""}`.toUpperCase() || "M";
}
function BadgeStatut({ statut }) {
  const info = STATUTS[statut] || { label: statut || "Inconnu", style: "bg-slate-100 text-slate-600 ring-slate-200" };
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${info.style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{info.label}
    </span>
  );
}
function StatCard({ titre, valeur, sousTitre, Icone, fond, couleur }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-3 ${fond}`}><Icone size={23} className={couleur} /></div>
        <ArrowUpRight size={18} className="text-slate-300" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{titre}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{valeur.toLocaleString("fr-FR")}</p>
      <p className="mt-2 text-xs text-slate-400">{sousTitre}</p>
    </div>
  );
}

export default function VerificationDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [erreurAction, setErreurAction] = useState("");
  const [succes, setSucces] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("tous");
  const [pretSelectionne, setPretSelectionne] = useState(null);
  const [pretEnTraitement, setPretEnTraitement] = useState(null);
  const [actualisation, setActualisation] = useState(0);

  useEffect(() => {
    const controleur = new AbortController();
    async function chargerDemandes() {
      setChargement(true);
      setErreur("");
      try {
        const reponse = await fetch("/api/secretaire/prets", {
          method: "GET", credentials: "same-origin", signal: controleur.signal,
        });
        if (reponse.status === 401) {
          setSessionExpiree(true);
          throw new Error("Session expirée.");
        }
        if (reponse.status === 403) throw new Error("Accès réservé au compte Secrétaire.");
        const donnees = await reponse.json().catch(() => ({}));
        if (!reponse.ok || !donnees.success) {
          throw new Error(donnees.message || "Impossible de charger les demandes.");
        }
        if (controleur.signal.aborted) return;
        setSessionExpiree(false);
        setDemandes(Array.isArray(donnees.prets) ? donnees.prets : []);
      } catch (e) {
        if (e.name !== "AbortError" && !controleur.signal.aborted) {
          setErreur(e.message || "Impossible de contacter le serveur.");
        }
      } finally {
        if (!controleur.signal.aborted) setChargement(false);
      }
    }
    chargerDemandes();
    return () => controleur.abort();
  }, [actualisation]);

  const aTraiter = useMemo(
    () => demandes.filter((d) => ["soumis", "en_verification"].includes(d.statut)),
    [demandes]
  );
  const liste = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    return aTraiter.filter((d) => {
      const contenu = [d.id, `PR-${d.id}`, d.motif, d.membre?.nom, d.membre?.prenom, d.membre?.email]
        .filter(Boolean).join(" ").toLowerCase();
      return contenu.includes(texte) && (statut === "tous" || d.statut === statut);
    });
  }, [aTraiter, recherche, statut]);

  const nouvelles = aTraiter.filter((d) => d.statut === "soumis").length;
  const enVerification = aTraiter.filter((d) => d.statut === "en_verification").length;
  const actualiserDemandes = () => setActualisation((n) => n + 1);

  async function mettreEnVerification(pret) {
    if (pretEnTraitement !== null || sessionExpiree || chargement || pret.statut !== "soumis") return;
    if (!window.confirm(`Passer le dossier PR-${pret.id} en vérification ?`)) return;
    setPretEnTraitement(String(pret.id));
    setErreurAction(""); setSucces("");
    try {
      const reponse = await fetch(`/api/secretaire/prets/${encodeURIComponent(pret.id)}/statut`, {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "en_verification" }),
      });
      if (reponse.status === 401) {
        setSessionExpiree(true);
        throw new Error("Session expirée.");
      }
      if (reponse.status === 403) throw new Error("Vous n'êtes pas autorisé à modifier ce dossier.");
      const donnees = await reponse.json().catch(() => ({}));
      if (!reponse.ok || !donnees.success) {
        throw new Error(donnees.message || "Impossible de modifier le statut.");
      }
      setSucces(`Le dossier PR-${pret.id} est maintenant en vérification.`);
      actualiserDemandes();
    } catch (e) {
      setErreurAction(e.message || "Erreur. Vérifiez le statut avant de réessayer.");
    } finally {
      setPretEnTraitement(null);
    }
  }

  function ouvrirFiche(pret) {
    if (sessionExpiree || pretEnTraitement !== null) return;
    setErreurAction(""); setSucces("");
    setPretSelectionne(pret.id);
  }
  function verificationReussie(message) {
    setPretSelectionne(null);
    setErreurAction("");
    setSucces(message || "Le dossier a été transmis au Directeur.");
    actualiserDemandes();
  }

  return (
    <div className="w-full space-y-7 pb-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-8 top-12 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
              <ShieldCheck size={15} /> Espace Secrétaire
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Vérifier les demandes</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100">
              Examinez les nouveaux dossiers et transmettez les demandes vérifiées au Directeur.
            </p>
          </div>
          <button type="button" onClick={actualiserDemandes}
            disabled={chargement || pretEnTraitement !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/25 disabled:opacity-50">
            <RefreshCw size={18} className={chargement ? "animate-spin" : ""} /> Actualiser
          </button>
        </div>
      </header>

      {succes && <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <CheckCircle2 size={20} className="shrink-0" /><p>{succes}</p>
      </div>}
      {(erreur || erreurAction) && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle size={20} className="shrink-0" />
        <div><p>{erreur || erreurAction}</p></div>
      </div>}

      <section aria-label="Statistiques des dossiers" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard titre="Dossiers à traiter" valeur={aTraiter.length} sousTitre="Total en attente de vérification" Icone={FileText} fond="bg-emerald-50" couleur="text-emerald-700" />
        <StatCard titre="Nouvelles demandes" valeur={nouvelles} sousTitre="Demandes au statut Soumis" Icone={Clock3} fond="bg-blue-50" couleur="text-blue-700" />
        <StatCard titre="En vérification" valeur={enVerification} sousTitre="Dossiers déjà pris en charge" Icone={ClipboardCheck} fond="bg-amber-50" couleur="text-amber-700" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><UsersRound size={21} className="text-emerald-700" /> Dossiers à vérifier</h2>
            <p className="mt-1 text-sm text-slate-500">{aTraiter.length} dossier(s) en attente de traitement.</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Suivi des demandes</span>
        </div>
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-5">
          <label className="relative min-w-[210px] flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" aria-label="Rechercher une demande" value={recherche}
              onChange={(e) => setRecherche(e.target.value)} placeholder="Référence, membre, motif…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="relative">
            <Filter size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select aria-label="Filtrer les demandes par statut" value={statut} onChange={(e) => setStatut(e.target.value)}
              className="w-full min-w-[210px] rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
              <option value="tous">Tous les dossiers à traiter</option>
              <option value="soumis">Soumis</option>
              <option value="en_verification">En vérification</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-slate-500">
          <span>{liste.length} résultat(s) affiché(s)</span>
          <span className="inline-flex items-center gap-1"><Info size={14} /> Seuls les dossiers à vérifier sont affichés</span>
        </div>
        {chargement ? <div role="status" className="space-y-3 p-6" aria-label="Chargement des demandes">
          {[1, 2, 3].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
        </div> : !erreur && <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>
              {['Référence', 'Membre', 'Montant', 'Date', 'Statut', 'Actions'].map((titre) => <th scope="col" key={titre} className="px-5 py-4 font-semibold">{titre}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {liste.map((pret) => {
                const traitementEnCours = pretEnTraitement === String(pret.id);
                return <tr key={pret.id} className="transition-colors hover:bg-emerald-50/40">
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-emerald-800">PR-{pret.id}</td>
                  <td className="px-5 py-4"><div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">{initiales(pret.membre)}</span>
                    <div className="min-w-0"><p className="font-semibold text-slate-800">{nomMembre(pret.membre)}</p><p className="max-w-[190px] truncate text-xs text-slate-400">{pret.membre?.email || '—'}</p></div>
                  </div></td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{montantFR(pret.montant)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{dateFR(pret.dateDemande)}</td>
                  <td className="px-5 py-4"><BadgeStatut statut={pret.statut} /></td>
                  <td className="px-5 py-4"><div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => ouvrirFiche(pret)} disabled={pretEnTraitement !== null || sessionExpiree}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                      <ClipboardCheck size={16} /> Vérifier
                    </button>
                    {pret.statut === "soumis" ? <button type="button" onClick={() => mettreEnVerification(pret)} disabled={pretEnTraitement !== null || sessionExpiree}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                      {traitementEnCours ? <Loader2 size={15} className="animate-spin" /> : <Clock3 size={15} />}
                      {traitementEnCours ? "Traitement…" : "En vérification"}
                    </button> : <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"><Clock3 size={14} /> En cours</span>}
                  </div></td>
                </tr>;
              })}
              {liste.length === 0 && <tr><td colSpan={6} className="px-5 py-14 text-center">
                <Inbox size={34} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-700">Aucun dossier trouvé</p>
                <p className="mt-1 text-xs text-slate-400">Ajustez les filtres ou actualisez la liste.</p>
              </td></tr>}
            </tbody>
          </table>
        </div>}
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs text-slate-500">
          Les vérifications et transmissions au Directeur sont réalisées depuis la fiche du dossier.
        </div>
      </section>

      {pretSelectionne !== null && <FicheVerificationModal
        pretId={pretSelectionne}
        onFermer={() => setPretSelectionne(null)}
        onSucces={verificationReussie}
      />}
    </div>
  );
}
