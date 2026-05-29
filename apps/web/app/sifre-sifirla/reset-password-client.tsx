"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { confirmPasswordReset } from "../../lib/auth-client";

type ResetPasswordClientProps = {
  token: string;
};

export function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    if (!token) {
      setError("Şifre yenileme bağlantısı eksik.");
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifre tekrarı aynı olmalıdır.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await confirmPasswordReset({ token, password });
      setMessage(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Şifre güncellenemedi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="ega-auth-shell">
      <section className="ega-auth-card">
        <div className="ega-pill">Yeni şifre</div>
        <h1>Şifreni yenile</h1>
        <p>
          Güçlü bir yeni şifre belirle. En az 8 karakter, büyük harf, küçük harf ve
          rakam içermelidir.
        </p>

        <form className="ega-form" onSubmit={handleSubmit}>
          <div className="ega-field">
            <label htmlFor="new-password">Yeni şifre</label>
            <input
              id="new-password"
              className="ega-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="ega-field">
            <label htmlFor="confirm-password">Yeni şifre tekrar</label>
            <input
              id="confirm-password"
              className="ega-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          {message ? <div className="ega-message ega-message--success">{message}</div> : null}
          {error ? <div className="ega-message ega-message--error">{error}</div> : null}

          <button className="ega-button" type="submit" disabled={submitting}>
            {submitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>

        <div className="ega-inline-links ega-inline-links--stacked">
          <Link href="/giris">Giriş sayfasına dön</Link>
          <Link href="/sifremi-unuttum">Yeni bağlantı iste</Link>
        </div>
      </section>
    </main>
  );
}
