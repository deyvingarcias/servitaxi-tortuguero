import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const FILTROS = [
  { label: "Todas", value: "todas" },
  { label: "Pendientes", value: "pendiente" },
  { label: "Confirmadas", value: "confirmada" },
  { label: "Completadas", value: "completada" },
  { label: "Canceladas", value: "cancelada" },
];

function getEstadoStyles(estado) {
  switch (estado) {
    case "pendiente":
      return "bg-yellow-50 text-yellow-700 ring-yellow-200";
    case "confirmada":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "completada":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "cancelada":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-200";
  }
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Reservas() {
  const navigate = useNavigate();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
          .from("reservas")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setReservas(data ?? []);
      } catch (err) {
        setError(err?.message || "No se pudieron cargar las reservas.");
        setReservas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, []);

  const reservasFiltradas = useMemo(() => {
    if (filtroEstado === "todas") return reservas;
    return reservas.filter((reserva) => reserva.estado === filtroEstado);
  }, [reservas, filtroEstado]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-6">
        <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-28 animate-pulse rounded-2xl bg-zinc-100"
              />
            ))}
          </div>

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
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Reservas</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Gestiona y revisa todas las reservas
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTROS.map((filtro) => {
              const activo = filtroEstado === filtro.value;
              return (
                <button
                  key={filtro.value}
                  onClick={() => setFiltroEstado(filtro.value)}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                    activo
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
                  ].join(" ")}
                >
                  {filtro.label}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>
        ) : null}

        {!error && reservasFiltradas.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-zinc-50 p-8 text-center ring-1 ring-zinc-200">
            <p className="text-base font-semibold text-zinc-900">
              No hay reservas todavía
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Cuando entren nuevas reservas aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reservasFiltradas.map((reserva) => (
              <article
                key={reserva.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/reservas/${reserva.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/admin/reservas/${reserva.id}`);
                  }
                }}
                className="cursor-pointer rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {reserva.cliente_nombre || "Sin nombre"}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {reserva.cliente_telefono || "Sin teléfono"}
                    </p>
                  </div>

                  <span
                    className={[
                      "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      getEstadoStyles(reserva.estado),
                    ].join(" ")}
                  >
                    {reserva.estado || "desconocido"}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm text-zinc-700">
                  <p>
                    <span className="font-semibold text-zinc-900">Ruta:</span>{" "}
                    {reserva.origen || "—"} → {reserva.destino || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">Fecha:</span>{" "}
                    {formatFecha(reserva.fecha_hora)}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">Servicio:</span>{" "}
                    {reserva.tipo_servicio || "—"}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
                  <span className="text-xs text-zinc-500">
                    Creada: {formatFecha(reserva.created_at)}
                  </span>
                  <span className="text-sm font-semibold text-emerald-600">
                    Ver detalle
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reservas;