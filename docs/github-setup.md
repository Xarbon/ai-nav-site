# GitHub 配置指南

## 1. 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 仓库名称: `ai-nav-site`
4. 描述: `AI 工具导航网站 - 基于 Next.js + Cloudflare Workers + D1`
5. 设为 Private（推荐）
6. 点击 "Create repository"

## 2. 配置 GitHub Token

### 方式 A: 使用 Personal Access Token（推荐）

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. Token 名称: `ai-nav-site-deploy`
4. 选择权限:
   - ✅ repo (Full control of private repositories)
   - ✅ workflow (Update GitHub Action workflows)
5. 点击 "Generate token"
6. **复制生成的 token**（只显示一次）

### 配置到 Git

```bash
# 方式 1: 使用 credential helper（推荐）
git config --global credential.helper store
git remote set-url origin https://<你的用户名>:<token>@github.com/kobecai/ai-nav-site.git

# 方式 2: 使用环境变量
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
git remote set-url origin https://x-access-token:${GITHUB_TOKEN}@github.com/kobecai/ai-nav-site.git
```

## 3. 推送代码到 GitHub

```bash
cd /root/.coze/agents/7670082612630782251/workspace/ai-nav-site
git push -u origin main
```

## 4. 配置 GitHub Secrets

在 GitHub 仓库中配置环境变量：

1. 进入仓库页面
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 添加以下 Secrets:

### 必需的 Secrets

```yaml
CLOUDFLARE_API_TOKEN: REDACTED_CLOUDFLARE_TOKEN
CLOUDFLARE_ACCOUNT_ID: de4e3ec96835f552a36829beb4951724
D1_DATABASE_ID: c5523847-81df-448f-b2bf-0a5ea8ed6ab9
```

### 可选的 Secrets

```yaml
PRODUCT_HUNT_API_TOKEN: <你的 Product Hunt API Token>
OPENAI_API_KEY: <你的 OpenAI API Key>
```

## 5. 测试 GitHub Actions

1. 进入仓库 → "Actions" 标签
2. 应该能看到 "Collect AI Tools" 工作流
3. 点击 "Run workflow" → "Run workflow" 手动触发
4. 等待运行完成
5. 查看运行结果和日志

## 6. 查看采集报告

运行完成后，报告会自动上传到 Artifacts：

1. 进入 Actions → 选择运行记录
2. 向下滚动到 "Artifacts" 部分
3. 点击 "collection-report-xxxxx" 下载
4. 解压查看 JSON 和 Markdown 报告

## 7. 自动运行

工作流配置为每天 UTC 2:00（北京时间 10:00）自动运行。

如需修改运行时间，编辑 `.github/workflows/collect-tools.yml`:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # UTC 2:00
```

## 故障排查

### 问题: 无法推送到 GitHub

```bash
# 检查 token 是否正确
echo $GITHUB_TOKEN

# 重新配置 remote URL
git remote set-url origin https://<用户名>:<token>@github.com/kobecai/ai-nav-site.git
```

### 问题: Actions 运行失败

1. 检查 Secrets 是否正确配置
2. 查看 Actions 运行日志
3. 确认 Cloudflare API Token 有 D1 编辑权限

### 问题: 采集报告为空

1. 确认数据源 API 正常工作
2. 检查网络请求是否成功
3. 查看详细的错误日志
