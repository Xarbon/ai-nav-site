// 20个一级分类（不可自定义）
export const VALID_CATEGORIES = [
  'ecommerce',
  'content_creation',
  'cross_border_opc',
  'office_productivity',
  'design',
  'dev_automation',
  'education',
  'local_business',
  'audio_video',
  'lifestyle',
  'legal_compliance',
  'marketing',
  'real_estate',
  'hr',
  'quant_trading',
  'ai_comic_drama',
  'finance_tax',
  'ai_customer_service',
  'industrial',
  'healthcare',
] as const;

// 133个二级分类（按一级分类分组）
export const SUB_CATEGORIES: Record<string, string[]> = {
  'ecommerce': ["product-image", "product-video", "listing-seo", "detail-copy", "sku-poster", "profit-calc", "multi-lang-copy", "livestream-script", "product-cutout", "review-reply"],
  'content_creation': ["xiaohongshu-copy", "wechat-article", "short-video-script", "ai-voice-avatar", "image-to-video", "podcast-tools", "social-copy", "cover-illustration", "content-analytics", "multi-platform-adapt"],
  'cross_border_opc': ["landing-page", "cold-email", "social-ad-creative", "influencer-outreach", "seo-blog", "trade-docs", "live-translation", "ad-creative", "logistics-cost", "after-sales"],
  'office_productivity': ["report-writing", "excel-tools", "ppt-generator", "meeting-minutes", "contract-docs", "mindmap-plan", "pdf-tools", "email-communication", "project-sop", "ocr-tools"],
  'design': ["logo-vi", "poster-flyer", "comic-character", "id-photo", "interior-design", "packaging", "image-restore", "3d-rendering", "style-image", "batch-image"],
  'dev_automation': ["ai-code-gen", "low-code-rpa", "code-assistant", "data-pipeline", "ai-agent", "web-scraper", "vps-deploy", "api-tools", "seo-geo", "prompt-tools"],
  'education': ["course-content", "exam-bank", "knowledge-column", "teaching-animation", "homework-grading", "enrollment-marketing", "study-notes"],
  'local_business': ["store-poster", "platform-copy", "store-video", "menu-design", "store-event", "customer-retention"],
  'audio_video': ["text-to-speech", "digital-human", "video-editing", "audio-cleanup", "video-clipping", "ai-music"],
  'lifestyle': ["travel-plan", "fitness-diet", "wedding", "daily-copy", "fashion-tryon"],
  'legal_compliance': ["contract-gen", "risk-check", "trademark-brand", "qualification-docs"],
  'marketing': ["ad-creative-gen", "keyword-research", "ad-copy", "campaign-analytics", "growth-hacking"],
  'real_estate': ["listing-copy", "floorplan-render", "sales-script", "agency-marketing"],
  'hr': ["resume-optimize", "recruitment-copy", "interview-questions", "performance-review", "employee-training"],
  'quant_trading': ["strategy-backtest", "trading-bot", "market-data", "risk-control", "crypto-tools"],
  'ai_comic_drama': ["novel-to-comic", "character-consistency", "storyboard-gen", "motion-comic", "comic-voice", "batch-production"],
  'finance_tax': ["invoice-manage", "tax-calc", "bookkeeping", "payroll", "financial-analysis"],
  'ai_customer_service': ["chatbot-build", "private-domain", "lead-capture", "omnichannel", "ticket-system"],
  'industrial': ["quality-inspection", "predictive-maintain", "production-schedule", "cad-design", "safety-monitor"],
  'healthcare': ["health-consult", "medical-imaging", "record-manage", "mental-health", "fitness-health"],
};

// 有效的人群标签
export const VALID_AUDIENCE_TAGS = ['cn_opc', 'cross_border', 'content_creator'];

// 有效的定价模式
export const VALID_PRICING_MODELS = ['Free', 'Freemium', 'Paid', 'Contact'];

// 有效的状态
export const VALID_STATUSES = ['active', 'draft', 'archived'];

// 验证一级分类
export function validateCategory(category: string): boolean {
  return VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number]);
}

// 验证二级分类（需要匹配对应的一级分类）
export function validateSubCategory(category: string, subCategory: string): boolean {
  const validSubs = SUB_CATEGORIES[category];
  if (!validSubs) return false;
  return validSubs.includes(subCategory);
}

// 验证人群标签
export function validateAudienceTags(tags: string[]): { valid: boolean; invalid: string[] } {
  const invalid = tags.filter(t => !VALID_AUDIENCE_TAGS.includes(t));
  return { valid: invalid.length === 0, invalid };
}

// 验证定价模式
export function validatePricing(pricing: string): boolean {
  return VALID_PRICING_MODELS.includes(pricing);
}

// 验证状态
export function validateStatus(status: string): boolean {
  return VALID_STATUSES.includes(status);
}

// 验证布尔值
export function validateBoolean(value: string | boolean): boolean {
  if (typeof value === 'boolean') return true;
  const v = String(value).toLowerCase().trim();
  return v === 'true' || v === 'false';
}

// 验证评分（0-5，可一位小数）
export function validateRating(rating: number | string): boolean {
  const num = typeof rating === 'string' ? parseFloat(rating) : rating;
  return !isNaN(num) && num >= 0 && num <= 5;
}
