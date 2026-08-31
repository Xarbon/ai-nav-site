import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // Cloudflare Pages 需要 SSR，不能用 static export
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
