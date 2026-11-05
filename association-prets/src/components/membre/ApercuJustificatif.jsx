
import { FileText, ExternalLink } from "lucide-react";

function ApercuJustificatif({ justificatifs = [] }) {
  if (!justificatifs.length) {
    return (
      <div className="border-2 border-dashed rounded-xl p-8 text-center">
        <FileText
          size={36}
          className="text-gray-400 mx-auto"
        />
        <p className="text-sm text-gray-500 mt-3">
          Aucun justificatif disponible pour ce prêt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {justificatifs.map((fichier) => (
        <div key={fichier.id} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm break-all">
                {fichier.nom}
              </p>
              <p className="text-xs text-gray-500">
                {Math.round(fichier.taille / 1024)} Ko
              </p>
            </div>

            <a
              href={fichier.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline shrink-0"
            >
              <ExternalLink size={16} />
              Ouvrir
            </a>
          </div>

          {fichier.type === "application/pdf" ? (
            <iframe
              src={fichier.url}
              title={`Justificatif ${fichier.nom}`}
              sandbox="allow-scripts"
              className="w-full h-[420px] border border-gray-200 rounded-xl bg-white"
            />
          ) : ["image/jpeg", "image/png"].includes(fichier.type) ? (
            <div className="bg-gray-50 border rounded-xl p-3">
              <img
                src={fichier.url}
                alt={`Justificatif ${fichier.nom}`}
                className="max-h-[520px] w-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Aperçu non disponible.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default ApercuJustificatif;
