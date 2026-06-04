"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBetaReadiness, type BetaReadinessSummary } from "../../lib/admin-tenancy-client";

const setupSteps = [
  {
    title: "Gerçek kurum verisini hazırla",
    body: "Kurum, merkez, şube ve yetkili kullanıcıları gerçek bilgilerle girin."
  },
  {
    title: "Demo kayıtları ayır",
    body: "Test kayıtlarının public katalogda yayınlanmadığını kontrol edin."
  },
  {
    title: "Operasyonu test et",
    body: "Grup, canlı ders, duyuru ve rol panellerini gerçek akışla deneyin."
  },
  {
    title: "Rol izolasyonunu doğrula",
    body: "Her rolün yalnızca kendi yetki alanını gördüğünü doğrulayın."
  }
] as const;

export default function BetaReadinessPage() {
  const [summary, setSummary] = useState<BetaReadinessSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setSummary(await getBetaReadiness());
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Beta hazırlık durumu alınamadı."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const statusLabel = useMemo(() => {
    if (!summary) {
      return "Kontrol bekleniyor";
    }

    if (summary.readinessPercentage === 100) {
      return "Beta verisi hazır";
    }

    if (summary.readinessPercentage >= 70) {
      return "Kritik eksikler azaldı";
    }

    return "Beta verisi eksik";
  }, [summary]);

  const demoDataExists = Boolean(
    summary?.demoData &&
      (summary.demoData.staffCount > 0 ||
        summary.demoData.studentCount > 0 ||
        summary.demoData.organizationCount > 0 ||
        summary.demoData.productCount > 0 ||
        summary.demoData.announcementCount > 0 ||
        summary.demoData.liveSessionCount > 0)
  );

  return (
    <main className="admin-shell">
      <section className="admin-card admin-ops-hero">
        <div>
          <span className="admin-pill">Kurulum Kontrolü</span>
          <h1>Operasyon hazırlığını kontrol edin.</h1>
          <p>
            Kurum, şube, kullanıcı, grup, canlı ders, duyuru ve paket hazırlığını doğrulayın.
          </p>
        </div>
        <div className="admin-ops-role-card">
          <strong>{statusLabel}</strong>
          <span>{summary ? `%${summary.readinessPercentage}` : "Yükleniyor"}</span>
          <small>
            {summary
              ? `${summary.readyCount}/${summary.totalCount} kontrol tamam`
              : "Canlı sayımlar okunuyor"}
          </small>
        </div>
      </section>

      {error ? <div className="admin-message admin-message--error">{error}</div> : null}

      {summary?.demoData?.publicExposureRisk ? (
        <section className="admin-message admin-message--error">
          Public katalogda yayımlanmış demo paket veya aktif demo kategori bulundu. Canlı beta
          öncesinde bunları taslağa alın veya gerçek içerikle değiştirin.
        </section>
      ) : null}

      {demoDataExists ? (
        <section className="admin-card">
          <span className="admin-pill">Demo Veri Güvenliği</span>
          <h2>Demo kayıtlar güvenli şekilde ayrılıyor.</h2>
          <p>
            Demo veriler gerçek müşteri verisi değildir. Üretimde varsayılan olarak engellenir;
            demo şifreleri panelde gösterilmez.
          </p>
          <div className="admin-stat-grid admin-ops-stats">
            <article className="admin-stat">
              <strong>{summary?.demoData?.staffCount ?? 0}</strong>
              <span>Demo personel</span>
            </article>
            <article className="admin-stat">
              <strong>{summary?.demoData?.studentCount ?? 0}</strong>
              <span>Demo öğrenci</span>
            </article>
            <article className="admin-stat">
              <strong>{summary?.demoData?.productCount ?? 0}</strong>
              <span>Demo paket</span>
            </article>
            <article className="admin-stat">
              <strong>{summary?.demoData?.publicProductCount ?? 0}</strong>
              <span>Public demo paket</span>
            </article>
          </div>
        </section>
      ) : null}

      {loading ? (
        <section className="admin-card admin-saas-loading">
          <span className="admin-pill">Canlı Kontrol</span>
          <h2>Hazırlık durumu yükleniyor</h2>
          <p>Yetki kapsamınıza göre güncel sayımlar alınıyor.</p>
        </section>
      ) : null}

      {summary ? (
        <>
          <section className="admin-stat-grid admin-ops-stats">
            {summary.items.map((item) => (
              <article className="admin-stat" key={item.key} data-ready={item.ready}>
                <strong>{item.count}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </section>

          <section className="admin-ops-grid">
            <article className="admin-card">
              <span className="admin-pill">Eksik Kontroller</span>
              <h2>Canlı beta öncesi tamamlanması gerekenler</h2>
              <div className="admin-stack">
                {summary.missingItems.length ? (
                  summary.missingItems.map((item) => (
                    <div className="admin-record-item" key={item.key}>
                      <div className="admin-record-item__top">
                        <strong>{item.label}</strong>
                        <span>Eksik</span>
                      </div>
                      <p>En az 1 kayıt eklenmeli.</p>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-state">
                    Zorunlu kontroller tamamlandı.
                  </div>
                )}
              </div>
              <div className="admin-toolbar admin-toolbar--split">
                <button className="admin-button" type="button" onClick={() => void load()}>
                  Tekrar Kontrol Et
                </button>
                <Link className="admin-button admin-button--ghost" href="/saas">
                  Kurum ve Şube Yönetimine Git
                </Link>
                <Link className="admin-button admin-button--ghost" href="/operasyon">
                  Operasyonu Aç
                </Link>
              </div>
            </article>

            <article className="admin-card">
              <span className="admin-pill">Kurulum Akışı</span>
              <h2>Beta verisini hazırlama sırası</h2>
              <div className="admin-stack">
                {setupSteps.map((step, index) => (
                  <div className="admin-record-item" key={step.title}>
                    <div className="admin-record-item__top">
                      <strong>
                        {index + 1}. {step.title}
                      </strong>
                      <span>Beta</span>
                    </div>
                    <p>{step.body}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </main>
  );
}
