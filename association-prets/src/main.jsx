
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthContext";

import App from "./App";
import { PretsProvider } from "./context/PretsContext";

import "./index.css";


ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PretsProvider>
          <App />
        </PretsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

