/**
 * Optional local test for ScraperAPI + Risto (provider 1).
 * Run: set SCRAPERAPI_KEY=your_key&& node scrape_p1.js   (Windows cmd)
 *      $env:SCRAPERAPI_KEY="your_key"; node scrape_p1.js  (PowerShell)
 * Production: set SCRAPERAPI_KEY only in Vercel → Environment Variables.
 */
const key = process.env.SCRAPERAPI_KEY;
if (!key) {
    console.error("Set SCRAPERAPI_KEY first.");
    process.exit(1);
}
const url = encodeURIComponent("https://ristoanime.co/");
fetch(`https://api.scraperapi.com/?api_key=${encodeURIComponent(key)}&url=${url}`)
    .then((r) => r.text())
    .then((body) => console.log("length", body.length, "has MovieItem", body.includes("MovieItem")))
    .catch(console.error);
