import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SplashScreen } from "@/components/splash-screen";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["vietnamese", "latin"],
  display: 'swap',
  variable: '--font-jakarta',
});

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
    <html lang="vi" className={jakarta.variable}>
      <body className={jakarta.className}>
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
