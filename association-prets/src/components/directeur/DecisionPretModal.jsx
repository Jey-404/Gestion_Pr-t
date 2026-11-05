
import { useState } from "react";
import { CheckCircle2, XCircle, Scale } from "lucide-react";

export default function DecisionPretModal({
  dossier,
  onFermer,
  onSucces,
}) {
  const [decision, setDecision] = useState("");
  const [observation, setObservation] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function enregistrerDecision(event) {
    event.preventDefault();

    if (
      chargement ||
      !["approuve", "rejete"].includes(decision) ||
      observation.trim().length < 10 ||
      observation.trim().length > 2000
    ) {
      return;
    }

    const action =
      decision === "approuve" ? "approuver" : "refuser";

    const confirmation = window.confirm(
      `Confirmer la décision d'${action} le dossier PR-${dossier.id} ?`
    );

    if (!confirmation) return;

    setChargement(true);
    setErreur("");

    try {
      const reponse = await fetch(
        `/api/directeur/dossiers/${encodeURIComponent(
          dossier.id
        )}/decision`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            observation: observation.trim(),
          }),
        }
      );

      if (reponse.status === 401) {
        throw new Error(
          "Session expirée."
        );
      }

      const donnees = await reponse.json();

      if (!reponse.ok || !donnees.success) {
        throw new Error(
          donnees.message ||
            "Impossible d'enregistrer la décision."
        );
      }

      onSucces?.(
        donnees.message ||
          "La décision a été enregistrée."
      );
    } catch (e) {
      setErreur(
        e.message ||
          "Une erreur est survenue pendant la décision."
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Décision du dossier PR-${dossier.id}`}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl"
      >
        <header className="p-5 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Scale size={22} className="text-green-700" />
            Décision du Directeur — PR-{dossier.id}
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Examinez la demande avant de prendre une décision.
          </p>
        </header>

        <form onSubmit={enregistrerDecision}>
          <div className="p-5 space-y-5">
            <section className="bg-gray-50 border rounded-xl p-4 space-y-3">
              <h3 className="font-bold">
                Informations du dossier
              </h3>

              <p>
                <strong>Membre :</strong>{" "}
                {dossier.membre?.prenom}{" "}
                {dossier.membre?.nom}
              </p>

              <p>
                <strong>Email :</strong>{" "}
                {dossier.membre?.email}
              </p>

              <p>
                <strong>Montant demandé :</strong>{" "}
                {Number(dossier.montant).toLocaleString("fr-FR")} FCFA
              </p>

              <p>
                <strong>Échéancier souhaité :</strong>{" "}
                {dossier.nombreEcheances
                  ? `${dossier.nombreEcheances} mensualité(s), à partir du ${
                    (dossier.datePremiereEcheance instanceof Date
                      ? dossier.datePremiereEcheance
                      : new Date(`${String(dossier.datePremiereEcheance).slice(0, 10)}T12:00:00`)
                    ).toLocaleDateString("fr-FR")
                  }`
                  : "Non renseigné"}
              </p>

              <p>
                <strong>Motif :</strong> {dossier.motif}
              </p>

              <p className="whitespace-pre-wrap">
                <strong>Description :</strong>{" "}
                {dossier.description || "Non renseignée"}
              </p>
            </section>

            <fieldset className="space-y-3">
              <legend className="font-bold mb-3">
                Décision du Directeur
              </legend>

              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-green-50">
                <input
                  type="radio"
                  name="decision"
                  value="approuve"
                  checked={decision === "approuve"}
                  onChange={(e) => setDecision(e.target.value)}
                  disabled={chargement}
                  className="accent-green-700"
                />

                <CheckCircle2 size={20} className="text-green-700" />

                <span className="font-semibold text-green-700">
                  Approuver le prêt
                </span>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-red-50">
                <input
                  type="radio"
                  name="decision"
                  value="rejete"
                  checked={decision === "rejete"}
                  onChange={(e) => setDecision(e.target.value)}
                  disabled={chargement}
                  className="accent-red-700"
                />

                <XCircle size={20} className="text-red-700" />

                <span className="font-semibold text-red-700">
                  Refuser le prêt
                </span>
              </label>
            </fieldset>

            <div>
              <label
                htmlFor="observation-directeur"
                className="block font-semibold mb-2"
              >
                Motif de la décision
              </label>

              <textarea
                id="observation-directeur"
                value={observation}
                onChange={(e) =>
                  setObservation(e.target.value)
                }
                minLength={10}
                maxLength={2000}
                required
                rows={4}
                disabled={chargement}
                placeholder="Expliquez la raison de votre décision..."
                className="w-full border border-gray-300 rounded-xl p-3"
              />
            </div>

            {erreur && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4"
              >
                {erreur}
              </div>
            )}
          </div>

          <footer className="sticky bottom-0 bg-white border-t p-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onFermer}
              disabled={chargement}
              className="px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Fermer
            </button>

            <button
              type="submit"
              disabled={
                chargement ||
                !decision ||
                observation.trim().length < 10 ||
                observation.trim().length > 2000
              }
              className="px-5 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50"
            >
              {chargement
                ? "Enregistrement..."
                : "Confirmer la décision"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
