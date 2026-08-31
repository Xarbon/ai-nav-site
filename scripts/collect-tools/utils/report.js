/**
 * 报告生成模块
 */

import fs from 'fs/promises';
import path from 'path';
import { log, LogLevels } from './logger.js';

const REPORT_DIR = 'scripts/collect-tools/reports';

export async function saveReport(report) {
  try {
    await fs.mkdir(REPORT_DIR, { recursive: true });
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const reportFile = path.join(REPORT_DIR, `report-${dateStr}-${timeStr}.json`);
    
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    log(`📄 报告已保存: ${reportFile}`, LogLevels.SUCCESS);
    
  } catch (error) {
    log(`❌ 保存报告失败: ${error.message}`, LogLevels.ERROR);
  }
}
