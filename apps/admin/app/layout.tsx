import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eğitim Gurmesi Akademi Yönetim",
  description: "Ayrı domain üzerinde çalışacak yönetim paneli iskeleti."
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
