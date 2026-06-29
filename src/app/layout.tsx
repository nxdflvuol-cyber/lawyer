import type { Metadata } from "next";
import { Cairo, Amiri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { TelegramPoller } from "@/components/telegram-poller";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "المحامي الشامل - نظام إدارة المكاتب القانونية",
  description: "نظام متكامل لإدارة مكاتب المحاماة مع ذكاء اصطناعي قانوني متقدم",
  keywords: ["محامي", "قانون", "قضايا", "محكمة", "ذكاء اصطناعي", "إدارة مكتب"],
  authors: [{ name: "المحامي الشامل" }],
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${amiri.variable} font-arabic antialiased`}
      >
        <Providers>
          {children}
          <TelegramPoller />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
