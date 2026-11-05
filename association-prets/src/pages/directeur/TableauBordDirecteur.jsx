
import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
  FileText,
  Clock3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ClipboardCheck,
  Users,
  Eye,
  CalendarDays,
  Info,
  LayoutDashboard,
} from "lucide-react";

// ==========================================
// CONFIGURATION DES STATUTS
// ==========================================

const STATUTS = {
  soumis: {
    libelle: "Soumis",
    couleur: "bg-slate-100 text-slate-700",
  },
  en_verification: {
    libelle: "En vérification",
    couleur: "bg-amber-50 text-amber-700",
  },
  en_decision: {
    libelle: "En décision",
    couleur: "bg-violet-50 text-violet-700",
  },
  approuve: {
    libelle: "Approuvé",
    couleur: "bg-emerald-50 text-emerald-700",
  },
  rejete: {
    libelle: "Rejeté",
    couleur: "bg-red-50 text-red-700",
  },
  refuse: {
    libelle: "Refusé",
    couleur: "bg-red-50 text-red-700",
  },
  decaisse: {
    libelle: "Décaissé",
    couleur: "bg-blue-50 text-blue-700",
  },
  en_remboursement: {
    libelle: "En remboursement",
    couleur: "bg-cyan-50 text-cyan-700",
  },
  rembourse: {
    libelle: "Remboursé",
    couleur: "bg-green-50 text-green-800",
  },
};

// ==========================================
// FONCTIONS UTILITAIRES
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

function nombreFR(valeur) {
  return Number(valeur || 0).toLocaleString("fr-FR");
}

function nomComplet(membre) {
  return (
    [membre?.prenom, membre?.nom]
      .filter(Boolean)
      .join(" ") || "Non renseigné"
  );
}

function initialesMembre(membre) {
  const prenom = membre?.prenom?.trim()?.[0] || "";
  const nom = membre?.nom?.trim()?.[0] || "";

  return `${prenom}${nom}`.toUpperCase() || "M";
}

// ==========================================
// COMPOSANT BADGE DE STATUT
// ==========================================

function BadgeStatut({ statut }) {
  const information = STATUTS[statut] || {
    libelle: statut || "Inconnu",
    couleur: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-2
        whitespace-nowrap rounded-full
        px-3 py-1.5 text-xs font-semibold
        ${information.couleur}
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {information.libelle}
    </span>
  );
}

// ==========================================
// COMPOSANT CARTE STATISTIQUE
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
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-3 ${fond}`}>
          <Icone size={23} className={couleur} />
        </div>

        <span className="rounded-lg bg-slate-50 p-2 text-slate-300 transition-colors group-hover:text-emerald-600">
          <LayoutDashboard size={16} />
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {titre}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {nombreFR(valeur)}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

// ==========================================
// TABLEAU DE BORD DIRECTEUR
// ==========================================

export default function TableauBordDirecteur() {
  const [demandes, setDemandes] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [sessionExpiree, setSessionExpiree] =
    useState(false);

  const [actualisation, setActualisation] =
    useState(0);

  // ========================================
  // CHARGEMENT DES DONNEES MYSQL
  // ========================================

  useEffect(() => {
    const controleur = new AbortController();

    async function chargerDemandes() {
      setChargement(true);
      setErreur("");
      setSessionExpiree(false);

      try {
        const reponse = await fetch(
          "/api/directeur/tableau-bord",
          {
            method: "GET",
            credentials: "same-origin",
            signal: controleur.signal,
          }
        );

        if (reponse.status === 401) {
          if (!controleur.signal.aborted) {
            setSessionExpiree(true);
          }

          throw new Error(
            "Session expirée."
          );
        }

        if (reponse.status === 403) {
          throw new Error(
            "Accès réservé au Directeur."
          );
        }

        const donnees = await reponse.json().catch(
          () => ({})
        );

        if (!reponse.ok || !donnees.success) {
          throw new Error(
            donnees.message ||
              "Impossible de charger le tableau de bord."
          );
        }

        if (!controleur.signal.aborted) {
          setDemandes(
            Array.isArray(donnees.dernieresDemandes)
              ? donnees.dernieresDemandes.slice(0, 5)
              : []
          );
        }
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

    chargerDemandes();

    return () => controleur.abort();
  }, [actualisation]);

  // ========================================
  // STATISTIQUES DES 5 DERNIERS DOSSIERS
  // ========================================

  const statistiques = {
    total: demandes.length,

    enDecision: demandes.filter(
      (demande) => demande.statut === "en_decision"
    ).length,

    approuves: demandes.filter(
      (demande) => demande.statut === "approuve"
    ).length,

    rejetes: demandes.filter(
      (demande) =>
        ["rejete", "refuse"].includes(demande.statut)
    ).length,
  };

  const cartes = [
    {
      titre: "Dernières demandes",
      valeur: statistiques.total,
      description: "Dossiers récemment enregistrés",
      Icone: FileText,
      couleur: "text-emerald-700",
      fond: "bg-emerald-50",
    },
    {
      titre: "En décision",
      valeur: statistiques.enDecision,
      description: "Dossiers en attente d'une décision",
      Icone: Clock3,
      couleur: "text-amber-700",
      fond: "bg-amber-50",
    },
    {
      titre: "Approuvées",
      valeur: statistiques.approuves,
      description: "Demandes ayant reçu un accord",
      Icone: CheckCircle2,
      couleur: "text-blue-700",
      fond: "bg-blue-50",
    },
    {
      titre: "Refusées",
      valeur: statistiques.rejetes,
      description: "Demandes rejetées ou refusées",
      Icone: XCircle,
      couleur: "text-red-700",
      fond: "bg-red-50",
    },
  ];

  function actualiser() {
    setActualisation((n) => n + 1);
  }

  return (
    <div className="w-full space-y-7 pb-8">

      {/* ====================================
          BANDEAU DE BIENVENUE
      ==================================== */}

      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />

        <div className="pointer-events-none absolute right-5 top-8 h-44 w-44 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
              <ShieldCheck size={15} />
              Espace Directeur
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tableau de bord
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100">
              Consultez les dossiers et les indicateurs utiles à l’examen des demandes. Cet espace facilite un suivi clair et une prise de décision éclairée.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={actualiser}
              disabled={chargement}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/25 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  chargement ? "animate-spin" : ""
                }
              />
              Actualiser
            </button>

            <Link
              to="/directeur/demandes"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-800 shadow-sm transition-colors hover:bg-emerald-50"
            >
              <ClipboardCheck size={18} />
              Examiner les demandes
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </header>

      {/* ====================================
          MESSAGES D'ERREUR
      ==================================== */}

      {erreur && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
        >
          <AlertCircle
            size={21}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-bold">
              Impossible de charger les données
            </p>

            <p className="mt-1 text-sm leading-6">
              {erreur}
            </p>

          </div>
        </div>
      )}

      {/* ====================================
          CHARGEMENT
      ==================================== */}

      {chargement && (
        <div
          role="status"
          aria-label="Chargement du tableau de bord"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-100" />
              <div className="mt-5 h-4 w-28 rounded bg-slate-100" />
              <div className="mt-3 h-9 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* ====================================
          CONTENU REEL
      ==================================== */}

      {!chargement && !erreur && (
        <>

       

          {/* CARTES STATISTIQUES */}

          <section
            aria-label="Statistiques des dernières demandes"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {cartes.map((carte) => (
              <CarteStatistique
                key={carte.titre}
                {...carte}
              />
            ))}
          </section>

          {/* =================================
              CINQ DERNIERES DEMANDES
          ================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <CalendarDays
                    size={21}
                    className="text-emerald-700"
                  />

                  Les 5 dernières demandes
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Vue récente de tous les statuts,
                  en consultation uniquement.
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                <Eye size={15} />
                Consultation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Référence
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Membre
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Montant
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Motif
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Date
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Statut
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {demandes.map((demande) => (
                    <tr
                      key={demande.id}
                      className="transition-colors hover:bg-emerald-50/40"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-bold text-emerald-800">
                          PR-{demande.id}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <Users size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {nomComplet(demande.membre)}
                            </p>

                            <p className="text-xs text-slate-400">
                              Membre de l'association
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        {montantFR(demande.montant)}
                      </td>

                      <td
                        className="max-w-[200px] truncate px-5 py-4 text-slate-600"
                        title={demande.motif || ""}
                      >
                        {demande.motif || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {dateFR(demande.dateDemande)}
                      </td>

                      <td className="px-5 py-4">
                        <BadgeStatut
                          statut={demande.statut}
                        />
                      </td>
                    </tr>
                  ))}

                  {demandes.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-14 text-center"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-full bg-slate-100 p-4">
                            <FileText
                              size={28}
                              className="text-slate-400"
                            />
                          </div>

                          <p className="font-semibold text-slate-700">
                            Aucune demande enregistrée
                          </p>

                          <p className="text-sm text-slate-400">
                            Les nouvelles demandes
                            apparaîtront ici.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <p className="text-xs text-slate-500">
                Affichage limité aux cinq dernières
                demandes enregistrées.
              </p>

              <Link
                to="/directeur/demandes"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Examiner les demandes
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          {/* =================================
              ACCES RAPIDE
          ================================= */}


        </>
      )}
    </div>
  );
}
