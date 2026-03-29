/**
 * Optional local test for ScraperAPI + Animesit (provider 2).
 * Run with SCRAPERAPI_KEY set (see scrape_p1.js).
 */
const key = process.env.SCRAPERAPI_KEY;
if (!key) {
    console.error("Set SCRAPERAPI_KEY first.");
    process.exit(1);
}
const url = encodeURIComponent("https://web.animesit.com/");
fetch(`https://api.scraperapi.com/?api_key=${encodeURIComponent(key)}&url=${url}`)
    .then((r) => r.text())
    .then((body) => console.log("length", body.length))
    .catch(console.error);
