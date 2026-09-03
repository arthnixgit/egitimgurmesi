"use client";

import Link from "next/link";

export default function FreeMaterialsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="ega-section ega-container">
      <div className="ega-free-material-state" role="alert">
        <h1>Bu materyal şu anda açılamıyor.</h1>
        <p>İçerik bağlantısı kontrol ediliyor. Lütfen kısa süre sonra tekrar deneyin.</p>
        <div className="ega-free-material-state__actions">
          <button type="button" className="ega-button" onClick={reset}>
            Tekrar Dene
          </button>
          <Link className="ega-button ega-button--ghost" href="/ucretsiz-materyaller">
            Ücretsiz Materyaller
          </Link>
        </div>
      </div>
    </main>
  );
}