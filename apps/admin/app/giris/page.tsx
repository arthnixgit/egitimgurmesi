"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { loginStaff, saveStaffTokens } from "../../lib/auth-client";

const loginHighlights = [
  "İçerik, ürün, medya ve lead yönetimi tek panelde",
  "Sol menüden modül seç, içeride sayfa veya kayıt seç",
  "Kaydetmeden önce hangi alanı değiştirdiğini net gör"
] as const;

const modulePreview = [
  { label: "İçerik", text: "Ana sayfa, navbar, akademik kadro, ücretsiz materyaller" },
  { label: "Ticaret", text: "Paketler, kategoriler, fiyatlar ve siparişler" },
  { label: "Medya", text: "Görsel, PDF, video ve Google Drive bağlantıları" }
] as const;

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
      router.push("/");
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
          <span className="admin-badge admin-badge--warm">Yönetim Paneli</span>
          <h1>Website yönetimini tek, sade ve yönlendiren panelde topla.</h1>
          <p>
            Bu panel teknik kullanıcılar için değil; içerik, satış ve operasyon ekibinin her gün
            rahat kullanması için düzenlendi.
          </p>
        </div>

        <div className="admin-login-highlights">
          {loginHighlights.map((item) => (
            <div key={item} className="admin-login-highlight">
              <span>✓</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>

        <div className="admin-login-module-preview">
          {modulePreview.map((module) => (
            <article key={module.label}>
              <strong>{module.label}</strong>
              <span>{module.text}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-login-card">
        <span className="admin-badge">Personel girişi</span>
        <h2>Paneline giriş yap</h2>
        <p>
          Giriş yaptıktan sonra sol menüden modül seçebilir, ilgili sayfa veya kaydı düzenleyebilirsin.
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
