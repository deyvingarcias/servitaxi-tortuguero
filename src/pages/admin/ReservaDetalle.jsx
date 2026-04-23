import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function ReservaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reserva, setReserva] = useState(null);
  const [estado, setEstado] = useState("pendiente");
  const [conductor, setConductor] = useState("");
  const [notas, setNotas] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const cargarReserva = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const { data, error } = await supabase
          .from("reservas")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        setReserva(data);
        setEstado(data?.estado ?? "pendiente");
        setConductor(data?.conductor ?? "");
        setNotas(data?.notas ?? "");
      } catch (err) {
        setError(err?.message || "No se pudo cargar la reserva.");
        setReserva(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) cargarReserva();
  }, [id]);

  const handleGuardarCambios = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { error } = await supabase
        .from("reservas")
        .update({
          estado,
          conductor,
          notas,
        })
        .eq("id", id);

      if (error) throw error;

      setSuccess("Cambios guardados correctamente.");

      const { data, error: refreshError } = await supabase
        .from("reservas")
        .select("*")
        .eq("id", id)
        .single();

      if (refreshError) throw refreshError;

      setReserva(data);
      setEstado(data?.estado ?? "pendiente");
      setConductor(data?.conductor ?? "");
      setNotas(data?.notas ?? "");
    } catch (err) {
      setError(err?.message || "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = () => {
    if (!reserva?.cliente_telefono) return;

    const telefono = String(reserva.cliente_telefono).replace(/\D/g, "");
    const url = `https://wa.me/${telefono}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-6">
        <div className="mx-auto w-full max-w-5xl rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <div className="h-7 w-56 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-3xl bg-zinc-100" />
            <div className="h-40 animate-pulse rounded-3xl bg-zinc-100" />
            <div className="h-40 animate-pulse rounded-3xl bg-zinc-100 md:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !reserva) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-6">
        <div className="mx-auto w-full max-w-5xl rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>

          <button
            onClick={() => navigate("/admin/reservas")}
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6">
      <div className="mx-auto w-full max-w-5xl rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Detalle de reserva
            </h1>
            <p className="mt-1 text-sm text-zinc-500">ID: {id}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => navigate("/admin/reservas")}
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200"
            >
              Volver
            </button>

            <button
              onClick={handleWhatsApp}
              disabled={!reserva?.cliente_telefono}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enviar WhatsApp
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 ring-1 ring-emerald-200">
            {success}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Datos de la reserva
            </h2>
<div className="mt-4 grid grid-cols-1 gap-4">
  <InfoField label="Cliente" value={reserva?.cliente_nombre} />
  <InfoField label="Email" value={reserva?.cliente_email} />
  <InfoField label="Teléfono" value={reserva?.cliente_telefono} />
  <InfoField label="Origen" value={reserva?.origen} />
  <InfoField label="Destino" value={reserva?.destino} />
  <InfoField label="Fecha y hora" value={reserva?.fecha_hora ? new Date(reserva.fecha_hora).toLocaleString("es-NI", { dateStyle: "long", timeStyle: "short" }) : "—"} />
  <InfoField label="Tipo de servicio" value={reserva?.tipo_servicio} />
  <InfoField label="Método de pago" value={reserva?.metodo_pago} />
  <InfoField label="Creada el" value={reserva?.created_at} />
 {reserva?.ubicacion_cliente && (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Ubicación del cliente
      </p>
      <a
        href={reserva.ubicacion_cliente}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 block break-all text-sm font-medium text-emerald-600 underline hover:text-emerald-700"
      >
        Ver en Google Maps
      </a>
    </div>
  )}
</div>
            
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-4 ring-1 ring-zinc-200">
              <label className="mb-2 block text-sm font-semibold text-zinc-900">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="pendiente">pendiente</option>
                <option value="confirmada">confirmada</option>
                <option value="completada">completada</option>
                <option value="cancelada">cancelada</option>
              </select>
            </div>

            <div className="rounded-3xl bg-white p-4 ring-1 ring-zinc-200">
              <label className="mb-2 block text-sm font-semibold text-zinc-900">
                Conductor
              </label>
              <input
                type="text"
                value={conductor}
                onChange={(e) => setConductor(e.target.value)}
                placeholder="Nombre del conductor"
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="rounded-3xl bg-white p-4 ring-1 ring-zinc-200">
              <label className="mb-2 block text-sm font-semibold text-zinc-900">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas adicionales"
                rows={6}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <button
              onClick={handleGuardarCambios}
              disabled={saving}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-zinc-900">
        {value ? value : "—"}
      </p>
    </div>
  );
}