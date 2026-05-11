"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { loginStaff, saveStaffTokens } from "../../lib/auth-client";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginStaff({ email, password });
      saveStaffTokens(response);
      router.push("/icerik");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Giriş sırasında beklenmeyen bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-auth-shell">
      <section className="admin-card">
        <span className="admin-badge">Personel Girişi</span>
        <h1>Yönetim paneline giriş yap</h1>
        <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
          Bu ekran `POST /auth/staff/login` endpoint’ine bağlıdır ve yalnızca aktif personel
          hesaplarını kabul eder.
        </p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              className="admin-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              className="admin-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <div className="admin-message admin-message--error">{error}</div> : null}

          <button className="admin-button" type="submit" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div style={{ marginTop: 18 }}>
          <Link className="admin-button--ghost" href="/kurulum">
            İlk kurulum sayfasına git
          </Link>
        </div>
      </section>
    </main>
  );
}
