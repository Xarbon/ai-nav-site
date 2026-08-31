import {supabase} from './client';

export async function getTools(options?: {
  category?: string;
  subCategory?: string;
  audienceTags?: string[];
  isHot?: boolean;
  isRecommended?: boolean;
  isNew?: boolean;
  limit?: number;
}) {
  let query = supabase.from('tools').select('*').eq('status', 'active');

  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.subCategory) {
    query = query.eq('sub_category', options.subCategory);
  }
  if (options?.audienceTags && options.audienceTags.length > 0) {
    query = query.overlaps('audience_tags', options.audienceTags);
  }
  if (options?.isHot) {
    query = query.eq('is_hot', true);
  }
  if (options?.isRecommended) {
    query = query.eq('is_recommended', true);
  }
  if (options?.isNew) {
    query = query.eq('is_new', true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  query = query.order('sort_order', {ascending: true}).order('rating', {ascending: false});

  const {data, error} = await query;
  if (error) throw error;
  return data;
}

export async function getToolBySlug(slug: string) {
  const {data, error} = await supabase
    .from('tools')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error) throw error;
  return data;
}

export async function getRelatedTools(category: string, subCategory: string, excludeSlug: string) {
  const {data, error} = await supabase
    .from('tools')
    .select('*')
    .eq('category', category)
    .eq('sub_category', subCategory)
    .neq('slug', excludeSlug)
    .eq('status', 'active')
    .order('rating', {ascending: false})
    .limit(6);

  if (error) throw error;
  return data;
}

export async function searchTools(keyword: string) {
  const {data, error} = await supabase
    .from('tools')
    .select('*')
    .eq('status', 'active')
    .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,tags.cs.{${keyword}}`)
    .order('rating', {ascending: false})
    .limit(20);

  if (error) throw error;
  return data;
}
