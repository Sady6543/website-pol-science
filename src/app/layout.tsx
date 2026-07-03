import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ShellProvider } from "@/components/shell-provider";
import { AuthProvider } from "@/components/auth-provider";

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const fontDisplay = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KnowledgeOS",
  description: "Personal intelligence dashboard and knowledge vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg-canvas text-text-primary antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ShellProvider>
              {children}
            </ShellProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
