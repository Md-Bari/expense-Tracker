import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Aura - AI Wealth & Expense Manager",
  description: "Manage your income, expenses, budgets, savings goals, and chat with an intelligent financial advisor agent.",
  icons: {
    icon: '/aura_logo.png',
    apple: '/aura_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
