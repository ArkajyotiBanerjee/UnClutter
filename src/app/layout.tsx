import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { BackgroundLayer } from "@/components/BackgroundLayer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "UnClutter — Focused Student Task Manager",
  description: "A calm, minimal task manager built for students to organize, focus, and accomplish more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-stone-50 text-stone-900 min-h-full flex flex-col`}
      >
        <Providers>
          <BackgroundLayer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
