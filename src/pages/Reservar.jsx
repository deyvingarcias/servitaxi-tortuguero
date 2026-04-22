import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { DESTINOS as destinos } from "../constants/destinos";

const pasos = ["Servicio y ruta", "Fecha y datos", "Pago y confirmación"];

const servicioOptions = [
  { value: "taxi", label: "Taxi" },
  { value: "carga", label: "Camión de carga" },
];

const pagoOptions = [
  { value: "presencial", label: "Pagar al llegar" },
  { value: "online", label: "Pagar en línea" },
];

const initialForm = {
  tipoServicio: "taxi",
  origen: "",
  destino: "",
  otroDestino: "",
  fechaHora: "",
  clienteNombre: "",
  clienteTelefono: "",
  clienteEmail: "",
  metodoPago: "presencial",
};

function Reservar() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const destinosDisponibles = useMemo(() => [...destinos, "Otro"], []);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setError("");
  };

  const validateStep = (currentStep) => {
    const nextErrors = {};

    if (currentStep === 1) {
      if (!form.tipoServicio) nextErrors.tipoServicio = "Selecciona un tipo de servicio.";
      if (!form.origen.trim()) nextErrors.origen = "Escribe el origen.";
      if (!form.destino) nextErrors.destino = "Selecciona un destino.";
      if (form.destino === "Otro" && !form.otroDestino.trim()) {
        nextErrors.otroDestino = "Escribe el otro destino.";
      }
    }

    if (currentStep === 2) {
      if (!form.fechaHora) nextErrors.fechaHora = "Selecciona fecha y hora.";
      if (!form.clienteNombre.trim()) nextErrors.clienteNombre = "Escribe tu nombre completo.";
      if (!form.clienteTelefono.trim()) nextErrors.clienteTelefono = "Escribe tu teléfono.";
      if (!form.clienteEmail.trim()) {
        nextErrors.clienteEmail = "Escribe tu correo electrónico.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clienteEmail.trim())) {
        nextErrors.clienteEmail = "Escribe un correo válido.";
      }
    }

    if (currentStep === 3) {
      if (!form.metodoPago) nextErrors.metodoPago = "Selecciona un método de pago.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      setError("Revisa los campos marcados antes de continuar.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
    setError("");
  };

  const handleBack = () => {
    setError("");
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setError("Completa todos los campos obligatorios antes de confirmar.");
      return;
    }

    const destinoFinal =
      form.destino === "Otro" ? form.otroDestino.trim() : form.destino;

    setLoading(true);
    setError("");

    try {
      const payload = {
        cliente_nombre: form.clienteNombre.trim(),
        cliente_email: form.clienteEmail.trim(),
        cliente_telefono: form.clienteTelefono.trim(),
        tipo_servicio: form.tipoServicio,
        origen: form.origen.trim(),
        destino: destinoFinal,
        fecha_hora: form.fechaHora,
        metodo_pago: form.metodoPago,
        estado: "pendiente",
      };

      const { error: insertError } = await supabase
        .from("reservas")
        .insert([payload]);

      if (insertError) throw insertError;

      try {
        await fetch("/api/enviar-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cliente_nombre: payload.cliente_nombre,
            cliente_email: payload.cliente_email,
            origen: payload.origen,
            destino: destinoFinal,
            fecha_hora: payload.fecha_hora,
            tipo_servicio: payload.tipo_servicio,
            metodo_pago: payload.metodo_pago,
          }),
        });
      } catch (emailErr) {
        console.error("Email no enviado:", emailErr);
      }

      navigate("/confirmacion", {
        state: {
          cliente_nombre: payload.cliente_nombre,
          origen: payload.origen,
          destino: destinoFinal,
          fecha_hora: payload.fecha_hora,
          tipo_servicio: payload.tipo_servicio,
          metodo_pago: payload.metodo_pago,
        },
      });
    } catch (err) {
      setError(
        err?.message || "No se pudo confirmar la reserva. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const destinoMostrado =
    form.destino === "Otro" ? form.otroDestino.trim() : form.destino;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-red-600 p-6 text-white shadow-lg shadow-emerald-600/10">
          <p className="text-sm/6 font-medium uppercase tracking-[0.2em] text-white/80">
            ServiTaxi Tortuguero
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Reserva tu transporte</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
            Completa los 3 pasos para solicitar tu viaje bajo demanda.
          </p>
        </div>

        <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            {pasos.map((label, index) => {
              const pasoNumero = index + 1;
              const activo = pasoNumero === step;
              const completado = pasoNumero < step;

              return (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                          completado || activo
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-200 text-zinc-500"
                        }`}
                      >
                        {pasoNumero}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            activo ? "text-emerald-700" : "text-zinc-700"
                          }`}
                        >
                          Paso {pasoNumero}
                        </p>
                        <p className="text-xs text-zinc-500">{label}</p>
                      </div>
                    </div>
                    {index < pasos.length - 1 && (
                      <div className="mt-3 h-1 w-full rounded-full bg-zinc-200">
                        <div
                          className="h-1 rounded-full bg-emerald-600 transition-all"
                          style={{ width: step > pasoNumero ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Servicio y ruta</h2>

              <div className="mt-5">
                <label className="mb-3 block text-sm font-medium text-zinc-700">
                  Tipo de servicio
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {servicioOptions.map((option) => {
                    const selected = form.tipoServicio === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("tipoServicio", option.value)}
                        className={`rounded-2xl border-2 px-4 py-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          selected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <span className="block text-base font-semibold">{option.label}</span>
                        <span className="mt-1 block text-sm text-zinc-500">
                          {option.value === "taxi"
                            ? "Viajes rápidos y cómodos"
                            : "Carga ligera o pesada"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.tipoServicio && (
                  <p className="mt-2 text-sm text-red-600">{fieldErrors.tipoServicio}</p>
                )}
              </div>

              <div className="mt-5 grid gap-5">
                <div>
                  <label
                    htmlFor="origen"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Origen
                  </label>
                  <input
                    id="origen"
                    type="text"
                    value={form.origen}
                    onChange={(e) => updateField("origen", e.target.value)}
                    placeholder='Ej: "Mi casa en Tortuguero"'
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      fieldErrors.origen
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-200 focus:border-emerald-500 focus:ring-emerald-100"
                    }`}
                  />
                  {fieldErrors.origen && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.origen}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="destino"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Destino
                  </label>
                  <select
                    id="destino"
                    value={form.destino}
                    onChange={(e) => updateField("destino", e.target.value)}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      fieldErrors.destino
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-200 focus:border-emerald-500 focus:ring-emerald-100"
                    }`}
                  >
                    <option value="">Selecciona un destino</option>
                    {destinosDisponibles.map((destino) => (
                      <option key={destino} value={destino}>
                        {destino}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.destino && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.destino}</p>
                  )}
                </div>

                {form.destino === "Otro" && (
                  <div>
                    <label
                      htmlFor="otroDestino"
                      className="mb-2 block text-sm font-medium text-zinc-700"
                    >
                      Otro destino
                    </label>
                    <input
                      id="otroDestino"
                      type="text"
                      value={form.otroDestino}
                      onChange={(e) => updateField("otroDestino", e.target.value)}
                      placeholder="Escribe el destino exacto"
                      className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                        fieldErrors.otroDestino
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border-zinc-200 focus:border-emerald-500 focus:ring-emerald-100"
                      }`}
                    />
                    {fieldErrors.otroDestino && (
                      <p className="mt-2 text-sm text-red-600">
                        {fieldErrors.otroDestino}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">
                Fecha y datos del cliente
              </h2>

              <div className="mt-5 grid gap-5">
                <div>
                  <label
                    htmlFor="fechaHora"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Fecha y hora
                  </label>
                  <input
                    id="fechaHora"
                    type="datetime-local"
                    value={form.fechaHora}
                    onChange={(e) => updateField("fechaHora", e.target.value)}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      fieldErrors.fechaHora
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-200 focus:border-emerald-500 focus:ring-emerald-100"
                    }`}
                  />
                  {fieldErrors.fechaHora && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.fechaHora}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="clienteNombre"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Nombre completo
                  </label>
                  <input
                    id="clienteNombre"
                    type="text"
                    value={form.clienteNombre}
                    onChange={(e) => updateField("clienteNombre", e.target.value)}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      fieldErrors.clienteNombre
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-200 focus:border-emerald-500 focus:ring-emerald-100"
                    }`}
                  />
                  {fieldErrors.clienteNombre && (
                    <p className="mt-2 text-sm text-red-600">
                      {fieldErrors.clienteNombre}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="clienteTelefono"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Teléfono
                  </label>
                  <input
                    id="clienteTelefono"
                    type="tel"
                    value={form.clienteTelefono}
                    onChange={(e) => updateField("clienteTelefono", e.target.value)}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      fieldErrors.clienteTelefono
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-200 focus:border-emerald-500 focus:ring-emerald-100"
                    }`}
                  />
                  {fieldErrors.clienteTelefono && (
                    <p className="mt-2 text-sm text-red-600">
                      {fieldErrors.clienteTelefono}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="clienteEmail"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Email
                  </label>
                  <input
                    id="clienteEmail"
                    type="email"
                    value={form.clienteEmail}
                    onChange={(e) => updateField("clienteEmail", e.target.value)}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      fieldErrors.clienteEmail
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-200 focus:border-emerald-500 focus:ring-emerald-100"
                    }`}
                  />
                  {fieldErrors.clienteEmail && (
                    <p className="mt-2 text-sm text-red-600">
                      {fieldErrors.clienteEmail}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">
                Método de pago y confirmación
              </h2>

              <div className="mt-5">
                <label className="mb-3 block text-sm font-medium text-zinc-700">
                  Método de pago
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {pagoOptions.map((option) => {
                    const selected = form.metodoPago === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("metodoPago", option.value)}
                        className={`rounded-2xl border-2 px-4 py-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          selected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <span className="block text-base font-semibold">{option.label}</span>
                        <span className="mt-1 block text-sm text-zinc-500">
                          {option.value === "presencial"
                            ? "Pagas cuando llegues"
                            : "Pago digital"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.metodoPago && (
                  <p className="mt-2 text-sm text-red-600">{fieldErrors.metodoPago}</p>
                )}
              </div>

              <div className="mt-6 rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Resumen de la reserva
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
                  <div>
                    <span className="block text-zinc-500">Servicio</span>
                    <span className="font-medium">
                      {form.tipoServicio === "taxi" ? "Taxi" : "Camión de carga"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Origen</span>
                    <span className="font-medium">{form.origen || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Destino</span>
                    <span className="font-medium">{destinoMostrado || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Fecha y hora</span>
                    <span className="font-medium">{form.fechaHora || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Nombre</span>
                    <span className="font-medium">{form.clienteNombre || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Teléfono</span>
                    <span className="font-medium">{form.clienteTelefono || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Email</span>
                    <span className="font-medium">{form.clienteEmail || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Pago</span>
                    <span className="font-medium">
                      {form.metodoPago === "online"
                        ? "Pagar en línea"
                        : "Pagar al llegar"}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Siguiente
              </button>
            ) : (
              <button
  type="button"
  disabled={loading}
  onClick={handleSubmit}
  className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
>
  {loading ? "Confirmando..." : "Confirmar reserva"}
</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Reservar;