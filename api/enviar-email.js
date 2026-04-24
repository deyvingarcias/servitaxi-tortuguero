import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function pad(value) {
  return String(value).padStart(2, "0");
}

function toIcsUtc(date) {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function buildIcs({
  origen,
  destino,
  fecha_hora,
  tipo_servicio,
  metodo_pago,
}) {
  const start = new Date(fecha_hora);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const summary = `ServiTaxi – ${origen} a ${destino}`;
  const description = `Servicio: ${tipo_servicio} | Pago: ${metodo_pago}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ServiTaxi Tortuguero//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `SUMMARY:${summary}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return Buffer.from(ics, "utf8").toString("base64");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      origen,
      destino,
      fecha_hora,
      pasajeros,
      tipo_servicio,
      metodo_pago,
    } = req.body || {};

    if (
      !cliente_nombre ||
      !origen ||
      !destino ||
      !fecha_hora ||
      !tipo_servicio ||
      !metodo_pago
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const attachments = [
      {
        filename: "reserva.ics",
        content: buildIcs({
          origen,
          destino,
          fecha_hora,
          tipo_servicio,
          metodo_pago,
        }),
        contentType: "text/calendar",
      },
    ];

    const normalizedClientEmail =
      typeof cliente_email === "string" ? cliente_email.trim() : "";

    if (normalizedClientEmail) {
      const clientHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="color: #16a34a; margin-bottom: 16px;">Hola ${cliente_nombre},</h2>
          <p>Gracias por tu reserva en <strong>ServiTaxi Tortuguero</strong>.</p>
          <div style="margin: 20px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb;">
            <p><strong>Origen:</strong> ${origen}</p>
            <p><strong>Destino:</strong> ${destino}</p>
            <p><strong>Fecha y hora:</strong> ${fecha_hora}</p>
            <p><strong>Servicio:</strong> ${tipo_servicio}</p>
            <p><strong>Pago:</strong> ${metodo_pago}</p>
          </div>
          <p>Lenin se pondrá en contacto contigo pronto.</p>
        </div>
      `;

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: normalizedClientEmail,
        subject: "Confirmación de reserva – ServiTaxi Tortuguero",
        html: clientHtml,
        attachments,
      });
    }

    const { data: taxistas, error: taxistasError } = await supabaseAdmin
      .from("taxistas")
      .select("email, nombre")
      .eq("activo", true);

    if (!taxistasError && Array.isArray(taxistas) && taxistas.length > 0) {
      const taxistaHtml = (nombre = "") => `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="color: #16a34a; margin-bottom: 16px;">Nueva solicitud de taxi</h2>
          ${nombre ? `<p>Hola ${nombre},</p>` : ""}
          <p>Hay una nueva solicitud pendiente de atención.</p>
          <div style="margin: 20px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb;">
            <p><strong>Origen:</strong> ${origen}</p>
            <p><strong>Destino:</strong> ${destino}</p>
            <p><strong>Fecha y hora:</strong> ${fecha_hora}</p>
            <p><strong>Pasajeros:</strong> ${pasajeros ?? "-"}</p>
            <p><strong>Cliente:</strong> ${cliente_nombre}</p>
            <p><strong>Teléfono:</strong> ${cliente_telefono || "-"}</p>
          </div>
          <div style="margin-top: 24px;">
            <a
              href="https://servitaxi-tortuguero.vercel.app/taxista/panel"
              style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;"
            >
              Ver solicitudes
            </a>
          </div>
        </div>
      `;

      await Promise.all(
        taxistas.map(async (taxista) => {
          try {
            await resend.emails.send({
              from: "onboarding@resend.dev",
              to: taxista.email,
              subject: `Nueva solicitud de taxi — ${origen} → ${destino}`,
              html: taxistaHtml(taxista.nombre),
            });
          } catch (taxistaEmailError) {
            console.error(
              "Error enviando email a taxista:",
              taxista?.email,
              taxistaEmailError
            );
          }
        })
      );
    } else if (taxistasError) {
      console.error("Error consultando taxistas activos:", taxistasError);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      message: error?.message || "Internal Server Error",
    });
  }
}