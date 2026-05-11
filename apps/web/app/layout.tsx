import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EĞİTİM GURMESİ AKADEMİ",
    template: "%s | EĞİTİM GURMESİ AKADEMİ"
  },
  description: "Lise ve sınav hazırlık öğrencileri için kayıtlı video paketleri ve koçluk programları.",
  applicationName: "EĞİTİM GURMESİ AKADEMİ",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
