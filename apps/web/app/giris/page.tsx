"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { loginUser, saveUserTokens } from "../../lib/auth-client";

export default function LoginPage() {
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
      const response = await loginUser({ email, password });
      saveUserTokens(response);
      router.push("/hesabim");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Giriş yapılırken beklenmeyen bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ega-auth-shell">
      <section className="ega-auth-card">
        <div className="ega-pill">Öğrenci Girişi</div>
        <h1 style={{ fontFamily: "var(--font-display)" }}>Hesabına giriş yap</h1>
        <p>Satın aldığın ürünleri, hesap bilgilerini ve erişim durumunu bu alandan yönetebilirsin.</p>

        <form className="ega-form" onSubmit={handleSubmit}>
          <div className="ega-field">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              className="ega-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="ega-field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              className="ega-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <div className="ega-message ega-message--error">{error}</div> : null}

          <button className="ega-button" type="submit" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div style={{ marginTop: 18 }} className="ega-inline-note">
          Hesabın yok mu? <Link href="/kayit">Kayıt ol</Link>
        </div>
      </section>
    </main>
  );
}
