import type { Metadata, Viewport } from "next";
import "./globals.css";

// OG image lives in app/opengraph-image.png (Next adds the meta tags automatically).
// metadataBase turns it into an absolute URL, which Threads/Kakao need for the preview.
export const metadata: Metadata = {
  metadataBase: new URL("https://bungeoppang-seven.vercel.app"),
  title: "포잎이의 붕어빵 가게",
  description: "포잎이 사장님과 붕어빵을 굽고, 손님 주문을 완성하고, 작은 가게를 운영해요.",
  openGraph: {
    title: "포잎이의 붕어빵 가게",
    description: "포잎이와 함께하는 따끈따끈 붕어빵 가게 운영 게임",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f5eb",
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
