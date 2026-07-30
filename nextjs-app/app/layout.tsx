import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import "./landing.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Microservice Starter Kit",
  description:
    "Production-ready microservices starter — API Gateway, Keycloak SSO, catalog, orders, Stripe checkout, and Angular admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
