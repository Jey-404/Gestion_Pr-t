
import { useEffect, useState } from "react";

import {
  ClipboardCheck,
  RefreshCw,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldCheck,
  ArrowRight,
  Banknote,
  TrendingUp,
  Landmark,
  CalendarDays,
  LockKeyhole,
  FileCheck2,
} from "lucide-react";

import DossiersReelsDirecteur from "../../components/directeur/DossiersReelsDirecteur";

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

function montantFR(valeur) {
  const montant = Number(valeur);

  if (!Number.isFinite(montant)) {
    return "—";
  }

  return `${montant.toLocaleString("fr-FR")} FCFA`;
}

function dateMoisFR(valeur) {
  if (!valeur) return "Ce mois";

  const texte = typeof valeur === "string"
    ? valeur.slice(0, 10)
    : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texte)) {
    return "Ce mois";
  }

  const date = new Date(`${texte}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "Ce mois";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// ==========================================
// CARTE FINANCIERE
// ==========================================

function CarteBudget({
  titre,
  montant,
  description,
  Icone,
  couleur,
  fond,
}) {
  return (
    <div
      className="
        group rounded-2xl border border-slate-200
        bg-white p-5 shadow-sm
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`rounded-xl p-3 ${fond}`}>
          <Icone size={22} className={couleur} />
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {titre}
      </p>

      <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {montantFR(montant)}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

// ==========================================
// PAGE EXAMINER LES DEMANDES
// ==========================================

export default function ExamenDemandes() {
  const [quota, setQuota] = useState(null);

  const [quotaChargement, setQuotaChargement] =
    useState(true);

  const [quotaErreur, setQuotaErreur] =
    useState("");

  const [actualisationQuota, setActualisationQuota] =
    useState(0);

  // ========================================
  // RECUPERER LE BUDGET DEPUIS MYSQL
  // ========================================

  useEffect(() => {
    const controleur = new AbortController();

    async function chargerQuota() {
      setQuotaChargement(true);
      setQuotaErreur("");

      try {
        const reponse = await fetch(
          "/api/directeur/quota",
          {
            method: "GET",
            credentials: "same-origin",
            signal: controleur.signal,
          }
        );

        if (reponse.status === 401) {
          throw new Error(
            "Session expirée."
          );
        }

        if (reponse.status === 403) {
          throw new Error(
            "Accès réservé au Directeur."
          );
        }

        if (reponse.status === 404) {
          throw new Error(
            "La route /api/directeur/quota est introuvable."
          );
        }

        const donnees = await reponse.json().catch(
          () => ({})
        );

        if (!reponse.ok || !donnees.success) {
          throw new Error(
            donnees.message ||
              "Impossible de charger le budget mensuel."
          );
        }

        const resultat = donnees.quota;

        if (!resultat || typeof resultat !== "object") {
          throw new Error(
            "Les données du budget sont invalides."
          );
        }

        const limite = Number(resultat.limite);
        const utilise = Number(resultat.utilise);
        const restant = Number(resultat.restant);

        if (
          ![limite, utilise, restant].every(
            (valeur) =>
              Number.isFinite(valeur) && valeur >= 0
          )
        ) {
          throw new Error(
            "Le serveur a retourné des montants invalides."
          );
        }

        if (!controleur.signal.aborted) {
          setQuota({
            actif:
              resultat.actif === true ||
              resultat.actif === 1,

            mois: resultat.mois ?? null,
            limite,
            utilise,
            restant,
          });
        }

      } catch (erreur) {
        if (
          erreur.name !== "AbortError" &&
          !controleur.signal.aborted
        ) {
          setQuota(null);

          setQuotaErreur(
            erreur.message ||
              "Impossible de contacter le serveur."
          );
        }

      } finally {
        if (!controleur.signal.aborted) {
          setQuotaChargement(false);
        }
      }
    }

    chargerQuota();

    return () => controleur.abort();
  }, [actualisationQuota]);

  // ========================================
  // CALCUL DE L'UTILISATION
  // ========================================

  const budgetTotal = quota?.limite ?? 0;
  const budgetUtilise = quota?.utilise ?? 0;
  const budgetRestant = quota?.restant ?? 0;

  const pourcentage = budgetTotal > 0
    ? Math.min(
        100,
        Math.max(
          0,
          (budgetUtilise / budgetTotal) * 100
        )
      )
    : 0;

  function actualiserBudget() {
    setActualisationQuota((valeur) => valeur + 1);
  }

  return (
    <div className="w-full space-y-7 pb-10">

      {/* ====================================
          BANDEAU PRINCIPAL
      ==================================== */}

      <header
        className="
          relative overflow-hidden rounded-3xl
          bg-gradient-to-r
          from-emerald-900 via-emerald-800 to-green-700
          p-6 text-white shadow-lg sm:p-8
        "
      >
        <div
          className="
            pointer-events-none absolute
            -right-16 -top-24
            h-64 w-64 rounded-full
            border border-white/10
          "
        />

        <div
          className="
            pointer-events-none absolute
            right-0 top-12
            h-40 w-40 rounded-full bg-white/5
          "
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">

            <div
              className="
                mb-4 inline-flex items-center gap-2
                rounded-full border border-white/20
                bg-white/10 px-3 py-1.5
                text-xs font-semibold text-emerald-50
              "
            >
              <ShieldCheck size={15} />
              Espace Directeur
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Examiner les demandes
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100">
              Étudiez les dossiers transmis par le
              Secrétaire, consultez le budget disponible
              et prenez vos décisions en toute clarté.
            </p>

          </div>

          <div
            className="
              flex h-16 w-16 items-center justify-center
              rounded-2xl border border-white/20
              bg-white/10
            "
          >
            <ClipboardCheck size={30} />
          </div>
        </div>
      </header>

      {/* ====================================
          PRESENTATION DU BUDGET
      ==================================== */}

      <section className="space-y-5">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>
            <div className="flex items-center gap-2">
              <Landmark
                size={22}
                className="text-emerald-700"
              />

              <h2 className="text-xl font-bold text-slate-900">
                Suivi du budget mensuel
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Montants engagés lors de l'approbation
              des demandes de prêt.
            </p>
          </div>

          <button
            type="button"
            onClick={actualiserBudget}
            disabled={quotaChargement}
            className="
              inline-flex items-center gap-2 rounded-xl
              border border-emerald-200 bg-white
              px-4 py-2.5 text-sm font-semibold
              text-emerald-800 shadow-sm
              transition-colors hover:bg-emerald-50
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={17}
              className={
                quotaChargement ? "animate-spin" : ""
              }
            />

            Actualiser le budget
          </button>
        </div>

        {/* CHARGEMENT */}

        {quotaChargement && (
          <div
            role="status"
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="
                  animate-pulse rounded-2xl
                  border border-slate-200
                  bg-white p-5
                "
              >
                <div className="h-12 w-12 rounded-xl bg-slate-100" />
                <div className="mt-5 h-4 w-28 rounded bg-slate-100" />
                <div className="mt-3 h-8 w-36 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* ERREUR DU QUOTA */}

        {!quotaChargement && quotaErreur && (
          <div
            role="alert"
            className="
              flex items-start gap-3 rounded-2xl
              border border-red-200 bg-red-50
              p-5 text-red-700
            "
          >
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-bold">
                Budget indisponible
              </p>

              <p className="mt-1 text-sm">
                {quotaErreur}
              </p>
            </div>
          </div>
        )}

        {/* QUOTA INACTIF */}

        {!quotaChargement &&
          !quotaErreur &&
          !quota?.actif && (
            <div
              className="
                flex items-start gap-3 rounded-2xl
                border border-amber-200 bg-amber-50
                p-5 text-amber-800
              "
            >
              <AlertCircle
                size={21}
                className="shrink-0"
              />

              <div>
                <p className="font-bold">
                  Aucun budget mensuel actif
                </p>

                <p className="mt-1 text-sm leading-6">
                  L'Administrateur doit configurer
                  ou activer le budget du mois.
                </p>
              </div>
            </div>
          )}

        {/* BUDGET ACTIF */}

        {!quotaChargement &&
          !quotaErreur &&
          quota?.actif && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <CarteBudget
                  titre="Budget mensuel"
                  montant={budgetTotal}
                  description="Enveloppe définie par l'Administrateur"
                  Icone={Banknote}
                  couleur="text-slate-700"
                  fond="bg-slate-100"
                />

                <CarteBudget
                  titre="Montant engagé"
                  montant={budgetUtilise}
                  description="Prêts approuvés par le Directeur"
                  Icone={CheckCircle2}
                  couleur="text-amber-700"
                  fond="bg-amber-50"
                />

                <CarteBudget
                  titre="Budget disponible"
                  montant={budgetRestant}
                  description="Montant encore disponible"
                  Icone={Wallet}
                  couleur="text-emerald-700"
                  fond="bg-emerald-50"
                />
              </div>

              {/* PROGRESSION */}

              <div
                className="
                  rounded-2xl border border-slate-200
                  bg-white p-5 shadow-sm sm:p-6
                "
              >
                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <TrendingUp
                        size={19}
                        className="text-emerald-700"
                      />

                      Utilisation du budget
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {dateMoisFR(quota.mois)}
                    </p>
                  </div>

                  <span
                    className="
                      rounded-full bg-emerald-50
                      px-4 py-2 text-sm font-bold
                      text-emerald-700
                    "
                  >
                    {pourcentage.toLocaleString(
                      "fr-FR",
                      { maximumFractionDigits: 1 }
                    )} %
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label="Budget mensuel utilisé"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(pourcentage)}
                  className="
                    mt-5 h-3 overflow-hidden
                    rounded-full bg-emerald-100
                  "
                >
                  <div
                    className="
                      h-full rounded-full bg-emerald-600
                      transition-all duration-500
                    "
                    style={{
                      width: `${pourcentage}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs text-slate-500">
                  <span>
                    Engagé : {montantFR(budgetUtilise)}
                  </span>

                  <span>
                    Disponible : {montantFR(budgetRestant)}
                  </span>
                </div>
              </div>

             
            </>
          )}
      </section>

      {/* ====================================
          DOSSIERS A EXAMINER
      ==================================== */}

      <section className="space-y-4">

      

        {/* COMPOSANT EXISTANT */}

        <DossiersReelsDirecteur />

      </section>

      {/* ====================================
          RAPPEL DU PROCESSUS
      ==================================== */}


    </div>
  );
}
