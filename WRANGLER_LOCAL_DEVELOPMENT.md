# Wrangler 本地开发完整指南

## 项目概述

这是一个基于 Cloudflare Workers 的 Clash 订阅合并服务，使用 Wrangler CLI 进行本地开发和部署。项目支持将多个 Clash 订阅链接合并成一个统一的配置文件，并部署到 Cloudflare 的全球边缘网络。

**项目功能：**

- 合并多个 Clash 订阅链接
- 支持 VLESS、Hysteria2 等协议解析
- 自动去重和规则配置
- 全球 CDN 加速访问
- 无服务器架构，按需计费

## 环境要求

### 必需软件

- **Node.js**: 版本 18.x 或更高（Cloudflare Workers 要求）
- **npm**: 版本 8.x 或更高
- **Git**: 用于版本控制
- **Wrangler CLI**: Cloudflare Workers 开发工具

### 推荐工具

- **VS Code**: 代码编辑器
- **Cloudflare Workers 扩展**: VS Code 插件
- **Postman/Insomnia**: API 测试工具
- **Clash Verge**: Clash 客户端测试

## 安装和配置

### 1. 安装 Node.js 和 npm

**macOS (使用 Homebrew):**

```bash
# 安装 Homebrew (如果未安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js 18+
brew install node@18

# 验证安装
node --version  # 应该显示 18.x.x 或更高
npm --version
```

**Windows:**

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本 (18.x 或更高)
3. 运行安装程序
4. 验证安装

**Linux (Ubuntu/Debian):**

```bash
# 使用 NodeSource 仓库安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 Wrangler CLI

```bash
# 全局安装 Wrangler CLI
npm install -g wrangler

# 验证安装
wrangler --version
```

**或者使用 npx (推荐):**

```bash
# 使用 npx 运行，无需全局安装
npx wrangler --version
```

### 3. 克隆项目

```bash
# 克隆项目到本地
git clone https://github.com/ZzanZiFeng/Clash-ubscription-merge.git

# 进入项目目录
cd Clash-ubscription-merge
```

### 4. 安装项目依赖

```bash
# 安装依赖包
npm install

# 验证依赖安装
npm list
```

## Cloudflare 账户配置

### 1. 创建 Cloudflare 账户

1. 访问 [Cloudflare 官网](https://cloudflare.com)
2. 注册或登录账户
3. 完成邮箱验证

### 2. 获取 API Token

**方法一：使用 Wrangler 登录**

```bash
# 使用浏览器登录
wrangler login

# 或者使用 API Token
wrangler auth login
```

**方法二：手动创建 API Token**

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 "Create Token"
3. 选择 "Custom token"
4. 配置权限：
   - **Account**: `Cloudflare Workers:Edit`
   - **Zone**: `Zone:Read` (如果需要自定义域名)
5. 复制生成的 Token

### 3. 配置 Wrangler

```bash
# 设置 API Token
wrangler config

# 或者设置环境变量
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

## 项目结构详解

```
Clash-ubscription-merge/
├── src/                      # 源代码目录
│   └── worker.js             # Cloudflare Worker 主文件
├── wrangler.toml             # Wrangler 配置文件
├── package.json              # 项目依赖配置
├── .gitignore                # Git 忽略文件
└── README.md                 # 项目说明文档
```

### 核心文件说明

**`src/worker.js`** - Cloudflare Worker 主文件

- 处理 HTTP 请求
- 解析代理协议 (VLESS, Hysteria2)
- 合并订阅配置
- 生成最终 YAML 配置

**`wrangler.toml`** - Wrangler 配置文件

```toml
name = "clash-subscription-merge"
main = "src/worker.js"
compatibility_date = "2024-05-02"
```

**配置选项详解：**

```toml
name = "clash-subscription-merge"        # Worker 名称
main = "src/worker.js"                   # 入口文件
compatibility_date = "2024-05-02"        # 兼容性日期
compatibility_flags = ["nodejs_compat"]  # 兼容性标志

# 环境变量
[vars]
ENVIRONMENT = "development"

# 密钥管理
[[kv_namespaces]]
binding = "MY_KV_NAMESPACE"
id = "your-kv-namespace-id"

# 自定义域名
routes = [
  { pattern = "example.com/*", custom_domain = true }
]

# 构建配置
[build]
command = "npm run build"
cwd = "src"
watch_dir = "src"
```

## 本地开发流程

### 1. 启动本地开发服务器

```bash
# 启动 Wrangler 本地开发环境
wrangler dev

# 指定端口
wrangler dev --port 8787

# 指定本地协议
wrangler dev --local-protocol https

# 启用本地持久化
wrangler dev --persist-to ./wrangler-data
```

**预期输出：**

```
⎔ Starting local server...
[wrangler:info] Local server listening on http://localhost:8787
[wrangler:info] Your worker has access to the following bindings:
[wrangler:info] - KV Namespaces:
[wrangler:info]   - MY_KV_NAMESPACE: <namespace-id>
[wrangler:info] Ready on http://localhost:8787
```

### 2. 访问应用

打开浏览器访问：`http://localhost:8787`

**功能测试：**

1. 在文本框中输入订阅链接
2. 点击 "Merge" 按钮
3. 查看生成的 YAML 配置

### 3. API 接口测试

**直接 API 调用：**

```bash
# 使用 curl 测试
curl "http://localhost:8787/merge?urls=https://example.com/subscription1,https://example.com/subscription2"

# 使用 Postman 测试
GET http://localhost:8787/merge?urls=订阅链接1,订阅链接2
```

**测试用例：**

```bash
# 测试单个订阅
curl "http://localhost:8787/merge?urls=https://raw.githubusercontent.com/example/clash-config/main/config.yaml"

# 测试多个订阅
curl "http://localhost:8787/merge?urls=https://example1.com/sub,https://example2.com/sub"

# 测试错误处理
curl "http://localhost:8787/merge?urls=invalid-url"
```

## 开发调试技巧

### 1. 日志调试

**在 `src/worker.js` 中添加日志：**

```javascript
console.log("Processing subscription:", link);
console.log("Parsed proxies count:", proxies.length);
console.log("Final config:", JSON.stringify(finalConfig, null, 2));

// 使用结构化日志
console.log(
  JSON.stringify({
    level: "info",
    message: "Processing subscription",
    url: link,
    timestamp: new Date().toISOString(),
  })
);
```

**查看日志：**

```bash
# 查看实时日志
wrangler dev --local

# 查看生产环境日志
wrangler tail

# 查看特定 Worker 日志
wrangler tail clash-subscription-merge
```

### 2. 本地测试不同协议

**VLESS 协议测试：**

```javascript
const vlessUri =
  "vless://uuid@server:port?security=tls&sni=example.com#节点名称";
```

**Hysteria2 协议测试：**

```javascript
const hysteria2Uri =
  "hysteria2://password@server:port?sni=example.com#节点名称";
```

### 3. 热重载和实时调试

Wrangler Dev 支持热重载，修改代码后会自动重启：

```bash
# 修改 src/worker.js 后，Worker 会自动重启
# 无需手动重启 wrangler dev
```

**调试模式：**

```bash
# 启用调试模式
wrangler dev --inspect

# 使用 Chrome DevTools 调试
# 访问 chrome://inspect
```

### 4. 环境变量管理

**在 `wrangler.toml` 中定义环境变量：**

```toml
[vars]
ENVIRONMENT = "development"
MAX_SUBSCRIPTIONS = "10"
CACHE_DURATION = "300000"
```

**在代码中使用：**

```javascript
const environment = env.ENVIRONMENT;
const maxSubscriptions = parseInt(env.MAX_SUBSCRIPTIONS);
const cacheDuration = parseInt(env.CACHE_DURATION);
```

## 部署流程

### 1. 部署到 Cloudflare Workers

**首次部署：**

```bash
# 部署到 Cloudflare Workers
wrangler deploy

# 部署到预览环境
wrangler deploy --env preview
```

**后续部署：**

```bash
# 部署到生产环境
wrangler deploy

# 部署特定环境
wrangler deploy --env production
```

### 2. 自定义域名配置

**在 `wrangler.toml` 中配置路由：**

```toml
routes = [
  { pattern = "clash.example.com/*", custom_domain = true }
]
```

**部署后配置：**

```bash
# 添加自定义域名
wrangler custom-domains add clash.example.com

# 查看域名状态
wrangler custom-domains list
```

### 3. 环境管理

**创建不同环境：**

```toml
# wrangler.toml
[env.development]
name = "clash-subscription-merge-dev"

[env.staging]
name = "clash-subscription-merge-staging"

[env.production]
name = "clash-subscription-merge"
```

**部署到不同环境：**

```bash
# 部署到开发环境
wrangler deploy --env development

# 部署到预发布环境
wrangler deploy --env staging

# 部署到生产环境
wrangler deploy --env production
```

## 高级功能

### 1. KV 存储集成

**创建 KV 命名空间：**

```bash
# 创建 KV 命名空间
wrangler kv:namespace create "CACHE"

# 查看命名空间
wrangler kv:namespace list
```

**在 `wrangler.toml` 中配置：**

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

**在代码中使用：**

```javascript
// 存储数据
await env.CACHE.put("key", "value");

// 获取数据
const value = await env.CACHE.get("key");

// 删除数据
await env.CACHE.delete("key");
```

### 2. Durable Objects 集成

**定义 Durable Object：**

```javascript
// src/durable-object.js
export class Counter {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    const count = (await this.state.storage.get("count")) || 0;
    await this.state.storage.put("count", count + 1);
    return new Response(count.toString());
  }
}
```

**在 `wrangler.toml` 中配置：**

```toml
[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"
```

### 3. R2 存储集成

**创建 R2 存储桶：**

```bash
# 创建 R2 存储桶
wrangler r2 bucket create my-bucket
```

**在 `wrangler.toml` 中配置：**

```toml
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"
```

**在代码中使用：**

```javascript
// 上传文件
await env.MY_BUCKET.put("file.txt", "content");

// 下载文件
const object = await env.MY_BUCKET.get("file.txt");
const content = await object.text();
```

## 性能优化

### 1. 缓存机制

```javascript
// 使用 KV 存储实现缓存
async function getCachedSubscription(url, env) {
  const cacheKey = `subscription:${btoa(url)}`;
  const cached = await env.CACHE.get(cacheKey);

  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp < CACHE_DURATION) {
      return data.content;
    }
  }
  return null;
}

async function setCachedSubscription(url, content, env) {
  const cacheKey = `subscription:${btoa(url)}`;
  const data = {
    content,
    timestamp: Date.now(),
  };
  await env.CACHE.put(cacheKey, JSON.stringify(data));
}
```

### 2. 并发处理

```javascript
// 使用 Promise.all 并发获取订阅
const subscriptionPromises = subLinks.map(async (link) => {
  const response = await fetch(link);
  return parseSubscription(await response.text());
});

const results = await Promise.all(subscriptionPromises);
```

### 3. 内存优化

```javascript
// 及时清理大对象
let mergedProxies = [];
// ... 处理逻辑
mergedProxies = null; // 释放内存

// 使用流式处理大文件
const stream = new ReadableStream({
  start(controller) {
    // 流式处理逻辑
  },
});
```

## 测试策略

### 1. 单元测试

```bash
# 安装测试框架
npm install --save-dev jest @cloudflare/workers-types

# 创建测试文件
mkdir tests
touch tests/worker.test.js
```

**测试示例：**

```javascript
// tests/worker.test.js
import { handleRequest } from "../src/worker.js";

describe("Worker Tests", () => {
  test("should handle merge request", async () => {
    const request = new Request(
      "http://localhost/merge?urls=https://example.com/sub"
    );
    const response = await handleRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/yaml");
  });
});
```

**运行测试：**

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 2. 集成测试

```bash
# 使用 Wrangler 进行集成测试
wrangler dev --test-scheduled

# 测试定时任务
wrangler dev --test-scheduled --local
```

### 3. 端到端测试

```javascript
// 使用 Playwright 进行 E2E 测试
const { test, expect } = require("@playwright/test");

test("should display merge form", async ({ page }) => {
  await page.goto("http://localhost:8787");
  await expect(page.locator("h1")).toContainText("Clash Subscription Merge");
  await expect(page.locator("textarea")).toBeVisible();
});
```

## 监控和日志

### 1. 应用监控

```javascript
// 添加性能监控
const startTime = Date.now();
// ... 处理逻辑
const duration = Date.now() - startTime;
console.log(`Processing time: ${duration}ms`);
```

### 2. 错误监控

```javascript
// 添加错误捕获
addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Rejection:", event.reason);
  // 发送到监控服务
});

addEventListener("error", (event) => {
  console.error("Error:", event.error);
  // 发送到监控服务
});
```

### 3. 日志管理

```javascript
// 使用结构化日志
const logger = {
  info: (message, meta = {}) => {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  },
  error: (message, error = {}) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
```

## 安全考虑

### 1. 输入验证

```javascript
// 验证订阅链接格式
function validateSubscriptionUrl(url) {
  try {
    const urlObj = new URL(url);
    return ["http:", "https:"].includes(urlObj.protocol);
  } catch {
    return false;
  }
}
```

### 2. 速率限制

```javascript
// 使用 KV 存储实现速率限制
async function checkRateLimit(ip, env) {
  const key = `rate_limit:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分钟
  const maxRequests = 10; // 最多10个请求

  const requests = await env.CACHE.get(key);
  const requestTimes = requests ? JSON.parse(requests) : [];
  const validRequests = requestTimes.filter((time) => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return false;
  }

  validRequests.push(now);
  await env.CACHE.put(key, JSON.stringify(validRequests), {
    expirationTtl: 60,
  });
  return true;
}
```

### 3. 内容安全

```javascript
// 限制订阅大小
const MAX_SUBSCRIPTION_SIZE = 1024 * 1024; // 1MB

if (response.length > MAX_SUBSCRIPTION_SIZE) {
  throw new Error("Subscription too large");
}
```

## 常见问题解决

### 1. 端口冲突

**问题：** 端口 8787 被占用
**解决方案：**

```bash
# 使用其他端口
wrangler dev --port 3000

# 或者杀死占用端口的进程
lsof -ti:8787 | xargs kill -9
```

### 2. 依赖安装失败

**问题：** npm install 失败
**解决方案：**

```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 3. Wrangler 认证问题

**问题：** wrangler login 失败
**解决方案：**

```bash
# 重新登录
wrangler logout
wrangler login

# 或者使用 API Token
wrangler auth login
```

### 4. Worker 执行超时

**问题：** 合并大量订阅时超时
**解决方案：**

```toml
# 在 wrangler.toml 中增加超时时间
[limits]
cpu_ms = 50000  # 50秒 CPU 时间
```

### 5. 订阅链接访问失败

**问题：** 某些订阅链接无法访问
**解决方案：**

```javascript
// 添加重试机制和错误处理
const response = await fetch(link, {
  headers: {
    "User-Agent": "clash-verge/1.5.11",
  },
  // Cloudflare Workers 不支持 timeout 选项
  // 需要手动实现超时逻辑
});
```

## 部署最佳实践

### 1. 环境变量管理

```bash
# 创建 .env 文件
echo "ENVIRONMENT=development" > .env
echo "MAX_SUBSCRIPTIONS=10" >> .env
echo "CACHE_DURATION=300000" >> .env
```

### 2. 健康检查

```javascript
// 添加健康检查端点
if (url.pathname === "/health") {
  return new Response(
    JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    }),
    {
      headers: { "content-type": "application/json" },
    }
  );
}
```

### 3. 版本管理

```bash
# 使用 Git 标签管理版本
git tag v1.0.0
git push origin v1.0.0

# 部署特定版本
wrangler deploy --compatibility-date 2024-01-01
```

## 故障排除

### 1. 常见错误代码

| 错误代码 | 含义           | 解决方案               |
| -------- | -------------- | ---------------------- |
| 500      | 服务器内部错误 | 检查日志，修复代码错误 |
| 400      | 请求参数错误   | 验证输入参数格式       |
| 404      | 资源未找到     | 检查路由配置           |
| 502      | 网关错误       | 检查 Worker 配置       |

### 2. 调试工具

```bash
# 使用 Wrangler 调试器
wrangler dev --inspect

# 使用 Chrome DevTools
# 访问 chrome://inspect
```

### 3. 性能分析

```bash
# 使用 Wrangler 分析工具
wrangler dev --local --inspect

# 查看 Worker 指标
wrangler tail --format pretty
```

## 总结

这份文档涵盖了 Wrangler 本地开发的完整流程，从环境搭建到部署上线的每个环节。通过遵循这些最佳实践，你可以：

1. **快速搭建 Cloudflare Workers 开发环境**
2. **高效进行本地调试和测试**
3. **顺利部署到 Cloudflare 全球网络**
4. **维护和优化 Worker 性能**

**有用的链接：**

- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers 运行时 API](https://developers.cloudflare.com/workers/runtime-apis/)
- [Cloudflare Workers 示例](https://github.com/cloudflare/workers-examples)

祝你开发愉快！🚀
