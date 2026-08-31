'use client';

import Script from 'next/script';

export function UmamiAnalytics() {
  // Replace with your actual Umami tracking ID and domain
  const UMAMI_WEBSITE_ID = 'your-website-id'; // TODO: Replace with actual ID
  const UMAMI_SCRIPT_URL = 'https://analytics.yourdomain.com/script.js'; // TODO: Replace with actual URL
  
  return (
    <Script
      id="umami-analytics"
      strategy="afterInteractive"
      src={UMAMI_SCRIPT_URL}
      data-website-id={UMAMI_WEBSITE_ID}
      data-domains="aiqury.com,www.aiqury.com"
    />
  );
}
