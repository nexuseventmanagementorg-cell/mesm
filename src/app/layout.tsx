import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

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
  title: "MESM | Personalized Accoutrements for Ladies",
  description:
    "Discover MESM's curated jewellery and personalized accessories for everyday elegance and special occasions in Pakistan.",
  metadataBase: new URL("https://meemsgems.com"),
  openGraph: {
    title: "MESM — Personalized Accoutrements for Ladies",
    description: "Explore MESM's curated jewellery and personalized accessories in Pakistan.",
    images: ["/images/mesm-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brand-ivory text-brand-mocha min-h-screen flex flex-col`}>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
