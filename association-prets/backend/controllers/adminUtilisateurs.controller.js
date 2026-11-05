import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { pool } from "../config/db.js";

const ROLES = new Set(["membre", "secretaire", "directeur", "comptable", "administrateur"]);
const STATUTS = new Set(["actif", "suspendu"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const jsonErreur = (res, code, message) => res.status(code).json({ success: false, message });
function idValide(valeur) { const id = Number(valeur); return Number.isSafeInteger(id) && id > 0 ? id : null; }
function propre(valeur) { return typeof valeur === "string" ? valeur.trim() : ""; }
function publicUser(u) { return { id:String(u.id),nom:u.nom,prenom:u.prenom,email:u.email,telephone:u.telephone ?? "",role:u.role,statut:u.statut }; }
function valider(payload, creation = false) {
  const nom = propre(payload?.nom), prenom = propre(payload?.prenom);
  const email = propre(payload?.email).toLowerCase(), telephone = propre(payload?.telephone);
  const role = payload?.role;
  if (!nom || !prenom || nom.length > 100 || prenom.length > 100) return { erreur: "Nom et prénom obligatoires (100 caractères maximum)." };
  if (!EMAIL.test(email) || email.length > 254) return { erreur: "Adresse e-mail invalide." };
  if (!/^\d{10}$/.test(telephone)) return { erreur: "Le téléphone doit contenir 10 chiffres." };
  if (!ROLES.has(role)) return { erreur: "Rôle invalide." };
  if (creation && !STATUTS.has(payload?.statut ?? "actif")) return { erreur: "Statut invalide." };
  return { nom, prenom, email, telephone, role, statut: payload?.statut ?? "actif" };
}

export async function listerUtilisateursAdmin(req,res) {
  try {
    const [lignes] = await pool.execute(
      `SELECT id,nom,prenom,email,telephone,role,statut FROM utilisateurs ORDER BY id DESC LIMIT 500`
    );
    return res.json({success:true, utilisateurs:lignes.map(publicUser), total:lignes.length});
  } catch(e) { console.error("[ADMIN USERS LIST]", e.code || e.message); return jsonErreur(res,500,"Impossible de charger les utilisateurs."); }
}

export async function creerUtilisateurAdmin(req,res) {
  const valeur = valider(req.body, true);
  if (valeur.erreur) return jsonErreur(res,400,valeur.erreur);
  const motDePasse = req.body?.motDePasse;
  if (typeof motDePasse !== "string" || motDePasse.length < 12 || motDePasse.length > 128)
    return jsonErreur(res,400,"Le mot de passe initial doit contenir 12 à 128 caractères.");
  try {
    const hash = await argon2.hash(motDePasse, {type:argon2.argon2id});
    const [resultat] = await pool.execute(
      `INSERT INTO utilisateurs (nom,prenom,email,telephone,role,statut,mot_de_passe_hash) VALUES (?,?,?,?,?,?,?)`,
      [valeur.nom,valeur.prenom,valeur.email,valeur.telephone,valeur.role,valeur.statut,hash]
    );
    return res.status(201).json({success:true,message:"Compte créé dans MySQL.",utilisateur:{...publicUser({...valeur,id:resultat.insertId})}});
  } catch(e) {
    if (e.code === "ER_DUP_ENTRY") return jsonErreur(res,409,"Cette adresse e-mail est déjà utilisée.");
    console.error("[ADMIN USERS CREATE]",e.code || e.message);
    return jsonErreur(res,500,"Impossible de créer le compte.");
  }
}

export async function modifierUtilisateurAdmin(req,res) {
  const id = idValide(req.params.id);
  if (!id) return jsonErreur(res,400,"Identifiant invalide.");
  const valeur = valider(req.body);
  if (valeur.erreur) return jsonErreur(res,400,valeur.erreur);
  let connexion;
  try {
    connexion = await pool.getConnection(); await connexion.beginTransaction();
    const [lignes] = await connexion.execute(`SELECT id,role,statut FROM utilisateurs WHERE id=? FOR UPDATE`,[id]);
    if (!lignes.length) { await connexion.rollback(); return jsonErreur(res,404,"Utilisateur introuvable."); }
    const ancien = lignes[0];
    if (String(id) === String(req.adminId) && valeur.role !== "administrateur") {
      await connexion.rollback(); return jsonErreur(res,409,"Vous ne pouvez pas retirer votre propre rôle Administrateur.");
    }
    if (ancien.role === "administrateur" && valeur.role !== "administrateur" && ancien.statut === "actif") {
      const [admins] = await connexion.execute(`SELECT COUNT(*) AS total FROM utilisateurs WHERE role='administrateur' AND statut='actif'`);
      if (Number(admins[0].total) <= 1) { await connexion.rollback(); return jsonErreur(res,409,"Le dernier administrateur actif doit être conservé."); }
    }
    await connexion.execute(`UPDATE utilisateurs SET nom=?,prenom=?,email=?,telephone=?,role=? WHERE id=?`,
      [valeur.nom,valeur.prenom,valeur.email,valeur.telephone,valeur.role,id]);
    const [apres] = await connexion.execute(`SELECT id,nom,prenom,email,telephone,role,statut FROM utilisateurs WHERE id=?`,[id]);
    await connexion.commit();
    return res.json({success:true,message:"Utilisateur modifié.",utilisateur:publicUser(apres[0])});
  } catch(e) {
    if(connexion) {try {await connexion.rollback();}catch{}}
    if(e.code === "ER_DUP_ENTRY") return jsonErreur(res,409,"Adresse e-mail déjà utilisée.");
    console.error("[ADMIN USERS UPDATE]",e.code || e.message); return jsonErreur(res,500,"Modification impossible.");
  } finally {connexion?.release();}
}

export async function changerStatutUtilisateurAdmin(req,res) {
  const id=idValide(req.params.id), statut=req.body?.statut;
  if(!id || !STATUTS.has(statut)) return jsonErreur(res,400,"Données invalides.");
  if(String(id)===String(req.adminId) && statut!=="actif") return jsonErreur(res,409,"Vous ne pouvez pas suspendre votre propre compte.");
  let connexion;
  try {
    connexion=await pool.getConnection(); await connexion.beginTransaction();
    const [lignes]=await connexion.execute(`SELECT id,role,statut FROM utilisateurs WHERE id=? FOR UPDATE`,[id]);
    if(!lignes.length){await connexion.rollback();return jsonErreur(res,404,"Compte introuvable.");}
    if(lignes[0].role==="administrateur" && lignes[0].statut==="actif" && statut==="suspendu") {
      const [admins]=await connexion.execute(`SELECT COUNT(*) AS total FROM utilisateurs WHERE role='administrateur' AND statut='actif'`);
      if(Number(admins[0].total)<=1){await connexion.rollback();return jsonErreur(res,409,"Impossible de suspendre le dernier administrateur actif.");}
    }
    await connexion.execute(`UPDATE utilisateurs SET statut=? WHERE id=?`,[statut,id]);
    await connexion.commit(); return res.json({success:true,message:statut==="actif"?"Compte activé.":"Compte suspendu."});
  } catch(e){if(connexion){try{await connexion.rollback();}catch{}}console.error("[ADMIN USER STATUS]",e.code||e.message);return jsonErreur(res,500,"Modification du statut impossible.");}
  finally{connexion?.release();}
}

export async function reinitialiserMotDePasseAdmin(req,res) {
  const id=idValide(req.params.id);
  if(!id) return jsonErreur(res,400,"Identifiant invalide.");
  if(String(id)===String(req.adminId)) return jsonErreur(res,409,"Pour votre propre mot de passe, utilisez la procédure de changement de mot de passe.");
  // Secret aléatoire de 24 caractères; jamais journalisé ou enregistré en clair.
  const temporaire=randomBytes(18).toString("base64url");
  try {
    const hash=await argon2.hash(temporaire,{type:argon2.argon2id});
    const [resultat]=await pool.execute(`UPDATE utilisateurs SET mot_de_passe_hash=? WHERE id=?`,[hash,id]);
    if(resultat.affectedRows!==1)return jsonErreur(res,404,"Utilisateur introuvable.");
    res.setHeader("Cache-Control","no-store");
    return res.json({success:true,message:"Mot de passe réinitialisé.",motDePasseTemporaire:temporaire});
  }catch(e){console.error("[ADMIN PASSWORD RESET]",e.code||e.message);return jsonErreur(res,500,"Réinitialisation impossible.");}
}
