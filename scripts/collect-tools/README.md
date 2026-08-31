# AI 工具自动采集系统

基于 GitHub Actions 的 AI 工具自动采集和更新系统。

## 功能特性

- ✅ 从 Product Hunt 采集最新 AI 工具
- ✅ 从 GitHub Trending 采集热门开源项目
- ✅ 自动数据清洗和去重
- ✅ 自动翻译和补全缺失字段
- ✅ 批量写入 Cloudflare D1 数据库
- ✅ 生成采集报告

## 目录结构

```
scripts/collect-tools/
├── index.js              # 主入口
├── package.json          # 依赖配置
├── sources/              # 数据源模块
│   ├── producthunt.js    # Product Hunt 采集
│   └── github.js         # GitHub 采集
├── processors/           # 数据处理模块
│   └── main.js           # 数据清洗、翻译、补全
├── db/                   # 数据库操作模块
│   └── d1.js             # Cloudflare D1 操作
├── utils/                # 工具模块
│   ├── logger.js         # 日志工具
│   └── report.js         # 报告生成
└── reports/              # 采集报告目录
```

## 配置环境变量

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加以下环境变量：

- `CLOUDFLARE_API_TOKEN` - Cloudflare API Token (需要 D1 编辑权限)
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare Account ID
- `D1_DATABASE_ID` - D1 数据库 ID
- `PRODUCT_HUNT_API_TOKEN` - Product Hunt API Token (可选)
- `GITHUB_TOKEN` - GitHub Token (自动提供)
- `OPENAI_API_KEY` - OpenAI API Key (可选,用于 AI 翻译)

## 本地运行

```bash
# 1. 安装依赖
cd scripts/collect-tools
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件填入实际的 API 密钥

# 3. 运行采集脚本
node index.js
```

## GitHub Actions 配置

工作流配置文件: `.github/workflows/collect-tools.yml`

触发条件:
- 每天 UTC 2:00 (北京时间 10:00)
- 手动触发: Actions → Collect AI Tools → Run workflow
- 代码更新: push 到 main 分支且修改了 scripts/collect-tools/ 目录

## 数据流程

1. **采集阶段**: 从 Product Hunt 和 GitHub 采集工具列表
2. **去重阶段**: 检查 D1 数据库中是否已存在该 URL
3. **处理阶段**: 
   - 数据清洗和验证
   - 自动推断分类
   - 生成 slug
   - 翻译 (如果配置了 OpenAI)
   - 补全 OPC 场景、业务问题、优缺点等字段
4. **入库阶段**: 批量插入到 D1 数据库 (状态为 draft)
5. **报告阶段**: 生成 JSON 和 Markdown 格式的采集报告

## 数据库表结构

采集系统写入 `tools` 表，包含以下核心字段:

- 基础信息: name, name_en, url, description, description_en
- 分类信息: category, sub_category, tags
- 定价信息: pricing, pricing_detail, payment_info
- OPC 场景: opc_scenario, business_question_list
- 优缺点: pros, cons
- 核心能力: core_capabilities
- 运行信息: run_mode, hardware_level, learn_level
- 状态标记: is_hot, is_recommended, is_new, is_featured
- SEO 信息: seo_title, seo_meta_desc

## 后续优化

- [ ] 集成 OpenAI API 进行智能翻译和内容生成
- [ ] 添加更多数据源 (Hacker News, Reddit, etc.)
- [ ] 实现工具更新检测
- [ ] 添加自动发布规则
- [ ] 实现采集结果邮件通知
- [ ] 添加采集失败重试机制

## 故障排查

### 问题: 数据库插入失败

检查环境变量是否正确配置:
```bash
echo $CLOUDFLARE_API_TOKEN
echo $D1_DATABASE_ID
```

### 问题: Product Hunt 采集失败

确认 Product Hunt API Token 有效:
```bash
curl -H "Authorization: Bearer $PRODUCT_HUNT_API_TOKEN" \
  https://api.producthunt.com/v2/api/graphql
```

### 查看采集报告

报告保存在 `scripts/collect-tools/reports/` 目录下:
```bash
ls -la scripts/collect-tools/reports/
cat scripts/collect-tools/reports/report-*.json | jq
```
