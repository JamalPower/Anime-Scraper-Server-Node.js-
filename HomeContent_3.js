const axios = require("axios");
const cheerio = require("cheerio");

const axiosInstance = axios.create({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

class HomeContent_3 {
    constructor() {
        this.baseUrl = "https://animelek.vip";
    }
    async content() {
        try {
            const url = this.baseUrl;
            // Best to use GET for standard web pages
            const response = await axiosInstance.get(url);
            const data = response.data;
            const result = [];
            const $ = cheerio.load(data);

            // 1. Optional: Handle the Top Slider ("الأكثر مشاهدة") if it exists
            const sliderContainer = $('.slider-episode-container');
            if (sliderContainer.length > 0) {
                const sliderTitle = sliderContainer.prev('.main-didget-head').find('h2').text().trim().replace(/\s+/g, ' ');
                const sliderList = [];
                sliderContainer.find('.owl-episode-card').each((i, el) => {
                    const anime = {
                        url: $(el).find('.anime-title h3 a, .anime-card-title a').attr('href') || $(el).find('a').first().attr('href'),
                        title: $(el).find('.anime-title h3 a, .anime-card-title a').text().trim(),
                        image: $(el).find('img').attr('src'),
                        status: '', 
                        episode: $(el).find('.anime-title h4 a, .anime-card-title h4 a').text().trim(),
                        season: ''
                    };
                    if (anime.title) sliderList.push(anime);
                });
                
                if (sliderList.length > 0) {
                    result.push({
                        title: sliderTitle || 'الأكثر مشاهدة',
                        animeList: sliderList
                    });
                }
            }

            // 2. Handle the standard widgets ("الحلقات المثبتة", "الأنميات المثبتة", "اخر الحلقات", etc.)
            $('.main-widget').each((i, widget) => {
                const title = $(widget).find('.main-didget-head h2').text().trim().replace(/\s+/g, ' ');
                const animeList = [];
                
                // Using a comma to select both types of cards within this specific widget
                $(widget).find('.episodes-card-container, .anime-card-container').each((j, el) => {
                    const isEpisodeCard = $(el).hasClass('episodes-card-container') || $(el).find('.ep-card-anime-title').length > 0;
                    
                    const titleText = $(el).find('.ep-card-anime-title h3 a, .anime-card-title a').text().trim();
                    const urlVal = $(el).find('.ep-card-anime-title h3 a, .anime-card-title a').attr('href') || $(el).find('a').first().attr('href');
                    const imgVal = $(el).find('img.img-responsive').attr('src') || $(el).find('img').attr('src');
                    
                    // Fixed status: just target the container without the `a` tags inside them individually, 
                    // which prevents cheerio `.text()` from duplicating the text.
                    const statusVal = $(el).find('.episodes-card-status, .anime-card-status').text().trim().replace(/\n/g, '').replace(/\s+/g, ' ');

                    // The H4 text can be either the episode number (for episode cards) or the season (for anime cards)
                    const subtitleText = $(el).find('h4').text().trim();

                    const anime = {
                        url: urlVal,
                        title: titleText || $(el).find('.anime-card-details h3 a').text().trim(),
                        image: imgVal || $(el).find('.anime-card-poster img').attr('src'),
                        status: statusVal,
                        episode: isEpisodeCard ? subtitleText : '',
                        season: !isEpisodeCard ? subtitleText : ''
                    };
                    // Ensure we don't push empty/invalid items
                    if (anime.title) {
                        animeList.push(anime);
                    }
                });

                if (animeList.length > 0) {
                    result.push({
                        title: title,
                        animeList: animeList
                    });
                }
            });

            return result;
        } catch (error) {
            throw error;
        }
    }
    async searchContent(query) {
        try {
            const url = this.baseUrl + "/search/?s=" + query;
            const response = await axiosInstance.get(url);
            const data = response.data;
            const animeList = [];
            const $ = cheerio.load(data);
            
            // Try different containers and wrappers
            const itemSelector = '.anime-card-container, .episodes-card-container, [class*="col-"]';
            const containerSelector = '.search-results, .anime-list-content, .container';
            
            $(containerSelector).find(itemSelector).each((i, el) => {
                const $el = $(el);
                const isEpisodeCard = $el.find('.episodes-card-container, .ep-card-anime-title').length > 0;

                const titleText = $el.find('.anime-card-title h3 a, .anime-card-title a, .ep-card-anime-title h3 a').text().trim();
                const urlVal = $el.find('a.overlay').attr('href') || $el.find('.anime-card-title h3 a, .anime-card-title a').attr('href') || $el.find('a').first().attr('href');
                const imgVal = $el.find('.anime-card-poster img').attr('src') || $el.find('img').attr('src');
                const statusVal = $el.find('.anime-card-status, .episodes-card-status').first().text().trim().replace(/\n/g, '').replace(/\s+/g, ' ');
                const subtitleText = $el.find('h4').text().trim();

                const anime = {
                    url: urlVal,
                    title: titleText || $el.find('.anime-card-details h3 a').text().trim(),
                    image: imgVal,
                    status: statusVal,
                    episode: isEpisodeCard ? subtitleText : '',
                    season: !isEpisodeCard ? subtitleText : ''
                };
                
                if (anime.title && !animeList.some(item => item.url === anime.url)) {
                    animeList.push(anime);
                }
            });
            return animeList;
        } catch (error) {
            throw error;
        }
    }

    async animeDetails(url) {
        try {
            const response = await axiosInstance.get(url);
            const data = response.data;
            const $ = cheerio.load(data);
            
            const getInfoValue = (label) => {
                let value = '';
                $('.full-list-info').each((i, el) => {
                    const firstSmall = $(el).find('small').first().text().trim();
                    if (firstSmall === label) {
                        value = $(el).find('small').last().text().trim();
                    }
                });
                return value;
            };

            const genres = [];
            $('.anime-genres li a').each((i, el) => {
                genres.push({
                    label: $(el).text().trim()
                });
            });

            const anime = {
                title: $('h1.anime-details-title').text().trim() || $('.anime-details-title').first().text().trim(),
                image: $('.anime-thumbnail-pic img').attr('src') || '',
                status: getInfoValue('حالة الأنمي'),
                type: getInfoValue('النوع'),
                year: getInfoValue('بداية العرض'),
                duration: getInfoValue('مدة الحلقة'),
                season: getInfoValue('الموسم'),
                episodes: getInfoValue('عدد الحلقات'),
                studio: '', 
                director: '', 
                trailer_url:$('.anime-trailer').attr('href') || '',
                genres: genres,
                story: $('.anime-story').text().trim(),
                characters: [] 
            };

            return anime;
        } catch (error) {
            throw error;
        }
    }

    async getServersForWatching(url) {
        try {
            const response = await axiosInstance.get(url);
            const data = response.data;
            const $ = cheerio.load(data);
            const servers = [];

            // The list of servers is inside ul#episode-servers li.watch a
            $('#episode-servers li.watch a').each((i, el) => {
                const epUrl = $(el).attr('data-ep-url');
                const titleText = $(el).contents().not($(el).children('small')).text().trim(); // get text without <small> tag
                const qualityText = $(el).find('small').text().trim(); // typically 'HD', 'FHD', 'SD'
                
                if (epUrl) {
                    servers.push({
                        name: titleText + (qualityText ? ' ' + qualityText : ''),
                        url: epUrl
                    });
                }
            });

            return servers;
        } catch (error) {
            throw error;
        }
    }
    async episodeList(url) {
        try {
            const response = await axiosInstance.get(url);
            const data = response.data;
            const $ = cheerio.load(data);
            const episodes = [];
            $('#DivEpisodesList .DivEpisodeContainer').each((i, el) => {
                const epUrl = $(el).find('.ep-card-anime-title-detail h3 a').attr('href') || $(el).find('a.overlay').attr('href');
                const titleText = $(el).find('.ep-card-anime-title-detail h3 a').text().trim();
                if (epUrl) {
                    episodes.push({
                        name: titleText,
                        url: epUrl,
                    });
                }
            });
            return episodes;
        } catch (error) {
            throw error;
        }
    }
    async animeList(offset){
        const url = `${this.baseUrl}/%D9%82%D8%A7%D8%A6%D9%85%D8%A9-%D8%A7%D9%84%D8%A3%D9%86%D9%85%D9%8A/?page=${String(offset)}`;
        const response = await axiosInstance.get(url);
        const $ = cheerio.load(response.data);
        const animeList = [];
        $('.anime-list-content .anime-card-container, .anime-list-content [class*="col-"]').each((i, el) => {
            const $el = $(el);
            const isEpisodeCard = $el.find('.episodes-card-container, .ep-card-anime-title').length > 0;

            const titleText = $el.find('.anime-card-title h3 a, .anime-card-title a').text().trim();
            const urlVal = $el.find('a.overlay').attr('href') || $el.find('.anime-card-title h3 a').attr('href') || $el.find('a').first().attr('href');
            const imgVal = $el.find('.anime-card-poster img').attr('src') || $el.find('img').attr('src');
            const statusVal = $el.find('.anime-card-status').first().text().trim().replace(/\n/g, '').replace(/\s+/g, ' ');
            const subtitleText = $el.find('h4').text().trim();
            const anime = {
                url: urlVal,
                title: titleText || $el.find('.anime-card-details h3 a').text().trim(),
                image: imgVal,
                status: statusVal,
                episode: isEpisodeCard ? subtitleText : '',
                season: !isEpisodeCard ? subtitleText : ''
            };
            if (anime.title) {
                animeList.push(anime);
            }
        });
        const next = $(".page-link").attr("href");
        const data = {
            animeList: animeList,
            next: next
        }
        return data;
    }

    async movieList(offset){
        const response = await axiosInstance.get(`${this.baseUrl}/anime-type/%D9%81%D9%8A%D9%84%D9%85/?page=${String(offset)}`);
        const $ = cheerio.load(response.data);
        const animeList = [];
        $('.anime-list-content .anime-card-container, .anime-list-content [class*="col-"]').each((i, el) => {
            const $el = $(el);
            const titleText = $el.find('.anime-card-title h3 a, .anime-card-title a').text().trim();
            const urlVal = $el.find('a.overlay').attr('href') || $el.find('.anime-card-title h3 a').attr('href') || $el.find('a').first().attr('href');
            const imgVal = $el.find('.anime-card-poster img').attr('src') || $el.find('img').attr('src');
            const statusVal = $el.find('.anime-card-status').text().trim();
            const anime = {
                url: urlVal,
                title: titleText || $el.find('.anime-card-details h3 a').text().trim(),
                image: imgVal,
                status: statusVal,
                type: 'Movie'
            };
            if (anime.title) animeList.push(anime);
        });
        return { animeList, next: $(".page-link").length > 0 };
    }

    async seasonalList(offset){
        const url = `${this.baseUrl}/%D8%A7%D9%84%D9%85%D9%88%D8%B3%D9%85-%D8%A7%D9%84%D8%AD%D8%A7%D9%84%D9%8A/?page=${String(offset)}`;
        const response = await axiosInstance.get(url);
        const $ = cheerio.load(response.data);
        const animeList = [];
        $('.anime-list-content .anime-card-container, .anime-list-content [class*="col-"]').each((i, el) => {
            const $el = $(el);
            const titleText = $el.find('.anime-card-title h3 a, .anime-card-title a').text().trim();
            const urlVal = $el.find('a.overlay').attr('href') || $el.find('.anime-card-title h3 a').attr('href') || $el.find('a').first().attr('href');
            const imgVal = $el.find('.anime-card-poster img').attr('src') || $el.find('img').attr('src');
            const statusVal = $el.find('.anime-card-status').text().trim();
            const anime = {
                url: urlVal, 
                title: titleText || $el.find('.anime-card-details h3 a').text().trim(), 
                image: imgVal, 
                status: statusVal
            };
            if (anime.title) animeList.push(anime);
        });
        return { animeList, next: $(".page-link").length > 0 };
    }
}
module.exports = HomeContent_3;