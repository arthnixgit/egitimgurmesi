"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearStaffTokens,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  fetchStaffOverview,
  logoutStaff
} from "../lib/auth-client";

type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;
type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;

export default function AdminHomePage() {
  const router = useRouter();
  const [bootstrapRequired, setBootstrapRequired] = useState<boolean | null>(null);
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [overview, setOverview] = useState<StaffOverviewResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const bootstrapStatus = await fetchBootstrapStatus();

        if (!active) {
          return;
        }

        setBootstrapRequired(bootstrapStatus.requiresBootstrap);

        if (bootstrapStatus.requiresBootstrap) {
          setLoading(false);
          return;
        }

        const [staffResponse, overviewResponse] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview()
        ]);

        if (!active) {
          return;
        }

        setStaff(staffResponse);
        setOverview(overviewResponse);
        setError("");
      } catch (requestError) {
        if (!active) {
          return;
        }

        clearStaffTokens();
        setStaff(null);
        setOverview(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Yönetim verileri yüklenemedi."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await logoutStaff();
    router.push("/giris");
  }

  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand__mark">EGA</div>
          <div>
            <strong style={{ display: "block" }}>Eğitim Gurmesi Akademi Yönetim</strong>
            <span style={{ color: "var(--admin-muted)" }}>
              Personel girişi ve yetki kontrollü yönetim alanı
            </span>
          </div>
        </div>

        <span className="admin-badge">API Auth Bağlantısı Aktif</span>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <span className="admin-badge">Durum</span>
          <h1>Yönetim erişimi artık gerçek endpoint’lere bağlı.</h1>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
            Bu ekran bootstrap durumu, personel auth ve permission guard sonucu ile davranır.
          </p>

          {loading ? <div className="admin-message admin-message--success">Durum yükleniyor...</div> : null}
          {error ? <div className="admin-message admin-message--error">{error}</div> : null}

          {!loading && bootstrapRequired ? (
            <div className="admin-actions" style={{ marginTop: 20 }}>
              <Link className="admin-button" href="/kurulum">
                İlk Super-Admin Kurulumu
              </Link>
            </div>
          ) : null}

          {!loading && bootstrapRequired === false && !staff ? (
            <div className="admin-actions" style={{ marginTop: 20 }}>
              <Link className="admin-button" href="/giris">
                Personel Girişi
              </Link>
            </div>
          ) : null}

          {staff?.staffUser ? (
            <div className="admin-summary">
              <div className="admin-list__item">
                <strong>
                  {staff.staffUser.firstName} {staff.staffUser.lastName}
                </strong>
                <div>{staff.staffUser.email}</div>
              </div>
              <div className="admin-list__item">
                <strong>Roller</strong>
                <div>{staff.staffUser.roleKeys.join(", ")}</div>
              </div>
              <div className="admin-list__item">
                <strong>Permission sayısı</strong>
                <div>{overview?.permissionKeys.length ?? 0}</div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="admin-card">
          <span className="admin-badge">İlk Yetki Testi</span>
          <div className="admin-stat-grid">
            <div className="admin-stat">
              <strong>Bootstrap</strong>
              <span>{bootstrapRequired ? "Gerekli" : "Tamamlandı"}</span>
            </div>
            <div className="admin-stat">
              <strong>Staff Access</strong>
              <span>{staff?.staffUser ? "Aktif" : "Giriş bekleniyor"}</span>
            </div>
            <div className="admin-stat">
              <strong>Guard Check</strong>
              <span>{overview ? "dashboard.read geçti" : "Henüz çalışmadı"}</span>
            </div>
          </div>

          <div className="admin-list">
            <div className="admin-list__item">
              `GET /staff/overview` artık permission guard ile korunuyor.
            </div>
            <div className="admin-list__item">
              İlk super-admin hesabı yoksa kurulum sayfası açılır.
            </div>
            <div className="admin-list__item">
              Personel oturumu access/refresh token akışı ile dönüyor.
            </div>
          </div>

          {staff?.staffUser ? (
            <div className="admin-actions" style={{ marginTop: 20 }}>
              <button className="admin-button" type="button" onClick={handleLogout}>
                Çıkış Yap
              </button>
              <Link className="admin-button--ghost" href="/giris">
                Başka Hesapla Giriş
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
