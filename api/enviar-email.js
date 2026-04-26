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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseFechaHoraInput(fecha_hora) {
  const match = String(fecha_hora || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0),
  };
}

function formatFechaHora(fecha_hora) {
  const parsed = parseFechaHoraInput(fecha_hora);

  if (!parsed) {
    return {
      fecha: "-",
      hora: "-",
    };
  }

  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  return {
    fecha: `${parsed.day} de ${months[parsed.month - 1]} de ${parsed.year}`,
    hora: `${pad(parsed.hour)}:${pad(parsed.minute)} h`,
  };
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

function getNicaraguaDateFromInput(fecha_hora) {
  const parsed = parseFechaHoraInput(fecha_hora);

  if (!parsed) {
    return new Date(fecha_hora);
  }

  return new Date(
    Date.UTC(
      parsed.year,
      parsed.month - 1,
      parsed.day,
      parsed.hour + 6,
      parsed.minute,
      parsed.second
    )
  );
}

function buildIcs({
  origen,
  destino,
  fecha_hora,
  tipo_servicio,
  metodo_pago,
}) {
  const start = getNicaraguaDateFromInput(fecha_hora);
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

function buildEmailShell({
  headerTitle,
  headerColor,
  introTitle,
  introText,
  detailRows,
  ctaHtml = "",
}) {
  return `
  <html>
    <body style="margin:0;padding:0;background:#f3f4f6;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;margin:0;padding:0;width:100%;">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;font-family:Arial,Helvetica,sans-serif;color:#111827;border-collapse:separate;">
              <tr>
                <td style="background:${headerColor};padding:22px 24px;border-radius:16px 16px 0 0;">
                  <div style="font-size:28px;line-height:1.2;font-weight:700;color:#ffffff;">
                    ${headerTitle}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;padding:24px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:0 0 14px 0;">
                        <div style="font-size:20px;line-height:1.3;font-weight:700;color:#111827;margin:0 0 8px 0;">
                          ${introTitle}
                        </div>
                        <div style="font-size:15px;line-height:1.6;color:#4b5563;margin:0;">
                          ${introText}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:6px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
                    ${detailRows}
                  </table>

                  ${ctaHtml}
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:16px 8px 0 8px;font-size:12px;line-height:1.5;color:#6b7280;">
                  ServiTaxi Tortuguero · Tortuguero, Nicaragua
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

function buildDetailRow(label, value, isLast = false) {
  return `
    <tr>
      <td style="padding:14px 16px;border-bottom:${isLast ? "none" : "1px solid #e5e7eb"};background:#ffffff;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="width:34%;vertical-align:top;font-size:14px;line-height:1.5;font-weight:700;color:#111827;padding-right:12px;">
              ${label}
            </td>
            <td style="vertical-align:top;font-size:14px;line-height:1.5;color:#374151;word-break:break-word;">
              ${value}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildClientHtml({
  cliente_nombre,
  origen,
  destino,
  fecha_hora,
  tipo_servicio,
  metodo_pago,
  pasajeros,
}) {
  const fh = formatFechaHora(fecha_hora);

  const detailRows = [
    buildDetailRow("📍 Origen", escapeHtml(origen)),
    buildDetailRow("🏁 Destino", escapeHtml(destino)),
    buildDetailRow("📅 Fecha", escapeHtml(fh.fecha)),
    buildDetailRow("🕐 Hora", escapeHtml(fh.hora)),
    buildDetailRow("🚖 Servicio", escapeHtml(tipo_servicio)),
    buildDetailRow("💳 Pago", escapeHtml(metodo_pago)),
    buildDetailRow("👥 Pasajeros", escapeHtml(pasajeros ?? "-"), true),
  ].join("");

  return buildEmailShell({
    headerTitle: "ServiTaxi Tortuguero",
    headerColor: "#16a34a",
    introTitle: `Hola ${escapeHtml(cliente_nombre)},`,
    introText:
      "Tu reserva ha sido registrada correctamente. Estos son los detalles:",
    detailRows,
  });
}

function buildTaxistaHtml({
  nombre,
  origen,
  destino,
  fecha_hora,
  pasajeros,
  cliente_nombre,
  cliente_telefono,
}) {
  const fh = formatFechaHora(fecha_hora);

  const detailRows = [
    buildDetailRow("📍 Origen", escapeHtml(origen)),
    buildDetailRow("🏁 Destino", escapeHtml(destino)),
    buildDetailRow("📅 Fecha", escapeHtml(fh.fecha)),
    buildDetailRow("🕐 Hora", escapeHtml(fh.hora)),
    buildDetailRow("👥 Pasajeros", escapeHtml(pasajeros ?? "-")),
    buildDetailRow("🙍 Cliente", escapeHtml(cliente_nombre)),
    buildDetailRow("📞 Teléfono", escapeHtml(cliente_telefono || "-"), true),
  ].join("");

  const ctaHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">
      <tr>
        <td align="left">
          <a href="https://servitaxitortuguero.com/taxista/panel" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:14px;line-height:1;font-weight:700;padding:14px 18px;border-radius:12px;">
            Ver solicitudes
          </a>
        </td>
      </tr>
    </table>
  `;

  return buildEmailShell({
    headerTitle: "🚖 Nueva solicitud de viaje",
    headerColor: "#dc2626",
    introTitle: nombre ? `Hola ${escapeHtml(nombre)},` : "Nueva solicitud pendiente",
    introText: "Hay una nueva solicitud de viaje con estos datos:",
    detailRows,
    ctaHtml,
  });
}

function buildClientText({
  cliente_nombre,
  origen,
  destino,
  fecha_hora,
  tipo_servicio,
  metodo_pago,
  pasajeros,
}) {
  const fh = formatFechaHora(fecha_hora);

  return [
    `Hola ${cliente_nombre},`,
    "",
    "Tu reserva ha sido registrada correctamente.",
    "",
    `Origen: ${origen}`,
    `Destino: ${destino}`,
    `Fecha: ${fh.fecha}`,
    `Hora: ${fh.hora}`,
    `Servicio: ${tipo_servicio}`,
    `Pago: ${metodo_pago}`,
    `Pasajeros: ${pasajeros ?? "-"}`,
    "",
    "ServiTaxi Tortuguero · Tortuguero, Nicaragua",
  ].join("\n");
}

function buildTaxistaText({
  nombre,
  origen,
  destino,
  fecha_hora,
  pasajeros,
  cliente_nombre,
  cliente_telefono,
}) {
  const fh = formatFechaHora(fecha_hora);

  return [
    nombre ? `Hola ${nombre},` : "Nueva solicitud pendiente",
    "",
    "Hay una nueva solicitud de viaje.",
    "",
    `Origen: ${origen}`,
    `Destino: ${destino}`,
    `Fecha: ${fh.fecha}`,
    `Hora: ${fh.hora}`,
    `Pasajeros: ${pasajeros ?? "-"}`,
    `Cliente: ${cliente_nombre}`,
    `Teléfono: ${cliente_telefono || "-"}`,
    "",
    "Ver solicitudes: https://servitaxitortuguero.com/taxista/panel",
    "",
    "ServiTaxi Tortuguero · Tortuguero, Nicaragua",
  ].join("\n");
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
      await resend.emails.send({
        from: "ServiTaxi Tortuguero <reservas@servitaxitortuguero.com>",
        to: normalizedClientEmail,
        subject: "Confirmación de reserva – ServiTaxi Tortuguero",
        html: buildClientHtml({
          cliente_nombre,
          origen,
          destino,
          fecha_hora,
          tipo_servicio,
          metodo_pago,
          pasajeros,
        }),
        text: buildClientText({
          cliente_nombre,
          origen,
          destino,
          fecha_hora,
          tipo_servicio,
          metodo_pago,
          pasajeros,
        }),
        attachments,
      });
    }

    const { data: taxistas, error: taxistasError } = await supabaseAdmin
      .from("taxistas")
      .select("email, nombre")
      .eq("activo", true);

    if (!taxistasError && Array.isArray(taxistas) && taxistas.length > 0) {
      await Promise.all(
        taxistas.map(async (taxista) => {
          try {
            await resend.emails.send({
              from: "ServiTaxi Tortuguero <reservas@servitaxitortuguero.com>",
              to: taxista.email,
              subject: `Nueva solicitud de taxi — ${origen} → ${destino}`,
              html: buildTaxistaHtml({
                nombre: taxista.nombre,
                origen,
                destino,
                fecha_hora,
                pasajeros,
                cliente_nombre,
                cliente_telefono,
              }),
              text: buildTaxistaText({
                nombre: taxista.nombre,
                origen,
                destino,
                fecha_hora,
                pasajeros,
                cliente_nombre,
                cliente_telefono,
              }),
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