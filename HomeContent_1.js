const axios = require("axios");
const cheerio = require("cheerio");

const axiosInstance = axios.create({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

class HomeContent_1 {
    async content(type) {
        const formData = new URLSearchParams();
        if (type) {
            formData.append('type', type);
            formData.append('offset', '2');
        }
        const response = await axiosInstance
            .post("https://ristoanime.co/wp-content/themes/TopAnime/Ajaxt/Filtering.php",
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }
            );
        const $ = cheerio.load(response.data);
        const animeList = [];
        $(".MovieItem").each((index, element) => {
            const $el = $(element);
            const anime = {
                url: $el.attr("href") || $el.find("a").attr("href"),
                title: $el.find(".title h4, .title h2, h4").first().text().trim(),
                image: ($el.find(".poster").attr("data-style") || $el.find(".poster").attr("style") || $el.attr("data-style") || $el.attr("style") || "").replace(/background-image:\s*url\(["']?/, "").replace(/["']?\);.*/, ""),
                type: $el.find(".categorySpan").text().trim(),
                genre: $el.find(".genre").text().trim(),
                releaseYear: $el.find(".release-year, .year").first().text().trim(),
                episode: ($el.find(".Episode").text() || "").replace("حلقة ", "").replace("حلقات ", "").replace("موسم ", ""),
                status: $el.find(".ribbon").text().trim(),
                quality: $el.find(".quality").text().trim()
            };
            if (anime.title) animeList.push(anime);
        });
        const next = $(".ShowMoreFromTab").attr("href");
        const data = {
            animeList: animeList,
            next: next
        }
        return data;
    }
    async sliderContent() {
        const response = await axiosInstance.get("https://ristoanime.co/");
        const $ = cheerio.load(response.data);
        const sliderList = [];
        $(".SliderHome .SlideItem").each((index, element) => {
            const $el = $(element);
            const slider = {
                url: $el.attr("href") || $el.find("a").attr("href"),
                title: $el.find(".title").text().trim(),
                image: ($el.find(".poster").attr("data-style") || $el.find(".poster").attr("style") || $el.attr("data-style") || $el.attr("style") || "").replace(/background-image:\s*url\(["']?/, "").replace(/["']?\);.*/, ""),
                type: $el.find(".categorySpan").text().trim(),
                episode: ($el.find(".Episode").text() || "").replace("حلقة ", "").replace("حلقات ", "").replace("موسم ", "")
            };
            if (slider.title) sliderList.push(slider);
        });
        return sliderList;
    }
    async searchContent(query) {
        const response = await axiosInstance.get(`https://ristoanime.co/?s=${query}`);
        const $ = cheerio.load(response.data);
        const searchList = [];
        $(".container .MovieItem").each((index, element) => {
            const $el = $(element);
            const anime = {
                url: $el.attr("href") || $el.find("a").attr("href"),
                title: $el.find(".title h4, h4").first().text().trim(),
                image: ($el.find(".poster").attr("style") || $el.find(".poster").attr("data-style") || $el.attr("style") || $el.attr("data-style") || "").replace(/background-image:\s*url\(["']?/, "").replace(/["']?\);.*/, ""),
                type: $el.find(".categorySpan").text().trim(),
                genre: $el.find(".genre").text().trim(),
                year: $el.find(".year, .release-year").first().text().trim(),
                quality: $el.find(".quality").text().trim()
            };
            if (anime.title) searchList.push(anime);
        });
        return searchList;
    }
    async animeList(offset) {
        const BASE = "https://ristoanime.co";
        const response = await axiosInstance.get(`${BASE}/series/?offset=${String(offset)}`);
        const $ = cheerio.load(response.data);
        const animeList = [];
        $(".container .MovieItem").each((index, element) => {
            const $el = $(element);
            const anime = {
                url: $el.attr("href") || $el.find("a").attr("href"),
                title: $el.find(".title h4, h4").first().text().trim(),
                image: ($el.find(".poster").attr("style") || $el.find(".poster").attr("data-style") || $el.attr("style") || $el.attr("data-style") || "").replace(/background-image:\s*url\(["']?/, "").replace(/["='?]\);.*/, ""),
                type: $el.find(".categorySpan").text().trim(),
                genre: $el.find(".genre").text().trim(),
                releaseYear: $el.find(".release-year, .year").first().text().trim(),
                quality: $el.find(".quality").text().trim()
            };
            if (anime.title) animeList.push(anime);
        });
        // Pagination link from the site (usually .ShowMoreFromTab or similar)
        const next = animeList.length > 0 ? true : false;
        return { animeList, next };
    }

    async movieList(offset) {
        const BASE = "https://ristoanime.co";
        const response = await axiosInstance.get(`${BASE}/movies?offset=${String(offset)}`);
        const $ = cheerio.load(response.data);
        const animeList = [];
        $(".container .MovieItem").each((index, element) => {
            const $el = $(element);
            const anime = {
                url: $el.attr("href") || $el.find("a").attr("href"),
                title: $el.find(".title h4, h4").first().text().trim(),
                image: ($el.find(".poster").attr("style") || $el.find(".poster").attr("data-style") || $el.attr("style") || $el.attr("data-style") || "").replace(/background-image:\s*url\(["']?/, "").replace(/["']?\);.*/, ""),
                type: "Movie",
                genre: $el.find(".genre").text().trim(),
                releaseYear: $el.find(".release-year, .year").first().text().trim(),
                quality: $el.find(".quality").text().trim()
            };
            if (anime.title) animeList.push(anime);
        });
        return { animeList, next: animeList.length > 0 };
    }

    async seasonalList(offset) {
        const BASE = "https://ristoanime.co";
        // RistoAnime usually has an 'ongoing' or seasonal section
        const response = await axiosInstance.get(`${BASE}/series/?status=ongoing&offset=${String(offset)}`);
        const $ = cheerio.load(response.data);
        const animeList = [];
        $(".container .MovieItem").each((index, element) => {
            const $el = $(element);
            const anime = {
                url: $el.attr("href") || $el.find("a").attr("href"),
                title: $el.find(".title h4, h4").first().text().trim(),
                image: ($el.find(".poster").attr("style") || $el.find(".poster").attr("data-style") || $el.attr("style") || $el.attr("data-style") || "").replace(/background-image:\s*url\(["']?/, "").replace(/["']?\);.*/, ""),
                type: $el.find(".categorySpan").text().trim(),
                genre: $el.find(".genre").text().trim(),
                releaseYear: $el.find(".release-year, .year").first().text().trim(),
                quality: $el.find(".quality").text().trim()
            };
            if (anime.title) animeList.push(anime);
        });
        return { animeList, next: animeList.length > 0 };
    }
    async episodeDate() {
        const response = await axiosInstance.get("https://ristoanime.co/time/");
        const $ = cheerio.load(response.data);
        const data = [];
        let currentDay = "";
        $(".container").each((index, element) => {
            const dayLabel = $(element).find(".filterTabs span").text().trim();
            if (dayLabel) {
                currentDay = dayLabel;
                return;
            }

            const items = $(element).find(".MovieItem");
            if (items.length === 0 || !currentDay) return;

            const episodeList = [];
            items.each((i, el) => {
                const rawStyle = $(el).find(".poster").attr("style") || "";
                const image = rawStyle
                    .replace(/background-image:\s*url\(["']?/, "")
                    .replace(/["']?\);.*/, "")
                    .trim();
                episodeList.push({
                    url: $(el).find("a").attr("href"),
                    title: $(el).find(".title h4").text().trim(),
                    image,
                    type: $(el).find(".categorySpan").text().trim(),
                    genre: $(el).find(".genre").text().trim(),
                    releaseYear: $(el).find(".release-year").text().trim(),
                    quality: $(el).find(".quality").text().trim()
                });
            });

            data.push({ day: currentDay, animeList: episodeList });
            currentDay = "";
        });
        return data;
    }
    async animeDetails(url) {
        const response = await axiosInstance.get(url);
        const $ = cheerio.load(response.data);
        const $li = $(".TaxContent li");
        const animeInfos = {
            title: $(".PostTitle a").text().trim(),
            image: $(".Poster img").attr("src"),
            status: $(".Poster .ribbon").text().trim(),
            story: $(".StoryArea p").text().trim(),
            category: $li.eq(0).find("a").text().trim(),
            genres: $li.eq(1).find("a").map((i, el) => $(el).text().trim()).get(),
            duration: $li.eq(2).find("a").text().trim(),
            releaseYear: $li.eq(3).find("a").text().trim(),
            language: $li.eq(4).find("a").text().trim(),
            quality: $li.eq(5).find("a").map((i, el) => $(el).text().trim()).get(),
            country: $li.eq(6).find("a").text().trim(),
            englishTitle: $li.eq(7).find("a").text().trim(),
            currentStatus: $li.eq(8).find("a").text().trim(),
        };
        return animeInfos;
    }
    async episodeList(url) {
        const response = await axiosInstance.get(url);
        const $ = cheerio.load(response.data);
        const episodeList = [];
        $(".EpisodesList a").each((index, element) => {
            const episode = {
                url: $(element).attr("href"),
                number: $(element).find("em").text().trim(),
            };
            episodeList.push(episode);
        });
        episodeList.reverse()
        const data = {
            list: episodeList,
            next: '/anime-episode-list'
        }
        return data;
    }
    async getServersForWatching(url) {
        const response = await axiosInstance.get(url + 'watch/');
        const $ = cheerio.load(response.data);
        const serverList = [];
        $(".ServersList #watch li").each((index, element) => {
            const server = {
                url: $(element).attr("data-watch"),
                name: "سيرفر " + $(element).find("span").text().trim(),
            };
            serverList.push(server);
        });
        return serverList;
    }
}

module.exports = HomeContent_1;
