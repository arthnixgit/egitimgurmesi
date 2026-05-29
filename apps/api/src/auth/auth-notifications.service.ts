import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { appEnv } from "../config/env";

type PreviewDeliveryResult = {
  mode: "preview";
  previewUrl: string;
};

type SentDeliveryResult = {
  mode: "sent";
  provider: "smtp";
  messageId: string;
};

export type AuthDeliveryResult = PreviewDeliveryResult | SentDeliveryResult;

type DeliveryPayload = {
  email: string;
  firstName: string;
  actionUrl: string;
  subject: string;
  preheader: string;
  heading: string;
  intro: string;
  actionLabel: string;
  footerNote: string;
};

@Injectable()
export class AuthNotificationsService {
  private readonly logger = new Logger(AuthNotificationsService.name);
  private transporterPromise: Promise<Transporter> | null = null;

  async sendEmailVerification(input: {
    email: string;
    firstName: string;
    verificationUrl: string;
  }): Promise<AuthDeliveryResult> {
    return this.send({
      email: input.email,
      firstName: input.firstName,
      actionUrl: input.verificationUrl,
      subject: "E-posta adresini doğrula",
      preheader: "Hesabını etkinleştirmek için e-posta adresini doğrula.",
      heading: "E-posta adresini doğrula",
      intro: "Eğitim Gurmesi hesabını kullanmaya başlamak için aşağıdaki bağlantıyla e-posta adresini doğrula.",
      actionLabel: "E-postamı Doğrula",
      footerNote: "Bu isteği sen başlatmadıysan bu e-postayı yok sayabilirsin."
    });
  }

  async sendPasswordReset(input: {
    email: string;
    firstName: string;
    resetUrl: string;
  }): Promise<AuthDeliveryResult> {
    return this.send({
      email: input.email,
      firstName: input.firstName,
      actionUrl: input.resetUrl,
      subject: "Şifre sıfırlama bağlantın hazır",
      preheader: "Şifreni güvenli şekilde yenilemek için bağlantıyı kullan.",
      heading: "Şifreni yenile",
      intro: "Şifreni sıfırlamak için aşağıdaki bağlantıyı kullan. Güvenlik için bu bağlantı sınırlı süreyle geçerlidir.",
      actionLabel: "Şifremi Yenile",
      footerNote: "Şifre yenileme talebi oluşturmadıysan hesabın için mevcut şifren geçerli kalır."
    });
  }

  private async send(payload: DeliveryPayload): Promise<AuthDeliveryResult> {
    const provider = appEnv.emailProvider();

    if (provider !== "smtp") {
      return this.sendPreview(payload.email, payload.actionUrl);
    }

    const transporter = await this.getTransporter();
    const fromName = appEnv.emailFromName().replace(/"/g, "");
    const from = `"${fromName}" <${appEnv.emailFrom()}>`;
    const replyTo = appEnv.emailReplyTo() || undefined;
    const html = this.renderHtml(payload);
    const text = this.renderText(payload);

    const result = await transporter.sendMail({
      from,
      to: payload.email,
      replyTo,
      subject: payload.subject,
      text,
      html
    });

    this.logger.log(`Auth email sent to ${payload.email} via SMTP: ${result.messageId}`);

    return {
      mode: "sent",
      provider: "smtp",
      messageId: result.messageId
    };
  }

  private async getTransporter() {
    if (!this.transporterPromise) {
      this.transporterPromise = this.createTransporter();
    }

    return this.transporterPromise;
  }

  private async createTransporter() {
    const host = appEnv.smtpHost();
    const port = appEnv.smtpPort();
    const secure = appEnv.smtpSecure();
    const user = appEnv.smtpUser();
    const password = appEnv.smtpPassword();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: password } : undefined
    });

    await transporter.verify();
    this.logger.log(`SMTP transporter verified on ${host}:${port}`);

    return transporter;
  }

  private sendPreview(email: string, actionUrl: string): PreviewDeliveryResult {
    this.logger.log(`Auth email preview for ${email}: ${actionUrl}`);

    return {
      mode: "preview",
      previewUrl: actionUrl
    };
  }

  private renderText(payload: DeliveryPayload) {
    return [
      `Merhaba ${payload.firstName},`,
      "",
      payload.intro,
      "",
      `${payload.actionLabel}: ${payload.actionUrl}`,
      "",
      payload.footerNote,
      "",
      "Eğitim Gurmesi Akademi"
    ].join("\n");
  }

  private renderHtml(payload: DeliveryPayload) {
    const safeName = this.escapeHtml(payload.firstName);
    const safeHeading = this.escapeHtml(payload.heading);
    const safeIntro = this.escapeHtml(payload.intro);
    const safeActionLabel = this.escapeHtml(payload.actionLabel);
    const safeFooter = this.escapeHtml(payload.footerNote);
    const safeActionUrl = this.escapeHtml(payload.actionUrl);
    const safePreheader = this.escapeHtml(payload.preheader);

    return `
<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeHeading}</title>
  </head>
  <body style="margin:0;background:#eff7fb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#183153;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse;border-radius:28px;overflow:hidden;background:linear-gradient(180deg,#ffffff 0%,#f5fbff 100%);box-shadow:0 24px 60px rgba(12,45,88,0.12);">
            <tr>
              <td style="padding:40px 40px 28px;background:linear-gradient(135deg,#0c7896 0%,#31b7b7 100%);color:#ffffff;">
                <div style="display:inline-block;padding:10px 16px;border-radius:999px;background:rgba(255,255,255,0.18);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Eğitim Gurmesi Akademi</div>
                <h1 style="margin:20px 0 12px;font-size:34px;line-height:1.08;font-weight:800;">${safeHeading}</h1>
                <p style="margin:0;font-size:16px;line-height:1.7;max-width:460px;">Merhaba ${safeName}, ${safeIntro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 18px;">
                <div style="text-align:center;">
                  <a href="${safeActionUrl}" style="display:inline-block;padding:16px 30px;border-radius:999px;background:linear-gradient(135deg,#0f7d95 0%,#2fb9b7 100%);color:#ffffff;font-weight:800;font-size:16px;text-decoration:none;box-shadow:0 14px 30px rgba(15,125,149,0.25);">${safeActionLabel}</a>
                </div>
                <p style="margin:24px 0 0;color:#4f6988;font-size:14px;line-height:1.7;text-align:center;">Bağlantı açılmazsa aşağıdaki adresi tarayıcına yapıştırabilirsin:</p>
                <p style="margin:8px 0 0;color:#0c7896;font-size:13px;line-height:1.7;word-break:break-all;text-align:center;">${safeActionUrl}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 36px;">
                <div style="height:1px;background:#d7e6f2;"></div>
                <p style="margin:20px 0 0;color:#5f7898;font-size:13px;line-height:1.7;">${safeFooter}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}
