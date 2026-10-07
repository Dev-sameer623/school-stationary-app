import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "School Stationery Manager",
  description: "Manage school stationery products, stock, and orders.",
  icons: {
    icon: [{ url: "/stationery-emblem.jpg", type: "image/jpeg" }],
    apple: [{ url: "/stationery-emblem.jpg", type: "image/jpeg" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
