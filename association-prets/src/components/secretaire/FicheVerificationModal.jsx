import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

function FicheVerificationModal({ pretId, onFermer, onSucces }) {
  const [pret, setPret] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (pretId == null) return;
    const controleur = new AbortController();

    async function chargerDossier() {
      setChargement(true);
      setErreur("");
      setPret(null);

      try {
        const reponse = await fetch(
          `/api/secretaire/prets/${encodeURIComponent(pretId)}`,
          { credentials: "same-origin", signal: controleur.signal }
        );

        if (reponse.status === 401) {
          throw new Error("Session expirée.");
        }
        if (reponse.status === 403) {
          throw new Error("Acces reserve au Secretaire.");
        }

        const donnees = await reponse.json();
        if (!reponse.ok || !donnees.success) {
          throw new Error(donnees.message || "Impossible de charger le dossier.");
        }
        if (!controleur.signal.aborted) setPret(donnees.pret);
      } catch (e) {
        if (e.name !== "AbortError" && !controleur.signal.aborted) {
          setErreur(e.message || "Erreur de chargement du dossier.");
        }
      } finally {
        if (!controleur.signal.aborted) setChargement(false);
      }
    }

    chargerDossier();
    return () => controleur.abort();
  }, [pretId]);

  const transmissionAutorisee =
    !!pret &&
    ["soumis", "en_verification"].includes(pret.statut) &&
    Array.isArray(pret.justificatifs) &&
    pret.justificatifs.length > 0;

  async function soumettreAuDirecteur(event) {
    event.preventDefault();
    if (!transmissionAutorisee || enregistrement) return;

    if (
      !window.confirm(
        `Transmettre le dossier PR-${pretId} au Directeur sans fiche de controle ?`
      )
    ) return;

    setEnregistrement(true);
    setErreur("");

    try {
      const reponse = await fetch(
        `/api/secretaire/prets/${encodeURIComponent(pretId)}/verification`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "transmettre_directeur" }),
        }
      );

      if (reponse.status === 401) {
        throw new Error("Session expirée.");
      }
      if (reponse.status === 403) {
        throw new Error("Vous n'etes pas autorise a transmettre ce dossier.");
      }

      const donnees = await reponse.json();
      if (!reponse.ok || !donnees.success) {
        throw new Error(donnees.message || "La transmission a echoue.");
      }
      onSucces?.(donnees.message || "Dossier transmis au Directeur.");
    } catch (e) {
      setErreur(e.message || "Erreur reseau. Verifiez le statut avant de reessayer.");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Dossier PR-${pretId}`}
        className="bg-white w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-xl"
      >
        <header className="p-5 border-b">
          <h2 className="text-xl font-bold">Dossier PR-{pretId}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Consultez les informations et les justificatifs avant transmission.
          </p>
        </header>

        <form onSubmit={soumettreAuDirecteur}>
          {chargement && (
            <p role="status" className="p-5">Chargement du dossier...</p>
          )}

          {!chargement && pret && (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-5">
                <section className="border rounded-xl p-4 space-y-2">
                  <h3 className="font-bold text-lg">Informations du membre</h3>
                  <p><strong>Nom :</strong> {pret.membre?.prenom} {pret.membre?.nom}</p>
                  <p><strong>Email :</strong> {pret.membre?.email || "Non renseigne"}</p>
                  <p><strong>Telephone :</strong> {pret.membre?.telephone || "Non renseigne"}</p>
                </section>

                <section className="border rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-lg">Informations du pret</h3>
                  <p className="text-2xl font-bold text-green-700">
                    {Number(pret.montant).toLocaleString("fr-FR")} FCFA
                  </p>
                  <p><strong>Motif :</strong> {pret.motif}</p>
                  <p className="whitespace-pre-wrap">
                    <strong>Description :</strong> {pret.description || "Aucune description"}
                  </p>
                  <p><strong>Statut :</strong> {pret.statut}</p>
                </section>
              </div>

              <section className="border rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText size={20} /> Pieces justificatives
                </h3>
                {!pret.justificatifs?.length && (
                  <p className="text-sm text-gray-500">Aucun justificatif disponible.</p>
                )}
                {pret.justificatifs?.map((document) => (
                  <div key={document.id} className="space-y-3">
                    <p className="text-sm font-medium break-all">{document.nom}</p>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 underline text-sm"
                    >
                      Ouvrir le document
                    </a>
                    {document.type === "application/pdf" ? (
                      <iframe
                        src={document.url}
                        title={`Justificatif ${document.id}`}
                        sandbox="allow-scripts"
                        className="w-full h-[420px] border rounded-lg"
                      />
                    ) : ["image/jpeg", "image/png"].includes(document.type) ? (
                      <img
                        src={document.url}
                        alt={`Justificatif ${document.nom}`}
                        className="w-full max-h-[500px] object-contain border rounded-lg"
                      />
                    ) : null}
                  </div>
                ))}
              </section>
            </div>
          )}

          {erreur && (
            <p role="alert" className="mx-5 mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
              {erreur}
            </p>
          )}

          <footer className="sticky bottom-0 bg-white border-t p-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onFermer}
              disabled={enregistrement}
              className="px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={!transmissionAutorisee || chargement || enregistrement}
              className="px-5 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50"
            >
              {enregistrement ? "Transmission..." : "Soumettre au Directeur"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default FicheVerificationModal;
