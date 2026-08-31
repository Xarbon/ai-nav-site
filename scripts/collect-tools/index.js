#!/usr/bin/env node

/**
 * AI工具自动采集系统
 * 
 * 功能：
 * 1. 从 Product Hunt 采集新产品
 * 2. 从 GitHub Trending 采集开源AI工具
 * 3. 数据清洗和去重
 * 4. 自动补全缺失字段（翻译、OPC场景等）
 * 5. 写入 D1 数据库
 * 6. 生成采集报告
 */

import { collectFromProductHunt } from './sources/producthunt.js';
import { collectFromGitHub } from './sources/github.js';
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
      github: { collected: 0, new: 0, errors: [] }
    },
    total: { collected: 0, processed: 0, inserted: 0, skipped: 0, errors: [] }
  };

  try {
    // 1. 从 Product Hunt 采集
    log('📡 采集 Product Hunt...', LogLevels.INFO);
    try {
      const phTools = await collectFromProductHunt();
      report.sources.product_hunt.collected = phTools.length;
      log(`✅ Product Hunt: 采集到 ${phTools.length} 个工具`, LogLevels.SUCCESS);
      
      // 2. 从 GitHub Trending 采集
      log('📡 采集 GitHub Trending...', LogLevels.INFO);
      const ghTools = await collectFromGitHub();
      report.sources.github.collected = ghTools.length;
      log(`✅ GitHub: 采集到 ${ghTools.length} 个工具`, LogLevels.SUCCESS);

      // 3. 合并所有工具
      const allTools = [...phTools, ...ghTools];
      report.total.collected = allTools.length;
      log(`📊 总共采集到 ${allTools.length} 个工具`, LogLevels.INFO);

      // 4. 检查已存在的工具
      const existingUrls = await checkExistingTools();
      const newTools = allTools.filter(tool => !existingUrls.has(tool.url));
      log(`🔍 去重后: ${newTools.length} 个新工具`, LogLevels.INFO);

      // 5. 处理工具数据（翻译、生成场景等）
      log('🔄 处理工具数据...', LogLevels.INFO);
      const processedTools = await processTools(newTools);
      report.total.processed = processedTools.length;
      log(`✅ 处理完成: ${processedTools.length} 个工具`, LogLevels.SUCCESS);

      // 6. 批量写入数据库
      if (processedTools.length > 0) {
        log('💾 写入数据库...', LogLevels.INFO);
        const insertResult = await batchInsertTools(processedTools);
        report.total.inserted = insertResult.success;
        report.total.skipped = insertResult.skipped;
        report.total.errors = insertResult.errors;
        log(`✅ 成功插入 ${insertResult.success} 个工具`, LogLevels.SUCCESS);
        if (insertResult.skipped > 0) {
          log(`⚠️  跳过 ${insertResult.skipped} 个工具`, LogLevels.WARNING);
        }
      }

      // 更新各数据源的新增数量
      report.sources.product_hunt.new = phTools.filter(t => 
        processedTools.some(pt => pt.url === t.url)
      ).length;
      report.sources.github.new = ghTools.filter(t => 
        processedTools.some(pt => pt.url === t.url)
      ).length;

    } catch (error) {
      if (error.message.includes('Product Hunt')) {
        report.sources.product_hunt.errors.push(error.message);
        log(`❌ Product Hunt 采集失败: ${error.message}`, LogLevels.ERROR);
      } else if (error.message.includes('GitHub')) {
        report.sources.github.errors.push(error.message);
        log(`❌ GitHub 采集失败: ${error.message}`, LogLevels.ERROR);
      } else {
        throw error;
      }
    }

  } catch (error) {
    log(`❌ 采集过程中发生错误: ${error.message}`, LogLevels.ERROR);
    report.total.errors.push(error.message);
    report.error = error.stack;
  } finally {
    // 7. 生成报告
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    report.endTime = new Date().toISOString();
    report.duration = `${duration}s`;
    
    log('\n📋 采集报告', LogLevels.INFO);
    log(`  总耗时: ${duration}s`, LogLevels.INFO);
    log(`  Product Hunt: ${report.sources.product_hunt.collected} 个 (新增 ${report.sources.product_hunt.new})`, LogLevels.INFO);
    log(`  GitHub: ${report.sources.github.collected} 个 (新增 ${report.sources.github.new})`, LogLevels.INFO);
    log(`  总计: ${report.total.collected} → ${report.total.inserted} 个新工具入库`, LogLevels.INFO);

    await saveReport(report);
    log('📄 报告已保存到 reports/', LogLevels.SUCCESS);

    // 8. 输出退出码
    if (report.total.errors.length > 0) {
      process.exit(1);
    } else {
      log('✨ 采集完成!', LogLevels.SUCCESS);
      process.exit(0);
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
