interface Tool {
  slug: string;
  name: string;
  name_en: string;
  description: string;
  description_en?: string;
  url: string;
  pricing: string;
  rating: number;
  category: string;
}

export function ToolJsonLd({tool, isZh}: {tool: Tool; isZh: boolean}) {
  const name = isZh ? tool.name : (tool.name_en || tool.name);
  const description = isZh ? tool.description : (tool.description_en || tool.description);
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: name,
    description: description,
    url: tool.url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: tool.pricing === 'Free' ? '0' : tool.pricing === 'Freemium' ? '0' : '1',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: tool.rating || 4,
      ratingCount: 100,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
    />
  );
}
