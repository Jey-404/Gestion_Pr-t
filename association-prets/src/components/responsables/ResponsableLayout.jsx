
import { useState } from "react";
import { Outlet } from "react-router";

import ResponsableSidebar from "./ResponsableSidebar";
import ResponsableHeader from "./ResponsableHeader";

import { responsables } from "../../data/responsables";

function ResponsableLayout({ role }) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  const configuration = responsables[role];

  if (!configuration) {
    return (
      <p className="p-6 text-red-600">
        Rôle inconnu.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsableSidebar
        titre={configuration.titre}
        menu={configuration.menu}
        ouvert={menuOuvert}
        fermer={() => setMenuOuvert(false)}
      />

      {/* Contenu à droite de la Sidebar */}
      <div className="md:ml-64 min-h-screen flex flex-col ">

        <ResponsableHeader
          titre={configuration.titre}
          ouvrirMenu={() => setMenuOuvert(true)}
          role={role}
        />

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default ResponsableLayout;
