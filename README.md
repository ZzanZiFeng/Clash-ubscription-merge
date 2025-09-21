# Clash Subscription Merge

A simple web service to merge multiple Clash subscription links into a single, unified configuration file. It applies a custom set of rules, proxy groups, and DNS settings to the merged subscription, providing a powerful and personalized Clash experience.

## Deploy

### Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ZzanZiFeng/Clash-ubscription-merge&repository-name=my-clash-subscription-merge)

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ZzanZiFeng/Clash-ubscription-merge)

### Deploy to Cloudflare

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ZzanZiFeng/Clash-ubscription-merge)

## Features

- **Merge Multiple Subscriptions**: Combine proxy servers from different subscription links into one configuration.
- **Custom Rules**: Apply your own set of rules to control traffic flow.
- **Automatic Proxy Groups**: Automatically create proxy groups based on region (e.g., Hong Kong, Taiwan, Singapore, Japan, USA).
- **Remove Duplicate Proxies**: Automatically remove duplicate proxies with the same name.
- **Easy to Use**: Simply run the service and provide your subscription links in the URL.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher is recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Installation

1.  **Clone or download the project files:**
    If you have Git installed, you can clone this repository. Otherwise, download the `index.js`, `clash-rules.js`, and `package.json` files directly.

2.  **Navigate to the project directory:**
    ```bash
    cd /path/to/Clash-ubscription-merge
    ```

3.  **Install dependencies:**
    Run the following command to install the required libraries (`express`, `axios`, `js-yaml`).
    ```bash
    npm install
    ```

## How to Use

1.  **Start the service:**
    Run the following command in your terminal to start the web service.
    ```bash
    node index.js
    ```
    You should see a message indicating that the service is running on port 3000.

2.  **Construct the merge URL:**
    The service provides a `/merge` endpoint that accepts a comma-separated list of subscription links. The URL format is as follows:

    ```
    http://localhost:3000/merge?urls=<link1>,<link2>,<link3>...
    ```

    **Replace `<link1>`, `<link2>`, etc., with your own Clash subscription links.**

3.  **Add to your Clash client:**
    - Copy the full URL you constructed in the previous step.
    - Open your Clash client (e.g., Clash Verge, Clash for Windows, etc.).
    - Go to the "Profiles" section and add a new profile from a URL.
    - Paste your URL and save.
    - Your Clash client will now fetch the merged and customized configuration.

### Example

Suppose you have two subscription links:
- `https://example.com/mysub1.yaml`
- `https://another.com/mysub2.yaml`

The merge URL you would use is:
```
http://localhost:3000/merge?urls=https://example.com/mysub1.yaml,https://another.com/mysub2.yaml
```

## Customization

All custom logic, including rules, proxy groups, and DNS settings, is located in the `clash-rules.js` file. You can modify this file to suit your personalized needs.

- **Custom Rules**: To add your own high-priority rules, edit the `customRules` array in the `overwriteRules` function.
- **Proxy Groups**: To change how proxy groups are created or to add new ones, modify the `overwriteProxyGroups` function.
- **DNS Settings**: To adjust DNS settings (e.g., preferred DNS servers), modify the `overwriteDns` function.