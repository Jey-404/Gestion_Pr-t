import argon2 from "argon2";
import { pool } from "../config/db.js";
export async function changerMotDePasse(req,res) {
 const id=req.session?.utilisateurId;
 if(!id) return res.status(401).json({success:false,message:"Connectez-vous."});
 const {ancienMotDePasse,nouveauMotDePasse,confirmation}=req.body||{};
 if(typeof ancienMotDePasse!=="string" || typeof nouveauMotDePasse!=="string" ||
    nouveauMotDePasse.length<8 || nouveauMotDePasse.length>128 || nouveauMotDePasse!==confirmation)
    return res.status(400).json({success:false,message:"Vérifiez l'ancien mot de passe, le nouveau (8 caractères minimum) et sa confirmation."});
 try {
   const [rows]=await pool.execute(`SELECT mot_de_passe_hash FROM utilisateurs WHERE id=? AND statut='actif' LIMIT 1`,[id]);
   if(!rows.length || !await argon2.verify(rows[0].mot_de_passe_hash,ancienMotDePasse))
     return res.status(403).json({success:false,message:"Ancien mot de passe incorrect."});
   if(ancienMotDePasse===nouveauMotDePasse) return res.status(400).json({success:false,message:"Choisissez un nouveau mot de passe différent."});
   const hash=await argon2.hash(nouveauMotDePasse,{type:argon2.argon2id});
   await pool.execute(`UPDATE utilisateurs SET mot_de_passe_hash=? WHERE id=? AND mot_de_passe_hash=?`,[hash,id,rows[0].mot_de_passe_hash]);
   return res.json({success:true,message:"Mot de passe modifié. Déconnectez-vous des autres appareils si nécessaire."});
 }catch(e){console.error('[PASSWORD]',e.code||e.message);return res.status(500).json({success:false,message:"Erreur de changement de mot de passe."});}
}
