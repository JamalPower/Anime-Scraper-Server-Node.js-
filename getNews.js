const axios = require("axios");
const axiosInstance = require('./scraperAxios');
const cheerio = require("cheerio");

class GetNews {
    async contentList() {
        const response = await axiosInstance.get("https://www.animearabs.com/");
        const $ = cheerio.load(response.data);
        const newsList = [];
        $("ul.columns-3 li").each((index, element) => {
            const $el = $(element);
            const news = {
                url: $el.find("a").attr("href"),
                title: $el.find("h3").first().text().trim(),
                image: $el.find("img").attr("src"),
                date: $el.find("time").first().text().trim()
            };
            if (news.title) newsList.push(news);
        });
        const next = $(".wp-block-query-pagination-next").attr("href");
        const data = {
            newsList: newsList,
            next: next
        }
        return data;
    }
    async contentPage(url) {
        try {
            const response = await axiosInstance.get(url);
            const $ = cheerio.load(response.data);

            const news = {
                title: $(".entry-title").text().trim() ||
                       $("h1").eq(1).text().trim() ||
                       $('meta[property="og:title"]').attr('content') ||
                       $("h1").first().text().trim(),
                image: $('meta[property="og:image"]').attr('content') ||
                       $(".attachment-post-thumbnail, .wp-post-image, .post-thumbnail img").first().attr("src"),
                content: $(".entry-content").html()?.trim() || $(".post-content").html()?.trim(),
                date: $(".entry-date, .published, time").first().text().trim() ||
                      $('meta[property="article:published_time"]').attr('content') || "",
                author: $(".author, .author-name, .vcard, .url.fn.n").first().text().trim() ||
                        $('meta[name="author"]').attr('content') || "",
                categories: $(".entry-categories, .cat-links, .post-categories").find("a").map((i, el) => $(el).text().trim()).get().join(", ") ||
                            $(".entry-categories, .cat-links, .post-categories").first().text().trim(),
                iframe_url: $("iframe").attr("src")
            };

            return news;
        } catch (error) {
            console.error(`Error fetching news page from ${url}:`, error.message);
            return null;
        }
    }
}
module.exports = GetNews;
