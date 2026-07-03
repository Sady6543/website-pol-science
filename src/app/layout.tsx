import type { Metadata, Viewport } from "next";
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
  title: {
    default: "KnowledgeOS",
    template: "%s — KnowledgeOS",
  },
  description:
    "Personal intelligence dashboard, knowledge vault, and live global data terminal for political science and world affairs.",
  keywords: [
    "knowledge management",
    "political science",
    "current affairs",
    "study",
    "flashcards",
    "world map",
  ],
  openGraph: {
    title: "KnowledgeOS",
    description: "Personal intelligence dashboard for political science and world affairs.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0B0D" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
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
      <head>
        {/* Preconnect to performance-critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inline script to apply system theme before first paint — prevents FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('knowledgeos-theme');
                if (!saved) {
                  saved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                }
                if (saved === 'light') document.documentElement.classList.add('light');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg-canvas text-text-primary antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ShellProvider>{children}</ShellProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
