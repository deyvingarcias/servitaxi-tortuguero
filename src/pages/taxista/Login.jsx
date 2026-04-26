// src/pages/taxista/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function TaxistaLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        throw authError;
      }

      navigate("/taxista/panel", { replace: true });
    } catch (err) {
      setError(err?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";

  const labelClass = "text-sm font-medium text-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-lg items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:p-8">
          <div className="mb-8">
            <p className="inline-flex rounded-full bg-emerald-600/10 px-3 py-1 text-sm font-medium text-emerald-700">
              Acceso taxistas
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
              Inicia sesión
            </h1>
            
          </div>
<p className="mt-2 text-sm text-zinc-600">
  Accede con tu email y contraseña para ver solicitudes pendientes.
</p>
<Link to="/" className="text-sm text-zinc-400 hover:text-zinc-600">
  ← Volver al inicio
</Link>
          {error ? (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleLogin}>
            <div className="grid gap-5">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  className={inputClass}
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Contraseña</label>
                <input
                  className={inputClass}
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Entrando..." : "Iniciar sesión"}
              </button>

              <div className="text-center text-sm text-zinc-600">
                <Link
                  to="/registro-taxista"
                  className="font-medium text-red-600 transition hover:text-red-700"
                >
                  ¿No tienes cuenta? Regístrate
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}