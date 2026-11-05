import { useState } from "react";
import { AlertCircle, Banknote, CheckCircle2, X } from "lucide-react";

function montantFR(valeur) {
  const montant = Number(valeur);
  return Number.isFinite(montant)
    ? `${montant.toLocaleString("fr-FR")} FCFA`
    : "—";
}

function dateFR(valeur) {
  if (!valeur) return "—";
  const date = valeur instanceof Date
    ? valeur
    : new Date(`${String(valeur).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}

const MODES = ["especes", "virement", "mobile_money"];

export default function PreparerDecaissementModal({ pret, onFermer, onSucces }) {
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [observation, setObservation] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");

  const formulaireValide =
    pret?.statut === "approuve" &&
    Number.isInteger(Number(pret?.nombreEcheances)) &&
    Number(pret.nombreEcheances) >= 1 &&
    Number(pret.nombreEcheances) <= 60 &&
    Number(pret.nombreEcheances) <= Number(pret.montant) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(pret?.datePremiereEcheance).slice(0, 10)) &&
    MODES.includes(modePaiement) &&
    reference.trim().length >= 3 &&
    reference.trim().length <= 100 &&
    observation.trim().length <= 2000;

  async function confirmerDecaissement(event) {
    event.preventDefault();
    if (!formulaireValide || enregistrement) return;

    const confirme = window.confirm(
      `Confirmer l'enregistrement du décaissement de ${montantFR(pret.montant)} pour PR-${pret.id} ?\n\n` +
      "Confirmez uniquement si le versement a bien été effectué."
    );
    if (!confirme) return;

    setEnregistrement(true);
    setErreur("");
    try {
      const reponse = await fetch(
        `/api/comptable/prets/${encodeURIComponent(pret.id)}/decaisser`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modePaiement,
            reference: reference.trim(),
            observation: observation.trim(),
          }),
        }
      );
      const donnees = await reponse.json().catch(() => ({}));
      if (!reponse.ok || !donnees.success) {
        throw new Error(donnees.message || "Impossible d'enregistrer le décaissement.");
      }
      if (typeof onSucces === "function") {
        onSucces(donnees.message);
      } else {
        onFermer();
      }
    } catch (e) {
      setErreur(e.message || "Une erreur de communication est survenue. Vérifiez l'historique avant de réessayer.");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="titre-decaissement" className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
        <header className="p-5 border-b flex items-center justify-between gap-3">
          <div>
            <h2 id="titre-decaissement" className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Banknote size={23} className="text-green-700" />
              Décaissement — PR-{pret.id}
            </h2>
            <p className="text-sm text-gray-500 mt-2">Enregistrer un versement effectué.</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onFermer} disabled={enregistrement} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
            <X size={20} />
          </button>
        </header>
        <form onSubmit={confirmerDecaissement}>
          <div className="p-5 space-y-5">
            <div className="bg-gray-50 border rounded-xl p-4 space-y-2">
              <h3 className="font-semibold">Informations du prêt</h3>
              <p className="text-sm"><strong>Membre :</strong> {pret.membre?.prenom} {pret.membre?.nom}</p>
              <p className="text-sm"><strong>Montant approuvé :</strong> {montantFR(pret.montant)}</p>
              <p className="text-sm"><strong>Motif :</strong> {pret.motif || "Non renseigné"}</p>
              <p className="text-sm">
                <strong>Échéancier choisi par le membre :</strong>{" "}
                {pret.nombreEcheances
                  ? `${pret.nombreEcheances} mensualité(s), dès le ${dateFR(pret.datePremiereEcheance)}`
                  : "Non renseigné"}
              </p>
              <p className="text-sm"><strong>Statut :</strong> {pret.statut}</p>
            </div>
            <div>
              <label htmlFor="mode-decaissement" className="block text-sm font-semibold mb-2">Mode de paiement</label>
              <select id="mode-decaissement" value={modePaiement} onChange={(e) => setModePaiement(e.target.value)} disabled={enregistrement} required className="w-full border border-gray-300 rounded-lg p-3">
                <option value="">Sélectionnez un mode</option>
                <option value="especes">Espèces</option>
                <option value="virement">Virement bancaire</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
            <div>
              <label htmlFor="reference-decaissement" className="block text-sm font-semibold mb-2">Référence de l'opération</label>
              <input id="reference-decaissement" type="text" required minLength={3} maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} disabled={enregistrement} placeholder="Référence ou numéro de reçu" className="w-full border border-gray-300 rounded-lg p-3" />
            </div>
            <div>
              <label htmlFor="observation-decaissement" className="block text-sm font-semibold mb-2">Observation (facultative)</label>
              <textarea id="observation-decaissement" maxLength={2000} rows={3} value={observation} onChange={(e) => setObservation(e.target.value)} disabled={enregistrement} className="w-full border border-gray-300 rounded-lg p-3" />
            </div>
            <p className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 text-sm">
              Le montant correspond au prêt approuvé. La date est enregistrée automatiquement.
              Cette opération ne déclenche pas de transfert bancaire ou Mobile Money.
            </p>
            {!pret.nombreEcheances && (
              <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                L’échéancier choisi par le membre est absent. Le décaissement est bloqué jusqu’à régularisation du dossier.
              </p>
            )}
            {erreur && (
              <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                <AlertCircle size={19} className="shrink-0" />
                <p>{erreur}</p>
              </div>
            )}
          </div>
          <footer className="sticky bottom-0 bg-white border-t p-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onFermer} disabled={enregistrement} className="px-5 py-3 border border-gray-300 rounded-lg disabled:opacity-50">Fermer</button>
            <button type="submit" disabled={!formulaireValide || enregistrement} className="inline-flex items-center gap-2 px-5 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50">
              <CheckCircle2 size={18} />
              {enregistrement ? "Enregistrement..." : "Confirmer le décaissement"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
