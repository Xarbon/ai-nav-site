import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales} from '@/i18n/config';
import {Navbar} from '@/components/layout/Navbar';
import {Footer} from '@/components/layout/Footer';
import {GoogleAdSense} from '@/components/ads/GoogleAdSense';
import '../globals.css';

const SITE_URL = 'https://aiqury.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  
  // SEO TDK 优化 - 针对 Google 和百度收录规则
  const title = isZh 
    ? 'AIqury - 用业务问题找AI工具 | 一人公司OPC创业必备AI工具导航'
    : 'AIqury - Find AI Tools By Your Questions | Solo OPC Founder Essential AI Tools Directory';
  
  const description = isZh
    ? 'AIqury是面向一人公司、跨境电商和自媒体的AI工具导航平台。按真实业务场景分类，聚合353+AI工具评测、OPC业务问题库、工具组合方案，帮助单人公司快速找到合适的AI生产力工具。涵盖电商、内容创作、量化交易、办公效率等20+赛道。'
    : 'AIqury is an AI tools navigation platform for solo OPC founders, cross-border ecommerce, and content creators. Indexes 353+ AI tools by real business questions, provides tool reviews, OPC business scenario library, and combo solutions. Covers 20+ categories including ecommerce, content creation, quant trading, office productivity, and more.';
  
  const keywords = isZh 
    ? 'AI工具导航,AI工具推荐,一人公司工具,OPC创业工具,跨境电商AI工具,自媒体AI工具,AI生产力工具,业务场景找工具,ChatGPT工具,AI办公工具,AI设计工具,AI营销工具,独立站工具,AI写作工具,AI视频工具'
    : 'AI tools directory,AI tools recommendation,solo founder tools,OPC startup tools,cross-border ecommerce AI tools,content creator AI tools,AI productivity tools,business scenario AI finder,ChatGPT tools,AI office tools,AI design tools,AI marketing tools,ecommerce tools,AI writing tools,AI video tools';

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'AIqury Team' }],
    publisher: 'AIqury',
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: 'AIqury',
      locale: isZh ? 'zh_CN' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: isZh ? 'AIqury - AI工具导航平台' : 'AIqury - AI Tools Directory',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
      creator: '@aiqury',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'google-site-verification-token', // 需要替换为实际token
      yandex: 'yandex-verification-token',
    },
    icons: {
      icon: [
        { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
      ],
      shortcut: '/favicon.ico',
      apple: '/favicon-32.png',
    },
    manifest: '/site.webmanifest',
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const fontClass = locale === 'zh' ? 'font-zh' : 'font-en';
  const isZh = locale === 'zh';

  return (
    <html lang={locale} className={fontClass} suppressHydrationWarning>
      <head>
        <GoogleAdSense />
        {/* hreflang tags are set per-page via generateMetadata */}
        <link rel="sitemap" type="application/xml" href="/api/sitemap" />
        {/* 百度自动推送 */}
        {isZh && (
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              var bp = document.createElement('script');
              var curProtocol = window.location.protocol.split(':')[0];
              if (curProtocol === 'https') {
                bp.src = 'https://zz.bdstatic.com/linkpush/push.js';
              } else {
                bp.src = 'http://push.zhangzs.com/push.js';
              }
              var s = document.getElementsByTagName("script")[0];
              s.parentNode.insertBefore(bp, s);
            })();
          `}} />
        )}
      </head>
      <body style={{background: '#FFFFFF', color: 'var(--text-body)'}}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar locale={locale} />
          <div className="flex min-h-[calc(100vh-64px)]">
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
          <Footer isZh={isZh} locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
