
import {
  createContext,
  useContext,
  useState,
} from "react";

import { pretsAdmin } from "../data/pretsAdmin";
import { demandesSecretaire } from "../data/secretaire";
import { demandesDirecteur } from "../data/directeur";
import { pretsComptable } from "../data/comptable";

const PretsContext = createContext(null);

// Rassembler les données fictives déjà existantes.
function creerPretsInitiaux() {
  const complements = new Map();

  // Informations particulières aux différents rôles.
  for (const pret of [
    ...demandesSecretaire,
    ...demandesDirecteur,
    ...pretsComptable,
  ]) {
    complements.set(pret.id, {
      ...(complements.get(pret.id) || {}),
      ...pret,
    });
  }

  // Les 9 prêts de l'Administrateur servent
  // de liste de référence pour cette démonstration.
  return pretsAdmin.map((pret) => ({
    ...pret,
    numeroPret: `PR-${String(pret.id).padStart(3, "0")}`,
    ...(complements.get(pret.id) || {}),
  }));
}

export function PretsProvider({ children }) {
  const [prets, setPrets] = useState(creerPretsInitiaux);

  return (
    <PretsContext.Provider value={{ prets, setPrets }}>
      {children}
    </PretsContext.Provider>
  );
}

export function usePrets() {
  const contexte = useContext(PretsContext);

  if (!contexte) {
    throw new Error(
      "usePrets doit être utilisé dans PretsProvider."
    );
  }

  return contexte; 
}
