#!/usr/bin/env node

/**
 * AI工具自动采集系统
 * 
 * 数据源：
 * 1. Product Hunt - 新产品发布
 * 2. GitHub Trending - 开源AI项目
 * 3. Toolify.ai - AI工具导航站
 * 4. There's An AI For That - AI工具数据库
 * 5. FutureTools - AI工具聚合
 */

import { collectFromProductHunt } from './sources/producthunt.js';
import { collectFromGitHub } from './sources/github.js';
import { collectFromToolify } from './sources/toolify.js';
import { collectFromTAAFT } from './sources/theresanaiforthat.js';
import { collectFromFutureTools } from './sources/futuretools.js';
import { processTools } from './processors/main.js';
import { batchInsertTools, checkExistingTools } from './db/d1.js';
import { saveReport } from './utils/report.js';
import { log, LogLevels } from './utils/logger.js';

async function main() {
  const startTime = Date.now();
  log('🚀 开始AI工具采集...', LogLevels.INFO);

  const report = {
    startTime: new Date().toISOString(),
    sources: {
      product_hunt: { collected: 0, new: 0, errors: [] },
      github: { collected: 0, new: 0, errors: [] },
      toolify: { collected: 0, new: 0, errors: [] },
      taft: { collected: 0, new: 0, errors: [] },
      futuretools: { collected: 0, new: 0, errors: [] }
    },
    total: { collected: 0, processed: 0, inserted: 0, skipped: 0, errors: [] }
  };

  const allTools = [];

  // ===== 1. 从各个数据源采集 =====

  // Product Hunt
  log('📡 采集 Product Hunt...', LogLevels.INFO);
  try {
    const tools = await collectFromProductHunt();
    report.sources.product_hunt.collected = tools.length;
    allTools.push(...tools);
    log(`✅ Product Hunt: ${tools.length} 个`, LogLevels.SUCCESS);
  } catch (error) {
    report.sources.product_hunt.errors.push(error.message);
    log(`❌ Product Hunt: ${error.message}`, LogLevels.ERROR);
  }

  // GitHub Trending
  log('📡 采集 GitHub Trending...', LogLevels.INFO);
  try {
    const tools = await collectFromGitHub();
    report.sources.github.collected = tools.length;
    allTools.push(...tools);
    log(`✅ GitHub: ${tools.length} 个`, LogLevels.SUCCESS);
  } catch (error) {
    report.sources.github.errors.push(error.message);
    log(`❌ GitHub: ${error.message}`, LogLevels.ERROR);
  }

  // Toolify.ai
  log('📡 采集 Toolify.ai...', LogLevels.INFO);
  try {
    const tools = await collectFromToolify();
    report.sources.toolify.collected = tools.length;
    allTools.push(...tools);
    log(`✅ Toolify.ai: ${tools.length} 个`, LogLevels.SUCCESS);
  } catch (error) {
    report.sources.toolify.errors.push(error.message);
    log(`❌ Toolify.ai: ${error.message}`, LogLevels.ERROR);
  }

  // There's An AI For That
  log('📡 采集 There\'s An AI For That...', LogLevels.INFO);
  try {
    const tools = await collectFromTAAFT();
    report.sources.taft.collected = tools.length;
    allTools.push(...tools);
    log(`✅ TAAFT: ${tools.length} 个`, LogLevels.SUCCESS);
  } catch (error) {
    report.sources.taft.errors.push(error.message);
    log(`❌ TAAFT: ${error.message}`, LogLevels.ERROR);
  }

  // FutureTools
  log('📡 采集 FutureTools...', LogLevels.INFO);
  try {
    const tools = await collectFromFutureTools();
    report.sources.futuretools.collected = tools.length;
    allTools.push(...tools);
    log(`✅ FutureTools: ${tools.length} 个`, LogLevels.SUCCESS);
  } catch (error) {
    report.sources.futuretools.errors.push(error.message);
    log(`❌ FutureTools: ${error.message}`, LogLevels.ERROR);
  }

  // ===== 2. 合并 + 去重 =====
  report.total.collected = allTools.length;
  log(`📊 总共采集: ${allTools.length} 个工具`, LogLevels.INFO);

  // 按 URL 去重（保留第一个）
  const urlSeen = new Set();
  const slugSeen = new Set();
  const uniqueTools = [];
  for (const tool of allTools) {
    const normalizedUrl = tool.url?.replace(/\/$/, '').toLowerCase();
    const normalizedSlug = tool.slug?.toLowerCase();
    // Skip if URL or slug already seen
    if ((normalizedUrl && urlSeen.has(normalizedUrl)) || 
        (normalizedSlug && slugSeen.has(normalizedSlug))) {
      continue;
    }
    if (normalizedUrl) urlSeen.add(normalizedUrl);
    if (normalizedSlug) slugSeen.add(normalizedSlug);
    uniqueTools.push(tool);
  }
  log(`🔗 URL/Slug 去重后: ${uniqueTools.length} 个`, LogLevels.INFO);

  // ===== 3. 数据库去重 =====
  try {
    const existingUrls = await checkExistingTools();
    const newTools = uniqueTools.filter(tool => {
      const normalizedUrl = tool.url?.replace(/\/$/, '').toLowerCase();
      return !existingUrls.has(normalizedUrl) && !existingUrls.has(tool.url);
    });
    log(`🆕 数据库去重后: ${newTools.length} 个新工具`, LogLevels.INFO);

    // ===== 4. AI 处理（翻译、补全）=====
    log('🔄 处理工具数据...', LogLevels.INFO);
    const processedTools = await processTools(newTools);
    report.total.processed = processedTools.length;
    log(`✅ 处理完成: ${processedTools.length} 个`, LogLevels.SUCCESS);

    // ===== 5. 写入数据库 =====
    if (processedTools.length > 0) {
      log('💾 写入 D1 数据库...', LogLevels.INFO);
      const insertResult = await batchInsertTools(processedTools);
      report.total.inserted = insertResult.success;
      report.total.skipped = insertResult.skipped;
      report.total.errors = insertResult.errors;
      log(`✅ 入库: ${insertResult.success} 个, 跳过: ${insertResult.skipped} 个`, LogLevels.SUCCESS);
    }

    // 统计各数据源新增
    const sourceMap = {
      producthunt: 'product_hunt',
      github: 'github',
      toolify: 'toolify',
      theresanaiforthat: 'taft',
      futuretools: 'futuretools'
    };
    for (const key of Object.keys(sourceMap)) {
      const dbKey = sourceMap[key];
      report.sources[dbKey].new = processedTools.filter(t => t.source === key).length;
    }

  } catch (error) {
    log(`❌ 处理/入库失败: ${error.message}`, LogLevels.ERROR);
    report.total.errors.push(error.message);
  }

  // ===== 6. 生成报告 =====
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  report.endTime = new Date().toISOString();
  report.duration = `${duration}s`;

  log('\n📋 采集报告', LogLevels.INFO);
  log(`  总耗时: ${duration}s`, LogLevels.INFO);
  log(`  Product Hunt: ${report.sources.product_hunt.collected} 个 (新增 ${report.sources.product_hunt.new})`, LogLevels.INFO);
  log(`  GitHub: ${report.sources.github.collected} 个 (新增 ${report.sources.github.new})`, LogLevels.INFO);
  log(`  Toolify.ai: ${report.sources.toolify.collected} 个 (新增 ${report.sources.toolify.new})`, LogLevels.INFO);
  log(`  TAAFT: ${report.sources.taft.collected} 个 (新增 ${report.sources.taft.new})`, LogLevels.INFO);
  log(`  FutureTools: ${report.sources.futuretools.collected} 个 (新增 ${report.sources.futuretools.new})`, LogLevels.INFO);
  log(`  合计: ${report.total.collected} → ${report.total.inserted} 个新工具入库`, LogLevels.INFO);

  await saveReport(report);

  // Don't fail on insertion errors (e.g., duplicate slugs) - they're expected
  // Only log them as warnings. The workflow should succeed as long as collection worked.
  log('✨ 采集完成!', LogLevels.SUCCESS);
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

