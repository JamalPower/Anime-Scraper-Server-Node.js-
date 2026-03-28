const axios = require("axios");
const cheerio = require("cheerio");

const axiosInstance = axios.create({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

class HomeContent_2 {
    constructor() {
        this.baseUrl = "https://web.animesit.com/";
    }

    async content(type) {
        try {
            const url = type ? `${this.baseUrl}anime/?status=ongoing&type=&order=update` : `${this.baseUrl}anime/?status=ongoing&type=&order=update`;
            const response = await axiosInstance.get(url);
            const data = response.data;
            const animeList = [];
            const $ = cheerio.load(data);
            const items = $('.listupd .bs, a.tip').length > 0 ? $('.listupd .bs, a.tip') : $('.bs, .a-i');
            items.each((i, el) => {
                const $el = $(el);
                const anime = {
                    url: $el.attr("href") || $el.find("a").attr("href"),
                    title: $el.find("h2, h3, h4").first().text().trim() || $el.text().trim(),
                    image: $el.find("img").attr("src") || $el.find("img").attr("data-src"),
                    status: $el.find(".epx, .status").text().trim(),
                    type: $el.find(".typez, .type").text().trim(),
                };
                if (anime.title && anime.url) animeList.push(anime);
            });
            const next = $('.hpage a').attr('href');
            const result = {
                animeList: animeList,
                next: next
            }
            return result;
        } catch (error) {
            throw error;
        }
    }

    async animeMovies(page = '1') {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}anime/?page=${page}&type=movie&order=update`);
            const data = response.data;
            const animeList = [];
            const $ = cheerio.load(data);
            const items = $('.listupd .bs, a.tip').length > 0 ? $('.listupd .bs, a.tip') : $('.bs, .a-i');
            items.each((i, el) => {
                const $el = $(el);
                const anime = {
                    url: $el.attr("href") || $el.find("a").attr("href"),
                    title: $el.find("h2, h3, h4").first().text().trim() || $el.text().trim(),
                    image: $el.find("img").attr("src") || $el.find("img").attr("data-src"),
                    status: $el.find(".epx, .status").text().trim(),
                    type: $el.find(".typez, .type").text().trim(),
                };
                if (anime.title && anime.url) animeList.push(anime);
            });
            const next = $('.hpage a.r').attr('href') || $('.hpage a').length > 0;
            return { animeList, next };
        } catch (error) { throw error; }
    }
    async animeContinuous(page = '1') {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}anime/?page=${page}&status=ongoing&order=update`);
            const data = response.data;
            const animeList = [];
            const $ = cheerio.load(data);
            const items = $('.listupd .bs, a.tip').length > 0 ? $('.listupd .bs, a.tip') : $('.bs, .a-i');
            items.each((i, el) => {
                const $el = $(el);
                const anime = {
                    url: $el.attr("href") || $el.find("a").attr("href"),
                    title: $el.find("h2, h3, h4").first().text().trim() || $el.text().trim(),
                    image: $el.find("img").attr("src") || $el.find("img").attr("data-src"),
                    status: $el.find(".epx, .status").text().trim(),
                    type: $el.find(".typez, .type").text().trim(),
                };
                if (anime.title && anime.url) animeList.push(anime);
            });
            const next = $('.hpage a.r').attr('href') || $('.hpage a').length > 0;
            return { animeList, next };
        } catch (error) { throw error; }
    }
    
    async animeList(page = '1') {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}anime/?page=${page}&order=update`);
            const data = response.data;
            const animeList = [];
            const $ = cheerio.load(data);
            const items = $('.listupd .bs, a.tip').length > 0 ? $('.listupd .bs, a.tip') : $('.bs, .a-i');
            items.each((i, el) => {
                const $el = $(el);
                const anime = {
                    url: $el.attr("href") || $el.find("a").attr("href"),
                    title: $el.find("h2, h3, h4").first().text().trim() || $el.text().trim(),
                    image: $el.find("img").attr("src") || $el.find("img").attr("data-src"),
                    status: $el.find(".epx, .status").text().trim(),
                    type: $el.find(".typez, .type").text().trim(),
                };
                if (anime.title && anime.url) animeList.push(anime);
            });
            const next = $('.hpage a.r').attr('href') || $('.hpage a').length > 0;
            return { animeList, next };
        } catch (error) { throw error; }
    }
    async animeCompleted() {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}anime/?status=completed&sub=&order=rating`);
            const data = response.data;
            const animeList = [];
            const $ = cheerio.load(data);
            const items = $('.listupd .bs, a.tip').length > 0 ? $('.listupd .bs, a.tip') : $('.bs, .a-i');
            items.each((i, el) => {
                const $el = $(el);
                const anime = {
                    url: $el.attr("href") || $el.find("a").attr("href"),
                    title: $el.find("h2, h3, h4").first().text().trim() || $el.text().trim(),
                    image: $el.find("img").attr("src") || $el.find("img").attr("data-src"),
                    status: $el.find(".epx, .status").text().trim(),
                    type: $el.find(".typez, .type").text().trim(),
                };
                if (anime.title && anime.url) animeList.push(anime);
            });
            const next = $('.hpage a').attr('href');
            const result = {
                animeList: animeList,
                next: next
            }
            return result;
        } catch (error) {
            throw error;
        }
    }
    async searchContent(query) {
        try {
            const response = await axiosInstance.get(`${this.baseUrl}/?s=${query}`);
            const data = response.data;
            const animeList = [];
            const $ = cheerio.load(data);
            const items = $('.listupd .bs, a.tip').length > 0 ? $('.listupd .bs, a.tip') : $('.bs, .a-i');
            items.each((i, el) => {
                const $el = $(el);
                const anime = {
                    url: $el.attr("href") || $el.find("a").attr("href"),
                    title: $el.find("h2, h3, h4").first().text().trim() || $el.text().trim(),
                    image: $el.find("img").attr("src") || $el.find("img").attr("data-src"),
                    status: $el.find(".epx, .status").text().trim(),
                    type: $el.find(".typez, .type").text().trim(),
                };
                if (anime.title && anime.url) animeList.push(anime);
            });
            const next = $('.hpage a').attr('href');
            const result = {
                animeList: animeList,
                next: next
            }
            return result;
        } catch (error) {
            throw error;
        }
    }

    async episodeDate() {
        try {
            const response = await axiosInstance.post(`${this.baseUrl}/anime-date`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async animeDetails(url) {
        try {
            const response = await axiosInstance.get(url);
            const data = response.data;
            const $ = cheerio.load(data);
            const getSpanValue = (label) => {
                let value = '';
                $('.info-content .spe span').each((i, el) => {
                    const bold = $(el).find('b').text().trim();
                    if (bold === label) {
                        // Remove the bold label text, keep the rest
                        $(el).find('b').remove();
                        value = $(el).text().trim();
                    }
                });
                return value;
            };

            // Helper: get href + text after a label (for linked fields)
            const getSpanLink = (label) => {
                let result = null;
                $('.info-content .spe span').each((i, el) => {
                    const bold = $(el).find('b').first().text().trim();
                    if (bold === label) {
                        const a = $(el).find('a').first();
                        result = a.text().trim()
                    }
                });
                return result;
            };

            // Genres
            const genres = [];
            $('.info-content .genxed a').each((i, el) => {
                genres.push({
                    label: $(el).text().trim()
                });
            });

            // Characters & Voice Actors
            const characters = [];
            $('.bixbox.charvoice .cvlist .cvitem').each((i, el) => {
                const char = $(el).find('.cvchar');
                const actor = $(el).find('.cvactor');

                characters.push({
                    character: {
                        name: char.find('.charname').text().trim(),
                        role: char.find('.charrole').text().trim(),
                        image: char.find('img').attr('src') || '',
                    },
                    voiceActor: {
                        name: actor.find('.charname').text().trim(),
                        url: actor.find('a').attr('href') || '',
                        image: actor.find('img').attr('src') || '',
                        language: actor.find('.charrole').text().trim(),
                    },
                });
            });

            const anime = {
                title: $('h1.entry-title').text().trim() || $('.bixbox.animefull h1').text().trim(),
                image: $('.bixbox.animefull .thumbook img').attr('src') || '',
                status: getSpanValue('الحالة:'),
                studio: getSpanLink('الاستوديو:'),
                year: getSpanValue('تم الإصدار:'),
                duration: getSpanValue('المدة:'),
                season: getSpanLink('الموسم:'),
                type: getSpanValue('النوع:'),
                episodes: getSpanValue('الحلقات:'),
                director: getSpanLink('المخرج:'),
                genres: genres,
                story: $('.entry-content p').text().trim(),
                characters: characters
            };

            return anime;
        } catch (error) {
            throw error;
        }
    }

    async episodeList(url) {
        try {
            const response = await axiosInstance.get(url);
            const data = response.data;
            const $ = cheerio.load(data);
            
            // The episodes and servers in animesit are embedded inside a noscript tag
            const noscriptHtml = $('noscript#diplayer').html();
            if (!noscriptHtml) return [];
            
            const $$ = cheerio.load(noscriptHtml);
            const episodes = [];
            
            $$('#EpList1 .CSB').each((i, el) => {
                const titleText = $$(el).text().trim();
                episodes.push({
                    name: titleText,
                    // Pass the index as a parameter because all servers are on this same anime page
                    url: `${url}?episode=${i}`,
                });
            });
            
            return episodes;
        } catch (error) {
            throw error;
        }
    }

    async getServersForWatching(episodeUrl) {
        try {
            // Parse the episode index passed from episodeList
            const urlObj = new URL(episodeUrl);
            const episodeIndex = parseInt(urlObj.searchParams.get('episode') || '0', 10);
            
            const pageUrl = episodeUrl.split('?')[0]; 
            
            const response = await axiosInstance.get(pageUrl);
            const data = response.data;
            const $ = cheerio.load(data);
            
            const noscriptHtml = $('noscript#diplayer').html();
            if (!noscriptHtml) return [];
            
            const $$ = cheerio.load(noscriptHtml);
            const servers = [];
            
            // .divv11 elements contain the un-rendered server lists per episode matching the index
            const serverContainers = $$('#ServerList1 .divv11');
            if (serverContainers.length > episodeIndex) {
                const container = serverContainers.eq(episodeIndex);
                container.find('li').each((i, el) => {
                    const serverName = $$(el).text().trim();
                    const quality = $$(el).attr('quality-data') || '';
                    const serverData = $$(el).attr('data') || '';
                    const type = $$(el).attr('type') || '';
                    
                    let embedUrl = serverData;
                    if (type === 'mp4upload') embedUrl = `https://www.mp4upload.com/embed-${serverData}.html`;
                    else if (type === 'dailymotion') embedUrl = `https://www.dailymotion.com/embed/video/${serverData}`;
                    else if (type === 'mega') embedUrl = `https://mega.nz/embed/${serverData}`;
                    else if (type === 'ok') embedUrl = `https://ok.ru/videoembed/${serverData}`;
                    else if (type === 'videa') embedUrl = `https://videa.hu/player?v=${serverData}`;
                    else if (type === 'asnwish') embedUrl = `https://asnwish.com/e/${serverData}`;
                    else if (type === 'uqload') embedUrl = `https://uqload.com/embed-${serverData}.html`;
                    else if (type === 'drive') embedUrl = `https://drive.google.com/file/d/${serverData}/preview`;
                    
                    if (serverData) {
                        servers.push({
                            name: serverName + (quality ? ` (${quality})` : ''),
                            url: embedUrl
                        });
                    }
                });
            }
            
            return servers;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = HomeContent_2;
