const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    const urls = [
        "https://ristoanime.co/movies/",
        "https://web.animesit.com/anime/?type=movie&order=update",
        "https://animelek.vip/قائمة-الأفلام/"
    ];

    for (const url of urls) {
        try {
            console.log(`Testing: ${url}`);
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            console.log(`Status: ${res.status}`);
            const $ = cheerio.load(res.data);
            const count1 = $(".MovieItem").length;
            const count2 = $(".bs").length;
            const count3 = $(".anime-card-container").length;
            console.log(`MovieItem: ${count1}, bs: ${count2}, anime-card: ${count3}`);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}
test();
