"use client";

import { useEffect, useState } from "react";

export default function AdminErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("Admin panel error", error);
  }, [error]);

  return (
    <main className="admin-shell">
      <section className="admin-card">
        <span className="admin-badge admin-badge--warm">Panel Hatası</span>
        <h1>Bu alan şu anda yüklenemedi.</h1>
        <p>
          Oturumunuz korunuyor. Sayfayı tekrar deneyebilir veya farklı bir yönetim alanına geçebilirsiniz.
        </p>
        <div className="admin-actions">
          <button className="admin-button" type="button" onClick={reset}>
            Tekrar Dene
          </button>
          <button className="admin-button--ghost" type="button" onClick={() => setShowDetails((current) => !current)}>
            {showDetails ? "Teknik detayı gizle" : "Teknik detayı göster"}
          </button>
        </div>
        {showDetails ? (
          <pre className="admin-message admin-message--error" style={{ whiteSpace: "pre-wrap" }}>
            {error.message}
            {error.digest ? `\nDigest: ${error.digest}` : ""}
          </pre>
        ) : null}
      </section>
    </main>
  );
}
