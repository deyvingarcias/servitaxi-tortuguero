import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

function formatFecha(fecha) {
  if (!fecha) return "—";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getActivoStyles(activo) {
  return activo
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-red-50 text-red-700 ring-red-200";
}

function Taxistas() {
  const navigate = useNavigate();

  const [taxistas, setTaxistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchTaxistas = async () => {
      try {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
          .from("taxistas")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTaxistas(data ?? []);
      } catch (err) {
        setError(err?.message || "No se pudieron cargar los taxistas.");
        setTaxistas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxistas();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const toggleActivo = async (taxista) => {
    const nextActivo = !taxista.activo;

    setUpdatingId(taxista.id);
    setError("");

    try {
      const { error } = await supabase
        .from("taxistas")
        .update({ activo: nextActivo })
        .eq("id", taxista.id);

      if (error) throw error;

      setTaxistas((prev) =>
        prev.map((item) =>
          item.id === taxista.id ? { ...item, activo: nextActivo } : item
        )
      );
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el taxista.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-6">
        <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-zinc-50 p-5 ring-1 ring-zinc-200"
              >
                <div className="h-5 w-32 animate-pulse rounded bg-zinc-200" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6">
      <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4">
          <div className="flex flex-col gap-2">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Taxistas</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Gestiona los conductores registrados
              </p>
            </div>

            <Link
              to="/admin/reservas"
              className="text-sm font-medium text-zinc-400 hover:text-zinc-600"
            >
              ← Volver a reservas
            </Link>
          </div>

          <div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>
        ) : null}

        {!error && taxistas.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-zinc-50 p-8 text-center ring-1 ring-zinc-200">
            <p className="text-base font-semibold text-zinc-900">
              No hay taxistas registrados todavía
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Cuando se registren aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {taxistas.map((taxista) => (
              <article
                key={taxista.id}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {taxista.nombre || "Sin nombre"}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {taxista.email || "Sin email"}
                    </p>
                  </div>

                  <span
                    className={[
                      "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      getActivoStyles(taxista.activo),
                    ].join(" ")}
                  >
                    {taxista.activo ? "activo" : "inactivo"}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm text-zinc-700">
                  <p>
                    <span className="font-semibold text-zinc-900">
                      Teléfono:
                    </span>{" "}
                    {taxista.telefono || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">Placa:</span>{" "}
                    {taxista.placa || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">
                      Número de taxi:
                    </span>{" "}
                    {taxista.numero_taxi || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">
                      Fecha de registro:
                    </span>{" "}
                    {formatFecha(taxista.created_at)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
                  <span className="text-xs text-zinc-500">
                    ID: {taxista.id?.slice?.(0, 8) || "—"}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleActivo(taxista)}
                    disabled={updatingId === taxista.id}
                    className={[
                      "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70",
                      taxista.activo
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-emerald-600 hover:bg-emerald-700",
                    ].join(" ")}
                  >
                    {updatingId === taxista.id
                      ? "Actualizando..."
                      : taxista.activo
                        ? "Desactivar"
                        : "Activar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Taxistas;