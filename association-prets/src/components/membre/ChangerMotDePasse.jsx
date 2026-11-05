import { useState } from "react";
export default function ChangerMotDePasse() {
  const [ancienMotDePasse, setAncien] = useState("");
  const [nouveauMotDePasse, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [encours, setEncours] = useState(false);
  async function enregistrer(event) {
    event.preventDefault(); setErreur(""); setMessage("");
    if (nouveauMotDePasse !== confirmation) { setErreur("La confirmation ne correspond pas."); return; }
    setEncours(true);
    try {
      const rep = await fetch("/api/auth/changer-mot-de-passe", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ancienMotDePasse, nouveauMotDePasse, confirmation}) });
      const data = await rep.json();
      if (!rep.ok || !data.success) throw new Error(data.message || "Modification impossible.");
      setMessage(data.message); setAncien(""); setNouveau(""); setConfirmation("");
    } catch (e) { setErreur(e.message); } finally { setEncours(false); }
  }
  return <form onSubmit={enregistrer} className="bg-white border rounded-xl p-5 space-y-4">
    <h2 className="text-lg font-bold">Changer mon mot de passe</h2>
    <label className="block text-sm">Ancien mot de passe<input type="password" autoComplete="current-password" required value={ancienMotDePasse} onChange={e=>setAncien(e.target.value)} className="mt-1 block w-full p-3 border rounded-lg" /></label>
    <label className="block text-sm">Nouveau mot de passe<input type="password" minLength={8} autoComplete="new-password" required value={nouveauMotDePasse} onChange={e=>setNouveau(e.target.value)} className="mt-1 block w-full p-3 border rounded-lg" /></label>
    <label className="block text-sm">Confirmer le nouveau mot de passe<input type="password" minLength={8} autoComplete="new-password" required value={confirmation} onChange={e=>setConfirmation(e.target.value)} className="mt-1 block w-full p-3 border rounded-lg" /></label>
    {erreur && <p role="alert" className="text-red-700">{erreur}</p>}{message && <p role="status" className="text-green-700">{message}</p>}
    <button type="submit" disabled={encours} className="bg-green-700 text-white rounded-lg px-5 py-3 disabled:opacity-50">{encours ? "Enregistrement..." : "Modifier mon mot de passe"}</button>
  </form>;
}
