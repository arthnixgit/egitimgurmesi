export default function AdminHomePage() {
  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand__mark">EGA</div>
          <div>
            <strong style={{ display: "block" }}>Eğitim Gurmesi Akademi Yönetim</strong>
            <span style={{ color: "var(--admin-muted)" }}>Ayrı giriş alanı ve rol tabanlı operasyon merkezi</span>
          </div>
        </div>

        <span className="admin-badge">RBAC Taslağı Kilitlendi</span>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <span className="admin-badge">Yetki Katmanı</span>
          <h1>Giriş alanı kullanıcı tarafından görülen yüzeyden ayrıldı.</h1>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
            Bu uygulama, <code>yonetim.&lt;alanadi&gt;</code> altında çalışacak yönetim paneli için başlangıç iskeletidir.
            Personel erişimi, public kullanıcı auth akışından ayrı tutulacaktır.
          </p>

          <div className="admin-list">
            <div className="admin-list__item">Super-admin tüm rol ve secret yönetimine sahiptir.</div>
            <div className="admin-list__item">Admin günlük içerik, katalog ve sipariş operasyonunu yürütür.</div>
            <div className="admin-list__item">Accounting ödeme ve reconciliation akışlarını taşır.</div>
            <div className="admin-list__item">Technician entegrasyon, webhook ve altyapı sağlığını yönetir.</div>
          </div>
        </section>

        <section className="admin-card">
          <span className="admin-badge">İlk Modüller</span>
          <div className="admin-stat-grid">
            <div className="admin-stat">
              <strong>Ürün</strong>
              <span>Katalog, fiyat, görünürlük ve kampanya yönetimi</span>
            </div>
            <div className="admin-stat">
              <strong>Sipariş</strong>
              <span>Yerel ödeme akışı ve Unikazan yönlendirme takibi</span>
            </div>
            <div className="admin-stat">
              <strong>LMS</strong>
              <span>Ders modülleri, video erişimi ve yayın yönetimi</span>
            </div>
          </div>

          <div className="admin-list">
            <div className="admin-list__item">Audit log ve rol matrisi başlangıçtan itibaren zorunlu olacak.</div>
            <div className="admin-list__item">Teknik ekranlar ile finans ekranları aynı role açılmayacak.</div>
            <div className="admin-list__item">Unikazan entegrasyonu yönetim panelinde ayrı izleme alanı alacak.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
