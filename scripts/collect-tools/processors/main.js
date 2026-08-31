/**
 * 数据处理模块
 * 负责清洗、翻译、补全工具数据
 * 使用 DeepSeek API 进行智能翻译和内容生成
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// DeepSeek API 调用函数
async function callDeepSeek(prompt, systemPrompt = '') {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt || '你是一个专业的AI工具翻译和内容生成助手。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      log(`  DeepSeek API 错误: ${response.status}`, LogLevels.WARNING);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    log(`  DeepSeek 调用失败: ${error.message}`, LogLevels.WARNING);
    return null;
  }
}

// 分类映射
const CATEGORY_MAP = {
  'artificial-intelligence': 'ai-tools',
  'machine-learning': 'ai-tools',
  'developer-tools': 'dev-automation',
  'productivity': 'office-productivity',
  'design': 'design',
  'marketing': 'marketing',
  'writing': 'content-creation',
  'ai': 'ai-tools',
  'chatbot': 'ai-customer-service',
  'automation': 'dev-automation',
  'video': 'audio-video',
  'image': 'design',
  'code': 'dev-automation',
  'seo': 'marketing',
  'social': 'marketing',
  'ecommerce': 'ecommerce',
  'education': 'education',
  'health': 'healthcare',
  'finance': 'finance-tax'
};

const VALID_CATEGORIES = [
  'ecommerce', 'content-creation', 'cross-border-opc', 'quant-trading',
  'office-productivity', 'dev-automation', 'design', 'education',
  'audio-video', 'lifestyle', 'marketing', 'ai-customer-service',
  'local-business', 'legal-compliance', 'hr', 'healthcare',
  'industrial', 'finance-tax', 'real-estate', 'ai-comic-drama', 'ai-tools'
];

export async function processTools(tools) {
  log(`开始处理 ${tools.length} 个工具...`, LogLevels.INFO);

  const processed = [];
  const hasAI = !!(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);

  if (hasAI) {
    log('AI 翻译/生成已启用 (DeepSeek)', LogLevels.SUCCESS);
  } else {
    log('未配置 AI API Key，使用基础模式', LogLevels.WARNING);
  }

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];

    try {
      // 1. 基础数据清洗
      const cleaned = cleanToolData(tool);

      // 2. 分类推断
      cleaned.category = inferCategory(cleaned);

      // 3. 生成 slug
      cleaned.slug = generateSlug(cleaned);

      // 4. AI 翻译 + 内容补全
      if (hasAI) {
        await translateAndEnhance(cleaned);
      } else {
        cleaned.name_en = cleaned.name_en || cleaned.name;
        cleaned.description_en = cleaned.description_en || cleaned.description;
      }

      // 5. 生成 OPC 场景
      if (!cleaned.opc_scenario || cleaned.opc_scenario.length === 0) {
        if (hasAI) {
          cleaned.opc_scenario = await generateOPCScenariosAI(cleaned);
        } else {
          cleaned.opc_scenario = generateOPCScenariosFallback(cleaned.category);
        }
      }

      // 6. 生成业务问题列表
      if (!cleaned.business_question_list || cleaned.business_question_list.length === 0) {
        if (hasAI) {
          cleaned.business_question_list = await generateBusinessQuestionsAI(cleaned);
        } else {
          cleaned.business_question_list = generateBusinessQuestionsFallback(cleaned.category);
        }
      }

      // 7. 生成优缺点
      if (!cleaned.pros || cleaned.pros.length === 0) {
        if (hasAI) {
          const result = await generateProsAndConsAI(cleaned);
          cleaned.pros = result.pros;
          cleaned.cons = result.cons;
        } else {
          const result = generateProsAndConsFallback(cleaned);
          cleaned.pros = result.pros;
          cleaned.cons = result.cons;
        }
      }

      // 8. 生成核心能力
      if (!cleaned.core_capabilities || cleaned.core_capabilities.length === 0) {
        if (hasAI) {
          cleaned.core_capabilities = await generateCoreCapabilitiesAI(cleaned);
        } else {
          cleaned.core_capabilities = ['AI 生成', '自动化处理', '数据分析'];
        }
      }

      // 9. 设置默认值
      cleaned.status = 'draft';
      cleaned.is_hot = false;
      cleaned.is_recommended = false;
      cleaned.is_new = true;
      cleaned.is_featured = false;
      cleaned.rating = 0;
      cleaned.sort_order = 999;
      cleaned.run_mode = 'web';
      cleaned.hardware_level = 'none';
      cleaned.learn_level = 'easy';
      cleaned.cn_access = 'accessible';
      cleaned.language = ['en', 'zh'];

      processed.push(cleaned);

      if ((i + 1) % 5 === 0) {
        log(`  已处理 ${i + 1}/${tools.length}（AI模式: ${hasAI ? '开启' : '关闭'}）`, LogLevels.DEBUG);
      }

    } catch (error) {
      log(`  ❌ 处理工具失败 ${tool.name}: ${error.message}`, LogLevels.ERROR);
    }
  }

  log(`处理完成: ${processed.length}/${tools.length}`, LogLevels.SUCCESS);
  return processed;
}

// AI 翻译 + 内容增强（一次 API 调用完成所有翻译）
async function translateAndEnhance(tool) {
  // 如果已有中英文描述，跳过翻译
  if (tool.name_en && tool.description_en) return;

  const inputName = tool.name || tool.name_en || '';
  const inputDesc = tool.description || tool.description_en || '';

  if (!inputName && !inputDesc) return;

  const prompt = `你是一个专业翻译。请翻译以下AI工具信息。

工具名称: ${inputName}
工具描述: ${inputDesc}
工具分类: ${tool.category}

请严格按以下JSON格式返回（不要添加其他内容）：
{"name": "中文名称", "name_en": "English Name", "description": "中文描述（50-100字）", "description_en": "English description (50-100 words)"}

要求：
1. 翻译要准确自然
2. 描述要简洁有力，突出核心价值
3. 英文描述用简洁的英文`;

  const result = await callDeepSeek(prompt, '你是一个专业的中英双语翻译助手，擅长AI工具领域的翻译。');

  if (result) {
    try {
      // 尝试解析 JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name) tool.name = parsed.name;
        if (parsed.name_en) tool.name_en = parsed.name_en;
        if (parsed.description) tool.description = parsed.description.slice(0, 200);
        if (parsed.description_en) tool.description_en = parsed.description_en.slice(0, 200);
      }
    } catch (e) {
      log(`  翻译结果解析失败，使用简单复制`, LogLevels.DEBUG);
      tool.name_en = tool.name_en || tool.name;
      tool.description_en = tool.description_en || tool.description;
    }
  } else {
    tool.name_en = tool.name_en || tool.name;
    tool.description_en = tool.description_en || tool.description;
  }
}

// AI 生成 OPC 场景
async function generateOPCScenariosAI(tool) {
  const prompt = `基于以下AI工具信息，生成3个适合一人公司/OPC创业者的使用场景。

工具名称: ${tool.name}
描述: ${tool.description || tool.description_en}
分类: ${tool.category}

请严格按JSON数组格式返回，每个场景一句话（15-30字），例如：
["场景1", "场景2", "场景3"]`;

  const result = await callDeepSeek(prompt);
  if (result) {
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}
  }
  return generateOPCScenariosFallback(tool.category);
}

// AI 生成业务问题列表
async function generateBusinessQuestionsAI(tool) {
  const prompt = `基于以下AI工具信息，生成3个创业者会问的业务问题。

工具名称: ${tool.name}
描述: ${tool.description || tool.description_en}
分类: ${tool.category}

请严格按JSON数组格式返回，每个问题一句话：
["问题1?", "问题2?", "问题3?"]`;

  const result = await callDeepSeek(prompt);
  if (result) {
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}
  }
  return generateBusinessQuestionsFallback(tool.category);
}

// AI 生成优缺点
async function generateProsAndConsAI(tool) {
  const prompt = `基于以下AI工具信息，生成3个优点和2个缺点。

工具名称: ${tool.name}
描述: ${tool.description || tool.description_en}
分类: ${tool.category}
定价: ${tool.pricing_model || '未知'}

请严格按JSON格式返回：
{"pros": ["优点1", "优点2", "优点3"], "cons": ["缺点1", "缺点2"]}`;

  const result = await callDeepSeek(prompt);
  if (result) {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.pros && parsed.cons) return parsed;
      }
    } catch (e) {}
  }
  return generateProsAndConsFallback(tool);
}

// AI 生成核心能力
async function generateCoreCapabilitiesAI(tool) {
  const prompt = `基于以下AI工具信息，提取3-5个核心能力关键词。

工具名称: ${tool.name}
描述: ${tool.description || tool.description_en}
分类: ${tool.category}

请严格按JSON数组格式返回：
["能力1", "能力2", "能力3"]`;

  const result = await callDeepSeek(prompt);
  if (result) {
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}
  }
  return ['AI 生成', '自动化处理', '数据分析'];
}

function cleanToolData(tool) {
  return {
    name: (tool.name || '').trim().slice(0, 50),
    name_en: (tool.name_en || '').trim().slice(0, 50),
    url: normalizeUrl(tool.url),
    description: (tool.description || '').trim().slice(0, 200),
    description_en: (tool.description_en || '').trim().slice(0, 200),
    tags: Array.isArray(tool.tags) ? tool.tags.slice(0, 10) : [],
    source: tool.source || 'unknown',
    metadata: tool.metadata || {}
  };
}

function normalizeUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (!url.startsWith('http')) url = 'https://' + url;
  return url.replace(/\/$/, '');
}

function inferCategory(tool) {
  const tags = (tool.tags || []).map(t => t.toLowerCase());
  const desc = ((tool.description || '') + ' ' + (tool.description_en || '')).toLowerCase();

  // 先尝试标签匹配
  for (const tag of tags) {
    for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
      if (tag.includes(keyword) && VALID_CATEGORIES.includes(category)) {
        return category;
      }
    }
  }

  // 再尝试描述关键词匹配
  const descKeywords = {
    'ecommerce': ['ecommerce', 'shopify', 'product', 'store', '电商'],
    'content-creation': ['writing', 'blog', 'article', 'content', '写作', '文章'],
    'dev-automation': ['code', 'developer', 'programming', 'debug', '代码', '开发'],
    'design': ['design', 'image', 'graphic', 'logo', '设计', '图片'],
    'marketing': ['marketing', 'seo', 'advertising', 'campaign', '营销', '广告'],
    'audio-video': ['video', 'audio', 'music', 'voice', '视频', '音频'],
    'education': ['education', 'learning', 'teach', '课程', '学习'],
    'ai-customer-service': ['customer', 'support', 'chatbot', '客服'],
    'office-productivity': ['productivity', 'document', 'spreadsheet', '办公'],
    'cross-border-opc': ['cross-border', '跨境电商', '出海']
  };

  for (const [category, keywords] of Object.entries(descKeywords)) {
    for (const kw of keywords) {
      if (desc.includes(kw)) return category;
    }
  }

  return 'ai-tools';
}

function generateSlug(tool) {
  const name = tool.name_en || tool.name;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// Fallback 函数（无 AI 时使用）
function generateOPCScenariosFallback(category) {
  const scenarios = {
    'ecommerce': ['产品图片生成', '商品描述撰写', '客户服务自动化'],
    'content-creation': ['文章创作', '视频脚本生成', '社交媒体内容规划'],
    'office-productivity': ['文档自动化', '数据分析', '会议纪要生成'],
    'dev-automation': ['代码生成', 'Bug 修复', '代码审查'],
    'design': ['Logo 设计', '海报生成', 'UI 设计辅助'],
    'marketing': ['广告文案', 'SEO 优化', '社交媒体营销'],
    'ai-tools': ['AI 工具评测', '技术文档编写', '产品演示制作']
  };
  return scenarios[category] || scenarios['ai-tools'];
}

function generateBusinessQuestionsFallback(category) {
  const questions = {
    'ecommerce': ['如何快速生成电商产品图?', '怎样自动化处理客户咨询?'],
    'content-creation': ['如何用 AI 写文章?', '怎样批量生成视频脚本?'],
    'office-productivity': ['如何提高办公效率?', '怎样自动化数据分析?'],
    'dev-automation': ['如何用 AI 写代码?', '怎样自动化代码审查?'],
    'design': ['如何快速设计 Logo?', '怎样生成营销海报?'],
    'marketing': ['如何写广告文案?', '怎样优化 SEO?'],
    'ai-tools': ['这个工具适合什么场景?', '如何评估 AI 工具效果?']
  };
  return questions[category] || questions['ai-tools'];
}

function generateProsAndConsFallback(tool) {
  return {
    pros: ['功能强大', '界面友好', '持续更新'],
    cons: ['可能需要付费', '学习成本较高']
  };
}
