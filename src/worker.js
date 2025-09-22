// Cloudflare Workers version that exactly mimics Netlify
// Import js-yaml - this works in Cloudflare Workers with proper bundling
import yaml from 'js-yaml'

// Parser for different proxy protocols - copied from Netlify version
function parseProxyUri(uri) {
    try {
        const protocol = uri.split('://')[0]
        switch (protocol) {
            case 'vless':
                return parseVlessUri(uri)
            case 'hysteria2':
                return parseHysteria2Uri(uri)
            // Add other protocols like ss, trojan here if needed
            default:
                console.warn(`Unsupported protocol: ${protocol}`)
                return null
        }
    } catch (error) {
        console.error(`Error parsing URI: ${uri}`, error)
        return null
    }
}

function parseVlessUri(uri) {
    try {
        const url = new URL(uri)
        const params = url.searchParams
        const proxy = {
            name: decodeURIComponent(url.hash.substring(1)).trim(),
            type: 'vless',
            server: url.hostname,
            port: parseInt(url.port, 10),
            uuid: url.username,
            network: params.get('type') || 'tcp',
            tls: params.get('security') === 'tls',
            udp: true,
        }

        if (proxy.tls) {
            proxy.servername = params.get('sni') || params.get('host') || proxy.server
            proxy['client-fingerprint'] = params.get('fp') || 'chrome'
            if (params.get('flow')) {
                proxy.flow = params.get('flow')
            }
        }

        if (proxy.network === 'ws') {
            proxy['ws-opts'] = {
                path: params.get('path') || '/',
                headers: {
                    Host: params.get('host') || proxy.server
                }
            }
        }
        return proxy
    } catch (e) {
        console.error(`Failed to parse VLESS URI: ${uri}`, e)
        return null
    }
}

function parseHysteria2Uri(uri) {
    try {
        const url = new URL(uri)
        const params = url.searchParams
        const proxy = {
            name: decodeURIComponent(url.hash.substring(1)).trim(),
            type: 'hysteria2',
            server: url.hostname,
            port: parseInt(url.port, 10),
            password: url.username,
            sni: params.get('sni') || url.hostname,
            'skip-cert-verify': params.get('insecure') === '1' || params.get('skip-cert-verify') === 'true',
        }
        if (params.get('up')) proxy['up'] = params.get('up')
        if (params.get('down')) proxy['down'] = params.get('down')
        return proxy
    } catch (e) {
        console.error(`Failed to parse Hysteria2 URI: ${uri}`, e)
        return null
    }
}

// COMPLETE clash-rules.js implementation - copied exactly from Netlify version
const proxyName = "代理模式"

async function main(params) {
    if (!params.proxies) return params
    overwriteRules(params)
    await overwriteProxyGroups(params)
    overwriteDns(params)
    return params
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
    ]

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
    ]
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
    }
    params["rule-providers"] = ruleProviders
    params["rules"] = rules
}

// 地区检测规则配置 - 基于IP段的精确地理位置检测
const regionDetectionRules = {
    '香港': {
        code: 'HK',
        ipRanges: [
            // 香港主要IP段
            /^103\.10\./, /^103\.21\./, /^103\.31\./, /^103\.243\./, /^103\.16\./,
            /^113\.28\./, /^113\.30\./, /^119\.28\./, /^119\.29\./,
            /^202\.64\./, /^202\.67\./, /^202\.72\./, /^202\.125\./,
            /^210\.3\./, /^210\.4\./, /^210\.176\./, /^210\.177\./,
            /^218\.102\./, /^218\.213\./, /^203\.80\./, /^203\.198\./
        ]
    },
    '台湾': {
        code: 'TW',
        ipRanges: [
            // 台湾主要IP段
            /^1\.34\./, /^1\.160\./, /^1\.163\./, /^1\.168\./,
            /^60\.248\./, /^60\.249\./, /^60\.250\./, /^60\.251\./,
            /^111\.240\./, /^111\.241\./, /^111\.242\./, /^111\.243\./,
            /^114\.32\./, /^114\.33\./, /^114\.34\./, /^114\.35\./,
            /^140\.109\./, /^140\.110\./, /^140\.111\./, /^140\.112\./,
            /^163\.13\./, /^163\.14\./, /^163\.15\./, /^163\.16\./
        ]
    },
    '新加坡': {
        code: 'SG',
        ipRanges: [
            // 新加坡主要IP段
            /^103\.28\./, /^103\.225\./, /^103\.233\./, /^103\.47\./,
            /^155\.133\./, /^165\.21\./, /^175\.103\./, /^180\.87\./,
            /^202\.94\./, /^202\.156\./, /^202\.162\./, /^203\.116\./,
            /^210\.4\./, /^210\.185\./, /^218\.100\./, /^220\.255\./
        ]
    },
    '日本': {
        code: 'JP',
        ipRanges: [
            // 日本主要IP段
            /^138\.2\./, /^203\.10\./, /^212\.192\./, /^27\.0\./,
            /^49\.212\./, /^49\.213\./, /^49\.214\./, /^49\.215\./,
            /^118\.27\./, /^118\.238\./, /^118\.239\./, /^118\.240\./,
            /^153\.120\./, /^153\.121\./, /^153\.122\./, /^153\.123\./,
            /^202\.13\./, /^202\.32\./, /^202\.208\./, /^210\.130\./,
            /^210\.131\./, /^210\.132\./, /^210\.133\./, /^220\.100\./
        ]
    },
    '美国': {
        code: 'US',
        ipRanges: [
            // 美国主要IP段 (包含您提供的IP)
            /^108\.181\./, /^208\.87\./, /^63\.141\./, /^199\.168\./,
            /^107\.150\./, /^192\.151\./, /^173\.208\./, /^142\.54\./,
            /^166\.88\./, /^38\.134\./, /^207\.174\./, /^64\.233\./,
            /^173\.252\./, /^31\.13\./, /^157\.240\./, /^199\.16\./,
            /^23\.227\./, /^23\.235\./, /^23\.78\./, /^23\.79\./,
            /^104\.16\./, /^104\.17\./, /^104\.18\./, /^104\.19\./,
            /^8\.8\./, /^8\.34\./, /^172\.217\./, /^142\.250\./,
            // 添加更多美国IP段
            /^168\.138\./, /^64\.181\./, /^165\.1\./, /^38\.55\./,
            /^172\.245\./, /^198\.199\./, /^159\.65\./, /^174\.138\./,
            /^68\.183\./, /^157\.245\./, /^134\.122\./, /^167\.99\./,
            /^188\.166\./, /^143\.198\./, /^165\.22\./, /^178\.128\./
        ]
    },
    '英国': {
        code: 'GB',
        ipRanges: [
            // 英国主要IP段
            /^85\.159\./, /^140\.238\./, /^193\.123\./, /^212\.58\./,
            /^80\.68\./, /^80\.87\./, /^81\.2\./, /^81\.103\./,
            /^195\.59\./, /^195\.66\./, /^195\.137\./, /^195\.149\./,
            /^212\.140\./, /^212\.159\./, /^213\.205\./, /^217\.163\./,
            // 添加更多英国IP段
            /^91\.149\./, /^193\.108\./, /^192\.124\./
        ]
    },
    '加拿大': {
        code: 'CA',
        ipRanges: [
            // 加拿大主要IP段
            /^24\.222\./, /^24\.225\./, /^65\.92\./, /^65\.95\./,
            /^69\.196\./, /^70\.29\./, /^99\.232\./, /^99\.233\./,
            /^142\.59\./, /^198\.53\./, /^198\.84\./, /^206\.248\./
        ]
    },
    '德国': {
        code: 'DE',
        ipRanges: [
            // 德国主要IP段
            /^141\.147\./, /^202\.71\./, /^88\.198\./, /^144\.76\./,
            /^138\.201\./, /^168\.119\./, /^195\.201\./, /^213\.239\./,
            /^85\.10\./, /^85\.25\./, /^195\.71\./, /^212\.227\./
        ]
    },
    '法国': {
        code: 'FR',
        ipRanges: [
            // 法国主要IP段
            /^141\.253\./, /^144\.24\./, /^193\.252\./, /^212\.27\./,
            /^80\.12\./, /^81\.2\./, /^82\.64\./, /^83\.206\./,
            /^195\.154\./, /^212\.83\./, /^213\.186\./, /^217\.70\./
        ]
    },
    '澳大利亚': {
        code: 'AU',
        ipRanges: [
            // 澳大利亚主要IP段
            /^192\.9\./, /^203\.0\./, /^203\.2\./, /^203\.32\./,
            /^101\.189\./, /^110\.174\./, /^150\.101\./, /^175\.45\./,
            /^202\.6\./, /^202\.144\./, /^202\.158\./, /^210\.23\./
        ]
    },
    '韩国': {
        code: 'KR',
        ipRanges: [
            // 韩国主要IP段
            /^132\.226\./, /^152\.70\./, /^193\.122\./, /^158\.179\./,
            /^1\.11\./, /^1\.201\./, /^1\.224\./, /^1\.225\./,
            /^114\.207\./, /^175\.126\./, /^211\.33\./, /^211\.34\./,
            /^218\.144\./, /^218\.145\./, /^218\.234\./, /^220\.68\./
        ]
    },
    '荷兰': {
        code: 'NL',
        ipRanges: [
            // 荷兰主要IP段
            /^204\.10\./, /^158\.101\./, /^31\.220\./, /^46\.19\./,
            /^77\.72\./, /^80\.69\./, /^82\.94\./, /^85\.17\./,
            /^194\.109\./, /^195\.69\./, /^213\.154\./, /^217\.21\./
        ]
    },
    '巴西': {
        code: 'BR',
        ipRanges: [
            // 巴西主要IP段 (包含您提供的IP)
            /^129\.148\./, /^177\.37\./, /^189\.1\./, /^189\.2\./,
            /^201\.48\./, /^201\.49\./, /^200\.142\./, /^200\.147\./,
            /^186\.192\./, /^186\.193\./, /^191\.36\./, /^191\.37\./
        ]
    },
    '俄罗斯': {
        code: 'RU',
        ipRanges: [
            // 俄罗斯主要IP段
            /^77\.88\./, /^87\.240\./, /^93\.158\./, /^95\.213\./,
            /^178\.154\./, /^185\.32\./, /^188\.162\./, /^194\.87\./,
            /^213\.180\./, /^217\.69\./, /^46\.29\./, /^5\.45\./
        ]
    },
    '印度': {
        code: 'IN',
        ipRanges: [
            // 印度主要IP段
            /^103\.21\./, /^103\.22\./, /^157\.119\./, /^157\.230\./,
            /^165\.22\./, /^167\.71\./, /^203\.109\./, /^203\.110\./,
            /^122\.160\./, /^122\.161\./, /^180\.179\./, /^49\.204\./
        ]
    }
}

// 动态生成地区信息
function getRegionInfo(regionName, regionCode) {
    // 根据地区代码生成图标URL
    const iconUrl = regionCode ?
        `https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/${regionCode.toLowerCase()}.svg` :
        'https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/link.svg'

    return {
        name: regionName,
        code: regionCode,
        icon: iconUrl
    }
}

// IP地区检测函数 - 基于IP地址准确检测地区
async function detectProxyRegion(proxy) {
    const server = proxy.server
    const name = proxy.name

    // 跳过无关节点（如剩余流量、到期时间等）
    if (/剩余|到期|主页|官网|游戏|关注|流量|期限|时间|有效|套餐|苹果用户|下载/.test(name)) {
        return null // 返回null表示不是有效的代理节点
    }

    // 首先尝试从节点名称中推断地区
    const nameRegion = detectRegionByName(name)
    if (nameRegion) {
        console.log(`✅ 节点名称识别: ${name} -> ${nameRegion.name}`)
        return nameRegion
    }

    // 主要通过IP地址检测地区（最准确的方法）
    const ip = server
    const region = await detectRegionByIP(ip)
    if (region) {
        console.log(`✅ IP地址检测: ${ip} -> ${region.name}`)
        return region
    }

    // 如果IP检测失败，返回未知地区
    console.log(`⚠️ 无法检测地区: ${name} (${ip}) -> 归类到其它`)
    return getRegionInfo('其它', 'OTHER')
}

// 通过节点名称推断地区的函数
function detectRegionByName(name) {
    const nameUpper = name.toUpperCase()

    // 地区关键词映射
    const regionKeywords = {
        '香港': ['香港', 'HK', 'HONG KONG', 'HKG'],
        '台湾': ['台湾', 'TW', 'TAIWAN', 'TWN'],
        '新加坡': ['新加坡', 'SG', 'SINGAPORE', 'SGP'],
        '日本': ['日本', 'JP', 'JAPAN', 'JPN', '东京', 'TOKYO'],
        '美国': ['美国', 'US', 'USA', 'UNITED STATES', '洛杉矶', 'LOS ANGELES', '纽约', 'NEW YORK'],
        '英国': ['英国', 'GB', 'UK', 'UNITED KINGDOM', '伦敦', 'LONDON'],
        '加拿大': ['加拿大', 'CA', 'CANADA', 'CAN'],
        '德国': ['德国', 'DE', 'GERMANY', '法兰克福', 'FRANKFURT'],
        '法国': ['法国', 'FR', 'FRANCE', '巴黎', 'PARIS'],
        '澳大利亚': ['澳大利亚', 'AU', 'AUSTRALIA', '悉尼', 'SYDNEY'],
        '韩国': ['韩国', 'KR', 'KOREA', '首尔', 'SEOUL'],
        '荷兰': ['荷兰', 'NL', 'NETHERLANDS', '阿姆斯特丹', 'AMSTERDAM'],
        '巴西': ['巴西', 'BR', 'BRAZIL'],
        '俄罗斯': ['俄罗斯', 'RU', 'RUSSIA', '莫斯科', 'MOSCOW'],
        '印度': ['印度', 'IN', 'INDIA']
    }

    // 检查节点名称是否包含地区关键词
    for (const [regionName, keywords] of Object.entries(regionKeywords)) {
        for (const keyword of keywords) {
            if (nameUpper.includes(keyword)) {
                const config = regionDetectionRules[regionName]
                return getRegionInfo(regionName, config.code)
            }
        }
    }

    return null
}

// 基于IP地址检测地区的专门函数
function detectRegionByIP(ip) {
    // 验证IP地址格式
    if (!isValidIP(ip)) {
        return null
    }

    // 通过IP段匹配地区（最快最准确的方法）
    for (const [regionName, config] of Object.entries(regionDetectionRules)) {
        for (const ipRange of config.ipRanges) {
            if (ipRange.test(ip)) {
                const regionInfo = getRegionInfo(regionName, config.code)
                console.log(`✅ IP段规则匹配: ${ip} -> ${regionInfo.name}`)
                return regionInfo
            }
        }
    }

    // 如果IP段匹配失败，尝试使用在线IP地理位置服务
    // 这是备用方案，确保即使是未知IP段也能获得地区信息
    return queryIPLocation(ip)
}

// 查询IP地理位置的备用函数
async function queryIPLocation(ip) {
    // 定义多个备用API
    const apis = [
        {
            name: 'ip-api.com',
            url: `http://ip-api.com/json/${ip}?fields=status,country,countryCode`,
            parseResponse: (data) => {
                if (data.status === 'success' && data.countryCode) {
                    return {
                        country_code: data.countryCode,
                        country_name: data.country
                    }
                }
                return null
            }
        },
        {
            name: 'ipapi.co',
            url: `https://ipapi.co/${ip}/json/`,
            parseResponse: (data) => {
                if (data && data.country_code) {
                    return {
                        country_code: data.country_code,
                        country_name: data.country_name
                    }
                }
                return null
            }
        },
        {
            name: 'ipinfo.io',
            url: `https://ipinfo.io/${ip}/json`,
            parseResponse: (data) => {
                if (data && data.country) {
                    return {
                        country_code: data.country,
                        country_name: data.country
                    }
                }
                return null
            }
        }
    ]

    // 逐个尝试API
    for (const api of apis) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时

            const response = await fetch(api.url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()
            const parsed = api.parseResponse(data)

            if (parsed && parsed.country_code) {
                // 将国家代码映射到我们的地区系统
                const countryCode = parsed.country_code.toUpperCase()
                const countryName = parsed.country_name || '未知'

                // 查找是否有对应的地区配置
                for (const [regionName, config] of Object.entries(regionDetectionRules)) {
                    if (config.code === countryCode) {
                        const regionInfo = getRegionInfo(regionName, config.code)
                        console.log(`✅ ${api.name} API查询成功: ${ip} -> ${regionInfo.name}`)
                        return regionInfo
                    }
                }

                // 如果没有预定义的地区，创建一个新的地区信息
                const regionInfo = getRegionInfo(countryName, countryCode)
                console.log(`✅ ${api.name} API查询成功: ${ip} -> ${regionInfo.name}`)
                return regionInfo
            }
        } catch (error) {
            console.log(`${api.name} IP地理位置查询失败: ${ip} - ${error.message}`)
            continue // 尝试下一个API
        }
    }

    console.log(`所有IP地理位置API都失败了: ${ip}`)
    return null
}

// 验证IP地址格式的辅助函数
function isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}


// 覆写代理组
async function overwriteProxyGroups(params) {
    // 添加自用代理
    params.proxies.push(
        //  { name: '1 - 香港 - 示例 ', type: *, server: **, port: *, cipher: **, password: **, udp: true }
    )

    // 所有代理
    const allProxies = params["proxies"].map((e) => e.name)

    // 获取订阅分组信息
    const subscriptionGroups = params.subscriptionGroups || []

    // 为每个订阅创建地区分组
    const subscriptionRegionGroups = []
    const subscriptionAutoGroups = []
    const subscriptionManualGroups = []

    for (const sub of subscriptionGroups) {
        // 按地区分组该订阅的节点
        const regionGroups = {}

        // 获取该订阅的实际代理对象
        const subProxies = params.proxies.filter(proxy => sub.proxies.includes(proxy.name))

        console.log(`🔍 开始检测订阅 "${sub.name}" 的 ${subProxies.length} 个节点的地区信息...`)

        for (const proxy of subProxies) {
            const regionInfo = await detectProxyRegion(proxy)
            if (regionInfo && regionInfo !== null) { // 跳过无效节点
                const regionKey = regionInfo.name // 使用地区名称作为键
                if (!regionGroups[regionKey]) {
                    regionGroups[regionKey] = {
                        proxies: [],
                        info: regionInfo
                    }
                }
                regionGroups[regionKey].proxies.push(proxy.name)
            }
        }

        // 统计检测结果
        const totalRegions = Object.keys(regionGroups).length
        const totalNodes = Object.values(regionGroups).reduce((sum, group) => sum + group.proxies.length, 0)
        console.log(`📊 订阅 "${sub.name}" 地区检测完成: ${totalNodes} 个节点分布在 ${totalRegions} 个地区`)

        // 显示每个地区的节点数量
        Object.entries(regionGroups).forEach(([regionName, regionData]) => {
            console.log(`   ${regionData.info.icon} ${regionName}: ${regionData.proxies.length} 个节点`)
        })

        // 为每个有节点的地区创建代理组
        Object.keys(regionGroups).forEach(regionKey => {
            const regionData = regionGroups[regionKey]
            if (regionData.proxies.length > 0) {
                // 订阅+地区的自动选择组
                subscriptionRegionGroups.push({
                    name: `${sub.name} - ${regionData.info.name}`,
                    type: "url-test",
                    url: "http://www.gstatic.com/generate_204",
                    interval: 300,
                    tolerance: 50,
                    proxies: regionData.proxies,
                    icon: regionData.info.icon,
                    hidden: false,
                })
            }
        })

        // 收集该订阅的所有有效节点
        const validProxies = []
        Object.keys(regionGroups).forEach(regionKey => {
            validProxies.push(...regionGroups[regionKey].proxies)
        })

        // 订阅总体自动选择组（包含该订阅所有节点）
        if (validProxies.length > 0) {
            subscriptionAutoGroups.push({
                name: `${sub.name} - 自动选择`,
                type: "url-test",
                url: "http://www.gstatic.com/generate_204",
                interval: 300,
                tolerance: 50,
                proxies: validProxies,
                hidden: true,
            })

            // 订阅手工选择组
            subscriptionManualGroups.push({
                name: `${sub.name} - 手工选择`,
                type: "select",
                proxies: validProxies,
                icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/link.svg",
                hidden: false,
            })
        }
    }

    // 全局地区自动选择组（所有订阅的同地区节点）
    const globalRegionGroups = {}
    for (const proxy of params.proxies) {
        const regionInfo = await detectProxyRegion(proxy)
        if (regionInfo && regionInfo !== null) { // 跳过无效节点
            const regionKey = regionInfo.name // 使用地区名称作为键
            if (!globalRegionGroups[regionKey]) {
                globalRegionGroups[regionKey] = {
                    proxies: [],
                    info: regionInfo
                }
            }
            globalRegionGroups[regionKey].proxies.push(proxy.name)
        }
    }

    const globalAutoGroups = Object.keys(globalRegionGroups)
        .filter(regionKey => globalRegionGroups[regionKey].proxies.length > 0)
        .map(regionKey => {
            const regionData = globalRegionGroups[regionKey]
            return {
                name: `${regionData.info.name} - 全局选择`,
                type: "url-test",
                url: "http://www.gstatic.com/generate_204",
                interval: 300,
                tolerance: 50,
                proxies: regionData.proxies,
                icon: regionData.info.icon,
                hidden: true,
            }
        })

    // 生成自动选择的选项列表（去重）
    const autoSelectionOptions = []

    // 添加订阅自动选择
    subscriptionAutoGroups.forEach(group => {
        if (!autoSelectionOptions.includes(group.name)) {
            autoSelectionOptions.push(group.name)
        }
    })

    // 添加订阅+地区自动选择组（这是用户要求的重点）
    subscriptionRegionGroups.forEach(group => {
        if (!autoSelectionOptions.includes(group.name)) {
            autoSelectionOptions.push(group.name)
        }
    })

    // 添加全局地区自动选择
    globalAutoGroups.forEach(group => {
        if (!autoSelectionOptions.includes(group.name)) {
            autoSelectionOptions.push(group.name)
        }
    })

    // 添加ALL自动选择
    autoSelectionOptions.push("ALL - 自动选择")

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
    ]

    // 将所有分组添加到groups中
    groups.push(...subscriptionAutoGroups)         // 订阅自动选择组
    groups.push(...globalAutoGroups)               // 全局地区自动选择组
    groups.push(...subscriptionRegionGroups)       // 订阅+地区分组
    groups.push(...subscriptionManualGroups)       // 订阅手工选择组

    // 清理订阅分组信息，避免在最终配置中出现
    delete params.subscriptionGroups

    params["proxy-groups"] = groups
}

// 防止 dns 泄露
function overwriteDns(params) {
    const cnDnsList = [
        "https://223.5.5.5/dns-query",
        "https://1.12.12.12/dns-query",
    ]
    const trustDnsList = [
        'quic://dns.cooluc.com',
        "https://1.0.0.1/dns-query",
        "https://1.1.1.1/dns-query",
    ]

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
    }

    // GitHub 加速前缀
    const githubPrefix = "https://fastgh.lainbo.com/"

    // GEO 数据 GitHub 资源原始下载地址
    const rawGeoxURLs = {
        geoip:
            "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat",
        geosite:
            "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
        mmdb: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb",
    }

    // 生成带有加速前缀的 GEO 数据资源对象
    const accelURLs = Object.fromEntries(
        Object.entries(rawGeoxURLs).map(([key, githubUrl]) => [
            key,
            `${githubPrefix}${githubUrl}`,
        ])
    )

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
    }

    params.dns = { ...params.dns, ...dnsOptions }
    Object.keys(otherOptions).forEach((key) => {
        params[key] = otherOptions[key]
    })
}

function getProxiesByRegex(params, regex) {
    const matchedProxies = params.proxies.filter((e) => regex.test(e.name)).map((e) => e.name)
    return matchedProxies.length > 0 ? matchedProxies : ["手动选择"]
}

function getManualProxiesByRegex(params, regex) {
    const matchedProxies = params.proxies.filter((e) => regex.test(e.name)).map((e) => e.name)
    return matchedProxies.length > 0 ? matchedProxies : ["DIRECT", "手动选择", proxyName]
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
    const urls = new URL(request.url).searchParams.get('urls')
    if (!urls) {
        return new Response(getHomepageHtml(), {
            headers: { 'content-type': 'text/html;charset=UTF-8' },
        })
    }

    const subLinks = urls.replace(/\r?\n/g, ',').split(',').map(url => url.trim()).filter(url => url)
    let mergedProxies = []
    let subscriptionGroups = [] // 跟踪每个订阅的节点分组

    try {
        for (let i = 0; i < subLinks.length; i++) {
            const link = subLinks[i]
            console.log(`Fetching subscription from: ${link}`)
            const response = await fetch(link, {
                headers: {
                    'User-Agent': 'clash-verge/1.5.11' // Mimic a common Clash client
                }
            })
            const data = await response.text()
            let proxies = []
            let subName = `订阅${i + 1}` // 默认名称

            // Try parsing as YAML first - EXACTLY like Netlify version
            try {
                console.log(`Attempting to parse response from ${link} as YAML.`)
                const config = yaml.load(data)
                if (config && Array.isArray(config.proxies)) {
                    proxies = config.proxies
                    // 尝试从配置中获取订阅名称
                    if (config['proxy-groups'] && config['proxy-groups'].length > 0) {
                        const firstGroup = config['proxy-groups'][0]
                        if (firstGroup.name && firstGroup.name !== '代理模式') {
                            subName = firstGroup.name
                        }
                    }
                    // 如果配置有名称字段
                    if (config.name) {
                        subName = config.name
                    }
                    console.log(`Successfully parsed ${proxies.length} proxies as YAML from ${link}.`)
                } else {
                    throw new Error('Valid YAML but no proxies array found, attempting Base64 decode.')
                }
            } catch (e) {
                console.log(`Could not parse from ${link} as YAML (${e.message}), attempting Base64 decode.`)
                try {
                    // Use atob instead of Buffer for Cloudflare Workers
                    const decodedData = atob(data)
                    const proxyUris = decodedData.split(/\r?\n/).filter(u => u.trim() !== '')

                    if (proxyUris.length === 0) {
                        console.log(`Decoded data from ${link} but found 0 proxy URIs.`)
                    }

                    const parsedProxies = proxyUris.map(parseProxyUri)
                    proxies = parsedProxies.filter(p => p !== null)

                    console.log(`Successfully parsed ${proxies.length} out of ${proxyUris.length} proxy URIs from ${link}.`)

                    if (proxies.length < proxyUris.length) {
                        console.log("Failed to parse some URIs:")
                        parsedProxies.forEach((p, index) => {
                            if (p === null) {
                                console.log(`- ${proxyUris[index]}`)
                            }
                        })
                    }
                } catch (e2) {
                    console.error(`Failed to decode or parse subscription from ${link} as Base64. Error: ${e2.message}`)
                }
            }

            // 记录订阅分组信息
            if (proxies.length > 0) {
                subscriptionGroups.push({
                    name: subName,
                    proxies: proxies.map(p => p.name),
                    index: i + 1
                })
            }

            mergedProxies.push(...proxies)
        }

        console.log(`Total merged proxies (before deduplication): ${mergedProxies.length}`)

        // Remove duplicate proxies by name
        mergedProxies = mergedProxies.filter((proxy, index, self) =>
            index === self.findIndex((p) => p.name === proxy.name)
        )

        console.log(`Total merged proxies (after deduplication): ${mergedProxies.length}`)

        if (mergedProxies.length === 0) {
            return new Response('No valid proxies found in the provided URLs. Check the server logs for more details.', { status: 400 })
        }

        let finalConfig = {
            proxies: mergedProxies,
            subscriptionGroups: subscriptionGroups // 传递订阅分组信息给main函数
        }
        finalConfig = await main(finalConfig)

        // Use yaml.dump EXACTLY like Netlify version
        return new Response(yaml.dump(finalConfig), {
            headers: { 'Content-Type': 'text/yaml; charset=utf-8' },
        })
    } catch (error) {
        console.error(error)
        return new Response('Failed to merge subscriptions.', { status: 500 })
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
    `
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})