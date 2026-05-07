import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display"
});

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
      <body
        className={`${bodyFont.variable} ${displayFont.variable}`}
        style={{
          fontFamily: "var(--font-body)"
        }}
      >
        {children}
      </body>
    </html>
  );
}
