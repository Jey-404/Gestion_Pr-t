
function CarteStatistiqueMembre({
  titre,
  valeur,
  icone: Icone,
  description,
}) {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
          {Icone && (
            <Icone
              size={24}
              className="text-green-700"
            />
          )}
        </div>

        <span className="text-3xl font-bold text-gray-900">
          {valeur}
        </span>
      </div>

      <h2 className="text-sm font-semibold text-gray-900 mt-4">
        {titre}
      </h2>

      {description && (
        <p className="text-xs text-gray-500 mt-2">
          {description}
        </p>
      )}
    </article>
  );
}

export default CarteStatistiqueMembre;
