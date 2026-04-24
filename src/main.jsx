// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import App from "./App.jsx";
import Reservar from "./pages/Reservar.jsx";
import Confirmacion from "./pages/Confirmacion.jsx";

// TAXISTA
import RegistroTaxista from "./pages/RegistroTaxista.jsx";
import TaxistaLogin from "./pages/taxista/Login.jsx";
import TaxistaPanel from "./pages/taxista/Panel.jsx";
import ProtectedTaxistaRoute from "./components/ProtectedTaxistaRoute.jsx";

// ADMIN
import Login from "./pages/admin/Login.jsx";
import ReservasAdmin from "./pages/admin/Reservas.jsx";
import ReservaDetalle from "./pages/admin/ReservaDetalle.jsx";
import Publicidad from "./pages/admin/Publicidad.jsx";
import ProtectedRoute from "./components/ui/ProtectedRoute.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* PUBLICO */}
        <Route path="/" element={<App />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/confirmacion" element={<Confirmacion />} />
        <Route path="/registro-taxista" element={<RegistroTaxista />} />
        <Route path="/taxista/login" element={<TaxistaLogin />} />

        {/* ADMIN LOGIN (sin protección) */}
        <Route path="/admin/login" element={<Login />} />

        {/* ADMIN PROTEGIDO */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/reservas" element={<ReservasAdmin />} />
          <Route path="/admin/reservas/:id" element={<ReservaDetalle />} />
          <Route path="/admin/publicidad" element={<Publicidad />} />
        </Route>

        {/* TAXISTA PROTEGIDO */}
        <Route element={<ProtectedTaxistaRoute />}>
          <Route path="/taxista/panel" element={<TaxistaPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);