const axios = require('axios');
const fs = require('fs');

async function dumpSearch() {
    const url = 'https://animelek.vip/search/?s=hunter';
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    });
    fs.writeFileSync('search_dump.html', response.data);
    console.log('Search HTML dumped to search_dump.html');
}

dumpSearch();
