
import { NavLink } from "react-router";
import { X, Landmark } from "lucide-react";

function ResponsableSidebar({
  menu,
  titre,
  ouvert,
  fermer,
}) {
  return (
    <>
      {/* Fond sombre sur téléphone */}
      {ouvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={fermer}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      <aside
        id="menu-responsable"
        className={`
          fixed z-50 inset-y-0 left-0
          w-64 bg-white border-r border-gray-200
          flex flex-col
          transform transition-transform
          md:translate-x-0
          ${ouvert ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo et titre */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-green-700 p-2 rounded-lg">
                <Landmark
                  size={22}
                  className="text-white"
                />
              </div>

              <div>
                <p className="font-bold text-gray-900">
                  Gestion des prêts
                </p>

                <p className="text-xs text-gray-500">
                  {titre}
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={fermer}
              className="md:hidden p-1 text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Navigation responsable"
          className="flex-1 p-4 space-y-1 "
        >
          {menu.map((item) => {
            const Icon = item.icon;

            if (!item.path) {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400"
                  title="Disponible prochainement"
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs">
                    Bientôt
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end
                onClick={fermer}
                className={({ isActive }) =>
                  `flex items-center  gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <p className="text-xs text-gray-400">
            Application de gestion des prêts
          </p>
        </div>
      </aside>
    </>
  );
}

export default ResponsableSidebar;
