import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  UserPlus, RefreshCw, Search, Pencil, KeyRound, Eye, EyeOff, X,
  ShieldCheck, UserCheck, UserX, AlertCircle, Users, CheckCircle2,
  UserRound, FilterX, LockKeyhole, Copy, Sparkles, ChevronRight,
} from "lucide-react";

const ROLES = [
  ["membre", "Membre"],
  ["secretaire", "Secrétaire"],
  ["directeur", "Directeur"],
  ["comptable", "Comptable"],
  ["administrateur", "Administrateur"],
];
const labelsRoles = Object.fromEntries(ROLES);
const DEFAUT = {
  nom: "", prenom: "", email: "", telephone: "",
  role: "membre", statut: "actif", motDePasse: "",
};

const roleStyles = {
  membre: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  secretaire: "bg-blue-50 text-blue-700 ring-blue-100",
  directeur: "bg-violet-50 text-violet-700 ring-violet-100",
  comptable: "bg-amber-50 text-amber-800 ring-amber-100",
  administrateur: "bg-slate-100 text-slate-700 ring-slate-200",
};

async function api(url, options = {}) {
  const reponse = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await reponse.json().catch(() => ({}));
  if (!reponse.ok || !data.success) {
    throw new Error(data.message || `Erreur HTTP ${reponse.status}`);
  }
  return data;
}

function CarteStat({ titre, valeur, details, Icone, couleur }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className={`inline-flex rounded-xl p-3 ${couleur}`}>
        <Icone size={22} />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{titre}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {Number(valeur).toLocaleString("fr-FR")}
      </p>
      <p className="mt-2 text-xs text-slate-400">{details}</p>
    </div>
  );
}

function Champ({ label, children }) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

const styleChamp = "block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
const styleSecondaire = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function GestionUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [erreurModal, setErreurModal] = useState("");
  const [message, setMessage] = useState("");
  const [recherche, setRecherche] = useState("");
  const [role, setRole] = useState("tous");
  const [statut, setStatut] = useState("tous");
  const [numeroChargement, setNumeroChargement] = useState(0);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(DEFAUT);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [motTemporaire, setMotTemporaire] = useState("");
  const [afficherMot, setAfficherMot] = useState(false);
  const [messageCopie, setMessageCopie] = useState("");

  useEffect(() => {
    const controleur = new AbortController();
    async function charger() {
      setChargement(true);
      setErreur("");
      try {
        const data = await api("/api/admin/utilisateurs", {
          signal: controleur.signal,
        });
        if (!controleur.signal.aborted) {
          setUtilisateurs(Array.isArray(data.utilisateurs) ? data.utilisateurs : []);
        }
      } catch (e) {
        if (!controleur.signal.aborted && e.name !== "AbortError") {
          setErreur(e.message || "Impossible de charger les utilisateurs.");
        }
      } finally {
        if (!controleur.signal.aborted) setChargement(false);
      }
    }
    charger();
    return () => controleur.abort();
  }, [numeroChargement]);

  const affiches = useMemo(() => utilisateurs.filter((u) => {
    const contenu = `${u.prenom || ""} ${u.nom || ""} ${u.email || ""} ${u.telephone || ""} ${u.id}`.toLocaleLowerCase("fr");
    return contenu.includes(recherche.trim().toLocaleLowerCase("fr")) &&
      (role === "tous" || u.role === role) &&
      (statut === "tous" || u.statut === statut);
  }), [utilisateurs, recherche, role, statut]);

  const totalActifs = utilisateurs.filter((u) => u.statut === "actif").length;
  const totalMembres = utilisateurs.filter((u) => u.role === "membre").length;
  const filtresActifs = Boolean(recherche || role !== "tous" || statut !== "tous");

  function ouvrirCreation() {
    setForm({ ...DEFAUT });
    setMotTemporaire("");
    setErreurModal("");
    setMessage("");
    setModal({ type: "creation" });
  }
  function ouvrirEdition(u) {
    setForm({
      nom: u.nom || "", prenom: u.prenom || "", email: u.email || "",
      telephone: u.telephone || "", role: u.role,
      statut: u.statut, motDePasse: "",
    });
    setErreurModal("");
    setModal({ type: "edition", utilisateur: u });
  }
  function fermer() {
    if (actionEnCours) return;
    setModal(null);
    setMotTemporaire("");
    setAfficherMot(false);
    setErreurModal("");
    setMessageCopie("");
  }
  function recharger() { setNumeroChargement((n) => n + 1); }

  async function sauvegarder(e) {
    e.preventDefault();
    if (!modal || actionEnCours) return;
    setActionEnCours(true);
    setErreurModal("");
    setMessage("");
    try {
      const { type, utilisateur } = modal;
      const payload = {
        nom: form.nom, prenom: form.prenom, email: form.email,
        telephone: form.telephone, role: form.role,
        ...(type === "creation" ? {
          statut: form.statut, motDePasse: form.motDePasse,
        } : {}),
      };
      const data = await api(
        type === "creation" ? "/api/admin/utilisateurs" : `/api/admin/utilisateurs/${utilisateur.id}`,
        { method: type === "creation" ? "POST" : "PATCH", body: JSON.stringify(payload) }
      );
      setMessage(data.message || "Utilisateur enregistré.");
      setModal(null);
      recharger();
    } catch (e) {
      setErreurModal(e.message || "Impossible d'enregistrer cet utilisateur.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function changerStatut(u) {
    const nouveau = u.statut === "actif" ? "suspendu" : "actif";
    if (!window.confirm(`${nouveau === "actif" ? "Activer" : "Suspendre"} le compte de ${u.prenom} ${u.nom} ?`)) return;
    setActionEnCours(true);
    setErreur("");
    setMessage("");
    try {
      const data = await api(`/api/admin/utilisateurs/${u.id}/statut`, {
        method: "PATCH", body: JSON.stringify({ statut: nouveau }),
      });
      setMessage(data.message || "Statut mis à jour.");
      recharger();
    } catch (e) {
      setErreur(e.message || "Impossible de changer le statut.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function reinitialiser(u) {
    if (!window.confirm(`Réinitialiser le mot de passe de ${u.prenom} ${u.nom} ? Son ancien mot de passe ne fonctionnera plus.`)) return;
    setActionEnCours(true);
    setErreur("");
    setMessage("");
    setMotTemporaire("");
    setErreurModal("");
    try {
      const data = await api(`/api/admin/utilisateurs/${u.id}/reinitialiser-mot-de-passe`, { method: "POST" });
      setMotTemporaire(data.motDePasseTemporaire || "");
      setAfficherMot(false);
      setModal({ type: "motDePasse", utilisateur: u });
    } catch (e) {
      setErreur(e.message || "Impossible de réinitialiser le mot de passe.");
    } finally {
      setActionEnCours(false);
    }
  }

  async function copierSecret() {
    try {
      await navigator.clipboard.writeText(motTemporaire);
      setMessageCopie("Mot de passe copié.");
    } catch {
      setMessageCopie("Copie impossible. Sélectionnez le texte manuellement.");
    }
  }

  return (
    <div className="w-full space-y-7 pb-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-10 top-14 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck size={15} /> Administration des comptes
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestion des utilisateurs</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100">
              Gérez vos membres, attribuez les rôles et sécurisez les comptes depuis un seul espace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={recharger} disabled={chargement} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/25 disabled:opacity-50">
              <RefreshCw size={17} className={chargement ? "animate-spin" : ""} /> Actualiser
            </button>
            <button type="button" onClick={ouvrirCreation} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-50">
              <UserPlus size={18} /> Nouvel utilisateur
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div role="status" className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <CheckCircle2 size={20} className="shrink-0" /> {message}
        </div>
      )}
      {erreur && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <span className="flex-1">{erreur}</span>
        </div>
      )}

      <section aria-label="Statistiques des utilisateurs" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CarteStat titre="Utilisateurs" valeur={utilisateurs.length} details="Comptes enregistrés" Icone={Users} couleur="bg-emerald-50 text-emerald-700" />
        <CarteStat titre="Membres" valeur={totalMembres} details="Comptes ayant le rôle Membre" Icone={UserRound} couleur="bg-blue-50 text-blue-700" />
        <CarteStat titre="Comptes actifs" valeur={totalActifs} details="Comptes autorisés à se connecter" Icone={UserCheck} couleur="bg-violet-50 text-violet-700" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Users size={20} className="text-emerald-700" /> Annuaire des utilisateurs</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {affiches.length} résultat(s) sur {utilisateurs.length} compte(s) chargés (maximum 500).
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Sparkles size={14} /> Gestion centralisée
          </span>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-slate-100 bg-slate-50/50 p-5 sm:p-6">
          <div className="relative min-w-[220px] flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input aria-label="Rechercher" type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} className={`${styleChamp} pl-11`} placeholder="Nom, prénom, e-mail, téléphone..." />
          </div>
          <select aria-label="Filtrer par rôle" className={`${styleChamp} w-full sm:w-auto sm:min-w-[170px]`} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="tous">Tous les rôles</option>
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select aria-label="Filtrer par statut" className={`${styleChamp} w-full sm:w-auto sm:min-w-[155px]`} value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
          </select>
          {filtresActifs && (
            <button type="button" onClick={() => { setRecherche(""); setRole("tous"); setStatut("tous"); }} className={styleSecondaire}>
              <FilterX size={16} /> Effacer
            </button>
          )}
        </div>

        {chargement ? (
          <div role="status" className="space-y-3 p-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
            <p className="text-sm text-slate-500">Chargement des utilisateurs...</p>
          </div>
        ) : !erreur ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Utilisateur</th>
                  <th className="px-5 py-4 font-semibold">Téléphone</th>
                  <th className="px-5 py-4 font-semibold">Rôle</th>
                  <th className="px-5 py-4 font-semibold">Statut</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {affiches.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-emerald-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                          {(u.prenom?.[0] || u.nom?.[0] || "U").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{u.prenom} {u.nom}</p>
                          <p className="max-w-[230px] truncate text-xs text-slate-500" title={u.email}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{u.telephone || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${roleStyles[u.role] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                        {labelsRoles[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${u.statut === "actif" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {u.statut === "actif" ? "Actif" : "Suspendu"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={actionEnCours} onClick={() => ouvrirEdition(u)} className={styleSecondaire} title="Modifier le compte"><Pencil size={15} /> Modifier</button>
                        <button type="button" disabled={actionEnCours} onClick={() => reinitialiser(u)} className={styleSecondaire} title="Réinitialiser le mot de passe"><KeyRound size={15} /> Réinitialiser</button>
                        <button type="button" disabled={actionEnCours} onClick={() => changerStatut(u)} className={`${styleSecondaire} ${u.statut === "actif" ? "hover:!border-red-200 hover:!bg-red-50 hover:!text-red-700" : ""}`}>
                          {u.statut === "actif" ? <UserX size={15} /> : <UserCheck size={15} />}
                          {u.statut === "actif" ? "Suspendre" : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {affiches.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-14 text-center">
                    <Users size={30} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-700">Aucun utilisateur trouvé</p>
                    <p className="mt-1 text-sm text-slate-400">Modifiez les filtres ou créez un compte.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
          Les actions sont enregistrées via les API d'administration. <ChevronRight size={13} className="inline" />
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="titre-admin-modal" className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><ShieldCheck size={21} /></div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Administration</p>
                  <h2 id="titre-admin-modal" className="text-lg font-bold text-slate-900">
                    {modal.type === "creation" ? "Créer un utilisateur" : modal.type === "edition" ? "Modifier le compte" : "Mot de passe réinitialisé"}
                  </h2>
                </div>
              </div>
              <button type="button" onClick={fermer} disabled={actionEnCours} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={20} /></button>
            </header>

            {modal.type === "motDePasse" ? (
              <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="flex items-center gap-2 font-bold"><LockKeyhole size={18} /> Mot de passe temporaire</p>
                  <p className="mt-2">Pour <strong>{modal.utilisateur.prenom} {modal.utilisateur.nom}</strong>. Ce secret ne sera plus affiché après fermeture.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input aria-label="Mot de passe temporaire" readOnly type={afficherMot ? "text" : "password"} value={motTemporaire} className={`${styleChamp} min-w-[160px] flex-1 font-mono`} />
                  <button type="button" onClick={() => setAfficherMot((v) => !v)} className={styleSecondaire} aria-label={afficherMot ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{afficherMot ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  <button type="button" onClick={copierSecret} className={styleSecondaire}><Copy size={16} /> Copier</button>
                </div>
                {messageCopie && <p role="status" className="text-xs text-emerald-700">{messageCopie}</p>}
                <p className="text-sm leading-6 text-slate-600">Transmettez ce mot de passe par un canal sécurisé. L'application ne force pas encore son remplacement à la première connexion.</p>
                <div className="flex justify-end"><button type="button" onClick={fermer} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Fermer</button></div>
              </div>
            ) : (
              <form onSubmit={sauvegarder} className="flex min-h-0 flex-col">
                <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
                  <p className="text-sm text-slate-500">Renseignez les informations du compte. Les champs marqués d'un astérisque sont obligatoires.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Champ label="Nom *"><input required maxLength={100} className={styleChamp} value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} /></Champ>
                    <Champ label="Prénom *"><input required maxLength={100} className={styleChamp} value={form.prenom} onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))} /></Champ>
                  </div>
                  <Champ label="Adresse e-mail *"><input type="email" required maxLength={254} className={styleChamp} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></Champ>
                  <Champ label="Téléphone *"><input type="tel" required pattern="[0-9]{10}" maxLength={10} className={styleChamp} value={form.telephone} onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))} /></Champ>
                  <Champ label="Rôle *"><select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className={styleChamp}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Champ>
                  {modal.type === "creation" && (
                    <>
                      <Champ label="Statut *"><select value={form.statut} onChange={(e) => setForm((p) => ({ ...p, statut: e.target.value }))} className={styleChamp}><option value="actif">Actif</option><option value="suspendu">Suspendu</option></select></Champ>
                      <Champ label="Mot de passe initial (12 caractères minimum) *"><input type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={styleChamp} value={form.motDePasse} onChange={(e) => setForm((p) => ({ ...p, motDePasse: e.target.value }))} /></Champ>
                    </>
                  )}
                  {erreurModal && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" />{erreurModal}</p>}
                </div>
                <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white p-5">
                  <button type="button" onClick={fermer} disabled={actionEnCours} className={styleSecondaire}>Annuler</button>
                  <button disabled={actionEnCours} type="submit" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{actionEnCours ? "Enregistrement..." : "Enregistrer"}</button>
                </footer>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
