const express = require("express");
const cors = require("cors");
require('dotenv').config()
const DataStandardizer = require("../DataStandardizer");
const db = require("../database");
const PORT = 3000;
const ejs = require("ejs");
const path = require("path");
const localhost = "http://localhost:" + PORT;

const server_list = 
[
    {
     name: "RA",
     url: "/api/latest?offset=1"
    },
    {
     name: "AS",
     url: "/api/latest?offset=2"
    },
    {
     name: "AL",
     url: "/api/latest?offset=3"
    }
]
const app = express();
app.set("trust proxy", 1);
const rateLimit = require("express-rate-limit");
app.use(cors());
app.use(express.json());

// Anti-Scraping: Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 200, 
    message: { error: "Too many requests from this IP, please try again after 15 minutes." },
    standardHeaders: true, 
    legacyHeaders: false, 
});
app.use(limiter);

// Anti-Scraping: Advanced API Protection
app.use('/api', (req, res, next) => {
    // 1. Secret Key Bypass for Jetpack Compose App & Testing
    const secretKey = req.headers['x-nexo-api-key'];
    if (secretKey === process.env.API_SECRET_KEY) {
        return next();
    }

    // 2. Block obvious scrappers by User-Agent
    const userAgent = req.headers['user-agent'] || '';
    const blockedUserAgents = ['curl', 'python', 'postman', 'wget', 'urllib', 'headless', 'puppeteer', 'httpclient'];
    const isBot = blockedUserAgents.some(bot => userAgent.toLowerCase().includes(bot));
    
    if (!userAgent || isBot) {
        return res.status(403).json({ error: "Access Denied: Unrecognized or explicitly blocked User-Agent." });
    }

    // 3. Strict Web Origin Restriction
    const origin = req.headers.origin || req.headers.referer || '';
    const allowedOrigins = ['https://anime-nexo.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000'];
    const isAllowedOrigin = allowedOrigins.some(o => origin.startsWith(o));

    if (!isAllowedOrigin) {
        return res.status(403).json({ error: "Access Denied: Unauthorized origin or missing Origin header. Please use the app API key if you are an authorized mobile client." });
    }

    next();
});
// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Content-Security-Policy', "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; frame-src 'self' https:;");
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// Set up EJS and Static Files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
// app.use(express.static(path.join(__dirname, "../public"))); // Uncomment if you have a public folder
// ==========================================
// API ROUTES
// ==========================================
app.get("/api/home-servers", async (req, res) => {
    res.status(200).json({
        message: {seccess:true},
        data: server_list
    })
});
app.get("/api/latest", async (req, res) => {
    const offset = req.query.offset || req.body?.offset || '1';
    const standardizer = new DataStandardizer();
    await standardizer.getLatestData(offset).then((data) => {
        res.status(200).json(data);
    }).catch((err) => {
        res.status(500).json({error: err.message});
    });
});
app.get("/api/search", async (req, res) => {
    const query = req.query.query || req.body?.query || '';
    const offset = req.query.offset || req.body?.offset || '1';
    if (!query) {
        res.status(400).json({error: "Please provide a query"});
        return;
    }
    const standardizer = new DataStandardizer();
    await standardizer.searchByOffset(query, offset).then((data) => {
        res.status(200).json(data);
    }).catch((err) => {
        res.status(500).json({error: err.message});
    });
});
app.get("/api/anime-details", async (req, res) => {
    const url = req.query?.url;
    if (!url) {
        res.status(400).json({error: "Please provide a url"});
        return;
    }
    const standardizer = new DataStandardizer();
    await standardizer.getAnimeDetails(url)
    .then((data) => {
       res.status(200).json(data);
    }).catch((err) =>{
        res.status(500).json({error: err.message})
    });
});
app.get("/api/anime-episodes", async (req, res) => {
    const url = req.query?.url;
    if (!url) {
        res.status(400).json({error: "Please provide a url"});
        return;
    }
    const standardizer = new DataStandardizer();
    await standardizer.getAnimeEpisodes(url)
    .then((data) => {
       res.status(200).json(data);
    }).catch((err) =>{
        res.status(500).json({error: err.message})
    });
});
app.get("/api/anime-servers", async (req, res) => {
   const url = req.query?.url;
   if (!url) {
       res.status(400).json({error: "Please provide a url"});
       return;
   }
   const standardizer = new DataStandardizer();
   await standardizer.getAnimeServers(url)
   .then((data) => {
      res.status(200).json(data);
   }).catch((err) =>{
       res.status(500).json({error: err.message})
   });
});
app.get("/api/anime/episode-date", async (req, res)=>{
    const standardizer = new DataStandardizer();
    await standardizer.getEpisodeByDate()
    .then((data) => {
       res.status(200).json(data);
    }).catch((err) =>{
        res.status(500).json({error: err.message})
    });
});

// ==========================================
// SSR VIEW ROUTES
// ==========================================
app.get("/", async (req, res) => {
    const offset = req.query.server || '1';
    const visitorIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const standardizer = new DataStandardizer();
    try {
        await initVisitorIpsTable();
        const visitorIpList = await db("visitor_ips").where({}).first();
        if (!visitorIpList) {
            await db("visitor_ips").insert({
                visitor_ip: JSON.stringify([visitorIp])
            });
        } else {
            const visitorIps = typeof visitorIpList.visitor_ip === 'string' ? JSON.parse(visitorIpList.visitor_ip) : visitorIpList.visitor_ip;
            if (!visitorIps.includes(visitorIp)) {
                visitorIps.push(visitorIp);
                await db("visitor_ips").update({
                    visitor_ip: JSON.stringify(visitorIps)
                });
            }
        }
        // ---------------------------

        const server_name = `server_${offset}`;
        await animeCachTable(server_name);
        const HomeCache = await db(server_name).where({}).first();
        const timeNow = Date.now();

        if (!HomeCache) {
            const homeData = await standardizer.getLatestData(offset);
            
            // Only save to cache if we actually found real data
            if (homeData && homeData.slider && homeData.slider.length > 0) {
                await db(server_name).insert({
                    home_page: JSON.stringify({
                        slider: homeData.slider,
                        rowData: homeData.rowData,
                        currentServer: offset,
                        time: timeNow
                    })
                });
            }
            res.render("index", { 
                slider: homeData.slider || [], 
                rowData: homeData.rowData || [], 
                currentServer: offset, 
                servers: server_list 
            });
        } else {
            // Cache exists — parse it and check if expired (or if it was cleared and is null)
            const homePageStr = HomeCache.home_page;
            const data = homePageStr ? (typeof homePageStr === 'string' ? JSON.parse(homePageStr) : homePageStr) : null;
            const cachedTime = data ? new Date(data.time).getTime() : 0;

            if (!data || (timeNow - cachedTime) >= 1000 * 60 * 60 * 24) {
                // Cache expired or was cleared (`null`) — scrape and update
                const homeData = await standardizer.getLatestData(offset);
                
                // Only update cache if we actually found real data
                if (homeData && homeData.slider && homeData.slider.length > 0) {
                    await db(server_name).update({
                        home_page: JSON.stringify({
                            slider: homeData.slider,
                            rowData: homeData.rowData,
                            currentServer: offset,
                            time: timeNow
                        })
                    });
                }
                res.render("index", { 
                    slider: homeData.slider || [], 
                    rowData: homeData.rowData || [], 
                    currentServer: offset, 
                    servers: server_list 
                });
            } else {
                // Cache is fresh — serve from database
                res.render("index", { 
                    slider: data.slider, 
                    rowData: data.rowData, 
                    currentServer: offset, 
                    servers: server_list 
                });
            }
        }
    } catch (e) {
        res.render("index", { slider: [], rowData: [], currentServer: offset, servers: server_list, error: "Failed to load Data ,check terminal" + e.message });
    }
});

app.get("/details", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.redirect("/");
    
    const epUrl = req.query.episodeUrl || null;
    const offset = req.query.server || '1';
    const standardizer = new DataStandardizer();
    try {
        const server_name = `server_${offset}`;
        await animeCachTable(server_name);
        const CacheRow = await db(server_name).where({}).first();
        const timeNow = Date.now();
        
        // We use encodeURIComponent so special characters in the URL don't break the JSON structure!
        const cacheKey = `url_${encodeURIComponent(url)}`;
        
        let details = null;
        let eps = [];
        
        let detailsStr = CacheRow ? CacheRow.anime_details : null;
        let parsedDetailsObj = detailsStr ? (typeof detailsStr === 'string' ? JSON.parse(detailsStr) : detailsStr) : {};
        let urlCache = parsedDetailsObj[cacheKey];
        let cachedTime = urlCache ? new Date(urlCache.time).getTime() : 0;
        
        if (!urlCache || (timeNow - cachedTime) >= 1000 * 60 * 60 * 24) {
            // Scrape fresh data
            details = await standardizer.getAnimeDetails(url);
            eps = await standardizer.getAnimeEpisodes(url).catch(() => []);
            
            // Only update cache if we actually found valid anime details!
            if (details) {
                parsedDetailsObj[cacheKey] = {
                    data: { details, eps },
                    time: timeNow
                };
                
                if (!CacheRow) {
                    await db(server_name).insert({
                        anime_details: JSON.stringify(parsedDetailsObj)
                    });
                } else {
                    await db(server_name).update({
                        anime_details: JSON.stringify(parsedDetailsObj)
                    });
                }
            }
        } else {
            // Cache is fresh — serve from database!
            details = urlCache.data.details;
            eps = urlCache.data.eps;
        }
        
        // We fetch the streaming servers LIVE every time. 
        // We DO NOT cache video server links because streaming tokens often expire within a few hours!
        let servers = null;
        if (epUrl) {
            servers = await standardizer.getAnimeServers(epUrl).catch(() => []);
        }

        res.render("anime-details", { 
            details, 
            episodes: eps, 
            url, 
            servers: server_list, // Website servers (RA, AS, AL)
            currentServer: offset,
            episodeServers: servers, // Streaming servers for the current episode
            activeEpisodeUrl: epUrl
        });
    } catch(e) {
        res.send("Error loading details page: " + e.message);
    }
});

// SSR LIST ROUTES
app.get("/anime-list", async (req, res) => {
    const srv = req.query.server || '1';
    const page = req.query.page || '1';
    const standardizer = new DataStandardizer();
    try {
        const server_name = `server_${srv}`;
        await animeCachTable(server_name);
        const CacheRow = await db(server_name).where({}).first();
        const timeNow = Date.now();
        const cacheKey = `page_${page}`;

        if (!CacheRow) {
            // First time ever: row doesn't exist, scrape and insert row
            const result = await standardizer.getAnimeList(srv, page);
            
            // Only save if data is valid
            if (result && result.data && result.data.length > 0) {
                const initialListCache = {
                    [cacheKey]: { data: result, time: timeNow }
                };
                await db(server_name).insert({
                    anime_list: JSON.stringify(initialListCache)
                });
            }

            res.render("list-page", { 
                title: "قائمة الانمي", 
                data: result.data || [], 
                next: result.next, 
                currentServer: srv, 
                currentPage: page, 
                servers: server_list,
                baseUrl: "/anime-list"
            });
        } else {
           
            const listStr = CacheRow.anime_list;
            const parsedListObj = listStr ? (typeof listStr === 'string' ? JSON.parse(listStr) : listStr) : {};
            
            // Look for this specific page inside the dictionary
            const pageCache = parsedListObj[cacheKey];
            const cachedTime = pageCache ? new Date(pageCache.time).getTime() : 0;

            if (!pageCache || (timeNow - cachedTime) >= 1000 * 60 * 60 * 24) {
                // Page is not cached yet OR expired -> scrape and update
                const result = await standardizer.getAnimeList(srv, page);
                
                // Add or update the specific page in the dictionary
                if (result && result.data && result.data.length > 0) {
                    parsedListObj[cacheKey] = { data: result, time: timeNow };
                    await db(server_name).update({
                        anime_list: JSON.stringify(parsedListObj)
                    });
                }
                
                res.render("list-page", { 
                    title: "قائمة الانمي", 
                    data: result.data || [], 
                    next: result.next, 
                    currentServer: srv, 
                    currentPage: page, 
                    servers: server_list,
                    baseUrl: "/anime-list"
                });
            } else {
                // Cached and fresh -> serve from DB
                const result = pageCache.data;
                res.render("list-page", { 
                    title: "قائمة الانمي", 
                    data: result.data, 
                    next: result.next, 
                    currentServer: srv, 
                    currentPage: page, 
                    servers: server_list,
                    baseUrl: "/anime-list"
                });
            }
        }
    } catch (e) { 
        console.log(e.message)
        res.redirect("/"); 
    }
});

app.get("/movie-list", async (req, res) => {
    const srv = req.query.server || '1';
    const page = req.query.page || '1';
    const standardizer = new DataStandardizer();
    try {
        const server_name = `server_${srv}`;
        await animeCachTable(server_name);
        const CacheRow = await db(server_name).where({}).first();
        const timeNow = Date.now();
        const cacheKey = `page_${page}`;

        if (!CacheRow) {
            // Row doesn't exist at all, scrape and insert row
            const result = await standardizer.getMovieList(srv, page);
            
            // Only save to cache if data is valid
            if (result && result.data && result.data.length > 0) {
                const initialListCache = {
                    [cacheKey]: { data: result, time: timeNow }
                };
                await db(server_name).insert({
                    movie_list: JSON.stringify(initialListCache)
                });
            }

            res.render("list-page", { 
                title: "قائمة الافلام", 
                data: result.data || [], 
                next: result.next, 
                currentServer: srv, 
                currentPage: page, 
                servers: server_list,
                baseUrl: "/movie-list"
            });
        } else {
            // Row exists, retrieve the existing `movie_list` dictionary
            const listStr = CacheRow.movie_list;
            const parsedListObj = listStr ? (typeof listStr === 'string' ? JSON.parse(listStr) : listStr) : {};
            
            const pageCache = parsedListObj[cacheKey];
            const cachedTime = pageCache ? new Date(pageCache.time).getTime() : 0;

            if (!pageCache || (timeNow - cachedTime) >= 1000 * 60 * 60 * 24) {
                // Not cached yet OR expired -> scrape and update
                const result = await standardizer.getMovieList(srv, page);
                
                // Add or update the specific page in the dictionary if valid
                if (result && result.data && result.data.length > 0) {
                    parsedListObj[cacheKey] = { data: result, time: timeNow };
                    await db(server_name).update({
                        movie_list: JSON.stringify(parsedListObj)
                    });
                }
                
                res.render("list-page", { 
                    title: "قائمة الافلام", 
                    data: result.data || [], 
                    next: result.next, 
                    currentServer: srv, 
                    currentPage: page, 
                    servers: server_list,
                    baseUrl: "/movie-list"
                });
            } else {
                // Cached and fresh -> serve from DB
                const result = pageCache.data;
                res.render("list-page", { 
                    title: "قائمة الافلام", 
                    data: result.data || [], 
                    next: result.next, 
                    currentServer: srv, 
                    currentPage: page, 
                    servers: server_list,
                    baseUrl: "/movie-list"
                });
            }
        }
    } catch (e) {
     console.log(e.message)
     res.redirect("/"); 
    }
});

app.get("/season-anime", async (req, res) => {
    const srv = req.query.server || '1';
    const page = req.query.page || '1';
    const standardizer = new DataStandardizer();
    try {
        const server_name = `server_${srv}`;
        await animeCachTable(server_name);
        const CacheRow = await db(server_name).where({}).first();
        const timeNow = Date.now();
        const cacheKey = `page_${page}`;

        if (!CacheRow) {
            // Row doesn't exist at all, scrape and insert row
            const result = await standardizer.getSeasonAnime(srv, page);
            
            // Only save to cache if data is valid
            if (result && result.data && result.data.length > 0) {
                const initialListCache = {
                    [cacheKey]: { data: result, time: timeNow }
                };
                await db(server_name).insert({
                    season_anime: JSON.stringify(initialListCache)
                });
            }

            res.render("list-page", { 
                title: "انميات الموسم", 
                data: result.data || [], 
                next: result.next, 
                currentServer: srv, 
                currentPage: page, 
                servers: server_list,
                baseUrl: "/season-anime"
            });
        } else {
            // Row exists, retrieve the existing dictionary
            const listStr = CacheRow.season_anime;
            const parsedListObj = listStr ? (typeof listStr === 'string' ? JSON.parse(listStr) : listStr) : {};
            
            const pageCache = parsedListObj[cacheKey];
            const cachedTime = pageCache ? new Date(pageCache.time).getTime() : 0;

            if (!pageCache || (timeNow - cachedTime) >= 1000 * 60 * 60 * 24) {
                // Not cached yet OR expired -> scrape and update
                const result = await standardizer.getSeasonAnime(srv, page);
                
                // Add or update the specific page in the dictionary if valid
                if (result && result.data && result.data.length > 0) {
                    parsedListObj[cacheKey] = { data: result, time: timeNow };
                    await db(server_name).update({
                        season_anime: JSON.stringify(parsedListObj)
                    });
                }
                
                res.render("list-page", { 
                    title: "انميات الموسم", 
                    data: result.data || [], 
                    next: result.next, 
                    currentServer: srv, 
                    currentPage: page, 
                    servers: server_list,
                    baseUrl: "/season-anime"
                });
            } else {
                // Cached and fresh -> serve from DB
                const result = pageCache.data;
                res.render("list-page", { 
                    title: "انميات الموسم", 
                    data: result.data || [], 
                    next: result.next, 
                    currentServer: srv, 
                    currentPage: page, 
                    servers: server_list,
                    baseUrl: "/season-anime"
                });
            }
        }
    } catch (e) { 
        console.log(e.message)
        res.redirect("/"); 
    }
});

app.get("/schedule", async (req, res) => {
    const srv = req.query.server || '1';
    const standardizer = new DataStandardizer();
    try {
        const server_name = `server_${srv}`;
        await animeCachTable(server_name);
        const CacheRow = await db(server_name).where({}).first();
        const timeNow = Date.now();

        if (!CacheRow) {
            // First time ever: row doesn't exist, scrape and insert row
            const scheduleData = await standardizer.getEpisodeByDate();
            await db(server_name).insert({
                schedule: JSON.stringify({
                    data: scheduleData,
                    time: timeNow
                })
            });
            res.render("schedule", { 
                title: "جدول الحلقات", 
                rowData: scheduleData.rowData, 
                currentServer: srv, 
                servers: server_list 
            });
        } else {
            // Row exists, check if schedule is already cached
            const scheduleStr = CacheRow.schedule;
            const parsedSchedule = scheduleStr ? (typeof scheduleStr === 'string' ? JSON.parse(scheduleStr) : scheduleStr) : null;
            const cachedTime = parsedSchedule ? new Date(parsedSchedule.time).getTime() : 0;

            if (!parsedSchedule || (timeNow - cachedTime) >= 1000 * 60 * 60 * 24) {
                // Not cached yet OR expired -> scrape and update
                const scheduleData = await standardizer.getEpisodeByDate();
                await db(server_name).update({
                    schedule: JSON.stringify({
                        data: scheduleData,
                        time: timeNow
                    })
                });
                res.render("schedule", { 
                    title: "جدول الحلقات", 
                    rowData: scheduleData.rowData, 
                    currentServer: srv, 
                    servers: server_list 
                });
            } else {
                // Cached and fresh -> serve from DB
                res.render("schedule", { 
                    title: "جدول الحلقات", 
                    rowData: parsedSchedule.data.rowData, 
                    currentServer: srv, 
                    servers: server_list 
                });
            }
        }
    } catch (e) { res.redirect("/"); }
});

app.get("/search", async (req, res) => {
    const query = req.query.query;
    const srv = req.query.server || '1';
    if (!query) return res.redirect("/");
    
    const standardizer = new DataStandardizer();
    try {
        const result = await standardizer.getSearch(query, srv);
        res.render("list-page", { 
            title: `نتائج البحث عن: ${query}`, 
            data: result.data, 
            next: null, 
            currentServer: srv, 
            currentPage: 1, 
            servers: server_list,
            baseUrl: "/search" 
        });
    } catch (e) { res.redirect("/"); }
});

app.get("/about", (req, res) => {
    const srv = req.query.server || '1';
    res.render("about", { 
        title: "حولنا", 
        currentServer: srv, 
        servers: server_list 
    });
});
app.get("/test", async (req, res) => {
    const url = encodeURIComponent(req.query.url);
    if (!url) return res.send('url is not provided');
    await fetch(`https://api.scraperapi.com/?api_key=${process.env.SCRAPER_API_KEY}&url=${url}`)
    .then((response) => response.text())
    .then((data) => {
        res.send(data);
    }).catch((err) =>{
        res.status(500).send(err.message)
    });
});
app.get("/clear-db", async (req, res) => {
  const server_name = `server_${req.query.server || '1'}`;
  await animeCachTable(server_name);
  
  await db(server_name).update({ 
      home_page: null, 
      anime_list: null, 
      schedule: null 
  });
  
  res.send({ message: "Cache successfully cleared! Go visit the home page again." });
});
app.get("/db-test", async (req, res) => {
    const server_name = `server_${req.query.server || '1'}`;
    await animeCachTable(server_name);
    const CacheRow = await db(server_name).where({}).first();
    res.send(CacheRow);
})
app.get("/api/visitor-ip", async (req, res) => {
    try {
        await initVisitorIpsTable();
        const visitorIpList = await db("visitor_ips").where({}).first();
        res.send(visitorIpList);
    } catch(e) {
        res.status(500).send({ error: e.message });
    }
})


//======================anime-cache========================
async function initVisitorIpsTable() {
    const exists = await db.schema.hasTable("visitor_ips");
    if (!exists) {
        await db.schema.createTable("visitor_ips", (table) => {
            table.increments("id").primary();
            table.json("visitor_ip");
        });
    }
}

async function animeCachTable(server_name){
    const exists = await db.schema.hasTable(server_name);
    if (!exists) {
        await db.schema.createTable(server_name, (table) => {
            table.increments("id").primary();
            table.json("home_page");
            table.json("anime_details");
            table.json("anime_episodes");
            table.json("anime_servers");
            table.json("anime_list");
            table.json("movie_list");
            table.json("season_anime");
            table.json("schedule");
            table.json("search");
            table.timestamp("time");
            table.timestamps(true, true);
        });
    }
}
//==========================================================
//------------------------------------------------------
// For Vercel serverless deployment
module.exports = app;

// For local development (uncomment if needed)
// app.listen(PORT, () => {
//     console.log(`Server started on port ${localhost}`);
// });
