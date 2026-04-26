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

function buildEmailShell({
  headerTitle,
  headerColor,
  introTitle,
  introText,
  detailRows,
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
  taxista_nombre,
  taxista_placa,
  taxista_color,
  taxista_telefono,
  origen,
  destino,
  fecha_hora,
}) {
  const fh = formatFechaHora(fecha_hora);
  const vehiculo = [taxista_color, taxista_placa].filter(Boolean).join(" · ") || "—";

  const detailRows = [
    buildDetailRow("🙍 Taxista", escapeHtml(taxista_nombre || "—")),
    buildDetailRow("🚖 Vehículo", escapeHtml(vehiculo)),
    buildDetailRow("📞 Teléfono del taxista", escapeHtml(taxista_telefono || "—")),
    buildDetailRow("📍 Origen", escapeHtml(origen || "—")),
    buildDetailRow("🏁 Destino", escapeHtml(destino || "—")),
    buildDetailRow("📅 Fecha", escapeHtml(fh.fecha)),
    buildDetailRow("🕐 Hora", escapeHtml(fh.hora), true),
  ].join("");

  return buildEmailShell({
    headerTitle: "ServiTaxi Tortuguero",
    headerColor: "#16a34a",
    introTitle: `Hola ${escapeHtml(cliente_nombre || "")},`,
    introText: "Tu viaje ya ha sido confirmado. Estos son los datos del taxista:",
    detailRows,
  });
}

function buildClientText({
  cliente_nombre,
  taxista_nombre,
  taxista_placa,
  taxista_color,
  taxista_telefono,
  origen,
  destino,
  fecha_hora,
}) {
  const fh = formatFechaHora(fecha_hora);
  const vehiculo = [taxista_color, taxista_placa].filter(Boolean).join(" · ") || "—";

  return [
    `Hola ${cliente_nombre || ""},`,
    "",
    "Tu viaje ya ha sido confirmado.",
    "",
    `Taxista: ${taxista_nombre || "—"}`,
    `Vehículo: ${vehiculo}`,
    `Teléfono del taxista: ${taxista_telefono || "—"}`,
    `Origen: ${origen || "—"}`,
    `Destino: ${destino || "—"}`,
    `Fecha: ${fh.fecha}`,
    `Hora: ${fh.hora}`,
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
      reserva_id,
      taxista_nombre,
      taxista_placa,
      taxista_color,
      taxista_telefono,
    } = req.body || {};

    if (!reserva_id) {
      return res.status(400).json({ message: "Missing reserva_id" });
    }

    const { data: reserva, error: reservaError } = await supabaseAdmin
      .from("reservas")
      .select("cliente_email, cliente_nombre, origen, destino, fecha_hora")
      .eq("id", reserva_id)
      .maybeSingle();

    if (reservaError) {
      return res.status(500).json({
        message: reservaError.message || "No se pudo buscar la reserva",
      });
    }

    if (!reserva) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    const clienteEmail = String(reserva.cliente_email || "").trim();

    if (!clienteEmail) {
      return res.status(200).json({ ok: true, skipped: true });
    }

    await resend.emails.send({
      from: "ServiTaxi Tortuguero <reservas@servitaxitortuguero.com>",
      to: clienteEmail,
      subject: "Tu taxista está en camino – ServiTaxi Tortuguero",
      html: buildClientHtml({
        cliente_nombre: reserva.cliente_nombre,
        taxista_nombre,
        taxista_placa,
        taxista_color,
        taxista_telefono,
        origen: reserva.origen,
        destino: reserva.destino,
        fecha_hora: reserva.fecha_hora,
      }),
      text: buildClientText({
        cliente_nombre: reserva.cliente_nombre,
        taxista_nombre,
        taxista_placa,
        taxista_color,
        taxista_telefono,
        origen: reserva.origen,
        destino: reserva.destino,
        fecha_hora: reserva.fecha_hora,
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      message: error?.message || "Internal Server Error",
    });
  }
}