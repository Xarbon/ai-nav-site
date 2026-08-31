import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIqury - Find AI Tools By Your Questions",
  description: "面向一人公司、跨境电商和自媒体的 AI 工具导航，按真实业务场景分类。",
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon-32.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
