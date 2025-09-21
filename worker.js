addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

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

  try {
    for (const link of subLinks) {
      const response = await fetch(link, {
        headers: {
          'User-Agent': 'clash-verge/1.5.11'
        }
      });
      const data = await response.text();
      let proxies = [];

      try {
        const config = yaml.load(data);
        if (config && config.proxies) {
          proxies = config.proxies;
        }
      } catch (e) {
        try {
          const decodedData = atob(data);
          const proxyUris = decodedData.split(/\r?\n/).filter(u => u.trim() !== '');
          proxies = proxyUris.map(parseProxyUri).filter(p => p !== null);
        } catch (e2) {
          console.error(`Failed to parse subscription from ${link} as Base64.`, e2);
        }
      }
      mergedProxies.push(...proxies);
    }

    mergedProxies = mergedProxies.filter((proxy, index, self) =>
      index === self.findIndex((p) => p.name === proxy.name)
    );

    if (mergedProxies.length === 0) {
      return new Response('No valid proxies found in the provided URLs.', { status: 400 });
    }

    let finalConfig = { proxies: mergedProxies };
    // Since we can't directly call the clash-rules.js main function,
    // we'll need to re-implement or include its logic here.
    // For now, we'll just return the merged proxies.
    // finalConfig = main(finalConfig); // This line needs to be adapted

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

// --- Start of integrated clash-rules.js content ---

const proxyName = "代理模式";

function main(params) {
    if (!params.proxies) return params;
    overwriteRules(params);
    overwriteProxyGroups(params);
    overwriteDns(params);
    return params;
}
// ... (The rest of the clash-rules.js content, excluding module.exports)
// ... (The parsing functions from functions/server.js)

// --- End of integrated content ---

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// ... (The rest of the worker.js code)

