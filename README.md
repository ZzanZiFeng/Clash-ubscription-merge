# Clash Subscription Merge

一个用于合并多个 Clash 订阅配置的工具。

## 功能特性

- 合并多个 Clash 订阅链接
- 自动去重代理节点
- 保留自定义规则和代理组
- 支持本地运行和 Netlify Functions 部署

## 安装

```bash
git clone https://github.com/ZzanZiFeng/Clash-ubscription-merge.git
cd Clash-ubscription-merge
npm install
```

## 本地运行

```bash
npm start
```

服务器将在 http://localhost:3000 启动。

## 使用方法

### 网页界面

1. 访问 http://localhost:3000
2. 在文本框中输入订阅链接（每行一个或逗号分隔）
3. 点击 "Merge" 按钮

### API 接口

直接访问合并端点：

```
GET /merge?urls=<subscription_urls>
```

示例：

```
http://localhost:3000/merge?urls=https://example.com/sub1,https://example.com/sub2
```

## 部署到 Netlify

1. 将代码推送到 GitHub
2. 在 Netlify 中连接你的 GitHub 仓库
3. 设置构建命令为空（或 `npm install`）
4. 设置发布目录为 `.`
5. Functions 目录会自动检测为 `functions`

部署后，访问你的 Netlify 域名即可使用。

## 技术栈

- Node.js
- Express.js
- Axios (HTTP 请求)
- js-yaml (YAML 处理)
- serverless-http (Netlify Functions 支持)

## License

ISC
