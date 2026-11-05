
import {
  ArrowLeftRight,
  Menu,
} from "lucide-react";
import { Link } from "react-router";
import MenuUtilisateur from "./MenuUtilisateur";
function ResponsableHeader({
  titre,
  ouvrirMenu,
  role,
}) {
  const peutPasserEnModeMembre = [
    "directeur",
    "secretaire",
    "comptable",
  ].includes(role);

  return (
    <header className="min-h-20 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between gap-3">

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Ouvrir le menu"
          aria-controls="menu-responsable"
          onClick={ouvrirMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>

        <div>
          <p className="font-bold text-gray-900">
            {titre}
          </p>
          <p className="text-xs text-gray-500">
            Gestion des prêts
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {peutPasserEnModeMembre && (
          <Link
            to="/membre/accueil"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:px-4"
          >
            <ArrowLeftRight size={17} />
            <span className="hidden sm:inline">Passer en mode membre</span>
            <span className="sm:hidden">Mode membre</span>
          </Link>
        )}
        <MenuUtilisateur />
      </div>
    </header>
  );
}

export default ResponsableHeader;
