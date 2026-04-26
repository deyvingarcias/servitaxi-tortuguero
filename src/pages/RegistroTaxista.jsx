// src/pages/RegistroTaxista.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RegistroTaxista() {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    password: "",
    confirm_password: "",
    placa: "",
    color: "",
    numero_taxi: "",
  });

  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const errors = useMemo(() => {
    const next = {};

    if (!form.nombre.trim()) next.nombre = "El nombre completo es obligatorio.";
    if (!form.telefono.trim()) next.telefono = "El teléfono es obligatorio.";

    const email = form.email.trim();
    if (!email) next.email = "El email es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Introduce un email válido.";
    }

    if (!form.password) next.password = "La contraseña es obligatoria.";
    else if (form.password.length < 6) {
      next.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (!form.confirm_password) {
      next.confirm_password = "Confirma la contraseña.";
    } else if (form.confirm_password !== form.password) {
      next.confirm_password = "Las contraseñas no coinciden.";
    }

    if (!form.placa.trim()) next.placa = "La placa del vehículo es obligatoria.";
    if (!form.numero_taxi.trim()) {
      next.numero_taxi = "El número de taxi es obligatorio.";
    }

    return next;
  }, [form]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
    setError("");
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async () => {
    setTouched({
      nombre: true,
      telefono: true,
      email: true,
      password: true,
      confirm_password: true,
      placa: true,
      color: true,
      numero_taxi: true,
    });

    if (Object.keys(errors).length > 0) {
      setError("Revisa los campos marcados antes de continuar.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const normalizedEmail = form.email.trim().toLowerCase();

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password: form.password,
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData?.user) {
        throw new Error("No se pudo crear la cuenta de autenticación.");
      }

      const { error: insertError } = await supabase.from("taxistas").insert([
        {
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
          email: normalizedEmail,
          placa: form.placa.trim(),
          color: form.color.trim(),
          numero_taxi: form.numero_taxi.trim(),
          activo: false,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      setSuccess("Cuenta creada correctamente. Lenin activará tu acceso pronto.");
      setForm({
        nombre: "",
        telefono: "",
        email: "",
        password: "",
        confirm_password: "",
        placa: "",
        color: "",
        numero_taxi: "",
      });
      setTouched({});
    } catch (err) {
      setError(
        err?.message ||
          "No se pudo enviar el registro. Inténtalo de nuevo en unos momentos."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";

  const labelClass = "text-sm font-medium text-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:p-8">
          <div className="mb-8">
            <p className="inline-flex rounded-full bg-emerald-600/10 px-3 py-1 text-sm font-medium text-emerald-700">
              Registro de taxista
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
              Crea tu cuenta de conductor
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Completa tus datos para que el administrador revise y active tu
              cuenta.
            </p>
          </div>

          {success ? (
            <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          ) : null}

          {error ? (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-5">
            <div>
              <label className={labelClass}>Nombre completo</label>
              <input
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                onBlur={() => handleBlur("nombre")}
                className={inputClass}
                placeholder="Tu nombre completo"
                type="text"
              />
              {touched.nombre && errors.nombre ? (
                <p className="mt-2 text-sm text-red-600">{errors.nombre}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass}>Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                onBlur={() => handleBlur("telefono")}
                className={inputClass}
                placeholder="Ej. 8888-8888"
                type="tel"
              />
              {touched.telefono && errors.telefono ? (
                <p className="mt-2 text-sm text-red-600">{errors.telefono}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                className={inputClass}
                placeholder="tu@email.com"
                type="email"
              />
              {touched.email && errors.email ? (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass}>Contraseña</label>
              <input
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
                type="password"
              />
              {touched.password && errors.password ? (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass}>Confirmar contraseña</label>
              <input
                value={form.confirm_password}
                onChange={(e) =>
                  handleChange("confirm_password", e.target.value)
                }
                onBlur={() => handleBlur("confirm_password")}
                className={inputClass}
                placeholder="Repite tu contraseña"
                type="password"
              />
              {touched.confirm_password && errors.confirm_password ? (
                <p className="mt-2 text-sm text-red-600">
                  {errors.confirm_password}
                </p>
              ) : null}
            </div>

            <div>
              <label className={labelClass}>Placa del vehículo</label>
              <input
                value={form.placa}
                onChange={(e) => handleChange("placa", e.target.value)}
                onBlur={() => handleBlur("placa")}
                className={inputClass}
                placeholder="Ej. ABC-123"
                type="text"
              />
              {touched.placa && errors.placa ? (
                <p className="mt-2 text-sm text-red-600">{errors.placa}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass}>Color del vehículo</label>
              <input
                value={form.color}
                onChange={(e) => handleChange("color", e.target.value)}
                onBlur={() => handleBlur("color")}
                className={inputClass}
                placeholder="Ej. Blanco, rojo, azul..."
                type="text"
              />
            </div>

            <div>
              <label className={labelClass}>Número de taxi</label>
              <input
                value={form.numero_taxi}
                onChange={(e) => handleChange("numero_taxi", e.target.value)}
                onBlur={() => handleBlur("numero_taxi")}
                className={inputClass}
                placeholder="Ej. 12"
                type="text"
              />
              {touched.numero_taxi && errors.numero_taxi ? (
                <p className="mt-2 text-sm text-red-600">
                  {errors.numero_taxi}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-3xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Enviando..." : "Enviar registro"}
            </button>

            <div className="text-center text-sm text-zinc-600">
              <Link
                to="/taxista/login"
                className="font-medium text-red-600 transition hover:text-red-700"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}