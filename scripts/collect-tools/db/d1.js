/**
 * Cloudflare D1 数据库操作模块
 */

import fetch from 'node-fetch';
import { log, LogLevels } from '../utils/logger.js';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export async function checkExistingTools() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    log('⚠️  D1 数据库配置缺失，跳过重复检查', LogLevels.WARNING);
    return new Set();
  }

  try {
    log('查询已存在的工具...', LogLevels.INFO);
    
    const query = `SELECT url FROM tools WHERE status != 'deleted'`;
    const response = await fetch(
      `${CLOUDFLARE_API_BASE}/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: query })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`D1 API error: ${response.status} - ${errorText.substring(0, 300)}`);
    }

    const data = await response.json();
    const urls = new Set(data.result[0].results.map(row => row.url));
    
    log(`找到 ${urls.size} 个已存在的工具`, LogLevels.INFO);
    return urls;

  } catch (error) {
    log(`❌ 查询 D1 失败: ${error.message}`, LogLevels.ERROR);
    return new Set();
  }
}

export async function batchInsertTools(tools) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    log('⚠️  D1 数据库配置缺失，跳过插入', LogLevels.WARNING);
    return { success: 0, skipped: tools.length, errors: ['Database not configured'] };
  }

  const result = {
    success: 0,
    skipped: 0,
    errors: []
  };

  log(`开始插入 ${tools.length} 个工具到 D1...`, LogLevels.INFO);

  // 逐条插入，避免批量失败
  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    
    try {
      const sql = buildInsertSQL(tool);
      
      const response = await fetch(
        `${CLOUDFLARE_API_BASE}/accounts/${accountId}/d1/database/${databaseId}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`D1 API error: ${response.status} - ${errorText.substring(0, 500)}`);
      }

      result.success++;
      
      if ((i + 1) % 10 === 0) {
        log(`  已插入 ${i + 1}/${tools.length}`, LogLevels.INFO);
      }

    } catch (error) {
      log(`  ❌ 插入失败 [${tool.name}]: ${error.message.substring(0, 200)}`, LogLevels.ERROR);
      result.errors.push(`${tool.slug}: ${error.message.substring(0, 100)}`);
    }

    // 避免请求过快
    await sleep(200);
  }

  log(`插入完成: ${result.success} 成功, ${tools.length - result.success} 失败`, LogLevels.SUCCESS);
  if (result.errors.length > 0) {
    log(`错误详情 (前5个):`, LogLevels.WARNING);
    result.errors.slice(0, 5).forEach(e => log(`  - ${e}`, LogLevels.WARNING));
  }
  return result;
}

function buildInsertSQL(tool) {
  const now = new Date().toISOString();
  
  const columns = [
    'id', 'slug', 'name', 'name_en', 'url', 'description', 'description_en',
    'detail', 'detail_en', 'icon_url', 'category', 'sub_category', 'audience_tags',
    'pricing', 'pricing_detail', 'language', 'rating', 'tags',
    'is_hot', 'is_recommended', 'is_new', 'is_featured',
    'affiliate_url', 'workflow', 'sort_order', 'status',
    'created_at', 'updated_at', 'run_mode', 'hardware_level', 'learn_level',
    'hardware_note', 'commercial_notice', 'business_question_list',
    'seo_title', 'seo_meta_desc', 'opc_scenario', 'payment_info', 'cn_access',
    'pros', 'cons', 'core_capabilities',
    'copyright_note', 'pricing_note', 'access_note', 'difficulty_note', 'capability_note', 'scenario_note',
    'opc_scenario_en', 'core_capabilities_en', 'pros_en', 'cons_en', 'business_question_list_en', 'payment_info_en',
    'locale'
  ];

  const values = [
    `lower(hex(randomblob(16)))`,
    strVal(tool.slug),
    strVal(tool.name),
    strVal(tool.name_en || tool.name),
    strVal(tool.url),
    strVal(tool.description),
    strVal(tool.description_en || tool.description),
    'NULL',
    'NULL',
    strVal(tool.icon_url || ''),
    strVal(tool.category),
    strVal(tool.sub_category || ''),
    strVal(JSON.stringify(tool.audience_tags || [])),
    strVal(tool.pricing || 'Free'),
    strVal(tool.pricing_detail || ''),
    strVal(JSON.stringify(tool.language || ['en', 'zh'])),
    `${tool.rating || 0}`,
    strVal(JSON.stringify(tool.tags || [])),
    `${tool.is_hot ? 1 : 0}`,
    `${tool.is_recommended ? 1 : 0}`,
    `${tool.is_new ? 1 : 0}`,
    `${tool.is_featured ? 1 : 0}`,
    strVal(tool.affiliate_url || ''),
    strVal(tool.workflow || ''),
    `${tool.sort_order || 999}`,
    strVal(tool.status || 'draft'),
    strVal(now),
    strVal(now),
    strVal(tool.run_mode || 'web'),
    strVal(tool.hardware_level || 'none'),
    strVal(tool.learn_level || 'easy'),
    'NULL',
    strVal(tool.commercial_notice || ''),
    strVal(JSON.stringify(tool.business_question_list || [])),
    'NULL',
    'NULL',
    strVal(JSON.stringify(tool.opc_scenario || [])),
    strVal(tool.payment_info || ''),
    strVal(tool.cn_access || 'accessible'),
    strVal(JSON.stringify(tool.pros || [])),
    strVal(JSON.stringify(tool.cons || [])),
    strVal(JSON.stringify(tool.core_capabilities || [])),
    'NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL',
    'NULL', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL',
    strVal(tool.locale || 'zh')
  ];

  return `INSERT INTO tools (${columns.join(', ')}) VALUES (${values.join(', ')})`;
}

function strVal(str) {
  if (str === null || str === undefined || str === '') return "''";
  // Escape single quotes and remove control characters
  const clean = String(str)
    .replace(/'/g, "''")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  return `'${clean}'`;
}

function escapeSql(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
