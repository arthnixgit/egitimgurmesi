const WHATSAPP_URL =
  "https://wa.me/905000000000?text=Merhaba%2C%20paketler%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.";

export function FloatingWhatsAppLink() {
  return (
    <a
      className="ega-whatsapp-float"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Eğitim Gurmesi Akademi WhatsApp hattını aç"
      title="WhatsApp"
    >
      <svg
        className="ega-whatsapp-float__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12 3.2a8.7 8.7 0 0 0-7.45 13.2L3.5 20.5l4.22-1.03A8.7 8.7 0 1 0 12 3.2Z" />
        <path d="M9.12 8.42c-.18-.4-.37-.4-.55-.41h-.47c-.17 0-.45.06-.68.31-.24.25-.91.89-.91 2.17 0 1.28.93 2.52 1.06 2.69.12.17 1.8 2.9 4.44 3.95 2.18.87 2.63.7 3.1.66.47-.05 1.52-.62 1.74-1.22.22-.6.22-1.11.15-1.22-.06-.11-.23-.17-.47-.29-.24-.12-1.41-.7-1.63-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.17-.28.19-.52.07-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.18-1.4-1.32-1.64-.14-.24-.01-.36.1-.48.1-.1.24-.28.36-.42.12-.14.16-.24.24-.41.08-.17.04-.31-.02-.43-.06-.12-.53-1.28-.74-1.76Z" />
      </svg>
    </a>
  );
}
