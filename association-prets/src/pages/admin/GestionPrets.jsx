
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  Search,
  RefreshCw,
  FileText,
  AlertCircle,
  X,
  ShieldCheck,
  Clock3,
  Wallet,
  Eye,
  Filter,
  CalendarDays,
  UserRound,
  Phone,
  Mail,
  CheckCircle2,
  ArrowUpRight,
  FolderOpen,
  Banknote,
  Info,
} from "lucide-react";

// ==========================================
// STATUTS
// ==========================================

const STATUTS = {
  brouillon: {
    nom: "Brouillon",
    couleur: "bg-slate-100 text-slate-600",
  },
  soumis: {
    nom: "Soumis",
    couleur: "bg-slate-100 text-slate-700",
  },
  en_verification: {
    nom: "En vérification",
    couleur: "bg-amber-50 text-amber-700",
  },
  en_decision: {
    nom: "En décision",
    couleur: "bg-violet-50 text-violet-700",
  },
  approuve: {
    nom: "Approuvé",
    couleur: "bg-emerald-50 text-emerald-700",
  },
  rejete: {
    nom: "Rejeté",
    couleur: "bg-red-50 text-red-700",
  },
  refuse: {
    nom: "Refusé",
    couleur: "bg-red-50 text-red-700",
  },
  decaisse: {
    nom: "Décaissé",
    couleur: "bg-blue-50 text-blue-700",
  },
  en_remboursement: {
    nom: "En remboursement",
    couleur: "bg-cyan-50 text-cyan-700",
  },
  rembourse: {
    nom: "Remboursé",
    couleur: "bg-green-50 text-green-800",
  },
};

// ==========================================
// FORMATAGE
// ==========================================

function nombreFR(valeur) {
  const nombre = Number(valeur ?? 0);

  return Number.isFinite(nombre)
    ? nombre.toLocaleString("fr-FR")
    : "0";
}

function formatMontant(valeur) {
  const montant = Number(valeur);

  return Number.isFinite(montant)
    ? `${montant.toLocaleString("fr-FR")} FCFA`
    : "—";
}

function formatDate(valeur) {
  if (!valeur) return "—";

  const date = new Date(valeur);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fr-FR");
}

function nomComplet(membre) {
  return (
    [membre?.prenom, membre?.nom]
      .filter(Boolean)
      .join(" ") || "Non renseigné"
  );
}

function initiales(membre) {
  const prenom = membre?.prenom?.trim()?.[0] || "";
  const nom = membre?.nom?.trim()?.[0] || "";

  return `${prenom}${nom}`.toUpperCase() || "M";
}

// ==========================================
// BADGE DE STATUT
// ==========================================

function BadgeStatut({ statut }) {
  const info = STATUTS[statut] || {
    nom: statut || "Inconnu",
    couleur: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-2
        rounded-full px-3 py-1.5
        text-xs font-semibold whitespace-nowrap
        ${info.couleur}
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {info.nom}
    </span>
  );
}

// ==========================================
// CARTE STATISTIQUE
// ==========================================

function CarteStatistique({
  titre,
  valeur,
  description,
  Icone,
  couleur,
  fond,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-3 ${fond}`}>
          <Icone size={23} className={couleur} />
        </div>

        <ArrowUpRight
          size={18}
          className="text-slate-300 transition-colors group-hover:text-emerald-600"
        />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {titre}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {nombreFR(valeur)}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

// ==========================================
// INFORMATIONS DE LA FICHE
// ==========================================

function LigneInformation({
  titre,
  valeur,
  Icone,
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
      <div className="rounded-lg bg-white p-2 text-emerald-700 shadow-sm">
        <Icone size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">
          {titre}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {valeur || "—"}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// FENETRE DE DETAILS
// ==========================================

function DetailPretModal({ pret, onFermer }) {
  useEffect(() => {
    function fermerAvecEchap(event) {
      if (event.key === "Escape") onFermer();
    }

    document.addEventListener("keydown", fermerAvecEchap);

    return () =>
      document.removeEventListener(
        "keydown",
        fermerAvecEchap
      );
  }, [onFermer]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-detail-pret"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* EN-TETE */}

        <header className="shrink-0 bg-gradient-to-r from-emerald-900 to-emerald-700 px-5 py-6 text-white sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                <FileText size={14} />
                Fiche de consultation
              </div>

              <h2
                id="titre-detail-pret"
                className="text-2xl font-bold"
              >
                Dossier PR-{pret.id}
              </h2>

              <p className="mt-2 text-sm text-emerald-100">
                Informations détaillées de la demande
              </p>
            </div>

            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer les détails"
              className="rounded-xl bg-white/15 p-2 transition-colors hover:bg-white/25"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* CONTENU */}

        <div className="space-y-6 overflow-y-auto p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
            <div>
              <p className="text-xs text-slate-500">
                État actuel du dossier
              </p>

              <div className="mt-2">
                <BadgeStatut statut={pret.statut} />
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500">
                Date de la demande
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(pret.dateDemande)}
              </p>
            </div>
          </div>

          {/* MEMBRE */}

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
              <UserRound size={17} className="text-emerald-700" />
              Informations du membre
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LigneInformation
                titre="Nom et prénom"
                valeur={nomComplet(pret.membre)}
                Icone={UserRound}
              />

              <LigneInformation
                titre="Adresse e-mail"
                valeur={pret.membre?.email}
                Icone={Mail}
              />

              <LigneInformation
                titre="Téléphone"
                valeur={pret.membre?.telephone}
                Icone={Phone}
              />
            </div>
          </div>

          {/* PRET */}

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
              <Banknote size={18} className="text-emerald-700" />
              Informations du prêt
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LigneInformation
                titre="Montant demandé"
                valeur={formatMontant(pret.montant)}
                Icone={Wallet}
              />

              <LigneInformation
                titre="Motif du prêt"
                valeur={pret.motif}
                Icone={FileText}
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">
                Description de la demande
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {pret.description || "Aucune description fournie."}
              </p>
            </div>
          </div>

          {/* ETAT DES DOCUMENTS */}

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
              <FolderOpen size={18} className="text-emerald-700" />
              Suivi du dossier
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                <div
                  className={`rounded-lg p-2 ${
                    pret.justificatifPresent
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {pret.justificatifPresent ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Justificatif
                  </p>

                  <p className="text-sm font-semibold text-slate-900">
                    {pret.justificatifPresent
                      ? "Document déposé"
                      : "Document absent"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                <div
                  className={`rounded-lg p-2 ${
                    pret.decaissementPresent
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Wallet size={20} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Décaissement
                  </p>

                  <p className="text-sm font-semibold text-slate-900">
                    {pret.decaissementPresent
                      ? "Enregistré"
                      : "Non enregistré"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />

            <p className="text-xs leading-5 text-blue-800">
              Cet espace est réservé à la consultation.
              Les décisions sont prises par le Directeur,
              et les opérations financières sont
              enregistrées par le Comptable.
            </p>
          </div>
        </div>

        {/* PIED DE FENETRE */}

        <footer className="flex shrink-0 justify-end border-t border-slate-100 bg-white p-5">
          <button
            type="button"
            onClick={onFermer}
            className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            Fermer
          </button>
        </footer>
      </section>
    </div>
  );
}

// ==========================================
// PAGE PRINCIPALE
// ==========================================

export default function GestionPrets() {
  const [prets, setPrets] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    aTraiter: 0,
    enSuivi: 0,
  });

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [actualisation, setActualisation] = useState(0);

  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("tous");
  const [selection, setSelection] = useState(null);

  // ========================================
  // CHARGEMENT DEPUIS MYSQL
  // ========================================

  useEffect(() => {
    const controleur = new AbortController();

    async function chargerPrets() {
      setChargement(true);
      setErreur("");

      try {
        const reponse = await fetch("/api/admin/prets", {
          method: "GET",
          credentials: "same-origin",
          signal: controleur.signal,
        });

        const donnees = await reponse.json().catch(
          () => ({})
        );

        if (!reponse.ok || !donnees.success) {
          throw new Error(
            donnees.message ||
              `Erreur HTTP ${reponse.status}`
          );
        }

        if (!controleur.signal.aborted) {
          setPrets(
            Array.isArray(donnees.prets)
              ? donnees.prets
              : []
          );

          setStats(
            donnees.statistiques || {
              total: 0,
              aTraiter: 0,
              enSuivi: 0,
            }
          );
        }
      } catch (e) {
        if (
          e.name !== "AbortError" &&
          !controleur.signal.aborted
        ) {
          setErreur(
            e.message || "Serveur inaccessible."
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
  // RECHERCHE ET FILTRAGE
  // ========================================

  const pretsFiltres = useMemo(() => {
    const texte = recherche.trim().toLowerCase();

    return prets.filter((pret) => {
      const contenu = [
        pret.id,
        `PR-${pret.id}`,
        pret.membre?.nom,
        pret.membre?.prenom,
        pret.membre?.email,
        pret.motif,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const correspondRecherche = contenu.includes(texte);

      const correspondStatut =
        statut === "tous" || pret.statut === statut;

      return correspondRecherche && correspondStatut;
    });
  }, [prets, recherche, statut]);

  const cartes = [
    {
      titre: "Tous les prêts",
      valeur: stats.total,
      description: "Demandes enregistrées",
      Icone: FileText,
      couleur: "text-emerald-700",
      fond: "bg-emerald-50",
    },
    {
      titre: "Demandes à traiter",
      valeur: stats.aTraiter,
      description: "Dossiers en attente",
      Icone: Clock3,
      couleur: "text-amber-700",
      fond: "bg-amber-50",
    },
    {
      titre: "Suivi financier",
      valeur: stats.enSuivi,
      description: "Prêts décaissés et en suivi",
      Icone: Wallet,
      couleur: "text-blue-700",
      fond: "bg-blue-50",
    },
  ];

  function actualiser() {
    setActualisation((n) => n + 1);
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <div className="w-full space-y-7 pb-8">
      {/* EN-TETE */}

      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-60 w-60 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-4 top-10 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
              <ShieldCheck size={15} />
              Espace Administrateur
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Gestion des prêts
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100">
              Consultez et suivez l'ensemble des
              demandes de prêt enregistrées dans
              votre association.
            </p>
          </div>

          <button
            type="button"
            onClick={actualiser}
            disabled={chargement}
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/25 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={chargement ? "animate-spin" : ""}
            />
            Actualiser
          </button>
        </div>
      </header>

      {/* ERREUR */}

      {erreur && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
        >
          <AlertCircle size={20} className="shrink-0" />

          <div>
            <p className="font-semibold">
              Impossible de charger les prêts
            </p>

            <p className="mt-1 text-sm">
              {erreur}
            </p>

          </div>
        </div>
      )}

      {/* STATISTIQUES */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cartes.map((carte) => (
          <CarteStatistique
            key={carte.titre}
            {...carte}
            valeur={chargement ? "…" : carte.valeur}
          />
        ))}
      </section>

      {/* LISTE DES PRETS */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FolderOpen size={21} className="text-emerald-700" />
              Liste des demandes
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Consultez les dossiers et leur état d'avancement.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            <Eye size={15} />
            Consultation uniquement
          </span>
        </div>

        {/* FILTRES */}

        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={recherche}
              onChange={(e) =>
                setRecherche(e.target.value)
              }
              placeholder="Référence, membre, motif..."
              aria-label="Rechercher un prêt"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="relative">
            <Filter
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={statut}
              onChange={(e) =>
                setStatut(e.target.value)
              }
              aria-label="Filtrer par statut"
              className="min-w-[190px] appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="tous">
                Tous les statuts
              </option>

              {Object.entries(STATUTS).map(
                ([valeur, info]) => (
                  <option key={valeur} value={valeur}>
                    {info.nom}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* COMPTEUR */}

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className="text-xs font-medium text-slate-500">
            {nombreFR(pretsFiltres.length)} dossier(s)
            affiché(s) sur {nombreFR(prets.length)} chargé(s)
          </p>

          <p className="text-xs text-slate-400">
            500 dernières demandes au maximum
          </p>
        </div>

        {/* CHARGEMENT */}

        {chargement ? (
          <div
            role="status"
            className="space-y-3 p-6"
          >
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : !erreur ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500">
                <tr>
                  {[
                    "Référence",
                    "Membre",
                    "Montant",
                    "Motif",
                    "Date",
                    "Statut",
                    "Actions",
                  ].map((titre) => (
                    <th
                      key={titre}
                      className="px-5 py-4 font-semibold"
                    >
                      {titre}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pretsFiltres.map((pret) => (
                  <tr
                    key={pret.id}
                    className="transition-colors hover:bg-emerald-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="font-bold text-emerald-800">
                        PR-{pret.id}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                          {initiales(pret.membre)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">
                            {nomComplet(pret.membre)}
                          </p>

                          <p className="max-w-[180px] truncate text-xs text-slate-400">
                            {pret.membre?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                      {formatMontant(pret.montant)}
                    </td>

                    <td
                      className="max-w-[190px] truncate px-5 py-4 text-slate-600"
                      title={pret.motif || ""}
                    >
                      {pret.motif || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(pret.dateDemande)}
                    </td>

                    <td className="px-5 py-4">
                      <BadgeStatut statut={pret.statut} />
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelection(pret)}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                      >
                        <Eye size={16} />
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}

                {pretsFiltres.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-slate-100 p-4">
                          <FileText
                            size={27}
                            className="text-slate-400"
                          />
                        </div>

                        <p className="font-semibold text-slate-700">
                          Aucun prêt trouvé
                        </p>

                        <p className="text-sm text-slate-400">
                          Modifiez votre recherche ou vos filtres.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* BAS DE TABLEAU */}

        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Info size={15} />
            La liste présente les demandes les plus récentes.
            Seuls les 500 derniers dossiers sont listés.
          </p>
        </div>
      </section>

      {/* FENETRE DE DETAILS */}

      {selection && (
        <DetailPretModal
          pret={selection}
          onFermer={() => setSelection(null)}
        />
      )}
    </div>
  );
}
