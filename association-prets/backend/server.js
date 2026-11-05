
import "dotenv/config";
import express from "express";
import adminRoutes from "./routes/admin.routes.js";
import session from "express-session";
import comptableRoutes from "./routes/comptable.routes.js";
import secretaireRoutes from "./routes/secretaire.routes.js";
import directeurRoutes from "./routes/directeur.routes.js";
import { pool } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import membreRoutes from "./routes/membre.routes.js";
const app = express();
const PORT = Number(process.env.PORT || 3001);

if (!process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 64) {
  throw new Error(
    "SESSION_SECRET est absent ou trop court dans .env."
  );
}

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "Configuration de sessions de développement uniquement."
  );
}

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));



// Sessions locales de développement.
app.use(
  session({
    name: "association.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: false, // HTTP local seulement
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    },
  })
);


// Nouvelles routes d'authentification
app.use("/api/auth", authRoutes);
app.use("/api/membre", membreRoutes);
app.use("/api/secretaire", secretaireRoutes);
app.use("/api/directeur", directeurRoutes);
app.use("/api/comptable", comptableRoutes);
app.use("/api/admin", adminRoutes);
// Route inconnue
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route API introuvable",
  });
});

// Erreurs Express
app.use((erreur, req, res, next) => {
  console.error("Erreur serveur :", erreur.message);

  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `API disponible sur http://127.0.0.1:${PORT}`
  );
});
