import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

type EmailMessage = { to: { email: string; name?: string }[]; subject: string; html: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

export class EmailService {
  async send(message: EmailMessage) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !senderEmail) {
      logger.warn("Brevo is not configured; email queued for later retry", { subject: message.subject });
      return { delivered: false, reason: "not_configured" } as const;
    }
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "content-type": "application/json", "api-key": apiKey },
        body: JSON.stringify({
          sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME ?? "Rinconcito del Sabor" },
          to: message.to,
          subject: message.subject,
          htmlContent: message.html
        })
      });
      if (!response.ok) throw new Error(`Brevo responded ${response.status}`);
      return { delivered: true } as const;
    } catch (error) {
      logger.error("Brevo delivery failed", { error: error instanceof Error ? error.message : String(error) });
      return { delivered: false, reason: "provider_error" } as const;
    }
  }

  passwordReset(name: string, email: string, token: string) {
    const url = `${getServerEnv().APP_URL}/personal/restablecer?token=${encodeURIComponent(token)}`;
    return this.send({
      to: [{ email, name }],
      subject: "Restablece tu contraseña",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#1d2420"><h1 style="color:#276146">Rinconcito del Sabor</h1><p>Hola ${name}, recibimos una solicitud para restablecer tu contraseña.</p><a href="${url}" style="display:inline-block;background:#e45d2f;color:white;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:700">Crear nueva contraseña</a><p style="color:#66736c">Este enlace es de un solo uso y vence pronto.</p></div>`
    });
  }

  deliveryConsent(input: { recipientName: string; recipientEmail: string; senderName: string; consentToken: string }) {
    const url = `${getServerEnv().APP_URL}/delivery/confirmar#token=${encodeURIComponent(input.consentToken)}`;
    const recipientName = escapeHtml(input.recipientName);
    const senderName = escapeHtml(input.senderName);
    return this.send({
      to: [{ email: input.recipientEmail, name: input.recipientName }],
      subject: "Confirma si deseas recibir este pedido",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#1d2420"><h1 style="color:#276146">Rinconcito del Sabor</h1><p>Hola ${recipientName}, ${senderName} quiere enviarte un pedido.</p><p>Por seguridad, el restaurante no lo enviará a cocina hasta que tú lo aceptes. El enlace es de un solo uso y vence en 30 minutos.</p><a href="${url}" style="display:inline-block;background:#e45d2f;color:white;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:700">Revisar y confirmar</a><p style="color:#66736c">Si no conoces a esta persona o no solicitaste el pedido, recházalo desde el enlace o ignora este mensaje.</p></div>`
    });
  }
}

export const emailService = new EmailService();
