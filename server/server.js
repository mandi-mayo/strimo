require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Insecure httpsAgent — ONLY for embed proxies with invalid/self-signed certs
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
axios.defaults.timeout = 15000;

// Test deployment endpoint
app.get('/api/test-deploy', (req, res) => {
    res.json({ deployed: true, timestamp: Date.now() });
});

// Diagnostic endpoint — traces the anime thumbnail pipeline step by step
app.get('/api/debug/anime-thumbs/:malId', async (req, res) => {
    const { malId } = req.params;
    const report = { malId, steps: [], tmdb_key_exists: !!TMDB_KEY };

    try {
        // Step 1: Jikan anime details
        report.steps.push({ step: '1-jikan-details', status: 'starting' });
        const animeRes = await axios.get(`${JIKAN_BASE}/anime/${malId}`, { timeout: 10000 });
        const anime = animeRes.data?.data;
        const title = anime?.title_english || anime?.title;
        report.steps[report.steps.length - 1] = { step: '1-jikan-details', status: 'ok', title, year: anime?.year };

        if (!TMDB_KEY) {
            report.steps.push({ step: '2-tmdb-search', status: 'skipped', reason: 'No TMDB_KEY' });
            return res.json(report);
        }

        // Step 2: TMDB search
        report.steps.push({ step: '2-tmdb-search', status: 'starting' });
        const searchQuery = encodeURIComponent(title);
        const searchRes = await axios.get(
            `${TMDB_BASE}/search/tv?api_key=${TMDB_KEY}&query=${searchQuery}&language=en-US`,
            { timeout: 10000 }
        );
        const results = searchRes.data?.results || [];
        report.steps[report.steps.length - 1] = {
            step: '2-tmdb-search', status: 'ok',
            results_count: results.length,
            first_result: results[0] ? { id: results[0].id, name: results[0].name } : null
        };

        if (!results.length) return res.json(report);
        const tmdb_id = results[0].id;

        // Step 3: TMDB season
        report.steps.push({ step: '3-tmdb-season', status: 'starting' });
        const seasonRes = await axios.get(
            `${TMDB_BASE}/tv/${tmdb_id}/season/1?api_key=${TMDB_KEY}&language=en-US`,
            { timeout: 10000 }
        );
        const eps = seasonRes.data?.episodes || [];
        const withStills = eps.filter(ep => ep.still_path);
        report.steps[report.steps.length - 1] = {
            step: '3-tmdb-season', status: 'ok',
            episodes_count: eps.length,
            with_stills: withStills.length,
            sample_image: withStills[0] ? `${TMDB_IMG}/w300${withStills[0].still_path}` : null
        };

        report.success = true;
    } catch (e) {
        report.steps.push({ step: 'ERROR', message: e.message, code: e.response?.status });
    }

    res.json(report);
});

// Subtitle Proxy to handle CORS
app.get('/api/proxy/subtitle', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL is required');
    try {
        const response = await axios.get(url, { responseType: 'text' });
        res.set('Content-Type', 'text/vtt');
        res.set('Access-Control-Allow-Origin', '*');
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Failed to fetch subtitle');
    }
});


// ============================================================
// EMBED PROXY — fetches embed pages server-side, strips ad/redirect scripts
// ============================================================

// Patterns that indicate ad/redirect scripts — matched against src and inline content
const AD_SCRIPT_PATTERNS = [
    /popunder/i, /pop-under/i, /popad/i, /popads/i,
    /adnxs/i, /doubleclick/i, /googlesyndication/i,
    /trafficjunky/i, /exoclick/i, /juicyads/i, /hilltopads/i,
    /propellerads/i, /adsterra/i, /monetag/i, /bidvertiser/i,
    /revcontent/i, /taboola/i, /outbrain/i,
    /window\.open\s*\(/i,
    /window\.location\s*=/i,
    /top\.location\s*=/i,
    /parent\.location\s*=/i,
    /document\.location\s*=/i,
    /\.href\s*=\s*['"`]https?/i,
    /setTimeout.*window\.open/i,
    /setInterval.*window\.open/i,
    /disable-devtool/i,
];

const shouldStripScript = (src, inlineContent = '') => {
    const target = src || inlineContent;
    return AD_SCRIPT_PATTERNS.some(p => p.test(target));
};

// Rewrite all relative URLs in HTML to absolute based on origin
const rewriteUrls = (html, origin) => {
    const base = new URL(origin);
    const baseUrl = `${base.protocol}//${base.host}`;

    // Fix src/href attributes that are root-relative or relative
    return html
        .replace(/(src|href|action)=(["'])\/\//g, `$1=$2${base.protocol}//`)
        .replace(/(src|href|action)=(["'])\//g, `$1=$2${baseUrl}/`)
        .replace(/(src|href|action)=(["'])(?!http|\/\/|data:|blob:|#|javascript)/g,
            `$1=$2${baseUrl}/`);
};

// Strip <script> tags matching ad patterns (both src= and inline)
const stripAdScripts = (html) => {
    // Strip external scripts with ad src
    html = html.replace(/<script[^>]+src=(["'])([^"']*)\1[^>]*>[\s\S]*?<\/script>/gi, (match, q, src) => {
        return shouldStripScript(src) ? '<!-- ad script removed -->' : match;
    });
    // Strip inline scripts containing redirect/ad code
    html = html.replace(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi, (match, code) => {
        return shouldStripScript('', code) ? '<!-- ad script removed -->' : match;
    });
    return html;
};

// Inject a script into the proxied page that locks navigation
const LOCK_SCRIPT = `
<script>
(function() {
  // Kill popups
  window.open = function() { return null; };
  // Block top/parent navigation
  try {
    Object.defineProperty(window, 'top', { get: function() { return window; } });
    Object.defineProperty(window, 'parent', { get: function() { return window; } });
  } catch(e) {}
  // Intercept location assignments
  const locProps = ['href', 'assign', 'replace'];
  locProps.forEach(function(p) {
    try {
      Object.defineProperty(location, p, {
        set: function() {},
        get: function() { return p === 'href' ? location.href : function(){}; },
        configurable: true
      });
    } catch(e) {}
  });
})();
</script>
`;

app.get('/api/proxy/embed', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL required');

    // Only allow known embed providers
    const ALLOWED_HOSTS = [
        'vidlink.pro',                             // VidLink embed provider
        'vidrock.ru',                              // VidRock embed provider
        'vidsrc.pm', 'vidsrc-embed.su', 'vidsrcme.su', 'vsrc.su',
        'vidfast.pro', 'vidsrc.xyz', 'vidsrc.fyi', 'vidsrc.cc',
        'videasy.net',
        'megaplay.buzz', 'animeplay.cfd',  // MegaPlay — MAL ID native, true sub/dub
        'player.vidplus.to',               // VidPlus — AniList ID, sub/dub toggle
    ];
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        return res.status(400).send('Invalid URL');
    }
    const host = parsedUrl.hostname.replace(/^www\./, '');
    if (!ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h))) {
        return res.status(403).send('Host not allowed');
    }

    try {
        const response = await axios.get(url, {
            httpsAgent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': parsedUrl.origin,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            responseType: 'text',
            maxRedirects: 5,
        });

        let html = response.data;
        html = rewriteUrls(html, url);
        html = stripAdScripts(html);
        // Inject lock script right after <head> or at top
        html = html.replace(/(<head[^>]*>)/i, `$1${LOCK_SCRIPT}`);
        if (!html.includes('<!-- lock injected -->')) {
            html = LOCK_SCRIPT + html;
        }

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Access-Control-Allow-Origin', '*');
        // Allow cross-origin framing for separated client/server deployments
        res.removeHeader('X-Frame-Options');
        res.send(html);
    } catch (error) {
        console.error('[EmbedProxy] Error:', error.message);
        res.status(502).send('Failed to fetch embed');
    }
});

const TMDB_KEY = process.env.TMDB_API_KEY;
const OMDB_KEY = process.env.OMDB_API_KEY;
const TMDB_BASE = 'https://api.tmdb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';
const JIKAN_BASE = 'https://api.jikan.moe/v4';

// VidLink Resolver
app.get('/api/resolve/vidlink', async (req, res) => {
    const { id, type, season, episode } = req.query;
    if (!id) return res.status(400).json({ error: 'ID is required' });

    try {
        let url = `https://vidlink.pro/api/details/${type || 'movie'}/${id}`;
        if (type === 'series' || type === 'tv') {
            url += `/${season || 1}/${episode || 1}`;
        }

        const response = await axios.get(url, { httpsAgent });
        // VidLink returns streams and subtitles
        res.json(response.data);
    } catch (error) {
        console.error("VidLink Resolve Error:", error.message);
        res.status(500).json({ error: 'Failed to resolve VidLink source' });
    }
});

// Helper: format TMDB movie/tv item
function formatTMDB(item, type) {
    return {
        id: item.id,
        tmdb_id: item.id,
        imdb_id: item.imdb_id || null,
        title: item.title || item.name,
        type: type || (item.media_type === 'tv' ? 'series' : item.media_type || 'movie'),
        image: item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `${TMDB_IMG}/original${item.backdrop_path}` : null,
        rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
        description: item.overview || '',
        year: (item.release_date || item.first_air_date || '').substring(0, 4) || 'N/A',
        genre_ids: item.genre_ids || [],
        popularity: item.popularity,
        vote_count: item.vote_count,
        source: 'tmdb'
    };
}
// Helper: Fetch with retry and exponential backoff (useful for Jikan rate-limiting)
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    try {
        return await axios.get(url, options);
    } catch (error) {
        if (retries > 0 && (error.response?.status === 429 || error.response?.status >= 500)) {
            console.warn(`[Retry] Fetch failed for ${url}. Retrying in ${delay}ms... (Remaining retries: ${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        throw error;
    }
}

// Helper: format Jikan anime item
function formatAnime(item) {
    return {
        id: `anime-${item.mal_id}`,
        mal_id: item.mal_id,
        title: item.title_english || item.title,
        type: 'anime',
        image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        backdrop: item.trailer?.images?.maximum_image_url || null,
        rating: item.score,
        description: item.synopsis || '',
        year: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear().toString() : 'N/A'),
        episodes_count: item.episodes,
        status: item.status,
        source: 'jikan'
    };
}

// ============================================================
// TMDB ENDPOINTS
// ============================================================

// 1. Trending/Latest (Interleaved Now Playing & Airing Today)
app.get('/api/trending', async (req, res) => {
    try {
        if (!TMDB_KEY) {
            // Fallback to TVMaze if no TMDB key
            const response = await axios.get('https://api.tvmaze.com/shows');
            let shows = response.data.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)).slice(0, 20);
            const results = shows.map(show => ({
                id: show.id,
                imdb_id: show.externals?.imdb,
                title: show.name,
                type: 'series',
                image: show.image?.original || show.image?.medium,
                backdrop: show.image?.original,
                rating: show.rating?.average,
                description: show.summary?.replace(/<[^>]+>/g, ''),
                year: show.premiered ? show.premiered.substring(0, 4) : 'N/A',
                source: 'tvmaze'
            }));
            return res.json(results);
        }

        // Fetch Official Trending All (Movies & TV) for the day
        const response = await axios.get(`${TMDB_BASE}/trending/all/day?api_key=${TMDB_KEY}&language=en-US`);
        const results = (response.data.results || [])
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .map(item => formatTMDB(item));

        res.json(results.slice(0, 20));
    } catch (error) {
        console.error("❌ Error fetching trending:", error.response?.status || error.message);
        res.status(500).json({ error: 'Failed to fetch trending content' });
    }
});

app.get('/api/upcoming', async (req, res) => {
    try {
        const response = await axios.get(`${TMDB_BASE}/movie/upcoming?api_key=${TMDB_KEY}&language=en-US&page=1`);
        const results = (response.data.results || []).map(item => formatTMDB(item, 'movie'));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch upcoming movies' });
    }
});

// 2. Popular Movies
app.get('/api/popular/movies', async (req, res) => {
    try {
        if (!TMDB_KEY) return res.json([]);
        const page = req.query.page || 1;
        const response = await axios.get(`${TMDB_BASE}/movie/popular?api_key=${TMDB_KEY}&language=en-US&page=${page}`);
        const results = response.data.results.map(item => formatTMDB(item, 'movie'));
        res.json(results);
    } catch (error) {
        console.error("Error fetching popular movies:", error.message);
        res.status(500).json({ error: 'Failed to fetch popular movies' });
    }
});

// 3. Popular TV
app.get('/api/popular/tv', async (req, res) => {
    try {
        if (!TMDB_KEY) {
            const response = await axios.get('https://api.tvmaze.com/shows');
            let shows = response.data.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)).slice(0, 20);
            const results = shows.map(show => ({
                id: show.id, imdb_id: show.externals?.imdb, title: show.name, type: 'series',
                image: show.image?.original || show.image?.medium, backdrop: show.image?.original,
                rating: show.rating?.average, description: show.summary?.replace(/<[^>]+>/g, ''),
                year: show.premiered ? show.premiered.substring(0, 4) : 'N/A', source: 'tvmaze'
            }));
            return res.json(results);
        }
        const page = req.query.page || 1;
        const response = await axios.get(`${TMDB_BASE}/tv/popular?api_key=${TMDB_KEY}&language=en-US&page=${page}`);
        const results = response.data.results.map(item => formatTMDB(item, 'series'));
        res.json(results);
    } catch (error) {
        console.error("Error fetching popular TV:", error.message);
        res.status(500).json({ error: 'Failed to fetch popular TV' });
    }
});

// 4. Top Rated
app.get('/api/top-rated/:type', async (req, res) => {
    try {
        if (!TMDB_KEY) return res.json([]);
        const { type } = req.params;
        const endpoint = type === 'tv' ? 'tv' : 'movie';
        const page = req.query.page || 1;
        const response = await axios.get(`${TMDB_BASE}/${endpoint}/top_rated?api_key=${TMDB_KEY}&language=en-US&page=${page}`);
        const results = response.data.results.map(item => formatTMDB(item, type === 'tv' ? 'series' : 'movie'));
        res.json(results);
    } catch (error) {
        console.error("Error fetching top rated:", error.message);
        res.status(500).json({ error: 'Failed to fetch top rated' });
    }
});

// 5. Upcoming Movies
app.get('/api/upcoming', async (req, res) => {
    try {
        if (!TMDB_KEY) return res.json([]);
        const response = await axios.get(`${TMDB_BASE}/movie/upcoming?api_key=${TMDB_KEY}&language=en-US&page=1`);
        const results = response.data.results.map(item => formatTMDB(item, 'movie'));
        res.json(results);
    } catch (error) {
        console.error("Error fetching upcoming:", error.message);
        res.status(500).json({ error: 'Failed to fetch upcoming' });
    }
});

// 6. Genres list
app.get('/api/genres', async (req, res) => {
    try {
        if (!TMDB_KEY) return res.json([]);
        const [movieGenres, tvGenres] = await Promise.all([
            axios.get(`${TMDB_BASE}/genre/movie/list?api_key=${TMDB_KEY}&language=en-US`),
            axios.get(`${TMDB_BASE}/genre/tv/list?api_key=${TMDB_KEY}&language=en-US`)
        ]);
        // Merge and deduplicate
        const all = [...movieGenres.data.genres, ...tvGenres.data.genres];
        const unique = Array.from(new Map(all.map(g => [g.id, g])).values());
        res.json(unique);
    } catch (error) {
        console.error("Error fetching genres:", error.message);
        res.status(500).json({ error: 'Failed to fetch genres' });
    }
});

// 7. Discover by Genre
app.get('/api/discover/:genreId', async (req, res) => {
    try {
        if (!TMDB_KEY) return res.json([]);
        const { genreId } = req.params;
        const type = req.query.type || 'movie';
        const page = req.query.page || 1;
        const endpoint = type === 'tv' ? 'tv' : 'movie';
        const response = await axios.get(`${TMDB_BASE}/discover/${endpoint}?api_key=${TMDB_KEY}&language=en-US&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`);
        const results = response.data.results.map(item => formatTMDB(item, type === 'tv' ? 'series' : 'movie'));
        res.json(results);
    } catch (error) {
        console.error("Error discovering by genre:", error.message);
        res.status(500).json({ error: 'Failed to discover content' });
    }
});

// Helper: Levenshtein distance for fuzzy matching
function getLevenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// Helper: Rank search results by relevance
function rankSearchResults(results, query) {
    const queryLower = query.toLowerCase().trim();

    return results.sort((a, b) => {
        const aTitle = (a.title || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();

        // Score calculation
        let scoreA = 0, scoreB = 0;

        // 1. Exact match (highest priority)
        if (aTitle === queryLower) scoreA += 1000;
        if (bTitle === queryLower) scoreB += 1000;

        // 2. Starts with query
        if (aTitle.startsWith(queryLower)) scoreA += 500;
        if (bTitle.startsWith(queryLower)) scoreB += 500;

        // 3. Contains query as whole word
        if (aTitle.includes(` ${queryLower}`) || aTitle.includes(`${queryLower} `)) scoreA += 300;
        if (bTitle.includes(` ${queryLower}`) || bTitle.includes(`${queryLower} `)) scoreB += 300;

        // 4. Partial match
        if (aTitle.includes(queryLower)) scoreA += 100;
        if (bTitle.includes(queryLower)) scoreB += 100;

        // 5. Fuzzy match (Typo Tolerance)
        const distA = getLevenshteinDistance(aTitle, queryLower);
        const distB = getLevenshteinDistance(bTitle, queryLower);
        if (distA <= 2) scoreA += (3 - distA) * 150; // Boost small typos
        if (distB <= 2) scoreB += (3 - distB) * 150;

        // 6. Boost by rating (if available)
        if (a.rating) scoreA += (a.rating / 10) * 50;
        if (b.rating) scoreB += (b.rating / 10) * 50;

        // 7. Boost by popularity (if available)
        if (a.popularity) scoreA += Math.min(a.popularity / 10, 50);
        if (b.popularity) scoreB += Math.min(b.popularity / 10, 50);

        // 8. Tie-breaker: more recent content
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        if (yearA !== yearB) scoreA += (yearA - yearB) * 2;

        return scoreB - scoreA;
    });
}

// 8. Search (TMDB + OMDb combined with smart ranking)
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const promises = [];

        if (TMDB_KEY) {
            promises.push(
                axios.get(`${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&language=en-US&query=${encodeURIComponent(q)}&page=1`)
                    .then(r => r.data.results
                        .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                        .map(item => formatTMDB(item))
                    )
                    .catch(() => [])
            );
        } else {
            // Fallback: TVMaze + OMDb
            promises.push(
                axios.get(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`)
                    .then(r => r.data.map(item => ({
                        id: item.show.id, imdb_id: item.show.externals?.imdb, title: item.show.name,
                        type: 'series', image: item.show.image?.original || item.show.image?.medium,
                        rating: item.show.rating?.average,
                        description: item.show.summary?.replace(/<[^>]+>/g, ''),
                        year: item.show.premiered ? item.show.premiered.substring(0, 4) : 'N/A',
                        source: 'tvmaze'
                    })))
                    .catch(() => [])
            );
            if (OMDB_KEY) {
                promises.push(
                    axios.get(`http://www.omdbapi.com/?s=${encodeURIComponent(q)}&apikey=${OMDB_KEY}`)
                        .then(r => {
                            if (r.data && r.data.Search && Array.isArray(r.data.Search)) {
                                return r.data.Search.map(item => ({
                                    id: item.imdbID, imdb_id: item.imdbID, title: item.Title,
                                    type: item.Type === 'series' ? 'series' : 'movie', image: item.Poster !== 'N/A' ? item.Poster : null, rating: null,
                                    description: '', year: item.Year, source: 'omdb'
                                }));
                            }
                            return [];
                        })
                        .catch(() => [])
                );
            }
        }

        let results = (await Promise.all(promises)).flat().filter(item => item.image);

        // Rank results by relevance
        results = rankSearchResults(results, q);

        res.json(results);
    } catch (error) {
        console.error("Error searching:", error.message);
        res.status(500).json({ error: 'Failed to search content' });
    }
});

// 9. Details (TMDB primary, TVMaze fallback for episodes)
app.get('/api/details/:id', async (req, res) => {
    const { id } = req.params;
    const { type, imdb, source } = req.query;

    try {
        // TMDB source
        if (TMDB_KEY && source !== 'tvmaze') {
            const endpoint = type === 'series' ? 'tv' : 'movie';
            const response = await axios.get(`${TMDB_BASE}/${endpoint}/${id}?api_key=${TMDB_KEY}&language=en-US&append_to_response=credits,recommendations,videos,external_ids`);
            const data = response.data;

            let episodes = [];
            let seasons = [];
            if (type === 'series' && data.seasons) {
                seasons = data.seasons.filter(s => s.season_number > 0).map(s => ({
                    season_number: s.season_number,
                    name: s.name,
                    episode_count: s.episode_count,
                    poster: s.poster_path ? `${TMDB_IMG}/w300${s.poster_path}` : null
                }));
            }

            const imdb_id = data.external_ids?.imdb_id || data.imdb_id || imdb;

            // Get OMDB ratings if available
            let omdbRatings = null;
            if (OMDB_KEY && imdb_id) {
                try {
                    const omdbRes = await axios.get(`http://www.omdbapi.com/?i=${imdb_id}&apikey=${OMDB_KEY}`);
                    if (omdbRes.data && omdbRes.data.Response === 'True') {
                        omdbRatings = {
                            imdb: omdbRes.data.imdbRating,
                            rottenTomatoes: omdbRes.data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value,
                            metacritic: omdbRes.data.Metascore,
                            rated: omdbRes.data.Rated,
                            runtime: omdbRes.data.Runtime,
                            awards: omdbRes.data.Awards
                        };
                    }
                } catch (e) { /* OMDB optional */ }
            }

            const cast = data.credits?.cast?.slice(0, 12).map(a => ({
                name: a.name,
                character: a.character,
                image: a.profile_path ? `${TMDB_IMG}/w185${a.profile_path}` : null
            })) || [];

            const recommendations = data.recommendations?.results?.slice(0, 12).map(item =>
                formatTMDB(item, item.media_type === 'tv' ? 'series' : 'movie')
            ) || [];

            const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

            res.json({
                id: data.id,
                tmdb_id: data.id,
                imdb_id,
                title: data.title || data.name,
                type: type || 'movie',
                image: data.poster_path ? `${TMDB_IMG}/w500${data.poster_path}` : null,
                backdrop: data.backdrop_path ? `${TMDB_IMG}/original${data.backdrop_path}` : null,
                rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
                description: data.overview,
                year: (data.release_date || data.first_air_date || '').substring(0, 4) || 'N/A',
                genres: data.genres?.map(g => g.name) || [],
                runtime: data.runtime || (data.episode_run_time?.[0]),
                tagline: data.tagline,
                status: data.status,
                cast,
                recommendations,
                trailer: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
                omdbRatings,
                seasons,
                episodes,
                source: 'tmdb'
            });
        } else {
            // TVMaze / OMDb fallback
            if (type === 'series') {
                const response = await axios.get(`https://api.tvmaze.com/shows/${id}?embed=episodes`);
                const show = response.data;
                const episodes = show._embedded?.episodes?.map(ep => ({
                    id: ep.id, name: ep.name, season: ep.season, number: ep.number,
                    image: ep.image?.original || ep.image?.medium,
                    summary: ep.summary?.replace(/<[^>]+>/g, '')
                })) || [];
                res.json({
                    id: show.id, imdb_id: show.externals?.imdb, title: show.name, type: 'series',
                    image: show.image?.original || show.image?.medium,
                    backdrop: show.image?.original,
                    rating: show.rating?.average, description: show.summary?.replace(/<[^>]+>/g, ''),
                    year: show.premiered ? show.premiered.substring(0, 4) : 'N/A',
                    episodes, genres: show.genres, source: 'tvmaze'
                });
            } else {
                const imdbId = imdb || id;
                if (OMDB_KEY) {
                    const response = await axios.get(`http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`);
                    const movie = response.data;
                    if (movie.Response === 'True') {
                        let rating = null;
                        if (movie.imdbRating && movie.imdbRating !== 'N/A') rating = parseFloat(movie.imdbRating);
                        res.json({
                            id: imdbId, imdb_id: imdbId, title: movie.Title, type: 'movie',
                            image: movie.Poster !== 'N/A' ? movie.Poster : null,
                            rating: rating,
                            description: movie.Plot !== 'N/A' ? movie.Plot : '',
                            year: movie.Year || 'N/A',
                            genres: movie.Genre && movie.Genre !== 'N/A' ? movie.Genre.split(', ') : [],
                            actors: movie.Actors && movie.Actors !== 'N/A' ? movie.Actors.split(', ') : [],
                            source: 'omdb'
                        });
                    } else {
                        res.status(404).json({ error: 'Not found' });
                    }
                } else {
                    res.status(404).json({ error: 'Not found' });
                }
            }
        }
    } catch (error) {
        console.error("Error fetching details:", error.message);
        res.status(500).json({ error: 'Failed to fetch details' });
    }
});

// 10. Get episodes for a specific season (TMDB)
app.get('/api/season/:showId/:seasonNum', async (req, res) => {
    try {
        const { showId, seasonNum } = req.params;
        if (TMDB_KEY) {
            const response = await axios.get(`${TMDB_BASE}/tv/${showId}/season/${seasonNum}?api_key=${TMDB_KEY}&language=en-US`);
            const episodes = response.data.episodes.map(ep => ({
                id: ep.id,
                name: ep.name,
                season: ep.season_number,
                number: ep.episode_number,
                image: ep.still_path ? `${TMDB_IMG}/w300${ep.still_path}` : null,
                summary: ep.overview,
                rating: ep.vote_average,
                air_date: ep.air_date,
                runtime: ep.runtime
            }));
            res.json(episodes);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error("Error fetching season:", error.message);
        res.status(500).json({ error: 'Failed to fetch season data' });
    }
});

// ============================================================
// ANIME ENDPOINTS (Jikan / MyAnimeList)
// ============================================================

// 11. Trending Anime
app.get('/api/anime/trending', async (req, res) => {
    try {
        const response = await axios.get(`${JIKAN_BASE}/top/anime?filter=airing&limit=20`);
        const results = (response.data?.data || []).map(formatAnime);
        res.json(results);
    } catch (error) {
        console.error("Error fetching trending anime:", error.message);
        res.status(500).json({ error: 'Failed to fetch trending anime' });
    }
});

// 12. Popular Anime
app.get('/api/anime/popular', async (req, res) => {
    try {
        const response = await axios.get(`${JIKAN_BASE}/top/anime?filter=bypopularity&limit=20`);
        const results = (response.data?.data || []).map(formatAnime);
        res.json(results);
    } catch (error) {
        console.error("Error fetching popular anime:", error.message);
        res.status(500).json({ error: 'Failed to fetch popular anime' });
    }
});

// 13. Search Anime
app.get('/api/anime/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const response = await axios.get(`${JIKAN_BASE}/anime?q=${encodeURIComponent(q)}&limit=20`);
        const results = (response.data?.data || []).map(formatAnime);
        res.json(results);
    } catch (error) {
        console.error("Error searching anime:", error.message);
        res.status(500).json({ error: 'Failed to search anime' });
    }
});

// 14. Anime Details
app.get('/api/anime/details/:malId', async (req, res) => {
    try {
        const { malId } = req.params;
        const [animeRes, episodesRes] = await Promise.all([
            fetchWithRetry(`${JIKAN_BASE}/anime/${malId}/full`).catch(e => {
                console.error("Failed to fetch anime details from Jikan:", e.message);
                throw e;
            }),
            fetchWithRetry(`${JIKAN_BASE}/anime/${malId}/episodes`).catch(e => {
                console.warn("Failed to fetch anime episodes from Jikan:", e.message);
                return { data: { data: [] } };
            })
        ]);

        const anime = animeRes.data.data;

        // Jikan episodes are blocked on cloud IPs — use for filler/recap flags only
        const jikanMeta = {};
        (episodesRes.data.data || []).forEach(ep => {
            jikanMeta[ep.mal_id] = { filler: ep.filler, recap: ep.recap, aired: ep.aired };
        });

        // TMDB (episodes + thumbnails) and AniList (embed ID) — fully parallel
        let tmdb_id = null;
        let anilist_id = null;
        let episodes = [];

        await Promise.all([
            // ── TMDB: primary episode list with stills ────────────────────────────
            (async () => {
                if (!TMDB_KEY) return;
                try {
                    const title = anime.title_english || anime.title;
                    const year = anime.year || (anime.aired?.from ? new Date(anime.aired.from).getFullYear() : null);
                    const searchQuery = encodeURIComponent(title);

                    const [withYear, withoutYear] = await Promise.all([
                        year
                            ? axios.get(`${TMDB_BASE}/search/tv?api_key=${TMDB_KEY}&query=${searchQuery}&first_air_date_year=${year}&language=en-US`, { timeout: 10000 }).catch(e => { console.warn('[AnimeDetails] TMDB year-search failed:', e.message); return null; })
                            : Promise.resolve(null),
                        axios.get(`${TMDB_BASE}/search/tv?api_key=${TMDB_KEY}&query=${searchQuery}&language=en-US`, { timeout: 10000 }).catch(e => { console.warn('[AnimeDetails] TMDB search failed:', e.message); return null; })
                    ]);

                    const results = (withYear?.data?.results?.length ? withYear.data.results : withoutYear?.data?.results) || [];
                    if (!results.length) return;
                    tmdb_id = results[0].id;

                    const tvRes = await axios.get(
                        `${TMDB_BASE}/tv/${tmdb_id}?api_key=${TMDB_KEY}&language=en-US`,
                        { timeout: 10000 }
                    ).catch(e => { console.warn('[AnimeDetails] TMDB tv-details failed:', e.message); return null; });

                    const seasons = (tvRes?.data?.seasons || []).filter(s => s.season_number > 0);
                    const jikanDateStr = anime.aired?.from ? anime.aired.from.split('T')[0] : null;
                    const jikanYear = anime.year || (jikanDateStr ? new Date(jikanDateStr).getFullYear() : null);

                    let bestSeasonNum = 1, maxScore = -1;
                    seasons.forEach(s => {
                        let score = 0;
                        if (s.air_date) {
                            if (jikanDateStr && s.air_date === jikanDateStr) score += 100;
                            else if (jikanYear && new Date(s.air_date).getFullYear() === jikanYear) score += 20;
                        }
                        const sName = (s.name || '').toLowerCase();
                        const aTitle = title.toLowerCase();
                        if (sName && (aTitle.includes(sName) || sName.includes(aTitle))) score += 15;
                        if (score > maxScore) { maxScore = score; bestSeasonNum = s.season_number; }
                    });

                    const seasonRes = await axios.get(
                        `${TMDB_BASE}/tv/${tmdb_id}/season/${bestSeasonNum}?api_key=${TMDB_KEY}&language=en-US`,
                        { timeout: 10000 }
                    ).catch(e => { console.warn('[AnimeDetails] TMDB season-fetch failed:', e.message); return null; });

                    // Build episode list from TMDB — thumbnails come directly from still_path
                    episodes = (seasonRes?.data?.episodes || []).map(ep => {
                        const m = jikanMeta[ep.episode_number] || {};
                        return {
                            id: ep.id,
                            name: ep.name,
                            number: ep.episode_number,
                            season: bestSeasonNum,
                            summary: ep.overview || '',
                            filler: m.filler || false,
                            recap: m.recap || false,
                            aired: ep.air_date || m.aired || null,
                            runtime: ep.runtime || null,
                            rating: ep.vote_average || null,
                            image: ep.still_path ? `${TMDB_IMG}/w300${ep.still_path}` : null
                        };
                    });

                    // Pad remaining episodes up to MAL's total count (no thumbnail, but selectable)
                    const malTotal = anime.episodes || 0;
                    for (let i = episodes.length + 1; i <= malTotal; i++) {
                        const m = jikanMeta[i] || {};
                        episodes.push({
                            id: `ep-${i}`, name: `Episode ${i}`, number: i,
                            season: bestSeasonNum, summary: '',
                            filler: m.filler || false, recap: m.recap || false,
                            aired: m.aired || null, runtime: null, rating: null, image: null
                        });
                    }
                } catch (e) {
                    console.warn('[AnimeDetails] TMDB episode fetch failed:', e.message);
                }
            })(),

            // ── AniList: embed source ID ───────────────────────────────────────────
            (async () => {
                try {
                    const alRes = await axios.post(
                        'https://graphql.anilist.co',
                        { query: 'query($id:Int){Media(idMal:$id,type:ANIME){id}}', variables: { id: parseInt(malId) } },
                        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 7000 }
                    );
                    anilist_id = alRes.data?.data?.Media?.id || null;
                } catch (e) {
                    console.warn('[AnimeDetails] AniList cross-reference failed:', e.message);
                }
            })()
        ]);

        // Final fallback: if TMDB returned nothing, generate bare episode stubs from MAL count
        if (episodes.length === 0) {
            const count = anime.episodes || 0;
            for (let i = 1; i <= count; i++) {
                const m = jikanMeta[i] || {};
                episodes.push({
                    id: `ep-${i}`, name: `Episode ${i}`, number: i, season: 1,
                    summary: '', filler: m.filler || false, recap: m.recap || false,
                    aired: m.aired || null, runtime: null, rating: null, image: null
                });
            }
        }

        res.json({
            ...formatAnime(anime),
            tmdb_id,
            anilist_id,
            genres: anime.genres?.map(g => g.name) || [],
            studios: anime.studios?.map(s => s.name) || [],
            trailer: anime.trailer?.embed_url || null,
            episodes,
            source: 'jikan'
        });
    } catch (error) {
        console.error("Error fetching anime details:", error.message);
        res.status(500).json({ error: 'Failed to fetch anime details' });
    }
});

// ============================================================
// UTILITY
// ============================================================

// (Removed unused /api/get-imdb endpoint - IMDb IDs available in main data)

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`   Strimo server running on port ${PORT}`);
        console.log(`   OMDB API: ${OMDB_KEY ? '✅ Connected' : '❌ No key (ratings unavailable)'}`);
        console.log(`   Jikan API: ✅ Connected (no key needed)`);
    });
}

module.exports = app;