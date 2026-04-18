import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "LinkedIn Content Writer Agent",
  description:
    "AI-powered multi-agent system that generates high-quality LinkedIn posts on any topic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-950 min-h-screen`}
      >
        <nav className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
              <span>💼</span>
              <span>LinkedIn Content Agent</span>
            </a>
            <a
              href="/generate"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              New Post
            </a>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
