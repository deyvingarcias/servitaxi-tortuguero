import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import App from "./App.jsx";
import Reservar from "./pages/Reservar.jsx";
import Confirmacion from "./pages/Confirmacion.jsx";

// ADMIN
import Login from "./pages/admin/Login.jsx";
import ReservasAdmin from "./pages/admin/Reservas.jsx";
import ReservaDetalle from "./pages/admin/ReservaDetalle.jsx";
import Publicidad from "./pages/admin/Publicidad.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* PUBLICO */}
        <Route path="/" element={<App />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/confirmacion" element={<Confirmacion />} />

        {/* ADMIN LOGIN (sin protección) */}
        <Route path="/admin/login" element={<Login />} />

        {/* ADMIN PROTEGIDO */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/reservas" element={<ReservasAdmin />} />
          <Route path="/admin/reservas/:id" element={<ReservaDetalle />} />
          <Route path="/admin/publicidad" element={<Publicidad />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);