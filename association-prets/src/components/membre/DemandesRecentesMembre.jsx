
import { Link } from "react-router";
import { ArrowRight, FileText } from "lucide-react";

const libellesStatuts = {
  soumis: "Soumis",
  en_verification: "En vérification",
  en_decision: "En décision",
  rejete: "Rejeté",
  refuse: "Refusé",
  approuve: "Approuvé",
  decaisse: "Décaissé",
  en_remboursement: "En remboursement",
  rembourse: "Remboursé",
};

const couleursStatuts = {
  soumis: "bg-blue-50 text-blue-700",
  en_verification: "bg-amber-50 text-amber-700",
  en_decision: "bg-purple-50 text-purple-700",
  rejete: "bg-red-50 text-red-700",
  refuse: "bg-red-50 text-red-700",
  approuve: "bg-green-50 text-green-700",
  decaisse: "bg-emerald-50 text-emerald-700",
  en_remboursement: "bg-indigo-50 text-indigo-700",
  rembourse: "bg-gray-100 text-gray-700",
};

function afficherDate(valeur) {
  if (!valeur) return "Date indisponible";

  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return date.toLocaleDateString("fr-FR");
}

function DemandesRecentesMembre({ demandes = [] }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Mes dernières demandes
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Vos cinq demandes les plus récentes.
          </p>
        </div>

        <Link
          to="/membre/mes-prets"
          className="inline-flex items-center gap-2 text-green-700 font-semibold text-sm hover:underline"
        >
          Voir tous mes prêts
          <ArrowRight size={17} />
        </Link>
      </div>

      {demandes.length === 0 ? (
        <div className="text-center py-10">
          <FileText
            size={34}
            className="mx-auto text-gray-400"
          />

          <p className="text-gray-500 text-sm mt-3">
            Vous n'avez encore soumis aucune demande de prêt.
          </p>

          <Link
            to="/membre/demander-pret"
            className="inline-block mt-4 text-green-700 font-semibold hover:underline"
          >
            Effectuer ma première demande
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {demandes.map((pret) => (
            <Link
              key={pret.id}
              to={`/membre/mes-prets/${pret.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  PR-{pret.id}
                </p>

                <p className="text-sm text-gray-700 mt-1 break-words">
                  {pret.motif}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {afficherDate(pret.dateDemande)}
                </p>
              </div>

              <div className="sm:text-right shrink-0">
                <p className="font-bold text-gray-900">
                  {Number(pret.montant)
                    .toLocaleString("fr-FR")} FCFA
                </p>

                <span
                  className={`inline-block text-xs font-medium rounded-full px-3 py-1 mt-2 ${
                    couleursStatuts[pret.statut] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {libellesStatuts[pret.statut] ||
                    pret.statut}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default DemandesRecentesMembre;
