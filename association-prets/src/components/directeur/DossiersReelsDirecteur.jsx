
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import DecisionPretModal from "./DecisionPretModal";

import {
  FileText,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  Scale,
} from "lucide-react";

// ============================================
// FORMATAGE DE LA DATE
// ============================================

function dateFR(valeur) {
  if (!valeur) return "—";

  const date = new Date(valeur);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fr-FR");
}

// ============================================
// FORMATAGE DU MONTANT
// ============================================

function montantFR(valeur) {
  const montant = Number(valeur);

  return Number.isFinite(montant)
    ? montant.toLocaleString("fr-FR") + " FCFA"
    : "—";
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function DossiersReelsDirecteur() {
  // Dossiers provenant de MySQL
  const [dossiers, setDossiers] = useState([]);

  // Etats du chargement
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);

  // Recherche
  const [recherche, setRecherche] = useState("");

  // Actualisation de la liste
  const [actualisation, setActualisation] = useState(0);

  // Dossier sélectionné pour la décision
  const [dossierSelectionne, setDossierSelectionne] =
    useState(null);

  // Message après la décision
  const [messageSucces, setMessageSucces] = useState("");

  // ============================================
  // CHARGER LES DOSSIERS DEPUIS MYSQL
  // ============================================

  useEffect(() => {
    const controleur = new AbortController();

    async function chargerDossiers() {
      setChargement(true);
      setErreur("");

      try {
        const reponse = await fetch(
          "/api/directeur/dossiers",
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
            "Accès réservé au compte Directeur."
          );
        }

        const donnees = await reponse.json();

        if (!reponse.ok || !donnees.success) {
          throw new Error(
            donnees.message ||
              "Impossible de récupérer les dossiers du Directeur."
          );
        }

        if (controleur.signal.aborted) {
          return;
        }

        setSessionExpiree(false);

        setDossiers(
          Array.isArray(donnees.dossiers)
            ? donnees.dossiers
            : []
        );
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

    chargerDossiers();

    return () => controleur.abort();
  }, [actualisation]);

  // ============================================
  // FILTRER LES DOSSIERS
  // ============================================

  const dossiersFiltres = useMemo(() => {
    const texte = recherche.trim().toLowerCase();

    return dossiers.filter((dossier) => {
      const contenu = [
        dossier.id,
        "PR-" + dossier.id,
        dossier.motif,
        dossier.membre?.nom,
        dossier.membre?.prenom,
        dossier.membre?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenu.includes(texte);
    });
  }, [dossiers, recherche]);

  // ============================================
  // ACTUALISER LES DOSSIERS
  // ============================================

  function actualiserDossiers() {
    setMessageSucces("");
    setActualisation((valeur) => valeur + 1);
  }

  // ============================================
  // OUVRIR LA FENETRE DE DECISION
  // ============================================

  function ouvrirDecision(dossier) {
    if (sessionExpiree || chargement) {
      return;
    }

    setMessageSucces("");
    setDossierSelectionne(dossier);
  }

  // ============================================
  // FERMER LA FENETRE
  // ============================================

  function fermerDecision() {
    setDossierSelectionne(null);
  }

  // ============================================
  // APRES UNE DECISION REUSSIE
  // ============================================

  function decisionReussie(message) {
    setDossierSelectionne(null);

    setMessageSucces(
      message ||
        "La décision du Directeur a été enregistrée."
    );

    // Actualiser les dossiers depuis MySQL.
    setActualisation((valeur) => valeur + 1);
  }

  // ============================================
  // AFFICHAGE
  // ============================================

  return (
    <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

      {/* EN-TETE */}
      <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Scale
              size={21}
              className="text-green-700"
            />
           Dossiers en attente de décision
          </h2>

          <p className="text-sm text-gray-500 mt-1">
          </p>
        </div>

        <button
          type="button"
          onClick={actualiserDossiers}
          disabled={chargement}
          className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={17} />
          Actualiser
        </button>
      </div>

      {/* MESSAGE DE SUCCES */}
      {messageSucces && (
        <div
          role="status"
          className="m-5 flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4"
        >
          <CheckCircle2
            size={20}
            className="shrink-0"
          />

          <p className="text-sm">
            {messageSucces}
          </p>
        </div>
      )}

      {/* MESSAGE D'ERREUR */}
      {erreur && (
        <div
          role="alert"
          className="m-5 p-4 border border-red-200 bg-red-50 text-red-700 rounded-xl flex items-start gap-3"
        >
          <AlertCircle
            size={20}
            className="shrink-0"
          />

          <div>
            <p className="text-sm">{erreur}</p>

          </div>
        </div>
      )}

      {/* CONTENU */}
      {!erreur && (
        <>
          {/* RECHERCHE */}
          <div className="p-5 border-b border-gray-100">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={recherche}
                onChange={(event) =>
                  setRecherche(event.target.value)
                }
                placeholder="Référence, membre ou motif..."
                className="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {!chargement && (
              <p className="mt-3 text-xs text-gray-500">
                {dossiersFiltres.length} dossier(s) affiché(s)
                {" "}sur {dossiers.length} en attente de décision.
              </p>
            )}
          </div>

          {/* CHARGEMENT */}
          {chargement ? (
            <p
              role="status"
              className="p-8 text-center text-gray-500"
            >
              Chargement des dossiers...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4">
                      Référence
                    </th>

                    <th className="p-4">
                      Membre
                    </th>

                    <th className="p-4">
                      Montant
                    </th>

                    <th className="p-4">
                      Motif
                    </th>

                    <th className="p-4">
                      Échéancier souhaité
                    </th>

                    <th className="p-4">
                      Date
                    </th>

                    <th className="p-4">
                      Statut
                    </th>

                    <th className="p-4">
                      Justificatif
                    </th>

                    <th className="p-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dossiersFiltres.map((dossier) => (
                    <tr
                      key={dossier.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      {/* REFERENCE */}
                      <td className="p-4 font-semibold whitespace-nowrap">
                        PR-{dossier.id}
                      </td>

                      {/* MEMBRE */}
                      <td className="p-4">
                        <p className="font-medium text-gray-900">
                          {dossier.membre?.prenom}{" "}
                          {dossier.membre?.nom}
                        </p>

                        <p className="text-xs text-gray-500">
                          {dossier.membre?.email}
                        </p>
                      </td>

                      {/* MONTANT */}
                      <td className="p-4 whitespace-nowrap">
                        {montantFR(dossier.montant)}
                      </td>

                      {/* MOTIF */}
                      <td className="p-4 max-w-xs">
                        <p className="truncate" title={dossier.motif || ""}>
                          {dossier.motif || "Non renseigné"}
                        </p>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {dossier.nombreEcheances
                          ? (
                            <>
                              <p className="font-medium">
                                {dossier.nombreEcheances} mensualité(s)
                              </p>
                              <p className="text-xs text-gray-500">
                                Dès le {dateFR(dossier.datePremiereEcheance)}
                              </p>
                            </>
                          )
                          : <span className="text-amber-700">Non renseigné</span>}
                      </td>

                      {/* DATE */}
                      <td className="p-4 whitespace-nowrap">
                        {dateFR(dossier.dateDemande)}
                      </td>

                      {/* STATUT */}
                      <td className="p-4">
                        <span className="inline-flex px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold whitespace-nowrap">
                          En décision
                        </span>
                      </td>

                      {/* JUSTIFICATIF */}
                      <td className="p-4">
                        {dossier.justificatifPresent ? (
                          <span className="text-green-700 font-medium text-xs">
                            Déposé
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium text-xs">
                            Absent
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() =>
                            ouvrirDecision(dossier)
                          }
                          disabled={
                            sessionExpiree ||
                            chargement
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-xs font-semibold hover:bg-green-800 disabled:opacity-50"
                        >
                          <Scale size={16} />
                          Décider
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* AUCUN DOSSIER */}
                  {dossiersFiltres.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-10 text-center text-gray-500"
                      >
                        <FileText
                          size={34}
                          className="mx-auto mb-3 text-gray-400"
                        />

                        <p>
                          Aucun dossier en attente ne
                          correspond à votre recherche.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* FENETRE DE DECISION */}
      {dossierSelectionne !== null && (
        <DecisionPretModal
          dossier={dossierSelectionne}
          onFermer={fermerDecision}
          onSucces={decisionReussie}
        />
      )}
    </section>
  );
}
