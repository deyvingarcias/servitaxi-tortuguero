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
  const [viajesAceptados, setViajesAceptados] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [alarmSilenced, setAlarmSilenced] = useState(false);

  const pendingReservas = useMemo(() => reservas, [reservas]);

  const loadReservas = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("reservas")
      .select(
        "id, origen, destino, fecha_hora, pasajeros, cliente_nombre, cliente_telefono, ubicacion_cliente, estado, conductor"
      )
      .eq("estado", "pendiente")
      .order("fecha_hora", { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    setReservas(data || []);
  }, []);

  const loadViajesAceptados = useCallback(async (nombreTaxista) => {
    if (!nombreTaxista) {
      setViajesAceptados([]);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("reservas")
      .select(
        "id, origen, destino, fecha_hora, pasajeros, cliente_nombre, cliente_telefono, ubicacion_cliente, conductor"
      )
      .eq("estado", "confirmada")
      .eq("conductor", nombreTaxista)
      .order("fecha_hora", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    setViajesAceptados(data || []);
  }, []);

  const loadHistorial = useCallback(async (nombreTaxista) => {
    if (!nombreTaxista) {
      setHistorial([]);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("reservas")
      .select(
        "id, origen, destino, fecha_hora, pasajeros, cliente_nombre, cliente_telefono"
      )
      .eq("estado", "completada")
      .eq("conductor", nombreTaxista)
      .order("fecha_hora", { ascending: false })
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    setHistorial(data || []);
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

        const nombreActivo = taxista.nombre || "";

        setTaxistaNombre(nombreActivo);
        setTaxistaData({
          nombre: taxista.nombre || "",
          placa: taxista.placa || "",
          color: taxista.color || "",
          telefono: taxista.telefono || "",
        });

        await Promise.all([
          loadReservas(),
          loadViajesAceptados(nombreActivo),
          loadHistorial(nombreActivo),
        ]);
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

    return () => {
      mounted = false;

      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
    };
  }, [loadHistorial, loadReservas, loadViajesAceptados, navigate]);

  useEffect(() => {
    if (!taxistaNombre) return;

    const intervalId = setInterval(async () => {
      try {
        await Promise.all([
          loadReservas(),
          loadViajesAceptados(taxistaNombre),
          loadHistorial(taxistaNombre),
        ]);
      } catch {
        // silencioso para el polling
      }
    }, POLLING_MS);

    return () => clearInterval(intervalId);
  }, [loadHistorial, loadReservas, loadViajesAceptados, taxistaNombre]);

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

  const refreshDriverLists = async (nombreTaxista) => {
    await Promise.all([
      loadViajesAceptados(nombreTaxista),
      loadHistorial(nombreTaxista),
    ]);
  };

  const handleAccept = async (reservaId) => {
    setActionLoading({ id: reservaId, type: "accept" });
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
      await refreshDriverLists(taxista.nombre || taxistaNombre);
    } catch (err) {
      setError(err?.message || "No se pudo aceptar el viaje.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (reservaId) => {
    setActionLoading({ id: reservaId, type: "complete" });
    setError("");

    try {
      const nombreConductor = taxistaNombre?.trim();
      if (!nombreConductor) {
        throw new Error("No se pudo identificar al conductor.");
      }

      const { error: updateError } = await supabase
        .from("reservas")
        .update({
          estado: "completada",
        })
        .eq("id", reservaId)
        .eq("estado", "confirmada")
        .eq("conductor", nombreConductor);

      if (updateError) throw updateError;

      await refreshDriverLists(nombreConductor);
    } catch (err) {
      setError(err?.message || "No se pudo marcar el viaje como completado.");
    } finally {
      setActionLoading(null);
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

  const isActionLoading = (reservaId, type) =>
    actionLoading?.id === reservaId && actionLoading?.type === type;

  const renderReservaCard = (reserva, { accepted = false, history = false } = {}) => {
    const isHistory = history === true;

    return (
      <div
        key={reserva.id}
        className={[
          "rounded-3xl bg-white p-6 shadow-sm ring-1 transition",
          isHistory ? "ring-zinc-100" : accepted ? "ring-blue-200" : "ring-zinc-200",
        ].join(" ")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={["text-sm font-medium", isHistory ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
              Origen
            </p>
            <p className={["mt-1 text-base font-semibold", isHistory ? "text-zinc-700" : "text-zinc-900"].join(" ")}>
              {reserva.origen}
            </p>
          </div>

          <div>
            <p className={["text-sm font-medium", isHistory ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
              Destino
            </p>
            <p className={["mt-1 text-base font-semibold", isHistory ? "text-zinc-700" : "text-zinc-900"].join(" ")}>
              {reserva.destino}
            </p>
          </div>

          <div>
            <p className={["text-sm font-medium", isHistory ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
              Fecha y hora
            </p>
            <p className={["mt-1 text-base font-semibold", isHistory ? "text-zinc-700" : "text-zinc-900"].join(" ")}>
              {formatFecha(reserva.fecha_hora)}
            </p>
          </div>

          <div>
            <p className={["text-sm font-medium", isHistory ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
              Pasajeros
            </p>
            <p className={["mt-1 text-base font-semibold", isHistory ? "text-zinc-700" : "text-zinc-900"].join(" ")}>
              {reserva.pasajeros}
            </p>
          </div>

          <div>
            <p className={["text-sm font-medium", isHistory ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
              Cliente
            </p>
            <p className={["mt-1 text-base font-semibold", isHistory ? "text-zinc-700" : "text-zinc-900"].join(" ")}>
              {reserva.cliente_nombre}
            </p>
          </div>

          <div>
            <p className={["text-sm font-medium", isHistory ? "text-zinc-400" : "text-zinc-500"].join(" ")}>
              Teléfono
            </p>
            <p className={["mt-1 text-base font-semibold", isHistory ? "text-zinc-700" : "text-zinc-900"].join(" ")}>
              {reserva.cliente_telefono}
            </p>
          </div>
        </div>

        {!isHistory && reserva.ubicacion_cliente ? (
          <div className="mt-6">
            <a
              href={reserva.ubicacion_cliente}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-3xl bg-green-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              📍 Ver ubicación del cliente
            </a>
          </div>
        ) : null}

        {!isHistory ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!accepted ? (
              <button
                type="button"
                onClick={() => handleAccept(reserva.id)}
                disabled={isActionLoading(reserva.id, "accept")}
                className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isActionLoading(reserva.id, "accept")
                  ? "Aceptando..."
                  : "Aceptar viaje"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleComplete(reserva.id)}
                disabled={isActionLoading(reserva.id, "complete")}
                className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isActionLoading(reserva.id, "complete")
                  ? "Completando..."
                  : "✅ Marcar como completado"}
              </button>
            )}

            <a
              href={buildWhatsAppUrl(reserva)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-3xl bg-green-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              WhatsApp cliente
            </a>
          </div>
        ) : null}
      </div>
    );
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

        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <p className="inline-flex rounded-full bg-emerald-600/10 px-3 py-1 text-sm font-medium text-emerald-700">
                Pendientes
              </p>
              <h2 className="text-xl font-semibold text-zinc-900">
                Solicitudes pendientes
              </h2>
            </div>

            {pendingReservas.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
                <p className="text-lg font-medium text-zinc-900">
                  No hay solicitudes pendientes en este momento
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingReservas.map((reserva) => renderReservaCard(reserva))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <p className="inline-flex rounded-full bg-blue-600/10 px-3 py-1 text-sm font-medium text-blue-700">
                Viajes aceptados
              </p>
              <h2 className="text-xl font-semibold text-zinc-900">
                Viajes aceptados
              </h2>
            </div>

            {viajesAceptados.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-blue-200">
                <p className="text-lg font-medium text-zinc-900">
                  No has aceptado ningún viaje todavía
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {viajesAceptados.map((reserva) =>
                  renderReservaCard(reserva, { accepted: true })
                )}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <p className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600">
                Historial
              </p>
              <h2 className="text-xl font-semibold text-zinc-900">Historial</h2>
            </div>

            {historial.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-100">
                <p className="text-lg font-medium text-zinc-900">
                  No tienes viajes completados todavía
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {historial.map((reserva) =>
                  renderReservaCard(reserva, { history: true })
                )}
              </div>
            )}

            {historial.length === 10 ? (
              <p className="mt-4 text-sm text-zinc-500">
                Mostrando los 10 viajes más recientes
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}