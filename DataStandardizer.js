const HomeContent_1 = require('./HomeContent_1');
const HomeContent_2 = require('./HomeContent_2');
const HomeContent_3 = require('./HomeContent_3');


class DataStandardizer {
    /**
     * Extracts and standardizes data from the different HomeContent providers.
     * @param {string|number} offset - The website identifier (1=RA, 2=AS, 3=AL)
     * @returns {Object} { slider: [...], rowData: [...] }
     */
    async getLatestData(offset) {
        const strOffset = String(offset);

        // 1: ristoanime.co
        if (strOffset === '1') {
            const home = new HomeContent_1();
            const [slider, latest, movies, episodes] = await Promise.all([
                home.sliderContent().catch(() => []),
                home.content().catch(() => ({ animeList: [] })),
                home.content('newMovies').catch(() => ({ animeList: [] })),
                home.content('newEpisodes').catch(() => ({ animeList: [] }))
            ]);

            return {
                slider: this.formatSlider(slider),
                rowData: [
                    { title: "أحدث الحلقات", data: this.formatList(episodes.animeList || []) },
                    { title: "أحدث الأنميات", data: this.formatList(latest.animeList || []) },
                    { title: "أحدث الأفلام", data: this.formatList(movies.animeList || []) }
                ].filter(row => row.data && row.data.length > 0)
            };
        } 
        // 2: animesit.com
        else if (strOffset === '2') {
            const home = new HomeContent_2();
            const [latest, movies, completed, continuous] = await Promise.all([
                home.content().catch((err) => ({ animeList: [] })),
                home.animeMovies().catch(() => ({ animeList: [] })),
                home.animeCompleted().catch(() => ({ animeList: [] })),
                home.animeContinuous().catch(() => ({ animeList: [] }))
            ]);

            return {
                slider: this.formatSlider(continuous.animeList || []),
                rowData: [
                    { title: "أحدث الأنميات", data: this.formatList(latest.animeList || []) },
                    { title: "أحدث الأفلام", data: this.formatList(movies.animeList || []) },
                    { title: "الأنميات المكتملة", data: this.formatList(completed.animeList || []) },
                    { title: "الأنميات المستمرة", data: this.formatList(continuous.animeList || []) }
                ].filter(row => row.data && row.data.length > 0)
            };
        } 
        // 3: animelek.vip
        else if (strOffset === '3') {
            const home = new HomeContent_3();
            // content() returns an array of categories
            const allData = await home.content().catch(() => []);
            
            let slider = [];
            const rowData = [];

            for (const section of allData) {
                if (section.title === 'الأكثر مشاهدة' || section.title.includes('مشاهدة')) {
                    // Extract Top Anime for the slider
                    slider = this.formatSlider(section.animeList);
                } else {
                    rowData.push({
                        title: section.title,
                        data: this.formatList(section.animeList)
                    });
                }
            }

            return {
                slider: slider,
                rowData: rowData.filter(row => row.data && row.data.length > 0)
            };
        }

        return { slider: [], rowData: [] };
    }

    /**
     * Searches a specific provider based on offset and returns a grouped response.
     */
    async searchByOffset(query, offset) {
        let provider, title;
        const strOffset = String(offset);
        
        if (strOffset === '1') {
            provider = new HomeContent_1();
            title = "RA";
        } else if (strOffset === '2') {
            provider = new HomeContent_2();
            title = "AS";
        } else if (strOffset === '3') {
            provider = new HomeContent_3();
            title = "AL";
        } else {
            return { rowData: [] };
        }

        try {
            const data = await this.getSearch(query, offset);
            return {
                rowData: [
                    { title: title, data: data.data }
                ].filter(row => row.data && row.data.length > 0)
            };
        } catch (e) {
            return { rowData: [] };
        }
    }

    /**
     * Standardizes the list of slider items.
     */
    formatSlider(list) {
        if (!Array.isArray(list)) return [];
        return list.map(item => ({
            url: item.url || "",
            title: item.title || "",
            image: item.image || "",
            description: item.description || item.story || item.genre || "", // Map to whatever is available
            story: item.story || "",
            episode: item.episode || item.status || "",
            status: item.status || "",
            type: item.type || "",
            genre: item.genre || "",
            year: item.year || item.releaseYear || "",
            quality: item.quality || "",
            season: item.season || ""
        }));
    }

    /**
     * Standardizes the list of row data items (animes, movies, episodes).
     */
    formatList(list) {
        if (!Array.isArray(list)) return [];
        return list.map(item => ({
            url: item.url || "",
            title: item.title || "",
            image: item.image || "",
            status: item.status || "",
            episode: (item.episode || "").replace(" ","").replace("الحلقة ", ""),
            type: item.type || "",
            genre: item.genre || "",
            year: item.year || item.releaseYear || "",
            quality: item.quality || "",
            season: item.season || "",
            story: item.story || "",
            description: item.description || ""
        }));
    }

    /**
     * Determines the correct HomeContent provider based on the URL hostname.
     */
    getProvider(urlString) {
        try {
            const hostname = new URL(urlString).hostname;
            if (hostname.includes('ristoanime')) return new HomeContent_1();
            if (hostname.includes('animesit')) return new HomeContent_2();
            if (hostname.includes('animelek')) return new HomeContent_3();
        } catch (e) {
            return null;
        }
        return null;
    }

    /**
     * Helper to format genres safely.
     */
    formatGenres(genres) {
        if (!Array.isArray(genres)) return [];
        return genres.map(g => (g.label ? g.label : g));
    }

    /**
     * Fetches and standardizes anime details.
     */
    async getAnimeDetails(url) {
        const provider = this.getProvider(url);
        if (!provider) throw new Error("Unsupported URL or Provider. Make sure the link is from ristoanime, animesit, or animelek.");

        const data = await provider.animeDetails(url);

        return {
            title: data.title || "",
            image: data.image || "",
            status: data.status || data.currentStatus || "",
            story: data.story || data.description || "",
            type: data.type || data.category || "",
            genres: this.formatGenres(data.genres),
            year: data.year || data.releaseYear || "",
            duration: data.duration || "",
            language: data.language || "",
            quality: Array.isArray(data.quality) ? data.quality.join(', ') : (data.quality || ""),
            country: data.country || "",
            englishTitle: data.englishTitle || "",
            studio: data.studio || "",
            season: data.season || "",
            episodes: data.episodes || "",
            director: data.director || "",
            characters: data.characters || []
        };
    }

    /**
     * Fetches and standardizes the episodes list.
     */
    async getAnimeEpisodes(url) {
        const provider = this.getProvider(url);
        if (!provider) throw new Error("Unsupported URL or Provider. Make sure the link is from ristoanime, animesit, or animelek.");

        const data = await provider.episodeList(url);

        if (provider instanceof HomeContent_1) {
            // HomeContent_1 returns { list: [{url, number}], next }
            if (!data || !data.list) return [];
            return data.list.map(ep => ({
                name: ep.number,
                url: ep.url
            }));
        } else {
            // HomeContent_2 and 3 return [{name, url}]
            if (!Array.isArray(data)) return [];
            return data.map(ep => ({
                name: ep.name || ep.number || "",
                url: ep.url || ""
            }));
        }
    }

    /**
     * Fetches and standardizes the servers list.
     */
    async getAnimeServers(url) {
        const provider = this.getProvider(url);
        if (!provider) throw new Error("Unsupported URL or Provider. Make sure the link is from ristoanime, animesit, or animelek.");

        const data = await provider.getServersForWatching(url);
        
        if (!Array.isArray(data)) return [];
        return data.map(server => ({
            name: server.name || "",
            url: server.url || ""
        }));
    }

    /**
     * Unified method to fetch Anime List from a specific server.
     */
    async getAnimeList(server, offset = '1') {
        let provider, listData;
        const strSrv = String(server);
        if (strSrv === '1') provider = new HomeContent_1();
        else if (strSrv === '2') provider = new HomeContent_2();
        else if (strSrv === '3') provider = new HomeContent_3();
        else return { data: [], next: null };

        try {
            // Check if animeList method exists, otherwise fallback to generic list
            if (provider.animeList) {
                listData = await provider.animeList(offset);
            } else if (provider.content) {
                listData = await provider.content();
            }
            
            const animeList = listData.animeList || listData || [];
            return {
                data: this.formatList(animeList),
                next: listData.next || null
            };
        } catch (e) {
            return { data: [], next: null };
        }
    }

    /**
     * Unified method to fetch Movie List from a specific server.
     */
    async getMovieList(server, offset = '1') {
        let provider, listData;
        const strSrv = String(server);
        if (strSrv === '1') {
            provider = new HomeContent_1();
            listData = await provider.movieList(offset);
        } else if (strSrv === '2') {
            provider = new HomeContent_2();
            listData = await provider.animeMovies(offset);
        } else if (strSrv === '3') {
            provider = new HomeContent_3();
            listData = await provider.movieList(offset); 
        } else return { data: [], next: null };

        try {
            const animeList = listData.animeList || listData || [];
            return {
                data: this.formatList(animeList),
                next: listData.next || null
            };
        } catch (e) {
            return { data: [], next: null };
        }
    }

    /**
     * Unified method to fetch Season/Ongoing Anime from a specific server.
     */
    async getSeasonAnime(server, offset = '1') {
        let provider, listData;
        const strSrv = String(server);
        if (strSrv === '1') {
            provider = new HomeContent_1();
            listData = await provider.seasonalList(offset);
        } else if (strSrv === '2') {
            provider = new HomeContent_2();
            listData = await provider.animeContinuous(offset);
        } else if (strSrv === '3') {
            provider = new HomeContent_3();
            listData = await provider.seasonalList(offset);
        } else return { data: [], next: null };

        try {
            const animeList = listData.animeList || listData || [];
            return {
                data: this.formatList(animeList),
                next: listData.next || null
            };
        } catch (e) {
            return { data: [], next: null };
        }
    }

    /**
     * Unified search for SSR.
     */
    async getSearch(query, server, offset = '1') {
        const strSrv = String(server);
        let provider;
        if (strSrv === '1') provider = new HomeContent_1();
        else if (strSrv === '2') provider = new HomeContent_2();
        else if (strSrv === '3') provider = new HomeContent_3();
        else return { data: [] };

        try {
            const data = await provider.searchContent(query);
            const list = Array.isArray(data) ? data : (data.animeList || []);
            return { data: this.formatList(list) };
        } catch (e) {
            return { data: [] };
        }
    }

    /**
     * Fetches and standardizes the episode release schedule (from HomeContent_1).
     */
    async getEpisodeByDate() {
        const provider = new HomeContent_1();
        try {
            const data = await provider.episodeDate();
            if (!Array.isArray(data)) return { rowData: [] };

            return {
                rowData: data.map(schedule => ({
                    title: schedule.day || "Unknown Day",
                    data: this.formatList(schedule.animeList || [])
                })).filter(row => row.data && row.data.length > 0)
            };
        } catch (e) {
            return { rowData: [] };
        }
    }
}

module.exports = DataStandardizer;
