const INSTAGRAM_URL = "https://www.instagram.com/egitimgurmesi.akademi/";

export function FloatingInstagramLink() {
  return (
    <a
      className="ega-instagram-float"
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Eğitim Gurmesi Akademi Instagram sayfasını aç"
      title="Instagram"
    >
      <svg
        className="ega-instagram-float__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.25" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.35" cy="6.7" r="1.2" className="ega-instagram-float__dot" />
      </svg>
    </a>
  );
}
