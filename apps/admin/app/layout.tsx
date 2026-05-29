import type { Metadata } from "next";
import { AdminFrame } from "./admin-frame";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eğitim Gurmesi Akademi Yönetim",
  description: "Eğitim Gurmesi Akademi içerik, ürün, medya ve operasyon yönetim paneli."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <AdminFrame>{children}</AdminFrame>
      </body>
    </html>
  );
}
