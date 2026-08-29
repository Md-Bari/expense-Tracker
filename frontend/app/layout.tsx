import type { Metadata } from "next";
import { Outfit, Hind_Siliguri } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-hind-siliguri",
});

export const metadata: Metadata = {
  title: "FinCore AI - AI Wealth & Expense Manager",
  description: "Manage your income, expenses, budgets, savings goals, and chat with an intelligent financial advisor agent powered by FinCore AI.",
  icons: {
    icon: '/fincore_logo.png',
    apple: '/fincore_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${hindSiliguri.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
