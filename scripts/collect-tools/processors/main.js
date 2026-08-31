/**
 * 数据处理模块
 * 负责清洗、翻译、补全工具数据
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

// 分类映射（从外部数据源映射到系统分类）
const CATEGORY_MAP = {
  'artificial-intelligence': 'ai-tools',
  'machine-learning': 'ai-tools',
  'developer-tools': 'dev-automation',
  'productivity': 'office-productivity',
  'design': 'design',
  'marketing': 'marketing',
  'writing': 'content-creation',
  'ai': 'ai-tools',
  'chatbot': 'customer-service',
  'automation': 'dev-automation'
};

// 有效分类列表
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
  
  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    
    try {
      // 1. 基础数据清洗
      const cleaned = cleanToolData(tool);
      
      // 2. 分类推断
      cleaned.category = inferCategory(cleaned);
      
      // 3. 生成 slug
      cleaned.slug = generateSlug(cleaned);
      
      // 4. 翻译（如果配置了 OpenAI）
      if (process.env.OPENAI_API_KEY) {
        await translateTool(cleaned);
      } else {
        // 简单翻译：复制中文名到英文
        cleaned.name_en = cleaned.name_en || cleaned.name;
        cleaned.description_en = cleaned.description_en || cleaned.description;
      }
      
      // 5. 生成 OPC 场景（如果为空）
      if (!cleaned.opc_scenario || cleaned.opc_scenario.length === 0) {
        cleaned.opc_scenario = generateOPCScenarios(cleaned.category);
      }
      
      // 6. 生成业务问题列表（如果为空）
      if (!cleaned.business_question_list || cleaned.business_question_list.length === 0) {
        cleaned.business_question_list = generateBusinessQuestions(cleaned);
      }
      
      // 7. 生成优缺点（如果为空）
      if (!cleaned.pros || cleaned.pros.length === 0) {
        const { pros, cons } = generateProsAndCons(cleaned);
        cleaned.pros = pros;
        cleaned.cons = cons;
      }
      
      // 8. 生成核心能力（如果为空）
      if (!cleaned.core_capabilities || cleaned.core_capabilities.length === 0) {
        cleaned.core_capabilities = generateCoreCapabilities(cleaned);
      }
      
      // 9. 设置默认值
      cleaned.status = 'draft'; // 新工具默认为草稿状态
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
      
      if ((i + 1) % 10 === 0) {
        log(`  已处理 ${i + 1}/${tools.length}`, LogLevels.DEBUG);
      }
      
    } catch (error) {
      log(`  ❌ 处理工具失败 ${tool.name}: ${error.message}`, LogLevels.ERROR);
    }
  }
  
  log(`处理完成: ${processed.length}/${tools.length}`, LogLevels.SUCCESS);
  return processed;
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
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  // 移除尾部斜杠
  return url.replace(/\/$/, '');
}

function inferCategory(tool) {
  // 从标签推断分类
  const tags = (tool.tags || []).map(t => t.toLowerCase());
  
  for (const tag of tags) {
    for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
      if (tag.includes(keyword)) {
        if (VALID_CATEGORIES.includes(category)) {
          return category;
        }
      }
    }
  }
  
  // 默认分类
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

async function translateTool(tool) {
  // TODO: 集成 OpenAI API 进行翻译
  // 目前使用简单复制
  tool.name_en = tool.name_en || tool.name;
  tool.description_en = tool.description_en || tool.description;
}

function generateOPCScenarios(category) {
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

function generateBusinessQuestions(tool) {
  const category = tool.category;
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

function generateProsAndCons(tool) {
  const pros = [
    '功能强大',
    '界面友好',
    '持续更新'
  ];
  
  const cons = [
    '可能需要付费',
    '学习成本较高',
    '国内访问可能受限'
  ];
  
  return { pros, cons };
}

function generateCoreCapabilities(tool) {
  return [
    'AI 生成',
    '自动化处理',
    '数据分析'
  ];
}
