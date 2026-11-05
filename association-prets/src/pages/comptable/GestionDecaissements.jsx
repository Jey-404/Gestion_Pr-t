
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  Banknote,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import PreparerDecaissementModal from "../../components/comptable/PreparerDecaissementModal";

const STATUTS_REFUSES = ["rejete", "refuse"];

function montantFR(valeur) {
  const montant = Number(valeur);
  return Number.isFinite(montant)
    ? `${montant.toLocaleString("fr-FR")} FCFA`
    : "—";
}

function dateFR(valeur) {
  if (!valeur) return "—";

  const date = new Date(valeur);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fr-FR");
}

import { Wallet, ShieldCheck, Filter, ClipboardList } from "lucide-react";

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

export default function GestionDecaissements() {
  const [prets, setPrets] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [actualisation, setActualisation] = useState(0);

  const [pretSelectionne, setPretSelectionne] = useState(null);
  const [messageSucces, setMessageSucces] = useState("");

  // ========================================
  // CHARGER LES PRETS DEPUIS MYSQL
  // ========================================

  useEffect(() => {
    const controleur = new AbortController();

    async function chargerPrets() {
      setChargement(true);
      setErreur("");
      setSessionExpiree(false);

      try {
        const reponse = await fetch(
          "/api/comptable/prets-decaissement",
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
            "Accès réservé au Comptable."
          );
        }

        const donnees = await reponse.json();

        if (!reponse.ok || !donnees.success) {
          throw new Error(
            donnees.message ||
              "Impossible de charger les prêts."
          );
        }

        if (!controleur.signal.aborted) {
          setPrets(
            Array.isArray(donnees.prets)
              ? donnees.prets
              : []
          );
        }
      } catch (e) {
        if (
          e.name !== "AbortError" &&
          !controleur.signal.aborted
        ) {
          setErreur(
            e.message || "Impossible de contacter le serveur."
          );
        }
      } finally {
        if (!controleur.signal.aborted) {
          setChargement(false);
        }
      }
    }

    chargerPrets();

    return () => controleur.abort();
  }, [actualisation]);

  // ========================================
  // STATISTIQUES
  // ========================================

  const statistiques = useMemo(() => {
    const approuves = prets.filter(
      (pret) => pret.statut === "approuve"
    );

    const refuses = prets.filter((pret) =>
      STATUTS_REFUSES.includes(pret.statut)
    );

    const montantADecaisser = approuves.reduce(
      (total, pret) => total + Number(pret.montant || 0),
      0
    );

    return {
      approuves: approuves.length,
      refuses: refuses.length,
      montantADecaisser,
    };
  }, [prets]);

  // ========================================
  // RECHERCHE ET FILTRES
  // ========================================

  const pretsFiltres = useMemo(() => {
    const texte = recherche.trim().toLowerCase();

    return prets.filter((pret) => {
      const contenu = [
        pret.id,
        `PR-${pret.id}`,
        pret.motif,
        pret.membre?.nom,
        pret.membre?.prenom,
        pret.membre?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const correspondRecherche = contenu.includes(texte);

      const correspondStatut =
        filtreStatut === "tous" ||
        (filtreStatut === "refuse"
          ? STATUTS_REFUSES.includes(pret.statut)
          : pret.statut === filtreStatut);

      return correspondRecherche && correspondStatut;
    });
  }, [prets, recherche, filtreStatut]);

  function decaissementReussi(message) {
    setPretSelectionne(null);
    setMessageSucces(message || "Décaissement enregistré avec succès.");
    setActualisation((valeur) => valeur + 1);
  }

  function ouvrirPreparation(pret) {
    // Sécurité côté interface :
    // seuls les prêts approuvés peuvent être préparés.
    if (pret.statut !== "approuve") return;

    setMessageSucces("");
    setPretSelectionne(pret);
  }


  return (
    <div className="w-full space-y-7 pb-8">
      <EnteteComptable titre="Gestion des décaissements"
        description="Préparez les versements pour les prêts approuvés par le Directeur, tout en gardant une visibilité sur les dossiers refusés."
        actualiser={() => setActualisation(n => n + 1)} chargement={chargement} />
      <AlerteComptable erreur={erreur} succes={messageSucces} />
      <section aria-label="Statistiques des décaissements" className="grid gap-4 md:grid-cols-3">
        <CarteComptable label="Prêts à décaisser" valeur={chargement ? "…" : statistiques.approuves.toLocaleString("fr-FR")}
          description="Dossiers approuvés par le Directeur" icone={CheckCircle2} couleur="emerald" />
        <CarteComptable label="Prêts refusés" valeur={chargement ? "…" : statistiques.refuses.toLocaleString("fr-FR")}
          description="Aucun décaissement possible" icone={XCircle} couleur="rose" />
        <CarteComptable label="Montant à décaisser" valeur={chargement ? "…" : montantFR(statistiques.montantADecaisser)}
          description="Somme des prêts approuvés" icone={Banknote} couleur="blue" />
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ClipboardList className="text-emerald-700" size={20}/> Liste des décisions</h2>
            <p className="mt-1 text-sm text-slate-500">Seuls les prêts approuvés peuvent être décaissés.</p></div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"><ShieldCheck size={14}/> Contrôle sécurisé</span>
        </div>
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-5">
          <div className="relative min-w-[220px] flex-1"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="search" aria-label="Rechercher un prêt" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Référence, membre ou motif..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div className="relative"><Filter size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <select aria-label="Filtrer les prêts" value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
              <option value="tous">Tous les statuts</option><option value="approuve">Approuvés</option><option value="refuse">Refusés</option>
            </select>
          </div>
        </div>
        <p className="px-5 py-3 text-xs font-medium text-slate-500">{pretsFiltres.length} dossier(s) affiché(s) sur {prets.length} chargé(s)</p>
        {chargement ? <SqueletteComptable /> : !erreur && <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['Référence','Membre','Montant','Motif','Échéancier souhaité','Décision du','Statut','Action'].map(t => <th key={t} className="px-5 py-4 font-semibold">{t}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{pretsFiltres.map(pret => <tr key={pret.id} className="hover:bg-emerald-50/40">
            <td className="whitespace-nowrap px-5 py-4 font-bold text-emerald-800">PR-{pret.id}</td>
            <td className="px-5 py-4"><NomMembre membre={pret.membre}/></td>
            <td className="whitespace-nowrap px-5 py-4 font-semibold">{montantFR(pret.montant)}</td>
            <td className="max-w-48 truncate px-5 py-4 text-slate-600" title={pret.motif || ""}>{pret.motif || "Non renseigné"}</td>
            <td className="whitespace-nowrap px-5 py-4 text-slate-600">{pret.nombreEcheances ? <><span className="font-medium">{pret.nombreEcheances} mensualité(s)</span><span className="block text-xs text-slate-500">Dès le {dateFR(pret.datePremiereEcheance)}</span></> : <span className="text-amber-700">Non renseigné</span>}</td>
            <td className="whitespace-nowrap px-5 py-4 text-slate-500">{dateFR(pret.dateModification)}</td>
            <td className="px-5 py-4"><span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${pret.statut === "approuve" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{pret.statut === "approuve" ? "Approuvé" : "Refusé"}</span></td>
            <td className="px-5 py-4">{pret.statut === "approuve" ?
              <button type="button" onClick={() => ouvrirPreparation(pret)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"><Banknote size={16}/> Préparer le décaissement</button>
              : <span className="text-xs text-slate-400">Aucune action</span>}</td>
          </tr>)}{pretsFiltres.length === 0 && <tr><td colSpan={8} className="px-6 py-14 text-center text-sm text-slate-500">Aucun prêt ne correspond à votre recherche.</td></tr>}</tbody>
        </table></div>}
      </section>
      {pretSelectionne && <PreparerDecaissementModal pret={pretSelectionne} onFermer={() => setPretSelectionne(null)} onSucces={decaissementReussi} />}
    </div>
  );
}
