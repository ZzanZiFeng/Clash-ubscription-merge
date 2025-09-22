# Netlify 本地开发完整指南

## 项目概述

这是一个 Clash 订阅合并服务，支持将多个 Clash 订阅链接合并成一个统一的配置文件。项目使用 Node.js + Express 构建，部署在 Netlify Functions 上。

**项目功能：**

- 合并多个 Clash 订阅链接
- 支持 VLESS、Hysteria2 等协议解析
- 自动去重和规则配置
- 提供 Web 界面和 API 接口

## 环境要求

### 必需软件

- **Node.js**: 版本 16.x 或更高
- **npm**: 版本 8.x 或更高
- **Git**: 用于版本控制
- **Netlify CLI**: 用于本地开发和部署

### 推荐工具

- **VS Code**: 代码编辑器
- **Postman/Insomnia**: API 测试工具
- **Clash Verge**: Clash 客户端测试

## 安装和配置

### 1. 安装 Node.js 和 npm

**macOS (使用 Homebrew):**

```bash
# 安装 Homebrew (如果未安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node

# 验证安装
node --version
npm --version
```

**Windows:**

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本
3. 运行安装程序
4. 验证安装

**Linux (Ubuntu/Debian):**

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 Netlify CLI

```bash
# 全局安装 Netlify CLI
npm install -g netlify-cli

# 验证安装
netlify --version
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

## 项目结构详解

```
Clash-ubscription-merge/
├── functions/                 # Netlify Functions 目录
│   ├── server.js             # 主服务器函数
│   └── clash-rules.js        # Clash 规则配置
├── src/                      # 源代码目录
│   └── worker.js             # Cloudflare Worker 版本
├── netlify.toml              # Netlify 配置文件
├── package.json              # 项目依赖配置
├── vercel.json               # Vercel 部署配置
├── wrangler.toml             # Cloudflare Worker 配置
└── README.md                 # 项目说明文档
```

### 核心文件说明

**`functions/server.js`** - 主服务器函数

- 处理 HTTP 请求
- 解析代理协议 (VLESS, Hysteria2)
- 合并订阅配置
- 生成最终 YAML 配置

**`functions/clash-rules.js`** - 规则配置

- 定义代理组规则
- 配置 DNS 设置
- 设置分流规则
- 管理代理分组

**`netlify.toml`** - Netlify 配置

```toml
[build]
  command = "npm install"
  functions = "functions"

[functions]
  included_files = ["functions/clash-rules.js"]

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

## 本地开发流程

### 1. 启动本地开发服务器

```bash
# 启动 Netlify 本地开发环境
netlify dev

# 或者指定端口
netlify dev --port 8888
```

**预期输出：**

```
◈ Netlify Dev ◈
◈ Starting Netlify Dev with netlify-cli/15.0.0
◈ Local server ready
◈ Functions server is running on port 8889
◈ Local server ready on http://localhost:8888
```

### 2. 访问应用

打开浏览器访问：`http://localhost:8888`

**功能测试：**

1. 在文本框中输入订阅链接
2. 点击 "Merge" 按钮
3. 查看生成的 YAML 配置

### 3. API 接口测试

**直接 API 调用：**

```bash
# 使用 curl 测试
curl "http://localhost:8888/merge?urls=https://example.com/subscription1,https://example.com/subscription2"

# 使用 Postman 测试
GET http://localhost:8888/merge?urls=订阅链接1,订阅链接2
```

**测试用例：**

```bash
# 测试单个订阅
curl "http://localhost:8888/merge?urls=https://raw.githubusercontent.com/example/clash-config/main/config.yaml"

# 测试多个订阅
curl "http://localhost:8888/merge?urls=https://example1.com/sub,https://example2.com/sub"
```

## 开发调试技巧

### 1. 日志调试

**在 `functions/server.js` 中添加日志：**

```javascript
console.log("Processing subscription:", link);
console.log("Parsed proxies count:", proxies.length);
console.log("Final config:", JSON.stringify(finalConfig, null, 2));
```

**查看日志：**

```bash
# 在另一个终端查看实时日志
netlify dev --live

# 或者查看 Netlify 函数日志
netlify functions:log
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

### 3. 配置热重载

Netlify Dev 支持热重载，修改代码后会自动重启：

```bash
# 修改 functions/server.js 后，服务器会自动重启
# 无需手动重启 netlify dev
```

## 部署流程

### 1. 部署到 Netlify

**首次部署：**

```bash
# 创建新站点并部署
netlify deploy --create-site clash-subscription-merge --prod
```

**后续部署：**

```bash
# 部署到生产环境
netlify deploy --prod

# 部署到预览环境
netlify deploy
```

### 2. 部署到其他平台

**Vercel 部署：**

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署到 Vercel
vercel --prod
```

**Cloudflare Workers 部署：**

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 部署到 Cloudflare Workers
wrangler deploy
```

## 常见问题解决

### 1. 端口冲突

**问题：** 端口 8888 被占用
**解决方案：**

```bash
# 使用其他端口
netlify dev --port 3000

# 或者杀死占用端口的进程
lsof -ti:8888 | xargs kill -9
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

### 3. Netlify CLI 认证问题

**问题：** netlify login 失败
**解决方案：**

```bash
# 重新登录
netlify logout
netlify login

# 或者使用浏览器登录
netlify login --browser
```

### 4. 函数执行超时

**问题：** 合并大量订阅时超时
**解决方案：**

```javascript
// 在 netlify.toml 中增加超时时间
[functions];
included_files = ["functions/clash-rules.js"];
timeout = 30;
```

### 5. 订阅链接访问失败

**问题：** 某些订阅链接无法访问
**解决方案：**

```javascript
// 添加重试机制和错误处理
const response = await axios.get(link, {
  headers: {
    "User-Agent": "clash-verge/1.5.11",
  },
  timeout: 10000, // 10秒超时
  retry: 3, // 重试3次
});
```

## 性能优化

### 1. 缓存机制

```javascript
// 添加订阅缓存
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

function getCachedSubscription(url) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}
```

### 2. 并发处理

```javascript
// 使用 Promise.all 并发获取订阅
const subscriptionPromises = subLinks.map(async (link) => {
  const response = await axios.get(link);
  return parseSubscription(response.data);
});

const results = await Promise.all(subscriptionPromises);
```

### 3. 内存优化

```javascript
// 及时清理大对象
let mergedProxies = [];
// ... 处理逻辑
mergedProxies = null; // 释放内存
```

## 测试策略

### 1. 单元测试

```bash
# 安装测试框架
npm install --save-dev jest supertest

# 创建测试文件
mkdir tests
touch tests/server.test.js
```

**测试示例：**

```javascript
const request = require("supertest");
const app = require("../functions/server");

describe("Subscription Merge API", () => {
  test("should merge subscriptions successfully", async () => {
    const response = await request(app)
      .get("/merge")
      .query({ urls: "https://example.com/sub" });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/yaml");
  });
});
```

### 2. 集成测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 3. 端到端测试

```javascript
// 使用 Playwright 进行 E2E 测试
const { test, expect } = require("@playwright/test");

test("should display merge form", async ({ page }) => {
  await page.goto("http://localhost:8888");
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
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // 发送到监控服务
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
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
// 添加速率限制
const rateLimit = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分钟
  const maxRequests = 10; // 最多10个请求

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }

  const requests = rateLimit.get(ip);
  const validRequests = requests.filter((time) => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return false;
  }

  validRequests.push(now);
  rateLimit.set(ip, validRequests);
  return true;
}
```

### 3. 内容安全

```javascript
// 限制订阅大小
const MAX_SUBSCRIPTION_SIZE = 1024 * 1024; // 1MB

if (response.data.length > MAX_SUBSCRIPTION_SIZE) {
  throw new Error("Subscription too large");
}
```

## 部署最佳实践

### 1. 环境变量管理

```bash
# 创建 .env 文件
echo "NODE_ENV=development" > .env
echo "MAX_SUBSCRIPTIONS=10" >> .env
echo "CACHE_DURATION=300000" >> .env
```

### 2. 健康检查

```javascript
// 添加健康检查端点
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

### 3. 优雅关闭

```javascript
// 处理优雅关闭
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});
```

## 故障排除

### 1. 常见错误代码

| 错误代码 | 含义           | 解决方案               |
| -------- | -------------- | ---------------------- |
| 500      | 服务器内部错误 | 检查日志，修复代码错误 |
| 400      | 请求参数错误   | 验证输入参数格式       |
| 404      | 资源未找到     | 检查路由配置           |
| 502      | 网关错误       | 检查函数配置           |

### 2. 调试工具

```bash
# 使用 Node.js 调试器
node --inspect functions/server.js

# 使用 Chrome DevTools
# 访问 chrome://inspect
```

### 3. 性能分析

```bash
# 使用 clinic.js 进行性能分析
npm install -g clinic
clinic doctor -- node functions/server.js
```

## 总结

这份文档涵盖了 Netlify 本地开发的完整流程，从环境搭建到部署上线的每个环节。通过遵循这些最佳实践，你可以：

1. **快速搭建开发环境**
2. **高效进行本地调试**
3. **顺利部署到生产环境**
4. **维护和优化应用性能**

记住，开发过程中遇到问题时，首先查看日志，然后使用调试工具，最后参考这份文档的故障排除部分。

**有用的链接：**

- [Netlify CLI 文档](https://docs.netlify.com/cli/get-started/)
- [Netlify Functions 文档](https://docs.netlify.com/functions/overview/)
- [Node.js 官方文档](https://nodejs.org/docs/)
- [Express.js 文档](https://expressjs.com/)

祝你开发愉快！🚀
