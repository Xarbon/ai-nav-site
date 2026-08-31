import {NextRequest, NextResponse} from 'next/server';
import * as XLSX from 'xlsx';
import {
  VALID_CATEGORIES,
  SUB_CATEGORIES,
  VALID_AUDIENCE_TAGS,
  VALID_PRICING_MODELS,
  VALID_STATUSES,
  validateCategory,
  validateSubCategory,
  validatePricing,
  validateStatus,
  validateBoolean,
  validateRating,
} from '@/lib/category-validation';
import { insertTool, toolUrlExists, toolExists } from '@/lib/d1/queries';

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-token');
  const adminPassword = process.env.ADMIN_PASSWORD || 'aiqury2024admin';
  return authHeader === adminPassword;
}

const COLUMN_MAP: Record<string, string> = {
  'tool_name': 'name',
  'en_name': 'name_en',
  'official_url': 'url',
  'short_intro': 'description',
  'detail_intro': 'detail',
  'category_1': 'category',
  'category_2': 'sub_category',
  'pricing_model': 'pricing',
  'pricing_detail': 'pricing_detail',
  'support_language': 'language',
  'score': 'rating',
  'tech_tag': 'tags',
  'is_hot': 'is_hot',
  'is_recommend': 'is_recommended',
  'is_new': 'is_new',
  'aff_link': 'affiliate_url',
  'workflow': 'workflow',
  'sort_weight': 'sort_order',
  'status': 'status',
  'run_mode': 'run_mode',
  'hardware_level': 'hardware_level',
  'learn_level': 'learn_level',
  'hardware_note': 'hardware_note',
  'business_question_list': 'business_question_list',
  'seo_title': 'seo_title',
  'seo_meta_desc': 'seo_meta_desc',
  'opc_business_scenario': 'opc_scenario',
  'opc_business_scenario_en': 'opc_scenario_en',
  'opc_scenario_en': 'opc_scenario_en',
  'cn_access': 'cn_access',
  'pros': 'pros',
  'cons': 'cons',
  'core_capability': 'core_capabilities',
  'copyright_note': 'copyright_note',
  'pricing_note': 'pricing_note',
  'access_note': 'access_note',
  'difficulty_note': 'difficulty_note',
  'capability_note': 'capability_note',
  'scenario_note': 'scenario_note',
  'core_capabilities_en': 'core_capabilities_en',
  'pros_en': 'pros_en',
  'cons_en': 'cons_en',
  'business_question_list_en': 'business_question_list_en',
  'payment_info_en': 'payment_info_en',
  '英文核心能力': 'core_capabilities_en',
  '英文优点': 'pros_en',
  '英文缺点': 'cons_en',
  '英文业务问题': 'business_question_list_en',
  '英文付费模式': 'payment_info_en',
  '工具名称': 'name',
  '工具名称*': 'name',
  '名称': 'name',
  '名称*': 'name',
  'Name': 'name',
  'Tool Name': 'name',
  '英文名': 'name_en',
  '英文名*': 'name_en',
  '英文名称': 'name_en',
  'English Name': 'name_en',
  'name_en': 'name_en',
  'Name (EN)': 'name_en',
  '官网链接': 'url',
  '官网链接*': 'url',
  '链接': 'url',
  '链接*': 'url',
  'URL': 'url',
  'url': 'url',
  'Website': 'url',
  '官网': 'url',
  '网站': 'url',
  '一句话描述': 'description',
  '一句话描述*': 'description',
  '简介': 'description',
  '简介*': 'description',
  '描述': 'description',
  'Description': 'description',
  'description': 'description',
  'Short Description': 'description',
  '短描述': 'description',
  '英文描述': 'description_en',
  'Description (EN)': 'description_en',
  'description_en': 'description_en',
  '英文简介': 'description_en',
  '详细介绍': 'detail',
  '详情': 'detail',
  'Detail': 'detail',
  'detail': 'detail',
  '详细介绍*': 'detail',
  '详情*': 'detail',
  '英文详情': 'detail_en',
  'Detail (EN)': 'detail_en',
  'detail_en': 'detail_en',
  '一级分类': 'category',
  '一级分类*': 'category',
  '分类': 'category',
  '分类*': 'category',
  'Category': 'category',
  'category': 'category',
  '赛道': 'category',
  'Track': 'category',
  '一级赛道': 'category',
  '主分类': 'category',
  '二级分类': 'sub_category',
  '二级分类*': 'sub_category',
  '子分类': 'sub_category',
  'Sub Category': 'sub_category',
  'sub_category': 'sub_category',
  'Sub-Category': 'sub_category',
  '二级赛道': 'sub_category',
  '子赛道': 'sub_category',
  '图标链接': 'icon_url',
  'Icon URL': 'icon_url',
  'icon_url': 'icon_url',
  '图标': 'icon_url',
  'Logo': 'icon_url',
  '人群标签': 'audience_tags',
  'Audience Tags': 'audience_tags',
  'audience_tags': 'audience_tags',
  '定价模式': 'pricing',
  '定价': 'pricing',
  'Pricing': 'pricing',
  'pricing': 'pricing',
  '付费模式': 'pricing',
  '价格模式': 'pricing',
  '定价详情': 'pricing_detail',
  'Pricing Detail': 'pricing_detail',
  '付费详情': 'pricing_detail',
  '支持语言': 'language',
  'Language': 'language',
  'language': 'language',
  'Languages': 'language',
  '评分': 'rating',
  'Rating': 'rating',
  'rating': 'rating',
  'Score': 'rating',
  '技术标签': 'tags',
  '标签': 'tags',
  'Tags': 'tags',
  'tags': 'tags',
  'Tag': 'tags',
  '是否热门': 'is_hot',
  '热门': 'is_hot',
  'Is Hot': 'is_hot',
  'Hot': 'is_hot',
  '是否推荐': 'is_recommended',
  '推荐': 'is_recommended',
  'Is Recommended': 'is_recommended',
  'is_recommended': 'is_recommended',
  'Recommended': 'is_recommended',
  '是否新品': 'is_new',
  '新品': 'is_new',
  'Is New': 'is_new',
  'New': 'is_new',
  '联盟链接': 'affiliate_url',
  'Affiliate URL': 'affiliate_url',
  'affiliate_url': 'affiliate_url',
  '推广链接': 'affiliate_url',
  '所属工作流': 'workflow',
  'Workflow': 'workflow',
  '工作流': 'workflow',
  '排序权重': 'sort_order',
  'Sort Order': 'sort_order',
  'sort_order': 'sort_order',
  '排序': 'sort_order',
  '权重': 'sort_order',
  '状态': 'status',
  'Status': 'status',
  '运行方式': 'run_mode',
  'Run Mode': 'run_mode',
  '运行模式': 'run_mode',
  '硬件需求': 'hardware_level',
  'Hardware Level': 'hardware_level',
  '硬件': 'hardware_level',
  '硬件消耗': 'hardware_level',
  '上手难度': 'learn_level',
  'Learn Level': 'learn_level',
  '难度': 'learn_level',
  '学习难度': 'learn_level',
  '硬件备注': 'hardware_note',
  'Hardware Note': 'hardware_note',
  '硬件说明': 'hardware_note',
  '商用版权提示': 'commercial_notice',
  'Commercial Notice': 'commercial_notice',
  'commercial_notice': 'commercial_notice',
  '商用提示': 'commercial_notice',
  '版权提示': 'commercial_notice',
  '业务问题列表': 'business_question_list',
  'Business Questions': 'business_question_list',
  '业务问题': 'business_question_list',
  'OPC问题': 'business_question_list',
  '业务场景问题': 'business_question_list',
  'SEO标题': 'seo_title',
  'SEO Title': 'seo_title',
  'SEO描述': 'seo_meta_desc',
  'SEO Description': 'seo_meta_desc',
  'SEO简介': 'seo_meta_desc',
  'OPC业务场景': 'opc_scenario',
  'OPC Scenarios': 'opc_scenario',
  'opc_scenario': 'opc_scenario',
  '业务场景': 'opc_scenario',
  'OPC场景': 'opc_scenario',
  '适用场景': 'opc_scenario',
  '付费模式详情': 'payment_info',
  'Payment Info': 'payment_info',
  'payment_info': 'payment_info',
  '付费说明': 'payment_info',
  '定价说明': 'payment_info',
  '国内访问状态': 'cn_access',
  'CN Access': 'cn_access',
  '国内访问': 'cn_access',
  '访问状态': 'cn_access',
  '国内可用性': 'cn_access',
  '优点': 'pros',
  'Pros': 'pros',
  '优势': 'pros',
  '缺点': 'cons',
  'Cons': 'cons',
  '不足': 'cons',
  '劣势': 'cons',
  '核心能力': 'core_capabilities',
  'Core Capabilities': 'core_capabilities',
  'core_capabilities': 'core_capabilities',
  '核心功能': 'core_capabilities',
  '主要功能': 'core_capabilities',

  // === Template v3 Chinese headers (missing mappings) ===
  '英文详细介绍': 'detail_en',
  '英文定价详情': 'payment_info_en',
  '付费模式备注': 'pricing_note',
  '场景备注': 'scenario_note',
  '能力备注': 'capability_note',
  '访问备注': 'access_note',
  '难度备注': 'difficulty_note',
  '是否精选': 'is_featured',
  '工作流说明': 'workflow',
  '版权备注': 'copyright_note',
  '英文OPC业务场景': 'opc_scenario_en',
  '英文业务问题列表': 'business_question_list_en',
  '受众标签': 'audience_tags',
  '通用标签': 'tags',
  '是否新工具': 'is_new',
  '语言支持': 'language',
};

export async function POST(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({error: 'No file provided'}, {status: 400});
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {type: 'array'});
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {defval: ''});

    const results = {
      total: jsonData.length,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    const seenUrls = new Set<string>();
    const seenSlugs = new Set<string>();

    for (let i = 0; i < jsonData.length; i++) {
      const rawRow = jsonData[i] as Record<string, any>;
      const rowNum = i + 2;

      const row: Record<string, any> = {};
      const unmappedCols: string[] = [];
      for (const [key, value] of Object.entries(rawRow)) {
        const fieldName = COLUMN_MAP[key.trim()] || key.trim().toLowerCase();
        if (!COLUMN_MAP[key.trim()] && !['工具名称*','英文名','官网链接*','一句话描述*'].includes(key.trim())) {
          // only flag truly unknown columns
        }
        row[fieldName] = value;
      }

      // 1. 必填字段检查
      const requiredFields = ['name', 'url', 'description', 'category'];
      const missingFields = requiredFields.filter(f => !row[f] || String(row[f]).trim() === '');
      if (missingFields.length > 0) {
        results.failed++;
        // Debug: show what keys we actually got
        const debugKeys = Object.keys(row).slice(0, 10).join(', ');
        results.errors.push(`Row ${rowNum}: 缺少必填字段 [${missingFields.join(', ')}] | 实际列: ${debugKeys}`);
        continue;
      }

      // 2. URL去重
      const url = String(row.url).trim();
      const urlExists = await toolUrlExists(url);
      if (urlExists) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: 官网链接已存在，跳过`);
        continue;
      }
      if (seenUrls.has(url)) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: 文件内URL重复`);
        continue;
      }
      seenUrls.add(url);

      // 3. 一级分类验证
      const category = String(row.category).trim();
      if (!validateCategory(category)) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: 一级分类 "${category}" 无效，必须是20个预设slug之一`);
        continue;
      }

      // 4. 二级分类验证（宽松模式：接受任意非空值）
      const subCategory = row.sub_category ? String(row.sub_category).trim() : '';
      if (subCategory && !validateSubCategory(category, subCategory)) {
        results.errors.push(`Row ${rowNum}: 二级分类 "${subCategory}" 不在预设列表中，已接受`);
      }

      // 5. 定价模式验证
      const pricing = row.pricing ? String(row.pricing).trim() : 'Free';
      if (pricing && !validatePricing(pricing)) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: 定价模式 "${pricing}" 无效，只能是 Free/Freemium/Paid`);
        continue;
      }

      // 6. 状态验证
      const status = row.status ? String(row.status).trim() : 'active';
      if (status && !validateStatus(status)) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: 状态 "${status}" 无效，只能是 active/draft/archived`);
        continue;
      }

      // 7. 布尔值验证
      for (const boolField of ['is_hot', 'is_recommended', 'is_new', 'is_featured']) {
        if (row[boolField] !== undefined && row[boolField] !== '' && !validateBoolean(row[boolField])) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: ${boolField} "${row[boolField]}" 无效，只能是 true/false`);
          continue;
        }
      }

      // 8. 评分验证
      if (row.rating !== undefined && row.rating !== '') {
        if (!validateRating(row.rating)) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: 评分 "${row.rating}" 无效，必须是0-5的数字`);
          continue;
        }
      }

      // 9. 人群标签验证
      const audienceTags = row.audience_tags
        ? String(row.audience_tags).split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
      // audience_tags validation relaxed - accept any tags

      // 10. 中文描述长度检查
      const description = String(row.description).trim();
      if (description.length > 25) {
        results.errors.push(`Row ${rowNum}: 一句话描述超过25字（当前${description.length}字），已截断`);
      }

      // 11. 生成slug
      const nameEn = row.name_en ? String(row.name_en).trim() : row.name;
      const slug = String(nameEn).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (row.name_en && seenSlugs.has(slug)) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: 英文名重复，slug "${slug}" 已存在`);
        continue;
      }
      seenSlugs.add(slug);

      // Check if slug exists in DB
      const slugExists = await toolExists(slug);
      if (slugExists) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: slug "${slug}" 已存在于数据库`);
        continue;
      }

      // 解析其他字段
      const languages = row.language
        ? String(row.language).split(',').map((l: string) => l.trim()).filter(Boolean)
        : [];
      // Helper: parse semicolon or pipe separated arrays
      const parseArray = (val: any): string[] => {
        if (!val) return [];
        if (Array.isArray(val)) return val.map((s: any) => String(s).trim()).filter(Boolean);
        const str = String(val);
        if (str.startsWith('[')) { try { return JSON.parse(str); } catch {} }
        return str.split(/[;｜|]/).map((s: string) => s.trim()).filter(Boolean);
      };

      const tags = row.tags ? parseArray(row.tags) : [];

      const toolData = {
        slug,
        name: String(row.name).trim(),
        name_en: row.name_en ? String(row.name_en).trim() : String(row.name).trim(),
        url: url,
        description: description.slice(0, 25),
        description_en: row.description_en ? String(row.description_en).trim() : '',
        detail: row.detail ? String(row.detail).trim() : '',
        detail_en: row.detail_en ? String(row.detail_en).trim() : '',
        icon_url: row.icon_url ? String(row.icon_url).trim() : '',
        category: category,
        sub_category: subCategory,
        audience_tags: audienceTags,
        pricing: pricing,
        pricing_detail: row.pricing_detail ? String(row.pricing_detail).trim() : '',
        language: languages,
        rating: row.rating ? parseFloat(String(row.rating)) : 0,
        tags: tags,
        is_hot: String(row.is_hot).toLowerCase() === 'true' || row.is_hot === true || row.is_hot === 1,
        is_recommended: String(row.is_recommended).toLowerCase() === 'true' || row.is_recommended === true || row.is_recommended === 1,
        is_new: String(row.is_new).toLowerCase() === 'true' || row.is_new === true || row.is_new === 1,
        is_featured: String(row.is_featured).toLowerCase() === 'true' || row.is_featured === true || row.is_featured === 1,
        affiliate_url: row.affiliate_url ? String(row.affiliate_url).trim() : '',
        workflow: row.workflow ? String(row.workflow).trim() : '',
        sort_order: row.sort_order ? parseInt(String(row.sort_order)) : 0,
        status: status,
        run_mode: row.run_mode ? String(row.run_mode).trim() : '',
        hardware_level: row.hardware_level ? String(row.hardware_level).trim() : '',
        learn_level: row.learn_level ? String(row.learn_level).trim() : '',
        hardware_note: row.hardware_note ? String(row.hardware_note).trim() : '',
        commercial_notice: row.commercial_notice ? String(row.commercial_notice).trim() : '',
        business_question_list: parseArray(row.business_question_list),
        seo_title: row.seo_title ? String(row.seo_title).trim() : '',
        seo_meta_desc: row.seo_meta_desc ? String(row.seo_meta_desc).trim() : '',
        opc_scenario: parseArray(row.opc_scenario),
        opc_scenario_en: parseArray(row.opc_scenario_en),
        core_capabilities_en: parseArray(row.core_capabilities_en),
        pros_en: parseArray(row.pros_en),
        cons_en: parseArray(row.cons_en),
        business_question_list_en: parseArray(row.business_question_list_en),
        payment_info: row.payment_info ? String(row.payment_info).trim() : '',
        payment_info_en: row.payment_info_en ? String(row.payment_info_en).trim() : '',
        cn_access: row.cn_access ? String(row.cn_access).trim() : '',
        pros: parseArray(row.pros),
        cons: parseArray(row.cons),
        core_capabilities: parseArray(row.core_capabilities),
        copyright_note: row.copyright_note ? String(row.copyright_note).trim() : '',
        pricing_note: row.pricing_note ? String(row.pricing_note).trim() : '',
        access_note: row.access_note ? String(row.access_note).trim() : '',
        difficulty_note: row.difficulty_note ? String(row.difficulty_note).trim() : '',
        capability_note: row.capability_note ? String(row.capability_note).trim() : '',
        scenario_note: row.scenario_note ? String(row.scenario_note).trim() : '',
      };

      try {
        await insertTool(toolData);
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${rowNum} "${row.name}": ${err.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({error: 'Import failed', details: String(error)}, {status: 500});
  }
}
