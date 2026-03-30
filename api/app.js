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
app.use(cors());
app.use(express.json());

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
    console.log(`Visitor IP: ${visitorIp} - Accessed Home Page with server offset: ${offset}`);
    const standardizer = new DataStandardizer();
    try {
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
            // Cache exists — parse it and check if expired
            const data = typeof HomeCache.home_page === 'string' ? JSON.parse(HomeCache.home_page) : HomeCache.home_page;
            const cachedTime = new Date(data.time).getTime();

            if ((timeNow - cachedTime) >= 1000 * 60 * 60 * 12) {
                // Cache expired — scrape and update
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
        res.render("index", { slider: [], rowData: [], currentServer: offset, servers: server_list, error: "Failed to load Data: " + e.message });
    }
});

app.get("/details", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.redirect("/");
    
    const epUrl = req.query.episodeUrl || null;
    const offset = req.query.server || '1';
    const standardizer = new DataStandardizer();
    try {
        const details = await standardizer.getAnimeDetails(url);
        const eps = await standardizer.getAnimeEpisodes(url).catch(() => []);
        
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
            // Row exists, get the existing dictionary (or empty object if null)
            const listStr = CacheRow.anime_list;
            const parsedListObj = listStr ? (typeof listStr === 'string' ? JSON.parse(listStr) : listStr) : {};
            
            // Look for this specific page inside the dictionary
            const pageCache = parsedListObj[cacheKey];
            const cachedTime = pageCache ? new Date(pageCache.time).getTime() : 0;

            if (!pageCache || (timeNow - cachedTime) >= 1000 * 60 * 60 * 12) {
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
        const result = await standardizer.getMovieList(srv, page);
        res.render("list-page", { 
            title: "قائمة الافلام", 
            data: result.data, 
            next: result.next, 
            currentServer: srv, 
            currentPage: page, 
            servers: server_list,
            baseUrl: "/movie-list"
        });
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
        const result = await standardizer.getSeasonAnime(srv, page);
        res.render("list-page", { 
            title: "انميات الموسم", 
            data: result.data, 
            next: result.next, 
            currentServer: srv, 
            currentPage: page, 
            servers: server_list,
            baseUrl: "/season-anime"
        });
    } catch (e) { res.redirect("/"); }
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

            if (!parsedSchedule || (timeNow - cachedTime) >= 1000 * 60 * 60 * 12) {
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


//======================anime-cache========================
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
