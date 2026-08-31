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
      throw new Error(`D1 API error: ${response.status}`);
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

  // 批量插入，每批 10 个
  const batchSize = 10;
  for (let i = 0; i < tools.length; i += batchSize) {
    const batch = tools.slice(i, i + batchSize);
    
    try {
      const sql = buildInsertSQL(batch);
      
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
        throw new Error(`D1 API error: ${response.status}`);
      }

      result.success += batch.length;
      
      if ((i + batchSize) % 50 === 0) {
        log(`  已插入 ${i + batchSize}/${tools.length}`, LogLevels.DEBUG);
      }

    } catch (error) {
      log(`  ❌ 批量插入失败: ${error.message}`, LogLevels.ERROR);
      result.errors.push(`Batch ${i}-${i + batchSize}: ${error.message}`);
    }

    // 避免请求过快
    await sleep(500);
  }

  log(`插入完成: ${result.success} 成功, ${result.skipped} 跳过`, LogLevels.SUCCESS);
  return result;
}

function buildInsertSQL(tools) {
  const values = tools.map(tool => {
    const fields = [
      `'${escapeSql(tool.slug)}'`,
      `'${escapeSql(tool.name)}'`,
      `'${escapeSql(tool.name_en || tool.name)}'`,
      `'${escapeSql(tool.url)}'`,
      `'${escapeSql(tool.description)}'`,
      `'${escapeSql(tool.description_en || tool.description)}'`,
      `'${escapeSql(tool.category)}'`,
      `'${escapeSql(tool.sub_category || '')}'`,
      `'${JSON.stringify(tool.tags || [])}'`,
      `'${escapeSql(tool.pricing || 'Free')}'`,
      `'${escapeSql(tool.pricing_detail || '')}'`,
      `'${JSON.stringify(tool.language || ['en', 'zh'])}'`,
      `${tool.rating || 0}`,
      `'${JSON.stringify(tool.opc_scenario || [])}'`,
      `'${escapeSql(tool.payment_info || '')}'`,
      `'${escapeSql(tool.cn_access || 'accessible')}'`,
      `'${JSON.stringify(tool.pros || [])}'`,
      `'${JSON.stringify(tool.cons || [])}'`,
      `'${JSON.stringify(tool.core_capabilities || [])}'`,
      `'${tool.run_mode || 'web'}'`,
      `'${tool.hardware_level || 'none'}'`,
      `'${tool.learn_level || 'easy'}'`,
      `${tool.is_hot ? 1 : 0}`,
      `${tool.is_recommended ? 1 : 0}`,
      `${tool.is_new ? 1 : 0}`,
      `${tool.is_featured ? 1 : 0}`,
      `'${escapeSql(tool.affiliate_url || '')}'`,
      `'${escapeSql(tool.workflow || '')}'`,
      `${tool.sort_order || 999}`,
      `'${escapeSql(tool.status || 'draft')}'`
    ];
    return `(${fields.join(', ')})`;
  }).join(',\n');

  return `INSERT INTO tools (
    slug, name, name_en, url, description, description_en,
    category, sub_category, tags, pricing, pricing_detail,
    language, rating, opc_scenario, payment_info, cn_access,
    pros, cons, core_capabilities, run_mode, hardware_level,
    learn_level, is_hot, is_recommended, is_new, is_featured,
    affiliate_url, workflow, sort_order, status
  ) VALUES\n${values}`;
}

function escapeSql(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
