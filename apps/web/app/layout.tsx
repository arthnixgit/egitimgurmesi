import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eğitim Gurmesi Akademi",
  description:
    "Lise ve sınav hazırlık öğrencileri için kayıtlı video paketleri ve koçluk programları."
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
