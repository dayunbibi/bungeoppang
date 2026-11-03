import type { Metadata, Viewport } from "next";
import "./globals.css";

// OG image lives in app/opengraph-image.png (Next adds the meta tags automatically).
// metadataBase turns it into an absolute URL, which Threads/Kakao need for the preview.
export const metadata: Metadata = {
  metadataBase: new URL("https://bungeoppang-seven.vercel.app"),
  title: "온라인 붕어빵 굽기",
  description: "반죽 붓고, 속 넣고, 타이밍 맞춰 뒤집기. 오늘의 붕어빵을 구워보세요.",
  openGraph: {
    title: "온라인 붕어빵 굽기",
    description: "황금 붕어빵 도전! 반죽 붓고 타이밍 맞춰 뒤집기",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#221a1d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* Korean display fonts. Loaded with a link tag because next/font only preloads latin subsets */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* root layout = every page, so this rule doesn't apply in the app router */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gowun+Dodum&family=Jua&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
