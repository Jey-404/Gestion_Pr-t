import { useCallback, useEffect, useState } from "react";
import { HandCoins, AlertCircle, CheckCircle2, X } from "lucide-react";

const MODES = ["especes", "virement", "mobile_money"];

function montantFR(valeur) {
  const n = Number(valeur);
  return Number.isFinite(n) ? `${n.toLocaleString("fr-FR")} FCFA` : "—";
}

function dateFR(valeur) {
  if (!valeur) return "—";
  const date = valeur instanceof Date
    ? valeur
    : new Date(`${String(valeur).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}

async function lireReponse(reponse) {
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok || !donnees.success) {
    throw new Error(donnees.message || `Erreur du serveur (${reponse.status}).`);
  }
  return donnees;
}

export default function RemboursementModal({ pret, onFermer, onSucces }) {
  const [situation, setSituation] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [operationEnCours, setOperationEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const [montant, setMontant] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [observation, setObservation] = useState("");

  const urlBase = `/api/comptable/prets/${encodeURIComponent(pret.id)}`;

  const chargerSituation = useCallback(async (signal) => {
    setChargement(true);
    setErreur("");
    try {
      const reponse = await fetch(
        `/api/comptable/prets/${encodeURIComponent(pret.id)}/situation`,
        { method: "GET", credentials: "same-origin", signal }
      );
      const donnees = await lireReponse(reponse);
      if (!signal?.aborted) setSituation(donnees.situation);
    } catch (e) {
      if (e.name !== "AbortError" && !signal?.aborted) {
        setSituation(null);
        setErreur(e.message || "Impossible de charger la situation du prêt.");
      }
    } finally {
      if (!signal?.aborted) setChargement(false);
    }
  }, [pret.id]);

  useEffect(() => {
    const controleur = new AbortController();
    chargerSituation(controleur.signal);
    return () => controleur.abort();
  }, [chargerSituation]);

  const prochaine = situation?.prochaineEcheance ?? null;
  const echeancierAbsent = situation !== null && Number(situation.nombreEcheances) === 0;
  const soldeDisponible = Number(prochaine?.restant ?? 0);
  const montantNumerique = Number(montant);

  const remboursementValide = Boolean(
    !chargement && prochaine && soldeDisponible > 0 &&
    montant.trim() !== "" && Number.isSafeInteger(montantNumerique) &&
    montantNumerique > 0 && montantNumerique <= soldeDisponible &&
    MODES.includes(modePaiement) &&
    reference.trim().length >= 3 && reference.trim().length <= 100 &&
    observation.trim().length <= 2000
  );

  async function confirmerRemboursement(event) {
    event.preventDefault();
    if (operationEnCours || !remboursementValide) return;
    if (!window.confirm(
      `Confirmer l'enregistrement de ${montantFR(montantNumerique)} pour PR-${pret.id} ?`
    )) return;

    setOperationEnCours(true);
    setErreur("");
    try {
      const reponse = await fetch(`${urlBase}/rembourser`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: montantNumerique,
          modePaiement,
          reference: reference.trim(),
          observation: observation.trim(),
        }),
      });
      const donnees = await lireReponse(reponse);
      if (typeof onSucces === "function") onSucces(donnees.message);
      else onFermer();
    } catch (e) {
      setErreur(e.message || "Impossible d'enregistrer le remboursement.");
    } finally {
      setOperationEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="titre-remboursement"
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
        <header className="p-5 border-b flex items-center justify-between gap-3">
          <div>
            <h2 id="titre-remboursement" className="text-xl font-bold flex items-center gap-2">
              <HandCoins size={22} className="text-green-700" /> Rembourser PR-{pret.id}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {pret.membre?.prenom} {pret.membre?.nom}
            </p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onFermer}
            disabled={operationEnCours} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
            <X size={20} />
          </button>
        </header>

        <div className="p-5 space-y-5">
          <div className="bg-gray-50 border rounded-xl p-4 text-sm space-y-2">
            <p><strong>Montant initial :</strong> {montantFR(pret.montant)}</p>
            <p><strong>Motif :</strong> {pret.motif || "Non renseigné"}</p>
            <p>
              <strong>Échéancier choisi par le membre :</strong>{" "}
              {pret.nombreEcheances
                ? `${pret.nombreEcheances} mensualité(s), à partir du ${dateFR(pret.datePremiereEcheance)}`
                : "Non renseigné"}
            </p>
          </div>

          {chargement && <p role="status" className="text-gray-500">Chargement des échéances...</p>}

          {!chargement && situation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-2">
              <p>Montant total des échéances : <strong>{montantFR(situation.montantTotal)}</strong></p>
              <p>Déjà remboursé : <strong>{montantFR(situation.montantRembourse)}</strong></p>
              <p>Solde restant : <strong>{montantFR(situation.montantRestant)}</strong></p>
              {prochaine && <p>Échéance n°{prochaine.numero} : <strong>{montantFR(prochaine.restant)}</strong> restant</p>}
            </div>
          )}

          {!chargement && echeancierAbsent && (
            <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Aucune échéance n’est enregistrée pour ce prêt. Le remboursement ne peut pas être saisi; vérifiez l’échéancier transmis avec la demande.
            </p>
          )}

          {!chargement && situation && !echeancierAbsent && !prochaine && (
            <p className="p-4 border rounded-lg text-gray-600">
              Toutes les échéances sont soldées. Aucun nouveau remboursement n'est nécessaire.
            </p>
          )}

          {!chargement && prochaine && (
            <form onSubmit={confirmerRemboursement} className="space-y-4">
              <div>
                <label htmlFor="montant-remboursement" className="block text-sm font-semibold mb-2">Montant du remboursement (FCFA)</label>
                <input id="montant-remboursement" type="number" min="1" step="1" max={soldeDisponible} required
                  value={montant} onChange={(e) => setMontant(e.target.value)}
                  disabled={operationEnCours} className="w-full border border-gray-300 rounded-lg p-3" />
              </div>
              <div>
                <label htmlFor="mode-remboursement" className="block text-sm font-semibold mb-2">Mode de paiement</label>
                <select id="mode-remboursement" required value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)} disabled={operationEnCours}
                  className="w-full border rounded-lg p-3">
                  <option value="">Sélectionnez un mode</option>
                  <option value="especes">Espèces</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              <div>
                <label htmlFor="reference-remboursement" className="block text-sm font-semibold mb-2">Référence du paiement</label>
                <input id="reference-remboursement" type="text" minLength={3} maxLength={100} required
                  value={reference} onChange={(e) => setReference(e.target.value)}
                  disabled={operationEnCours} className="w-full border rounded-lg p-3" />
              </div>
              <div>
                <label htmlFor="observation-remboursement" className="block text-sm font-semibold mb-2">Observation (facultative)</label>
                <textarea id="observation-remboursement" rows={3} maxLength={2000}
                  value={observation} onChange={(e) => setObservation(e.target.value)}
                  disabled={operationEnCours} className="w-full border rounded-lg p-3" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={!remboursementValide || operationEnCours}
                  className="px-5 py-3 bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50">
                  {operationEnCours ? "Enregistrement..." : "Confirmer le remboursement"}
                </button>
              </div>
            </form>
          )}

          {erreur && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle size={19} className="shrink-0" /> <p>{erreur}</p>
          </div>}
        </div>

        <footer className="p-5 border-t flex justify-end">
          <button type="button" onClick={onFermer} disabled={operationEnCours}
            className="px-5 py-3 border rounded-lg disabled:opacity-50">Fermer</button>
        </footer>
      </section>
    </div>
  );
}
