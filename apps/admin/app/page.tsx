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
              Yetki kontrollü içerik ve operasyon kontrol merkezi
            </span>
          </div>
        </div>

        <span className="admin-badge">Ayrı domain için hazır panel</span>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <span className="admin-badge">Durum</span>
          <h1>Yönetim paneli çekirdeği aktif</h1>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
            Personel auth, permission guard ve ilk CMS içerik ekranları aynı akış üzerinde çalışıyor.
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
                <strong>Yetkiler</strong>
                <div>{overview?.permissionKeys.length ?? 0} adet</div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="admin-card">
          <span className="admin-badge">Hızlı Erişim</span>
          <div className="admin-stat-grid">
            <div className="admin-stat">
              <strong>CMS Studio</strong>
              <span>Navigation, pages, staff, success, free materials</span>
            </div>
            <div className="admin-stat">
              <strong>Commerce Core</strong>
              <span>Products, categories, variants and order visibility</span>
            </div>
            <div className="admin-stat">
              <strong>Guard Check</strong>
              <span>{overview ? "dashboard.read geçti" : "Henüz test edilmedi"}</span>
            </div>
            <div className="admin-stat">
              <strong>Content Permission</strong>
              <span>
                {overview?.permissionKeys.includes("cms.manage") ? "cms.manage aktif" : "Yetki bekleniyor"}
              </span>
            </div>
          </div>

          <div className="admin-list">
            <div className="admin-list__item">
              Public web ile aynı CMS tablolarına bağlı ilk içerik yönetim ekranları hazır.
            </div>
            <div className="admin-list__item">
              Sonraki adım ürün, kategori ve sipariş omurgasını gerçek admin modüllerine taşımak.
            </div>
          </div>

          <div className="admin-actions" style={{ marginTop: 20 }}>
            <Link className="admin-button" href="/icerik">
              İçerik Stüdyosu
            </Link>
            <Link className="admin-button" href="/ticaret">
              Ticaret Merkezi
            </Link>
            <Link className="admin-button--ghost" href="/giris">
              Başka Hesapla Giriş
            </Link>
            {staff?.staffUser ? (
              <button className="admin-button--ghost" type="button" onClick={handleLogout}>
                Çıkış Yap
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
