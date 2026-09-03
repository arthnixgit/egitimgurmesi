import Link from "next/link";

export default function FreeMaterialNotFound() {
  return (
    <main className="ega-section ega-container">
      <div className="ega-free-material-state">
        <h1>Ücretsiz materyal bulunamadı.</h1>
        <p>Bu materyal yayından kaldırılmış, arşivlenmiş veya adresi değişmiş olabilir.</p>
        <div className="ega-free-material-state__actions">
          <Link className="ega-button" href="/ucretsiz-materyaller">
            Ücretsiz Materyaller
          </Link>
        </div>
      </div>
    </main>
  );
}