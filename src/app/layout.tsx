import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GARUDA MATCHROOM — Admin Media Sepak Bola Indonesia",
  description: "Dashboard operasional admin dan editor media sepak bola Indonesia. Kelola lineup, hasil pertandingan, rumor transfer, master klub, dan master pemain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
