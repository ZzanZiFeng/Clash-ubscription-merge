// Cloudflare Workers version that exactly mimics Netlify
// Import js-yaml - this works in Cloudflare Workers with proper bundling
import yaml from 'js-yaml';

// Parser for different proxy protocols - copied from Netlify version
function parseProxyUri(uri) {
    try {
        const protocol = uri.split('://')[0];
        switch (protocol) {
            case 'vless':
                return parseVlessUri(uri);
            case 'hysteria2':
                return parseHysteria2Uri(uri);
            // Add other protocols like ss, trojan here if needed
            default:
                console.warn(`Unsupported protocol: ${protocol}`);
                return null;
        }
    } catch (error) {
        console.error(`Error parsing URI: ${uri}`, error);
        return null;
    }
}

function parseVlessUri(uri) {
    try {
        const url = new URL(uri);
        const params = url.searchParams;
        const proxy = {
            name: decodeURIComponent(url.hash.substring(1)).trim(),
            type: 'vless',
            server: url.hostname,
            port: parseInt(url.port, 10),
            uuid: url.username,
            network: params.get('type') || 'tcp',
            tls: params.get('security') === 'tls',
            udp: true,
        };

        if (proxy.tls) {
            proxy.servername = params.get('sni') || params.get('host') || proxy.server;
            proxy['client-fingerprint'] = params.get('fp') || 'chrome';
            if (params.get('flow')) {
                proxy.flow = params.get('flow');
            }
        }

        if (proxy.network === 'ws') {
            proxy['ws-opts'] = {
                path: params.get('path') || '/',
                headers: {
                    Host: params.get('host') || proxy.server
                }
            };
        }
        return proxy;
    } catch (e) {
        console.error(`Failed to parse VLESS URI: ${uri}`, e);
        return null;
    }
}

function parseHysteria2Uri(uri) {
    try {
        const url = new URL(uri);
        const params = url.searchParams;
        const proxy = {
            name: decodeURIComponent(url.hash.substring(1)).trim(),
            type: 'hysteria2',
            server: url.hostname,
            port: parseInt(url.port, 10),
            password: url.username,
            sni: params.get('sni') || url.hostname,
            'skip-cert-verify': params.get('insecure') === '1' || params.get('skip-cert-verify') === 'true',
        };
        if (params.get('up')) proxy['up'] = params.get('up');
        if (params.get('down')) proxy['down'] = params.get('down');
        return proxy;
    } catch (e) {
        console.error(`Failed to parse Hysteria2 URI: ${uri}`, e);
        return null;
    }
}

// COMPLETE clash-rules.js implementation - copied exactly from Netlify version
const proxyName = "代理模式";

function main(params) {
    if (!params.proxies) return params;
    overwriteRules(params);
    overwriteProxyGroups(params);
    overwriteDns(params);
    return params;
}

// 覆写规则
function overwriteRules(params) {
    const customRules = [
      // 在此添加自定义规则，最高优先级。
      // 为了方便区分，可设置 全局代理模式 或 自定义代理组。
      // 示例 1 ：使用 全局代理模式
      //"DOMAIN-SUFFIX,linux.do," + proxyName,
      // 示例 2 ：使用 自定义代理组 1
      //"DOMAIN-SUFFIX,gstatic.com, 自定义代理组 1",
      // 示例 3 ：使用 自定义代理组 2
      //"DOMAIN-SUFFIX,googleapis.com, 自定义代理组 2",
    ];

    const rules = [
        ...customRules,
        "RULE-SET,reject, 广告拦截",
        "RULE-SET,direct,DIRECT",
        "RULE-SET,cncidr,DIRECT",
        "RULE-SET,private,DIRECT",
        "RULE-SET,lancidr,DIRECT",
        "GEOIP,LAN,DIRECT,no-resolve",
        "GEOIP,CN,DIRECT,no-resolve",
        "RULE-SET,applications,DIRECT",
        "RULE-SET,openai,ChatGPT",
        "RULE-SET,claude,Claude",
        "RULE-SET,spotify,Spotify",
        "RULE-SET,telegramcidr,电报消息,no-resolve",
        "RULE-SET,tld-not-cn," + proxyName,
        "RULE-SET,google," + proxyName,
        "RULE-SET,icloud," + proxyName,
        "RULE-SET,apple," + proxyName,
        "RULE-SET,gfw," + proxyName,
        "RULE-SET,greatfire," + proxyName,
        "RULE-SET,proxy," + proxyName,
        "MATCH, 漏网之鱼",
    ];
    const ruleProviders = {
        reject: {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
            path: "./ruleset/reject.yaml",
            interval: 86400,
        },
        icloud: {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
            path: "./ruleset/icloud.yaml",
            interval: 86400,
        },
        apple: {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
            path: "./ruleset/apple.yaml",
            interval: 86400,
        },
        google: {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
            path: "./ruleset/google.yaml",
            interval: 86400,
        },
        proxy: {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
            path: "./ruleset/proxy.yaml",
            interval: 86400,
        },
        openai: {
            type: "http",
            behavior: "classical",
            url: "https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OpenAI/OpenAI.yaml",
            path: "./ruleset/custom/openai.yaml"
        },
        claude: {
            type: "http",
            behavior: "classical",
            url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Claude/Claude.yaml",
            path: "./ruleset/custom/Claude.yaml"
        },
        spotify: {
            type: "http",
            behavior: "classical",
            url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Spotify/Spotify.yaml",
            path: "./ruleset/custom/Spotify.yaml"
        },
        telegramcidr: {
            type: "http",
            behavior: "ipcidr",
            url: "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
            path: "./ruleset/custom/telegramcidr.yaml"
        },
        direct: {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
            path: "./ruleset/direct.yaml",
            interval: 86400,
        },
        private: {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
            path: "./ruleset/private.yaml",
            interval: 86400,
        },
        gfw: {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
            path: "./ruleset/gfw.yaml",
            interval: 86400,
        },
        greatfire: {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/greatfire.txt",
            path: "./ruleset/greatfire.yaml",
            interval: 86400,
        },
        "tld-not-cn": {
            type: "http",
            behavior: "domain",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
            path: "./ruleset/tld-not-cn.yaml",
            interval: 86400,
        },
        cncidr: {
            type: "http",
            behavior: "ipcidr",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
            path: "./ruleset/cncidr.yaml",
            interval: 86400,
        },
        lancidr: {
            type: "http",
            behavior: "ipcidr",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
            path: "./ruleset/lancidr.yaml",
            interval: 86400,
        },
        applications: {
            type: "http",
            behavior: "classical",
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
            path: "./ruleset/applications.yaml",
            interval: 86400,
        },
    };
    params["rule-providers"] = ruleProviders;
    params["rules"] = rules;
}

// IP地区检测函数
function detectProxyRegion(proxy) {
    const server = proxy.server;
    const name = proxy.name;

    // 跳过无关节点（如剩余流量、到期时间等）
    if (/剩余|到期|主页|官网|游戏|关注|流量|期限|时间|有效/.test(name)) {
        return null; // 返回null表示不是有效的代理节点
    }

    // 通过节点名称检测地区（优先级最高）
    if (/ 香港 | HK|Hong|🇭🇰/.test(name)) return 'HK';
    if (/ 台湾 | TW|Taiwan|Wan|🇨🇳|🇹🇼/.test(name)) return 'TW';
    if (/ 新加坡 | 狮城 | SG|Singapore|🇸🇬/.test(name)) return 'SG';
    if (/ 日本 | JP|Japan|🇯🇵/.test(name)) return 'JP';
    if (/ 美国 | US|United States|America|🇺🇸/.test(name)) return 'US';
    if (/ 英国 | UK|United Kingdom|England|🏴󠁧󠁢󠁥󠁮󠁧󠁿/.test(name)) return 'UK';
    if (/ 加拿大 | CA|Canada|🇨🇦/.test(name)) return 'CA';
    if (/ 德国 | DE|Germany|🇩🇪/.test(name)) return 'DE';
    if (/ 法国 | FR|France|🇫🇷/.test(name)) return 'FR';
    if (/ 澳大利亚 | AU|Australia|🇦🇺/.test(name)) return 'AU';
    if (/ 澳门 | MO|Macao|🇲🇴/.test(name)) return 'MO';
    if (/ 韩国 | KR|Korea|🇰🇷/.test(name)) return 'KR';
    if (/ 荷兰 | NL|Netherlands|🇳🇱/.test(name)) return 'NL';

    // 通过IP段检测地区（简化版本，实际可以使用更精确的IP数据库）
    const ip = server;

    // 香港IP段（部分）
    if (/^103\.10\./.test(ip) || /^103\.21\./.test(ip) || /^103\.31\./.test(ip)) return 'HK';
    // 新加坡IP段（部分）
    if (/^103\.28\./.test(ip) || /^103\.225\./.test(ip)) return 'SG';
    // 日本IP段（部分）
    if (/^138\.2\./.test(ip) || /^203\.10\./.test(ip)) return 'JP';
    // 美国IP段（部分）
    if (/^108\.181\./.test(ip) || /^208\.87\./.test(ip) || /^63\.141\./.test(ip) || /^199\.168\./.test(ip) || /^107\.150\./.test(ip) || /^192\.151\./.test(ip) || /^173\.208\./.test(ip) || /^142\.54\./.test(ip)) return 'US';
    // 澳大利亚IP段（部分）
    if (/^192\.9\./.test(ip)) return 'AU';
    // 荷兰IP段（部分）
    if (/^204\.10\./.test(ip)) return 'NL';

    return 'OTHER'; // 其他地区
}

// 地区信息映射
const regionInfo = {
    'HK': { name: '香港', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/hk.svg' },
    'TW': { name: '台湾', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/tw.svg' },
    'SG': { name: '新加坡', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/sg.svg' },
    'JP': { name: '日本', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/jp.svg' },
    'US': { name: '美国', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/us.svg' },
    'UK': { name: '英国', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/uk.svg' },
    'CA': { name: '加拿大', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/ca.svg' },
    'DE': { name: '德国', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/de.svg' },
    'FR': { name: '法国', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/fr.svg' },
    'AU': { name: '澳大利亚', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/au.svg' },
    'MO': { name: '澳门', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/mo.svg' },
    'KR': { name: '韩国', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/kr.svg' },
    'NL': { name: '荷兰', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/nl.svg' },
    'OTHER': { name: '其它', icon: 'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/link.svg' }
};

// 覆写代理组
function overwriteProxyGroups(params) {
    // 添加自用代理
    params.proxies.push(
        //  { name: '1 - 香港 - 示例 ', type: *, server: **, port: *, cipher: **, password: **, udp: true }
    );

    // 所有代理
    const allProxies = params["proxies"].map((e) => e.name);

    // 获取订阅分组信息
    const subscriptionGroups = params.subscriptionGroups || [];

    // 为每个订阅创建地区分组
    const subscriptionRegionGroups = [];
    const subscriptionAutoGroups = [];
    const subscriptionManualGroups = [];

    subscriptionGroups.forEach(sub => {
        // 按地区分组该订阅的节点
        const regionGroups = {};

        // 获取该订阅的实际代理对象
        const subProxies = params.proxies.filter(proxy => sub.proxies.includes(proxy.name));

        subProxies.forEach(proxy => {
            const region = detectProxyRegion(proxy);
            if (region && region !== null) { // 跳过无效节点
                if (!regionGroups[region]) {
                    regionGroups[region] = [];
                }
                regionGroups[region].push(proxy.name);
            }
        });

        // 为每个有节点的地区创建代理组
        Object.keys(regionGroups).forEach(region => {
            if (regionGroups[region].length > 0) {
                const regionName = regionInfo[region].name;

                // 订阅+地区的自动选择组
                subscriptionRegionGroups.push({
                    name: `${sub.name} - ${regionName}`,
                    type: "url-test",
                    url: "http://www.gstatic.com/generate_204",
                    interval: 300,
                    tolerance: 50,
                    proxies: regionGroups[region],
                    icon: regionInfo[region].icon,
                    hidden: false,
                });
            }
        });

        // 订阅总体自动选择组（包含该订阅所有节点）
        subscriptionAutoGroups.push({
            name: `${sub.name} - 自动选择`,
            type: "url-test",
            url: "http://www.gstatic.com/generate_204",
            interval: 300,
            tolerance: 50,
            proxies: sub.proxies,
            hidden: true,
        });

        // 订阅手工选择组
        subscriptionManualGroups.push({
            name: `${sub.name} - 手工选择`,
            type: "select",
            proxies: sub.proxies,
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/link.svg",
            hidden: false,
        });
    });

    // 全局地区自动选择组（所有订阅的同地区节点）
    const globalRegionGroups = {};
    params.proxies.forEach(proxy => {
        const region = detectProxyRegion(proxy);
        if (region && region !== null) { // 跳过无效节点
            if (!globalRegionGroups[region]) {
                globalRegionGroups[region] = [];
            }
            globalRegionGroups[region].push(proxy.name);
        }
    });

    const globalAutoGroups = Object.keys(globalRegionGroups)
        .filter(region => globalRegionGroups[region].length > 0)
        .map(region => ({
            name: `${regionInfo[region].name} - 全局选择`,
            type: "url-test",
            url: "http://www.gstatic.com/generate_204",
            interval: 300,
            tolerance: 50,
            proxies: globalRegionGroups[region],
            icon: regionInfo[region].icon,
            hidden: true,
        }));

    // 生成自动选择的选项列表（去重）
    const autoSelectionOptions = [];

    // 添加订阅自动选择
    subscriptionAutoGroups.forEach(group => {
        if (!autoSelectionOptions.includes(group.name)) {
            autoSelectionOptions.push(group.name);
        }
    });

    // 添加全局地区自动选择
    globalAutoGroups.forEach(group => {
        if (!autoSelectionOptions.includes(group.name)) {
            autoSelectionOptions.push(group.name);
        }
    });

    // 添加ALL自动选择
    autoSelectionOptions.push("ALL - 自动选择");

    const groups = [
        {
            name: proxyName,
            type: "select",
            url: "http://www.gstatic.com/generate_204",
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/adjust.svg",
            proxies: [
                "自动选择",
                "手动选择",
                "负载均衡 (散列)",
                "负载均衡 (轮询)",
                "DIRECT",
            ],
        },
        {
            name: "手动选择",
            type: "select",
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/link.svg",
            proxies: allProxies,
        },
        {
            name: "自动选择",
            type: "select",
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/speed.svg",
            proxies: autoSelectionOptions,
        },
        {
            name: "负载均衡 (散列)",
            type: "load-balance",
            url: "http://www.gstatic.com/generate_204",
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/balance.svg",
            interval: 300,
            "max-failed-times": 3,
            strategy: "consistent-hashing",
            lazy: true,
            proxies: allProxies,
        },
        {
            name: "负载均衡 (轮询)",
            type: "load-balance",
            url: "http://www.gstatic.com/generate_204",
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/merry_go.svg",
            interval: 300,
            "max-failed-times": 3,
            strategy: "round-robin",
            lazy: true,
            proxies: allProxies,
        },
        {
            name: "ALL - 自动选择",
            type: "url-test",
            url: "http://www.gstatic.com/generate_204",
            interval: 300,
            tolerance: 50,
            proxies: allProxies,
            hidden: true,
        },
        {
            name: "电报消息",
            type: "select",
            proxies: [proxyName, ...autoSelectionOptions.slice(0, -1)], // 除了ALL自动选择
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/telegram.svg"
        },
        {
            name: "ChatGPT",
            type: "select",
            proxies: [proxyName, ...autoSelectionOptions.slice(0, -1)], // 除了ALL自动选择
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/chatgpt.svg"
        },
        {
            name: "Claude",
            type: "select",
            proxies: [proxyName, ...autoSelectionOptions.slice(0, -1)], // 除了ALL自动选择
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/claude.svg"
        },
        {
            name: "Spotify",
            type: "select",
            proxies: [proxyName, ...autoSelectionOptions.slice(0, -1)], // 除了ALL自动选择
            icon: "https://storage.googleapis.com/spotifynewsroom-jp.appspot.com/1/2020/12/Spotify_Icon_CMYK_Green.png"
        },
        {
            name: "漏网之鱼",
            type: "select",
            proxies: ["DIRECT", proxyName],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/fish.svg"
        },
        {
            name: "广告拦截",
            type: "select",
            proxies: ["REJECT", "DIRECT", proxyName],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/block.svg"
        },
    ];

    // 将所有分组添加到groups中
    groups.push(...subscriptionAutoGroups);         // 订阅自动选择组
    groups.push(...globalAutoGroups);               // 全局地区自动选择组
    groups.push(...subscriptionRegionGroups);       // 订阅+地区分组
    groups.push(...subscriptionManualGroups);       // 订阅手工选择组

    // 清理订阅分组信息，避免在最终配置中出现
    delete params.subscriptionGroups;

    params["proxy-groups"] = groups;
}

// 防止 dns 泄露
function overwriteDns(params) {
    const cnDnsList = [
        "https://223.5.5.5/dns-query",
        "https://1.12.12.12/dns-query",
    ];
    const trustDnsList = [
        'quic://dns.cooluc.com',
        "https://1.0.0.1/dns-query",
        "https://1.1.1.1/dns-query",
    ];

    const dnsOptions = {
        enable: true,
        "prefer-h3": true, // 如果 DNS 服务器支持 DoH3 会优先使用 h3
        "default-nameserver": cnDnsList, // 用于解析其他 DNS 服务器、和节点的域名，必须为 IP, 可为加密 DNS。注意这个只用来解析节点和其他的 dns，其他网络请求不归他管
        nameserver: trustDnsList, // 其他网络请求都归他管

        // 这个用于覆盖上面的 nameserver
        "nameserver-policy": {
            //[combinedUrls]: notionDns,
            "geosite:cn": cnDnsList,
            "geosite:geolocation-!cn": trustDnsList,
            // 如果你有一些内网使用的 DNS，应该定义在这里，多个域名用英文逗号分割
            // '+. 公司域名.com, www.4399.com, +.baidu.com': '10.0.0.1'
        },
        fallback: trustDnsList,
        "fallback-filter": {
            geoip: true,
            // 除了 geoip-code 配置的国家 IP, 其他的 IP 结果会被视为污染 geoip-code 配置的国家的结果会直接采用，否则将采用 fallback 结果
            "geoip-code": "CN",
            //geosite 列表的内容被视为已污染，匹配到 geosite 的域名，将只使用 fallback 解析，不去使用 nameserver
            geosite: ["gfw"],
            ipcidr: ["240.0.0.0/4"],
            domain: ["+.google.com", "+.facebook.com", "+.youtube.com"],
        },
    };

    // GitHub 加速前缀
    const githubPrefix = "https://fastgh.lainbo.com/";

    // GEO 数据 GitHub 资源原始下载地址
    const rawGeoxURLs = {
        geoip:
            "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat",
        geosite:
            "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
        mmdb: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb",
    };

    // 生成带有加速前缀的 GEO 数据资源对象
    const accelURLs = Object.fromEntries(
        Object.entries(rawGeoxURLs).map(([key, githubUrl]) => [
            key,
            `${githubPrefix}${githubUrl}`,
        ])
    );

    const otherOptions = {
        "unified-delay": true,
        "tcp-concurrent": true,
        profile: {
            "store-selected": true,
            "store-fake-ip": true,
        },
        sniffer: {
            enable: true,
            sniff: {
                TLS: {
                    ports: [443, 8443],
                },
                HTTP: {
                    ports: [80, "8080-8880"],
                    "override-destination": true,
                },
            },
        },
        "geodata-mode": true,
        "geox-url": accelURLs,
    };

    params.dns = { ...params.dns, ...dnsOptions };
    Object.keys(otherOptions).forEach((key) => {
        params[key] = otherOptions[key];
    });
}

function getProxiesByRegex(params, regex) {
    const matchedProxies = params.proxies.filter((e) => regex.test(e.name)).map((e) => e.name);
    return matchedProxies.length > 0 ? matchedProxies : ["手动选择"];
}

function getManualProxiesByRegex(params, regex) {
    const matchedProxies = params.proxies.filter((e) => regex.test(e.name)).map((e) => e.name);
    return matchedProxies.length > 0 ? matchedProxies : ["DIRECT", "手动选择", proxyName];
}

async function handleRequest(request) {
  const url = new URL(request.url)

  if (url.pathname === '/') {
    return new Response(getHomepageHtml(), {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    })
  }

  if (url.pathname === '/merge') {
    return handleMergeRequest(request)
  }

  return new Response('Not Found', { status: 404 })
}

async function handleMergeRequest(request) {
    const urls = new URL(request.url).searchParams.get('urls');
    if (!urls) {
        return new Response(getHomepageHtml(), {
            headers: { 'content-type': 'text/html;charset=UTF-8' },
        });
    }

    const subLinks = urls.replace(/\r?\n/g, ',').split(',').map(url => url.trim()).filter(url => url);
    let mergedProxies = [];
    let subscriptionGroups = []; // 跟踪每个订阅的节点分组

    try {
        for (let i = 0; i < subLinks.length; i++) {
            const link = subLinks[i];
            console.log(`Fetching subscription from: ${link}`);
            const response = await fetch(link, {
                headers: {
                    'User-Agent': 'clash-verge/1.5.11' // Mimic a common Clash client
                }
            });
            const data = await response.text();
            let proxies = [];
            let subName = `订阅${i + 1}`; // 默认名称

            // Try parsing as YAML first - EXACTLY like Netlify version
            try {
                console.log(`Attempting to parse response from ${link} as YAML.`);
                const config = yaml.load(data);
                if (config && Array.isArray(config.proxies)) {
                    proxies = config.proxies;
                    // 尝试从配置中获取订阅名称
                    if (config['proxy-groups'] && config['proxy-groups'].length > 0) {
                        const firstGroup = config['proxy-groups'][0];
                        if (firstGroup.name && firstGroup.name !== '代理模式') {
                            subName = firstGroup.name;
                        }
                    }
                    // 如果配置有名称字段
                    if (config.name) {
                        subName = config.name;
                    }
                    console.log(`Successfully parsed ${proxies.length} proxies as YAML from ${link}.`);
                } else {
                    throw new Error('Valid YAML but no proxies array found, attempting Base64 decode.');
                }
            } catch (e) {
                console.log(`Could not parse from ${link} as YAML (${e.message}), attempting Base64 decode.`);
                try {
                    // Use atob instead of Buffer for Cloudflare Workers
                    const decodedData = atob(data);
                    const proxyUris = decodedData.split(/\r?\n/).filter(u => u.trim() !== '');

                    if (proxyUris.length === 0) {
                        console.log(`Decoded data from ${link} but found 0 proxy URIs.`);
                    }

                    const parsedProxies = proxyUris.map(parseProxyUri);
                    proxies = parsedProxies.filter(p => p !== null);

                    console.log(`Successfully parsed ${proxies.length} out of ${proxyUris.length} proxy URIs from ${link}.`);

                    if (proxies.length < proxyUris.length) {
                        console.log("Failed to parse some URIs:");
                        parsedProxies.forEach((p, index) => {
                            if (p === null) {
                                console.log(`- ${proxyUris[index]}`);
                            }
                        });
                    }
                } catch (e2) {
                    console.error(`Failed to decode or parse subscription from ${link} as Base64. Error: ${e2.message}`);
                }
            }

            // 记录订阅分组信息
            if (proxies.length > 0) {
                subscriptionGroups.push({
                    name: subName,
                    proxies: proxies.map(p => p.name),
                    index: i + 1
                });
            }

            mergedProxies.push(...proxies);
        }

        console.log(`Total merged proxies (before deduplication): ${mergedProxies.length}`);

        // Remove duplicate proxies by name
        mergedProxies = mergedProxies.filter((proxy, index, self) =>
            index === self.findIndex((p) => p.name === proxy.name)
        );

        console.log(`Total merged proxies (after deduplication): ${mergedProxies.length}`);

        if (mergedProxies.length === 0) {
            return new Response('No valid proxies found in the provided URLs. Check the server logs for more details.', { status: 400 });
        }

        let finalConfig = {
            proxies: mergedProxies,
            subscriptionGroups: subscriptionGroups // 传递订阅分组信息给main函数
        };
        finalConfig = main(finalConfig);

        // Use yaml.dump EXACTLY like Netlify version
        return new Response(yaml.dump(finalConfig), {
            headers: { 'Content-Type': 'text/yaml; charset=utf-8' },
        });
    } catch (error) {
        console.error(error);
        return new Response('Failed to merge subscriptions.', { status: 500 });
    }
}

function getHomepageHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clash Subscription Merge</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; }
        textarea { width: 100%; box-sizing: border-box; padding: 10px; margin-bottom: 10px; }
        button { width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background-color: #0056b3; }
    </style>
</head>
<body>
    <h1>Clash Subscription Merge</h1>
    <form action="/merge" method="get">
        <textarea name="urls" rows="10" cols="50" placeholder="Enter subscription URLs, one per line or comma-separated"></textarea>
        <br>
        <button type="submit">Merge</button>
    </form>
</body>
</html>
    `;
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})