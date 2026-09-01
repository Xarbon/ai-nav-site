import { collectFromToolify } from './scripts/collect-tools/sources/toolify.js';
import { collectFromTAAFT } from './scripts/collect-tools/sources/theresanaiforthat.js';

console.log('=== 测试修复后的采集源 ===\n');

// 测试 aitools.fyi
try {
  console.log('[1/2] 测试 aitools.fyi...');
  const tools1 = await collectFromToolify();
  console.log(`✓ aitools.fyi: 采集到 ${tools1.length} 个工具`);
  if (tools1[0]) {
    console.log(`  示例: ${tools1[0].name} - ${tools1[0].url}`);
  }
} catch (e) {
  console.error(`✗ aitools.fyi 失败: ${e.message}`);
}

console.log('');

// 测试 ai-bot.cn
try {
  console.log('[2/2] 测试 ai-bot.cn...');
  const tools2 = await collectFromTAAFT();
  console.log(`✓ ai-bot.cn: 采集到 ${tools2.length} 个工具`);
  if (tools2[0]) {
    console.log(`  示例: ${tools2[0].name} - ${tools2[0].url}`);
    if (tools2[0].description) {
      console.log(`  描述: ${tools2[0].description.substring(0, 50)}...`);
    }
  }
} catch (e) {
  console.error(`✗ ai-bot.cn 失败: ${e.message}`);
}
