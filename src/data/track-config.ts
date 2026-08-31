// 赛道配色和图标配置
export const trackConfig: Record<string, { color: string; gradient: string; icon: string }> = {
  ecommerce: { color: '#3B82F6', gradient: 'from-blue-400 to-blue-600', icon: '🛒' },
  content_creation: { color: '#8B5CF6', gradient: 'from-purple-400 to-purple-600', icon: '✍️' },
  cross_border_opc: { color: '#10B981', gradient: 'from-green-400 to-green-600', icon: '🌍' },
  quant_trading: { color: '#F59E0B', gradient: 'from-yellow-400 to-yellow-600', icon: '📈' },
  ai_comic_drama: { color: '#EC4899', gradient: 'from-pink-400 to-pink-600', icon: '🎨' },
  office_productivity: { color: '#06B6D4', gradient: 'from-cyan-400 to-cyan-600', icon: '💼' },
  design: { color: '#F97316', gradient: 'from-orange-400 to-orange-600', icon: '🎨' },
  dev_automation: { color: '#6366F1', gradient: 'from-indigo-400 to-indigo-600', icon: '⚙️' },
  education: { color: '#14B8A6', gradient: 'from-teal-400 to-teal-600', icon: '📚' },
  local_business: { color: '#84CC16', gradient: 'from-lime-400 to-lime-600', icon: '🏪' },
  audio_video: { color: '#EF4444', gradient: 'from-red-400 to-red-600', icon: '🎬' },
  lifestyle: { color: '#F472B6', gradient: 'from-pink-300 to-pink-500', icon: '✨' },
  legal_compliance: { color: '#64748B', gradient: 'from-slate-400 to-slate-600', icon: '⚖️' },
  ai_customer_service: { color: '#0EA5E9', gradient: 'from-sky-400 to-sky-600', icon: '💬' },
  marketing: { color: '#D946EF', gradient: 'from-fuchsia-400 to-fuchsia-600', icon: '📣' },
  hr: { color: '#22C55E', gradient: 'from-green-500 to-emerald-600', icon: '👥' },
  construction: { color: '#78716C', gradient: 'from-stone-400 to-stone-600', icon: '🏗️' },
  industry: { color: '#7C3AED', gradient: 'from-violet-400 to-violet-600', icon: '🏭' },
  healthcare: { color: '#DC2626', gradient: 'from-red-500 to-rose-600', icon: '🏥' },
  research: { color: '#2563EB', gradient: 'from-blue-500 to-indigo-600', icon: '🔬' },
};

export function getTrackStyle(slug: string) {
  return trackConfig[slug] || { color: '#6B7280', gradient: 'from-gray-400 to-gray-600', icon: '📋' };
}
