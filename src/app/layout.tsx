import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import Sidebar from "./components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SocialSpark | IA para Instagram",
  description: "Crie Anúncios, Carrosséis e Landing Pages em segundos com IA a partir de qualquer perfil do Instagram.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="pt-BR"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#f9fafb]">
          <div className="flex flex-1 min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

