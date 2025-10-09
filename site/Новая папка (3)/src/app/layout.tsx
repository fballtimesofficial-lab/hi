import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Delivery Management System',
  description: 'Professional 3-tier order and delivery management platform',
  keywords: ['Delivery', 'Orders', 'Logistics', 'Admin', 'Courier'],
  authors: [{ name: 'Delivery Team' }],
  openGraph: {
    title: 'Delivery Management System',
    description: 'Order and delivery management platform',
    url: 'https://example.com',
    siteName: 'DeliveryMS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Delivery Management System',
    description: 'Order and delivery management platform',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
