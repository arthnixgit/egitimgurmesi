"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { requestPasswordReset } from "../../lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await requestPasswordReset({ email });
      setMessage(response.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Şifre yenileme isteği başlatılamadı."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="ega-auth-shell">
      <section className="ega-auth-card">
        <div className="ega-pill">Şifre Yenileme</div>
        <h1>Şifremi unuttum</h1>
        <p>
          Hesabına bağlı e-posta adresini yaz. Kayıtlıysa yeni şifre belirlemen için
          bağlantı gönderilir.
        </p>

        <form className="ega-form" onSubmit={handleSubmit}>
          <div className="ega-field">
            <label htmlFor="reset-email">E-posta</label>
            <input
              id="reset-email"
              className="ega-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {message ? <div className="ega-message ega-message--success">{message}</div> : null}
          {error ? <div className="ega-message ega-message--error">{error}</div> : null}

          <button className="ega-button" type="submit" disabled={submitting}>
            {submitting ? "Gönderiliyor..." : "Şifre yenileme bağlantısı gönder"}
          </button>
        </form>

        <div className="ega-inline-links ega-inline-links--stacked">
          <Link href="/giris">Giriş sayfasına dön</Link>
          <Link href="/eposta-dogrula">E-posta doğrulama</Link>
        </div>
      </section>
    </main>
  );
}
