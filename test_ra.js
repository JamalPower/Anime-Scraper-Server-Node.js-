const axios = require('axios');
const cheerio = require('cheerio');

async function testRA() {
    try {
        const query = 'hunter';
        const url = `https://ristoanime.co/?s=${query}`;
        console.log('Fetching:', url);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        
        console.log('Total HTML length:', response.data.length);
        console.log('Number of .MovieItem items:', $(".MovieItem").length);
        console.log('Number of .container .MovieItem items:', $(".container .MovieItem").length);
        
        $(".MovieItem").each((i, el) => {
            const $el = $(el);
            console.log(`Item ${i+1}:`);
            console.log('  Title:', $el.find(".title h4, h4").first().text().trim());
            console.log('  URL:', $el.attr("href") || $el.find("a").attr("href"));
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testRA();
