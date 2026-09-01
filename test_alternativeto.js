import { collectFromFutureTools } from './scripts/collect-tools/sources/futuretools.js';

console.log('=== 测试 AlternativeTo 采集器 ===\n');

try {
  const tools = await collectFromFutureTools();
  console.log(`\n✓ AlternativeTo: 采集到 ${tools.length} 个工具`);
  
  if (tools.length > 0) {
    console.log('\n前 5 个工具示例:');
    tools.slice(0, 5).forEach((t, i) => {
      console.log(`${i+1}. ${t.name}`);
      console.log(`   URL: ${t.url}`);
      console.log(`   分类: ${t.category}`);
      console.log(`   标签: ${t.tags.join(', ')}`);
      console.log('');
    });
  }
} catch (e) {
  console.error(`✗ AlternativeTo 失败: ${e.message}`);
  console.error(e.stack);
}
