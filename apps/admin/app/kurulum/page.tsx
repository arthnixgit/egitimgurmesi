"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { bootstrapStaff, fetchBootstrapStatus, saveStaffTokens } from "../../lib/auth-client";

export default function BootstrapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [requiresBootstrap, setRequiresBootstrap] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    bootstrapSecret: ""
  });

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetchBootstrapStatus();

        if (!active) {
          return;
        }

        setRequiresBootstrap(response.requiresBootstrap);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Bootstrap durumu alınamadı."
        );
      } finally {
        if (active) {
          setStatusLoading(false);
        }
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await bootstrapStaff(form);
      saveStaffTokens(response);
      router.push("/icerik");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Bootstrap sırasında beklenmeyen bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-auth-shell">
      <section className="admin-card">
        <span className="admin-badge">İlk Super-Admin Kurulumu</span>
        <h1>İlk personel hesabını oluştur</h1>
        <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
          Bu akış yalnızca sistemde hiç super-admin yoksa çalışır ve bootstrap secret gerektirir.
        </p>

        {statusLoading ? <div className="admin-message admin-message--success">Durum kontrol ediliyor...</div> : null}
        {error ? <div className="admin-message admin-message--error">{error}</div> : null}

        {requiresBootstrap === false ? (
          <div className="admin-summary">
            <div className="admin-list__item">
              Bootstrap artık kapalı. İlk yönetici hesabı zaten mevcut.
            </div>
            <Link className="admin-button--ghost" href="/giris">
              Giriş sayfasına git
            </Link>
          </div>
        ) : null}

        {requiresBootstrap ? (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="firstName">Ad</label>
                <input
                  id="firstName"
                  className="admin-input"
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="lastName">Soyad</label>
                <input
                  id="lastName"
                  className="admin-input"
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="email">E-posta</label>
                <input
                  id="email"
                  className="admin-input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="password">Şifre</label>
                <input
                  id="password"
                  className="admin-input"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="bootstrapSecret">Bootstrap Secret</label>
              <input
                id="bootstrapSecret"
                className="admin-input"
                type="password"
                value={form.bootstrapSecret}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bootstrapSecret: event.target.value }))
                }
                required
              />
            </div>

            <button className="admin-button" type="submit" disabled={loading}>
              {loading ? "Hesap oluşturuluyor..." : "Super-Admin Oluştur"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
