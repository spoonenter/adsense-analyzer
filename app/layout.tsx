import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "애드센스 승인 도우미 | 글자수세기 · 애드고시 체크리스트",
  description:
    "애드센스 승인에 필요한 글자수, 승인 방법, 체크리스트를 한눈에 확인하세요. 애드고시 통과를 돕는 스마트 글자수 세기 도구.",
  keywords: [
    "글자수세기",
    "애드센스 글자수세기",
    "애드센스 승인 도우미",
    "애드고시 승인도우미",
    "애드고시 체크리스트",
    "애드센스 승인 방법",
    "애드센스 승인 노하우",
  ],
  openGraph: {
    title: "애드센스 승인 도우미 | 글자수세기 · 애드고시 체크리스트",
    description:
      "애드센스 승인 전 필수 도구! 글자수 확인, 승인 조건 점검, 애드고시 체크리스트 제공.",
    url: "https://adsense.newsda.kr",
    siteName: "애드센스 승인 도우미",
    locale: "ko_KR",
    type: "website",
  },
  alternates: {
    canonical: "https://adsense.newsda.kr",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9591765421576424"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
