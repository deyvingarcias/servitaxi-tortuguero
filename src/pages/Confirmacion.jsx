import { useLocation, useNavigate } from "react-router-dom";

function Confirmacion() {
  const navigate = useNavigate();
  const location = useLocation();

  const reserva = location.state ?? null;

  const fechaFormateada = reserva?.fecha_hora
    ? new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(reserva.fecha_hora))
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-3xl">✅</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            ¡Reserva confirmada!
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600 sm:text-base">
            Te hemos enviado un email de confirmación con los detalles del viaje.
          </p>
        </div>

        {reserva ? (
          <div className="rounded-3xl bg-zinc-50 p-5 ring-1 ring-zinc-200">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Resumen de la reserva
            </h2>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoItem label="Nombre" value={reserva.cliente_nombre} />
              <InfoItem
                label="Ruta"
                value={`${reserva.origen ?? "—"} → ${reserva.destino ?? "—"}`}
              />
              <InfoItem label="Fecha y hora" value={fechaFormateada ?? reserva.fecha_hora ?? "—"} />
              <InfoItem label="Tipo de servicio" value={reserva.tipo_servicio ?? "—"} />
              <InfoItem label="Método de pago" value={reserva.metodo_pago ?? "—"} />
            </dl>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate("/reservar")}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Hacer otra reserva
          </button>

          <button
            onClick={() => navigate("/")}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-zinc-900">
        {value || "—"}
      </dd>
    </div>
  );
}

export default Confirmacion;