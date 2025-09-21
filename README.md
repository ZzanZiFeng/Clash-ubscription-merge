# Clash 订阅合并服务

这是一个简单的 Web 服务，旨在将多个 Clash 订阅链接合并成一个统一的配置文件。它会将一套自定义的规则、代理组和 DNS 设置应用到合并后的订阅中，为您提供强大且个性化的 Clash 使用体验。

## 功能特性

- **合并多个订阅**: 将来自不同订阅链接的代理服务器合并到一个配置中。
- **自定义规则**: 应用您自己的一套规则来控制流量走向。
- **自动代理组**: 根据地区（如：香港、台湾、新加坡、日本、美国）自动创建代理组。
- **移除重复代理**: 自动删除名称相同的重复代理。
- **使用简单**: 只需运行服务，并在 URL 中提供您的订阅链接即可。

## 环境要求

在开始之前，请确保您已安装以下软件：
- [Node.js](https://nodejs.org/) (建议使用 v14 或更高版本)
- [npm](https://www.npmjs.com/) (通常随 Node.js 一起安装)

## 安装步骤

1.  **克隆或下载项目文件:**
    如果您安装了 Git，可以克隆本仓库。否则，直接下载 `index.js`, `clash-rules.js`, 和 `package.json` 这几个文件。

2.  **进入项目目录:**
    ```bash
    cd /path/to/Clash-ubscription-merge
    ```

3.  **安装依赖:**
    运行以下命令来安装所需的支持库 (`express`, `axios`, `js-yaml`)。
    ```bash
    npm install
    ```

## 如何使用

1.  **启动服务:**
    在您的终端中运行以下命令来启动 Web 服务。
    ```bash
    node index.js
    ```
    您应该会看到一条消息，提示服务已在 3000 端口上运行。

2.  **构建合并 URL:**
    本服务提供了一个 `/merge` 接口，它接受一个用逗号分隔的订阅链接列表。URL 格式如下：

    ```
    http://localhost:3000/merge?urls=<链接1>,<链接2>,<链接3>...
    ```

    **请将 `<链接1>`, `<链接2>` 等替换为您自己的 Clash 订阅链接。**

3.  **添加到您的 Clash 客户端:**
    - 复制上一步中构建好的完整 URL。
    - 打开您的 Clash 客户端 (例如 Clash Verge, Clash for Windows 等)。
    - 前往 “Profiles” (配置) 部分，通过 URL 新增一个配置文件。
    - 粘贴您的 URL 并保存。
    - 您的 Clash 客户端现在将会获取到合并并应用了自定义规则的配置。

### 使用示例

假设您有两个订阅链接：
- `https://example.com/mysub1.yaml`
- `https://another.com/mysub2.yaml`

那么您需要使用的合并 URL 是：
```
http://localhost:3000/merge?urls=https://example.com/mysub1.yaml,https://another.com/mysub2.yaml
```

## 自定义配置

所有的自定义逻辑，包括规则、代理组和 DNS 设置，都位于 `clash-rules.js` 文件中。您可以修改此文件以满足您的个性化需求。

- **自定义规则**: 如果要添加最高优先级的您自己的规则，请编辑 `overwriteRules` 函数中的 `customRules` 数组。
- **代理组**: 如果要更改代理组的创建方式或添加新的代理组，请修改 `overwriteProxyGroups` 函数。
- **DNS 设置**: 如果要调整 DNS 设置（例如首选的 DNS 服务器），请修改 `overwriteDns` 函数。