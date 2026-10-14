interface Tool {
  slug: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  icon_url: string;
  pricing: string;
}

interface Props {
  tool: Tool;
  isZh: boolean;
  locale: string;
}

export function RelatedToolCard({ tool, isZh, locale }: Props) {
  const displayName = isZh ? tool.name : (tool.name_en || tool.name);
  const displayDesc = isZh ? tool.description : (tool.description_en || tool.description);
  const borderColor = tool.pricing === 'Paid' ? '#FB923C' : tool.pricing === 'Freemium' ? '#165DFF' : '#36D399';

  return (
    <a
      href={`/${locale}/tool/${tool.slug}`}
      className="block bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start gap-2.5">
        <img
          src={tool.icon_url || '/logo-icon.svg'}
          alt={displayName}
          className="w-9 h-9 rounded-lg object-cover shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold truncate group-hover:text-blue-600 transition" style={{ color: '#0E3A7A' }}>
            {displayName}
          </h4>
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#9CA3AF' }}>
            {displayDesc || ''}
          </p>
          <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
            style={{
              borderColor: borderColor + '60',
              color: borderColor,
            }}
          >
            {tool.pricing || 'Free'}
          </span>
        </div>
      </div>
    </a>
  );
}
