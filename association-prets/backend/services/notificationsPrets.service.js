
import {
  notifierMembreSansBloquer,
} from "./notifications.service.js";

// Notifications associées aux statuts réellement
// enregistrés dans la table prets.

const messagesStatuts = {
  soumis: {
    titre: "Demande de prêt enregistrée",
    message:
      "Votre demande a été enregistrée et attend son traitement.",
  },

  en_verification: {
    titre: "Demande en vérification",
    message:
      "Votre demande est actuellement en cours de vérification.",
  },

  en_decision: {
    titre: "Décision en cours",
    message:
      "Votre dossier est en cours d'examen pour décision.",
  },

  approuve: {
    titre: "Demande de prêt approuvée",
    message:
      "Le président a approuvé votre demande de prêt.",
  },

  rejete: {
    titre: "Demande de prêt rejetée",
    message:
      "Le président a refusé votre demande de prêt.",
  },

  refuse: {
    titre: "Demande de prêt refusée",
    message:
      "Le président a refusé votre demande de prêt.",
  },

  decaisse: {
    titre: "Prêt décaissé",
    message:
      "Le décaissement de votre prêt a été enregistré.",
  },

  en_remboursement: {
    titre: "Remboursement en cours",
    message:
      "Votre prêt est maintenant en cours de remboursement.",
  },

  rembourse: {
    titre: "Prêt entièrement remboursé",
    message:
      "Le remboursement de votre prêt est terminé.",
  },
};

export async function notifierChangementStatut({
  utilisateurId,
  pretId,
  ancienStatut,
  nouveauStatut,
}) {
  // Aucun événement si le statut reste identique.
  if (ancienStatut === nouveauStatut) {
    return null;
  }

  const notification = messagesStatuts[nouveauStatut];

  // Un statut non prévu ne déclenche pas
  // une notification trompeuse.
  if (!notification) {
    console.warn(
      "[NOTIFICATION] Statut non pris en charge :",
      nouveauStatut
    );

    return null;
  }

  const message =
    "Dossier PR-" +
    pretId +
    " : " +
    notification.message;

  return notifierMembreSansBloquer({
    utilisateurId,
    pretId,
    titre: notification.titre,
    message,
  });
}
