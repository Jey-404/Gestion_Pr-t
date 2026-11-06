
import "dotenv/config";

import express from "express";
import session from "express-session";
import cors from "cors";
import MySQLStoreFactory from "express-mysql-session";

import { pool } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import membreRoutes from "./routes/membre.routes.js";
import secretaireRoutes from "./routes/secretaire.routes.js";
import directeurRoutes from "./routes/directeur.routes.js";
import comptableRoutes from "./routes/comptable.routes.js";
import adminRoutes from "./routes/admin.routes.js";

// ==========================================
// CONFIGURATION GENERALE
// ==========================================

const app = express();

const production = process.env.NODE_ENV === "production";

const PORT = Number(process.env.PORT || 3001);

const FRONTEND_ORIGIN = production
  ? process.env.FRONTEND_ORIGIN
  : process.env.FRONTEND_ORIGIN ||
    "http://localhost:5173";

// ==========================================
// VALIDATION DES VARIABLES
// ==========================================

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 64
) {
  throw new Error(
    "SESSION_SECRET absent ou trop court (minimum 64 caractères)."
  );
}

if (production && !FRONTEND_ORIGIN) {
  throw new Error(
    "FRONTEND_ORIGIN doit être configuré sur Render."
  );
}

// ==========================================
// SECURITE
// ==========================================

app.disable("x-powered-by");

// Render utilise un proxy HTTPS.
if (production) {
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "100kb" }));

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
    ],
  })
);

// ==========================================
// STOCKAGE DES SESSIONS
// ==========================================

const MySQLStore = MySQLStoreFactory(session);

let sessionStore;

if (production) {
  const variablesDB = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
  ];

  for (const nom of variablesDB) {
    if (!process.env[nom]) {
      throw new Error(
        `Variable obligatoire manquante : ${nom}`
      );
    }
  }

  sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    createDatabaseTable: true,
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 7 * 24 * 60 * 60 * 1000,
  });
}

// ==========================================
// MIDDLEWARE SESSION
// ==========================================

app.use(
  session({
    name: "association.sid",

    secret: process.env.SESSION_SECRET,

    ...(sessionStore
      ? { store: sessionStore }
      : {}),

    resave: false,
    saveUninitialized: false,
    rolling: true,

    cookie: {
      httpOnly: true,

      secure: production,

      sameSite: production ? "none" : "lax",

      maxAge: 7 * 24 * 60 * 60 * 1000,

      path: "/",
    },
  })
);

// ==========================================
// ROUTE DE VERIFICATION
// ==========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gestion des prêts disponible",
    environnement: production
      ? "production"
      : "development",
  });
});

// ==========================================
// ROUTES EXISTANTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/membre", membreRoutes);

app.use("/api/secretaire", secretaireRoutes);

app.use("/api/directeur", directeurRoutes);

app.use("/api/comptable", comptableRoutes);

app.use("/api/admin", adminRoutes);

// ==========================================
// ROUTE INCONNUE
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route API introuvable",
  });
});

// ==========================================
// ERREURS EXPRESS
// ==========================================

app.use((erreur, req, res, next) => {
  console.error(
    "[SERVEUR]",
    erreur.message
  );

  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
  });
});

// ==========================================
// DEMARRAGE
// ==========================================

async function demarrerServeur() {
  try {
    if (sessionStore) {
      await sessionStore.onReady();
      console.log(
        "[SESSION] Stockage MySQL disponible"
      );
    }

    // Vérifie que la connexion applicative
    // vers MySQL est fonctionnelle.
    await pool.query("SELECT 1");

    console.log("[MYSQL] Connexion disponible");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `[API] Serveur démarré sur le port ${PORT}`
      );
    });
  } catch (erreur) {
    console.error(
      "[DEMARRAGE] Echec :",
      erreur.message
    );

    process.exitCode = 1;
    process.exit();
  }
}

demarrerServeur();
