
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
} from "lucide-react";

function monnaie(valeur) {
  if (valeur === null || valeur === undefined) {
    return "Non renseigné";
  }

  return (
    Number(valeur).toLocaleString("fr-FR") +
    " FCFA"
  );
}

function dateLisible(valeur) {
  if (!valeur) return "Date non renseignée";

  const date = new Date(valeur);

  return Number.isNaN(date.getTime())
    ? String(valeur)
    : date.toLocaleDateString("fr-FR");
}

function Historique({ titre, lignes, vide }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">
        {titre}
      </h3>

      {lignes.length === 0 ? (
        <p className="text-sm text-gray-500">
          {vide}
        </p>
      ) : (
        <div className="space-y-2">
          {lignes.map((ligne) => (
            <div
              key={ligne.id}
              className="border border-gray-200 rounded-lg p-3"
            >
              <div className="flex justify-between gap-3">
                <p className="font-semibold text-sm">
                  {monnaie(ligne.montant)}
                </p>
                <p className="text-xs text-gray-500">
                  {dateLisible(ligne.date)}
                </p>
              </div>

              {(ligne.mode || ligne.reference || ligne.statut) && (
                <p className="text-xs text-gray-500 mt-2 break-all">
                  {[
                    ligne.mode,
                    ligne.reference,
                    ligne.statut,
                  ].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SuiviFinancierMembre({ finances }) {
  if (!finances) return null;

  const cartes = [
    {
      titre: "Total décaissé",
      montant: finances.totalDecaisse,
      Icone: ArrowDownCircle,
    },
    {
      titre: "Total remboursé",
      montant: finances.totalRembourse,
      Icone: ArrowUpCircle,
    },
    {
      titre: "Solde indicatif",
      montant: finances.solde,
      Icone: Wallet,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {cartes.map(({ titre, montant, Icone }) => (
          <div
            key={titre}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <Icone size={22} className="text-green-700" />
            <p className="text-xs text-gray-500 mt-3">
              {titre}
            </p>
            <p className="font-bold text-lg mt-1">
              {monnaie(montant)}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Le solde indicatif est calculé à partir des
        décaissements et remboursements enregistrés.
        Il n'inclut pas les éventuels frais ou intérêts.
      </p>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-6">
        <Historique
          titre="Décaissements"
          lignes={finances.decaissements || []}
          vide="Aucun décaissement enregistré."
        />

        <Historique
          titre="Remboursements"
          lignes={finances.remboursements || []}
          vide="Aucun remboursement enregistré."
        />

        <div>
          <h3 className="font-semibold flex gap-2 items-center mb-3">
            <CalendarDays size={19} className="text-green-700" />
            Échéances
          </h3>

          <Historique
            titre=""
            lignes={finances.echeances || []}
            vide="Aucune échéance enregistrée."
          />
        </div>
      </div>
    </div>
  );
}

export default SuiviFinancierMembre;
