
import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
  RefreshCw,
  Users,
  UserCheck,
  FileText,
  Clock3,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowUpRight,
  LayoutDashboard,
  CalendarDays,
  Activity,
} from "lucide-react";

// ==========================================
// LIBELLES ET COULEURS DES STATUTS
// ==========================================

const statuts = {
  soumis: {
    libelle: "Soumis",
    style: "bg-slate-100 text-slate-700",
  },
  en_verification: {
    libelle: "En vérification",
    style: "bg-amber-50 text-amber-700",
  },
  en_decision: {
    libelle: "En décision",
    style: "bg-purple-50 text-purple-700",
  },
  approuve: {
    libelle: "Approuvé",
    style: "bg-emerald-50 text-emerald-700",
  },
  rejete: {
    libelle: "Rejeté",
    style: "bg-red-50 text-red-700",
  },
  refuse: {
    libelle: "Refusé",
    style: "bg-red-50 text-red-700",
  },
  decaisse: {
    libelle: "Décaissé",
    style: "bg-blue-50 text-blue-700",
  },
  en_remboursement: {
    libelle: "En remboursement",
    style: "bg-cyan-50 text-cyan-700",
  },
  rembourse: {
    libelle: "Remboursé",
    style: "bg-emerald-50 text-emerald-800",
  },
};

// ==========================================
// FONCTIONS DE FORMATAGE
// ==========================================

function nombreFR(valeur) {
  const nombre = Number(valeur ?? 0);

  return Number.isFinite(nombre)
    ? nombre.toLocaleString("fr-FR")
    : "0";
}

function montantFR(valeur) {
  const montant = Number(valeur ?? 0);

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

// ==========================================
// BADGE STATUT
// ==========================================

function BadgeStatut({ statut }) {
  const information = statuts[statut] || {
    libelle: statut || "Non renseigné",
    style: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-2
        rounded-full px-3 py-1.5
        text-xs font-semibold whitespace-nowrap
        ${information.style}
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {information.libelle}
    </span>
  );
}

// ==========================================
// CARTE STATISTIQUE
// ==========================================

function CarteStatistique({
  titre,
  valeur,
  Icone,
  couleur,
  fond,
  description,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
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
// ELEMENT DE SYNTHESE
// ==========================================

function ElementSynthese({
  titre,
  valeur,
  Icone,
  couleur,
  fond,
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className={`rounded-xl p-3 ${fond}`}>
        <Icone size={21} className={couleur} />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500">
          {titre}
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {nombreFR(valeur)}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// TABLEAU DE BORD ADMINISTRATEUR
// ==========================================

export default function TableauBordAdmin() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [sessionExpiree, setSessionExpiree] =
    useState(false);

  const [actualisation, setActualisation] =
    useState(0);

  // ========================================
  // RECUPERATION DES DONNEES MYSQL
  // ========================================

  useEffect(() => {
    const controleur = new AbortController();

    async function chargerTableauBord() {
      setChargement(true);
      setErreur("");
      setSessionExpiree(false);

      try {
        const reponse = await fetch(
          "/api/admin/tableau-bord",
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
            "Accès réservé à l'Administrateur."
          );
        }

        const data = await reponse.json().catch(
          () => ({})
        );

        if (!reponse.ok || !data.success) {
          throw new Error(
            data.message ||
              "Impossible de charger le tableau de bord."
          );
        }

        if (!controleur.signal.aborted) {
          setDonnees(data);
        }
      } catch (e) {
        if (
          !controleur.signal.aborted &&
          e.name !== "AbortError"
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

    chargerTableauBord();

    return () => controleur.abort();
  }, [actualisation]);

  const stats = donnees?.statistiques || {};

  const recentes = Array.isArray(
    donnees?.dernieresDemandes
  )
    ? donnees.dernieresDemandes
    : [];

  const cartes = [
    {
      titre: "Utilisateurs",
      valeur: stats.utilisateurs,
      Icone: Users,
      couleur: "text-emerald-700",
      fond: "bg-emerald-50",
      description: "Comptes enregistrés",
    },
    {
      titre: "Membres",
      valeur: stats.membres,
      Icone: UserCheck,
      couleur: "text-blue-700",
      fond: "bg-blue-50",
      description: "Comptes avec le rôle Membre",
    },
    {
      titre: "Prêts enregistrés",
      valeur: stats.prets,
      Icone: FileText,
      couleur: "text-amber-700",
      fond: "bg-amber-50",
      description: "Toutes les demandes",
    },
    {
      titre: "Prêts à traiter",
      valeur: stats.enAttente,
      Icone: Clock3,
      couleur: "text-violet-700",
      fond: "bg-violet-50",
      description: "Demandes en attente",
    },
  ];

  return (
    <div className="w-full space-y-7 pb-8">

      {/* ====================================
          EN-TETE PRINCIPAL
      ==================================== */}

      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-5 top-10 h-44 w-44 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
              <ShieldCheck size={15} />
              Espace Administrateur
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tableau de bord
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100">
              Retrouvez les indicateurs essentiels à la gestion de l’association. Suivez les comptes, les prêts et les opérations depuis un espace centralisé.
            </p>
          </div>

          <button
            type="button"
            disabled={chargement}
            onClick={() =>
              setActualisation((n) => n + 1)
            }
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/25 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={
                chargement ? "animate-spin" : ""
              }
            />

            Actualiser
          </button>
        </div>
      </header>

      {/* ====================================
          MESSAGE D'ERREUR
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
            <p className="font-semibold">
              Impossible de charger les informations
            </p>

            <p className="mt-1 text-sm">
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
          DONNEES REELLES
      ==================================== */}

      {!chargement && !erreur && donnees && (
        <>
          {/* CARTES STATISTIQUES */}

          <section
            aria-label="Statistiques générales"
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
              SYNTHESE DES PRETS
          ================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <Activity
                    size={21}
                    className="text-emerald-700"
                  />

                  <h2 className="text-lg font-bold text-slate-900">
                    Synthèse des prêts
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Répartition des demandes selon
                  leur progression.
                </p>
              </div>

              <Link
                to="/admin/prets"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                Voir les prêts
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:p-6">
              <ElementSynthese
                titre="Prêts approuvés"
                valeur={stats.approuves}
                Icone={CheckCircle2}
                couleur="text-emerald-700"
                fond="bg-emerald-100"
              />

              <ElementSynthese
                titre="Prêts refusés"
                valeur={stats.refuses}
                Icone={XCircle}
                couleur="text-red-700"
                fond="bg-red-100"
              />

              <ElementSynthese
                titre="Décaissement et suivi"
                valeur={stats.decaisses}
                Icone={Wallet}
                couleur="text-blue-700"
                fond="bg-blue-100"
              />
            </div>
          </section>

          {/* =================================
              CINQ DERNIERES DEMANDES
          ================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={21}
                    className="text-emerald-700"
                  />

                  <h2 className="text-lg font-bold text-slate-900">
                    Les 5 dernières demandes
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Dernières demandes enregistrées,
                  tous statuts confondus.
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                <LayoutDashboard size={14} />
                Consultation uniquement
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
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
                  {recentes.map((pret) => (
                    <tr
                      key={pret.id}
                      className="transition-colors hover:bg-emerald-50/40"
                    >
                      <td className="px-5 py-4">
                        <span className="font-bold text-emerald-800">
                          PR-{pret.id}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <Users size={16} />
                          </div>

                          <span className="font-medium text-slate-800">
                            {[
                              pret.membre?.prenom,
                              pret.membre?.nom,
                            ]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        {montantFR(pret.montant)}
                      </td>

                      <td
                        className="max-w-[200px] truncate px-5 py-4 text-slate-600"
                        title={pret.motif || ""}
                      >
                        {pret.motif || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {dateFR(pret.dateDemande)}
                      </td>

                      <td className="px-5 py-4">
                        <BadgeStatut statut={pret.statut} />
                      </td>
                    </tr>
                  ))}

                  {recentes.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
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
                            Aucune demande enregistrée
                          </p>

                          <p className="text-sm text-slate-400">
                            Les demandes apparaîtront ici
                            dès leur enregistrement.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <p className="text-xs text-slate-500">
                Affichage des cinq demandes les plus récentes.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
