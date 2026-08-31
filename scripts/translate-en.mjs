/**
 * 批量翻译工具数据字段为英文 (优化版)
 * - 一次性拉取所有数据
 * - 并行翻译（控制并发）
 * - 批量生成 SQL 文件
 * - 一次性执行
 */
import { execSync } from 'child_process';
import fs from 'fs';

const DB_NAME = 'aiqury-db';

async function d1Query(sql) {
  const cmd = `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN} npx wrangler d1 execute ${DB_NAME} --remote --command="${sql.replace(/"/g, '\\"')}" --json 2>/dev/null`;
  const result = execSync(cmd, { timeout: 30000 }).toString();
  const parsed = JSON.parse(result);
  return parsed[0]?.results || [];
}

async function d1Exec(sql) {
  const tmpFile = '/tmp/d1_batch.sql';
  fs.writeFileSync(tmpFile, sql);
  const cmd = `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN} npx wrangler d1 execute ${DB_NAME} --remote --file=${tmpFile} 2>/dev/null`;
  execSync(cmd, { timeout: 60000 });
  return true;
}

// MyMemory Translation API
async function translate(text, from = 'zh-CN', to = 'en-US') {
  if (!text || text.trim() === '') return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${from}|${to}`;
    const resp = await fetch(url, { timeout: 10000 });
    const data = await resp.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch (e) {
    return text;
  }
}

async function translateArray(jsonStr, concurrency = 3) {
  if (!jsonStr) return '[]';
  let arr;
  try { arr = JSON.parse(jsonStr); } catch { return jsonStr; }
  if (!Array.isArray(arr) || arr.length === 0) return '[]';
  
  const translated = [];
  // Translate in batches with concurrency limit
  for (let i = 0; i < arr.length; i += concurrency) {
    const batch = arr.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(item => typeof item === 'string' && item.trim() ? translate(item) : Promise.resolve(item))
    );
    translated.push(...results);
  }
  return JSON.stringify(translated);
}

async function main() {
  console.log('🌐 开始批量翻译...\n');
  
  // 1. 一次性拉取所有工具
  const tools = await d1Query(`SELECT id, slug, name, opc_scenario, core_capabilities, pros, cons, business_question_list, payment_info, opc_scenario_en, core_capabilities_en FROM tools WHERE status = 'active'`);
  console.log(`📦 找到 ${tools.length} 个工具`);
  
  // 2. 筛选需要翻译的
  const needTranslate = tools.filter(t => 
    !(t.opc_scenario_en && t.opc_scenario_en !== '[]' && t.core_capabilities_en && t.core_capabilities_en !== '[]')
  );
  console.log(`🔄 需要翻译: ${needTranslate.length} 个\n`);
  
  let translated = 0;
  const sqlStatements = [];
  
  for (const tool of needTranslate) {
    console.log(`[${translated + 1}/${needTranslate.length}] ${tool.name}`);
    
    const updates = [];
    
    // 并行翻译所有字段
    const [opcEn, capEn, prosEn, consEn, bizEn, payEn] = await Promise.all([
      tool.opc_scenario && tool.opc_scenario !== '[]' ? translateArray(tool.opc_scenario) : null,
      tool.core_capabilities && tool.core_capabilities !== '[]' ? translateArray(tool.core_capabilities) : null,
      tool.pros && tool.pros !== '[]' ? translateArray(tool.pros) : null,
      tool.cons && tool.cons !== '[]' ? translateArray(tool.cons) : null,
      tool.business_question_list && tool.business_question_list !== '[]' ? translateArray(tool.business_question_list) : null,
      tool.payment_info && tool.payment_info.trim() ? translate(tool.payment_info) : null,
    ]);
    
    if (opcEn) updates.push(`opc_scenario_en = '${opcEn.replace(/'/g, "''")}'`);
    if (capEn) updates.push(`core_capabilities_en = '${capEn.replace(/'/g, "''")}'`);
    if (prosEn) updates.push(`pros_en = '${prosEn.replace(/'/g, "''")}'`);
    if (consEn) updates.push(`cons_en = '${consEn.replace(/'/g, "''")}'`);
    if (bizEn) updates.push(`business_question_list_en = '${bizEn.replace(/'/g, "''")}'`);
    if (payEn) updates.push(`payment_info_en = '${payEn.replace(/'/g, "''")}'`);
    
    if (updates.length > 0) {
      sqlStatements.push(`UPDATE tools SET ${updates.join(', ')} WHERE id = '${tool.id}';`);
      translated++;
    }
    
    // 每 20 个工具批量执行一次
    if (sqlStatements.length >= 20) {
      console.log(`  💾 批量保存 ${sqlStatements.length} 条...`);
      await d1Exec(sqlStatements.join('\n'));
      sqlStatements.length = 0;
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  // 保存剩余的
  if (sqlStatements.length > 0) {
    console.log(`💾 批量保存最后 ${sqlStatements.length} 条...`);
    await d1Exec(sqlStatements.join('\n'));
  }
  
  console.log(`\n✅ 翻译完成！共翻译 ${translated} 个工具`);
}

main().catch(console.error);
