import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
      origen,
      destino,
      fecha_hora,
      tipo_servicio,
      metodo_pago,
    } = req.body || {};

    if (
      !cliente_nombre ||
      !cliente_email ||
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

    const html = `
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
      to: cliente_email,
      subject: "Confirmación de reserva – ServiTaxi Tortuguero",
      html,
      attachments,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      message: error?.message || "Internal Server Error",
    });
  }
}