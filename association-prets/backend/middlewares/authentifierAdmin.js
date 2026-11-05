import { pool } from "../config/db.js";

export async function authentifierAdmin(req, res, next) {
  const id = req.session?.utilisateurId;
  if (!id) return res.status(401).json({ success: false, message: "Connexion requise." });
  try {
    const [users] = await pool.execute(
      "SELECT id, role, statut FROM utilisateurs WHERE id = ? LIMIT 1", [id]
    );
    const user = users[0];
    if (!user) return res.status(401).json({ success: false, message: "Compte introuvable." });
    if (user.role !== "administrateur" || user.statut !== "actif") {
      return res.status(403).json({ success: false, message: "Accès réservé à l'administrateur actif." });
    }
    req.adminId = user.id;
    return next();
  } catch (err) {
    console.error("[AUTH ADMIN]", err.code || err.message);
    return res.status(500).json({ success: false, message: "Vérification des droits impossible." });
  }
}
