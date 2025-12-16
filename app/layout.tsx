import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["vietnamese", "latin"] });

export const metadata: Metadata = {
  title: "Chi tiêu nhà chung",
  description: "Quản lý chi tiêu cho nhà ở ghép",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/iconIOS.png", sizes: "192x192", type: "image/png" },
      { url: "/iconIOS.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/iconIOS.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chi tiêu",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
