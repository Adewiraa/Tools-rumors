import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gosball Media Tools",
  description:
    "Matchday line-up and transfer rumor story generator for Indonesian football media.",
  icons: {
    icon: "/gosball-logo.svg",
    shortcut: "/gosball-logo.svg",
    apple: "/gosball-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
