import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Tic Tac Toe",
  description: "A modern multiplayer Tic Tac Toe game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-center">Tic Tac Toe</h1>
          </header>
          <main className="flex flex-col items-center">
            <div className="w-full">{children}</div>
          </main>
          <footer className="mt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Tic Tac Toe Game</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
