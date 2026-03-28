const HomeContent_3 = require('./HomeContent_3');

async function testAL() {
    const al = new HomeContent_3();
    try {
        console.log('--- Testing AL Search ("hunter") ---');
        const searchResults = await al.searchContent('hunter');
        console.log('Search Results count:', searchResults.length);
        if (searchResults.length > 0) {
            console.log('First result title:', searchResults[0].title);
            console.log('First result URL:', searchResults[0].url);
        }

        console.log('\n--- Testing AL Anime List (Page 1) ---');
        const animeList = await al.animeList('1');
        console.log('Anime List count:', animeList.animeList.length);
        if (animeList.animeList.length > 0) {
            console.log('First anime title:', animeList.animeList[0].title);
        }

        console.log('\n--- Testing AL Movie List (Page 1) ---');
        const movieList = await al.movieList('1');
        console.log('Movie List count:', movieList.animeList.length);
        if (movieList.animeList.length > 0) {
            console.log('First movie title:', movieList.animeList[0].title);
        }

    } catch (e) {
        console.error('AL TEST ERROR:', e.message);
    }
}

testAL();
