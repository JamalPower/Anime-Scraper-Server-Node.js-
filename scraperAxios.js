const axios = require("axios");

const timeout = Number(process.env.SCRAPER_TIMEOUT_MS) || (process.env.VERCEL ? 20000 : 15000);

/** Fallback for local / quick tests only. Prefer `SCRAPERAPI_KEY` on Vercel; rotate this key if it was ever committed or shared. */
const SCRAPERAPI_KEY_FALLBACK = process.env.SCRAPER_API_KEY;

const scraperApiKey = process.env.SCRAPERAPI_KEY || SCRAPERAPI_KEY_FALLBACK;
const proxyUrl = process.env.SCRAPER_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

const headers = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
};

let httpsAgent;
let httpAgent;
if (proxyUrl) {
    const { HttpsProxyAgent } = require("https-proxy-agent");
    const agent = new HttpsProxyAgent(proxyUrl);
    httpsAgent = agent;
    httpAgent = agent;
}

const instance = axios.create({
    timeout,
    headers,
    ...(httpsAgent ? { httpsAgent, httpAgent, proxy: false } : {}),
});

function absoluteTargetUrl(config) {
    let targetUrl = config.url;
    if (!targetUrl) return null;
    if (!targetUrl.startsWith("http") && config.baseURL) {
        targetUrl = new URL(targetUrl, config.baseURL).href;
    }
    return targetUrl;
}

instance.interceptors.request.use((config) => {
    const targetUrl = absoluteTargetUrl(config);
    if (!targetUrl) return config;

    if (scraperApiKey) {
        const endpoint = new URL("https://api.scraperapi.com/");
        endpoint.searchParams.set("api_key", scraperApiKey);
        endpoint.searchParams.set("url", targetUrl);
        config.url = endpoint.toString();
        return config;
    }

    try {
        const u = new URL(targetUrl);
        if (!config.headers.Referer) {
            config.headers.Referer = `${u.origin}/`;
        }
        const method = (config.method || "get").toLowerCase();
        if (method === "post" && !config.headers.Origin) {
            config.headers.Origin = u.origin;
        }
        if (method === "post") {
            config.headers["Sec-Fetch-Site"] = "same-origin";
            config.headers["Sec-Fetch-Mode"] = "cors";
        }
    } catch (_) {
        /* ignore */
    }
    return config;
});

instance.interceptors.response.use(
    (r) => r,
    (err) => {
        if (process.env.SCRAPER_DEBUG === "1") {
            const cfg = err.config;
            const url = cfg ? cfg.url : "?";
            if (err.response) {
                console.error("[scraper]", err.response.status, url);
            } else {
                console.error("[scraper]", err.message, url);
            }
        }
        return Promise.reject(err);
    }
);

module.exports = instance;
