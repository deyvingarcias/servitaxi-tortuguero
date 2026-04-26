// src/pages/taxista/Panel.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const ALARM_INTERVAL_MS = 8000;
const POLLING_MS = 10000;

export default function TaxistaPanel() {
  const navigate = useNavigate();
  const audioContextRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [taxistaNombre, setTaxistaNombre] = useState("");
  const [taxistaData, setTaxistaData] = useState({
    nombre: "",
    placa: "",
    color: "",
    telefono: "",
  });
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [alarmSilenced, setAlarmSilenced] = useState(false);

  const pendingReservas = useMemo(() => reservas, [reservas]);

  const loadReservas = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("reservas")
      .select(
        "id, origen, destino, fecha_hora, pasajeros, cliente_nombre, cliente_telefono, estado, conductor"
      )
      .eq("estado", "pendiente")
      .order("fecha_hora", { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    setReservas(data || []);
  }, []);

  const playAlarmBeep = useCallback(async () => {
    if (typeof window === "undefined") return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    let audioContext = audioContextRef.current;

    if (!audioContext) {
      audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
    }

    try {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.4);

      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch {
      // Si el navegador bloquea el audio, simplemente no se reproduce.
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const init = async () => {
      setCheckingAuth(true);
      setLoading(true);
      setError("");

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        const user = userData?.user;
        const email = user?.email?.trim().toLowerCase();

        if (!email) {
          await supabase.auth.signOut();
          navigate("/taxista/login", { replace: true });
          return;
        }

        const { data: taxista, error: taxistaError } = await supabase
          .from("taxistas")
          .select("nombre, email, activo, placa, color, telefono")
          .ilike("email", email)
          .maybeSingle();

        if (taxistaError) throw taxistaError;

        if (!taxista) {
          await supabase.auth.signOut();
          navigate("/taxista/login", { replace: true });
          return;
        }

        if (!taxista.activo) {
          await supabase.auth.signOut();
          navigate("/taxista/login", { replace: true });
          return;
        }

        if (!mounted) return;

        setTaxistaNombre(taxista.nombre || "");
        setTaxistaData({
          nombre: taxista.nombre || "",
          placa: taxista.placa || "",
          color: taxista.color || "",
          telefono: taxista.telefono || "",
        });

        await loadReservas();
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "No se pudo cargar el panel.");
      } finally {
        if (!mounted) return;
        setCheckingAuth(false);
        setLoading(false);
      }
    };

    init();

    intervalId = setInterval(async () => {
      try {
        await loadReservas();
      } catch {
        // silencioso para el polling
      }
    }, POLLING_MS);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);

      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
    };
  }, [loadReservas, navigate]);

  useEffect(() => {
    const shouldPlayAlarm = pendingReservas.length > 0 && !alarmSilenced;

    if (!shouldPlayAlarm) {
      return;
    }

    playAlarmBeep();

    const alarmIntervalId = setInterval(() => {
      playAlarmBeep();
    }, ALARM_INTERVAL_MS);

    return () => clearInterval(alarmIntervalId);
  }, [alarmSilenced, pendingReservas.length, playAlarmBeep]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/taxista/login", { replace: true });
  };

  const handleToggleAlarm = () => {
    setAlarmSilenced((prev) => !prev);
  };

  const handleAccept = async (reservaId) => {
    setActionLoadingId(reservaId);
    setError("");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const email = userData?.user?.email?.trim().toLowerCase();
      if (!email) throw new Error("Sesión inválida.");

      const { data: taxista, error: taxistaError } = await supabase
        .from("taxistas")
        .select("nombre, email, placa, color, telefono")
        .ilike("email", email)
        .maybeSingle();

      if (taxistaError) throw taxistaError;
      if (!taxista) throw new Error("No se encontró el taxista.");

      const { error: updateError } = await supabase
        .from("reservas")
        .update({
          estado: "confirmada",
          conductor: taxista.nombre,
        })
        .eq("id", reservaId)
        .eq("estado", "pendiente");

      if (updateError) throw updateError;

      fetch("/api/confirmar-viaje", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reserva_id: reservaId,
          taxista_nombre: taxista.nombre || "",
          taxista_placa: taxista.placa || "",
          taxista_color: taxista.color || "",
          taxista_telefono: taxista.telefono || "",
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const text = await response.text().catch(() => "");
            console.error("Error enviando email de confirmación:", text);
          }
        })
        .catch((fetchError) => {
          console.error("Error enviando email de confirmación:", fetchError);
        });

      setReservas((prev) => prev.filter((r) => r.id !== reservaId));
    } catch (err) {
      setError(err?.message || "No se pudo aceptar el viaje.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatFecha = (value) => {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const buildWhatsAppUrl = (reserva) => {
    const telefono = String(reserva?.cliente_telefono || "")
      .replace(/\D/g, "")
      .trim();

    const numero = telefono.startsWith("505") ? telefono : `505${telefono}`;

    const mensaje = `Hola ${reserva?.cliente_nombre || ""}, soy tu taxista, voy a atender tu reserva de ${reserva?.origen || ""} a ${reserva?.destino || ""}.`;

    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  };

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
            <p className="text-sm text-zinc-600">Cargando panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-emerald-600/10 px-3 py-1 text-sm font-medium text-emerald-700">
              Panel del taxista
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
              Hola, {taxistaNombre || "taxista"}
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleToggleAlarm}
              className="inline-flex items-center justify-center rounded-3xl border border-zinc-200 bg-white px-4 py-3 font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              {alarmSilenced ? "🔕 Activar alarma" : "🔔 Silenciar alarma"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-3xl bg-red-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {pendingReservas.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
            <p className="text-lg font-medium text-zinc-900">
              No hay solicitudes pendientes en este momento
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingReservas.map((reserva) => (
              <div
                key={reserva.id}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">Origen</p>
                    <p className="mt-1 text-base font-semibold text-zinc-900">
                      {reserva.origen}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-500">Destino</p>
                    <p className="mt-1 text-base font-semibold text-zinc-900">
                      {reserva.destino}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-500">Fecha y hora</p>
                    <p className="mt-1 text-base font-semibold text-zinc-900">
                      {formatFecha(reserva.fecha_hora)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-500">Pasajeros</p>
                    <p className="mt-1 text-base font-semibold text-zinc-900">
                      {reserva.pasajeros}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-500">Cliente</p>
                    <p className="mt-1 text-base font-semibold text-zinc-900">
                      {reserva.cliente_nombre}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-500">Teléfono</p>
                    <p className="mt-1 text-base font-semibold text-zinc-900">
                      {reserva.cliente_telefono}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleAccept(reserva.id)}
                    disabled={actionLoadingId === reserva.id}
                    className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {actionLoadingId === reserva.id
                      ? "Aceptando..."
                      : "Aceptar viaje"}
                  </button>

                  <a
                    href={buildWhatsAppUrl(reserva)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-3xl bg-green-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700"
                  >
                    WhatsApp cliente
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}