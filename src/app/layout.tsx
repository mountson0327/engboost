import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { I18nProvider } from "@/lib/i18n/provider";
import { AuthProvider } from "@/lib/auth-client";
import { getLang } from "@/lib/i18n/server";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

// Inter — includes the "vietnamese" subset so VN diacritics render crisply.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EngBoost — Học tiếng Anh",
  description: "Học từ vựng với SRS, luyện tập cùng AI, quiz và đọc-nghe.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <I18nProvider lang={lang}>
          <AuthProvider>
            <Nav />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
              {children}
            </main>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
