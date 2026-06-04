"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { loginStaff, saveStaffTokens } from "../../lib/auth-client";
import { getStaffDefaultRoute } from "../../lib/role-routing";

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
      router.push(
        getStaffDefaultRoute({
          roleKeys: response.staffUser.roleKeys,
          permissionKeys: response.staffUser.permissionKeys
        })
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message
          : "Giriş sırasında beklenmeyen bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-hero">
        <div className="admin-login-hero__brand">
          <span>EGA</span>
          <strong>Eğitim Gurmesi Akademi</strong>
        </div>

        <div>
          <span className="admin-badge admin-badge--warm">Güvenli Personel Girişi</span>
          <h1>Eğitim operasyonunu yetkine göre yönet.</h1>
          <p>
            Giriş yaptıktan sonra yalnızca rolüne uygun panel, işlemler ve yönetim alanları açılır.
          </p>
        </div>

        <div className="admin-login-highlights">
          {["Rol bazlı panel", "Şube ve ekip kapsamı", "Güvenli yönetim erişimi"].map((item) => (
            <div key={item} className="admin-login-highlight">
              <span>✓</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-login-card">
        <span className="admin-badge">Personel girişi</span>
        <h2>Hesabına giriş yap</h2>
        <p>
          Yetki kapsamına göre yönetim paneline yönlendirileceksin.
        </p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label htmlFor="email">E-posta adresi</label>
            <input
              id="email"
              className="admin-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="ornek@egitimgurmesi.com"
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
              autoComplete="current-password"
              placeholder="Şifreni gir"
              required
            />
          </div>

          {error ? <div className="admin-message admin-message--error">{error}</div> : null}

          <button className="admin-button admin-button--wide" type="submit" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Yönetim paneline gir"}
          </button>
        </form>

        <div className="admin-login-card__footer">
          <span>İlk kurulum henüz yapılmadıysa:</span>
          <Link href="/kurulum">Super-admin kurulumu</Link>
        </div>
      </section>
    </main>
  );
}
