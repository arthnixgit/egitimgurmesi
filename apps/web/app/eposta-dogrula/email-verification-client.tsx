"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { confirmEmailVerification, requestEmailVerification } from "../../lib/auth-client";

type EmailVerificationClientProps = {
  token: string;
  initialEmail: string;
};

export function EmailVerificationClient({
  token,
  initialEmail
}: EmailVerificationClientProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(token ? "Doğrulama bağlantısı kontrol ediliyor..." : "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    async function verify() {
      setLoading(true);
      setError("");

      try {
        const response = await confirmEmailVerification(token);

        if (!active) {
          return;
        }

        setMessage(response.message);
      } catch (verificationError) {
        if (!active) {
          return;
        }

        setError(
          verificationError instanceof Error
            ? verificationError.message
            : "Doğrulama tamamlanamadı."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void verify();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await requestEmailVerification({ email });
      setMessage(response.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Doğrulama bağlantısı gönderilemedi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="ega-auth-shell">
      <section className="ega-auth-card">
        <div className="ega-pill ega-pill--warm">E-posta Doğrulama</div>
        <h1>E-posta adresini doğrula</h1>
        <p>
          Kayıt sonrasında hesabını aktif etmek için doğrulama bağlantısını kullan.
          Bağlantının süresi dolduysa aşağıdan yeniden isteyebilirsin.
        </p>

        {message ? <div className="ega-message ega-message--success">{message}</div> : null}
        {error ? <div className="ega-message ega-message--error">{error}</div> : null}

        {!token ? (
          <form className="ega-form" onSubmit={handleResend}>
            <div className="ega-field">
              <label htmlFor="verification-email">E-posta</label>
              <input
                id="verification-email"
                className="ega-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <button className="ega-button" type="submit" disabled={submitting}>
              {submitting ? "Gönderiliyor..." : "Yeni doğrulama bağlantısı gönder"}
            </button>
          </form>
        ) : loading ? (
          <div className="ega-inline-note">Bağlantı doğrulanıyor...</div>
        ) : null}

        <div className="ega-inline-links ega-inline-links--stacked">
          <Link href="/giris">Giriş sayfasına dön</Link>
          <Link href="/sifremi-unuttum">Şifremi unuttum</Link>
        </div>
      </section>
    </main>
  );
}
