const express = require('express')
const axios = require('axios')
const yaml = require('js-yaml')
const { main } = require('./clash-rules.js')

const app = express()
const port = process.env.PORT || 3000

// Parser for different proxy protocols - copied from Worker version
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

app.get('/', (req, res) => {
    res.send(`
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
    `)
})

app.get('/merge', async (req, res) => {
    const urls = req.query.urls
    if (!urls) {
        return res.redirect('/')
    }

    const subLinks = urls.replace(/\r?\n/g, ',').split(',').map(url => url.trim()).filter(url => url)
    let mergedProxies = []
    let subscriptionGroups = [] // 跟踪每个订阅的节点分组

    try {
        for (let i = 0; i < subLinks.length; i++) {
            const link = subLinks[i]
            console.log(`Fetching subscription from: ${link}`)
            const response = await axios.get(link, {
                headers: {
                    'User-Agent': 'clash-verge/1.5.11' // Mimic a common Clash client
                }
            })
            let proxies = []
            let subName = `订阅${i + 1}` // 默认名称

            // Try parsing as YAML first - EXACTLY like Worker version
            try {
                console.log(`Attempting to parse response from ${link} as YAML.`)
                const config = yaml.load(response.data)
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
                    const decodedData = Buffer.from(response.data, 'base64').toString('utf8')
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
            return res.status(400).send('No valid proxies found in the provided URLs. Check the server logs for more details.')
        }

        let finalConfig = {
            proxies: mergedProxies,
            subscriptionGroups: subscriptionGroups // 传递订阅分组信息给main函数
        }
        finalConfig = await main(finalConfig)

        res.setHeader('Content-Type', 'text/yaml; charset=utf-8')
        res.send(yaml.dump(finalConfig))
    } catch (error) {
        console.error(error)
        res.status(500).send('Failed to merge subscriptions.')
    }
})

const serverless = require('serverless-http')

// 本地开发时启动服务器
if (require.main === module) {
    app.listen(port, () => {
        console.log(`🚀 Server is running at http://localhost:${port}`)
        console.log(`📝 Home page: http://localhost:${port}/`)
        console.log(`🔗 Merge endpoint: http://localhost:${port}/merge?urls=<subscription_urls>`)
    })
}

module.exports.handler = serverless(app)