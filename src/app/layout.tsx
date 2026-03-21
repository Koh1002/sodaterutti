import type { Metadata, Viewport } from "next";
import PwaSetup from "@/components/PwaSetup";
import "./globals.css";

export const metadata: Metadata = {
  title: "そだてるっち - キャラクター育成ゲーム",
  description: "かわいいキャラクターを育てて、進化させて、世代をつないでいく育成Webゲーム",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "そだてるっち",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F5EBE0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased font-body noise-overlay">
        {children}
        <PwaSetup />
      </body>
    </html>
  );
}
