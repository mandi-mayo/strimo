require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const TMDB_KEY = process.env.TMDB_API_KEY;
const OMDB_KEY = process.env.OMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';
const JIKAN_BASE = 'https://api.jikan.moe/v4';

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

// 1. Trending (movies + TV combined, weekly)
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

        const response = await axios.get(`${TMDB_BASE}/trending/all/week?api_key=${TMDB_KEY}&language=en-US&page=1`);
        const results = response.data.results
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 20)
            .map(item => formatTMDB(item));
        res.json(results);
    } catch (error) {
        console.error("Error fetching trending:", error.message);
        res.status(500).json({ error: 'Failed to fetch trending content' });
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

// 8. Search (TMDB + IMDbOT combined)
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
            // Fallback: TVMaze + IMDbOT
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
            promises.push(
                axios.get(`https://search.imdbot.workers.dev/?q=${encodeURIComponent(q)}`)
                    .then(r => {
                        if (r.data?.description && Array.isArray(r.data.description)) {
                            return r.data.description.map(item => ({
                                id: item['#IMDB_ID'], imdb_id: item['#IMDB_ID'], title: item['#TITLE'],
                                type: 'movie', image: item['#IMG_POSTER'], rating: null,
                                description: item['#AKA'], year: item['#YEAR'], source: 'imdbot'
                            }));
                        }
                        return [];
                    })
                    .catch(() => [])
            );
        }

        const results = (await Promise.all(promises)).flat().filter(item => item.image);
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
            // TVMaze / IMDbOT fallback
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
                const response = await axios.get(`https://search.imdbot.workers.dev/?tt=${imdbId}`);
                const movie = response.data;
                res.json({
                    id: imdbId, imdb_id: imdbId, title: movie.short?.name, type: 'movie',
                    image: movie.short?.image,
                    rating: movie.short?.aggregateRating?.ratingValue,
                    description: movie.short?.description,
                    year: movie.short?.datePublished?.substring(0, 4) || 'N/A',
                    genres: typeof movie.short?.genre === 'string' ? [movie.short.genre] : movie.short?.genre || [],
                    actors: movie.short?.actor?.map(a => a.name) || [],
                    source: 'imdbot'
                });
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
        const results = response.data.data.map(formatAnime);
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
        const results = response.data.data.map(formatAnime);
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
        const results = response.data.data.map(formatAnime);
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
            axios.get(`${JIKAN_BASE}/anime/${malId}/full`),
            axios.get(`${JIKAN_BASE}/anime/${malId}/episodes`).catch(() => ({ data: { data: [] } }))
        ]);

        const anime = animeRes.data.data;
        const episodes = episodesRes.data.data?.map(ep => ({
            id: ep.mal_id,
            name: ep.title || ep.title_japanese,
            number: ep.mal_id,
            season: 1,
            summary: ep.synopsis || '',
            filler: ep.filler,
            recap: ep.recap
        })) || [];

        res.json({
            ...formatAnime(anime),
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

// 15. Get IMDB ID from TMDB ID (for video player)
app.get('/api/get-imdb/:tmdbId', async (req, res) => {
    try {
        const { tmdbId } = req.params;
        const type = req.query.type === 'series' ? 'tv' : 'movie';
        if (TMDB_KEY) {
            const response = await axios.get(`${TMDB_BASE}/${type}/${tmdbId}/external_ids?api_key=${TMDB_KEY}`);
            res.json({ imdb_id: response.data.imdb_id });
        } else {
            res.json({ imdb_id: null });
        }
    } catch (error) {
        res.json({ imdb_id: null });
    }
});

app.listen(PORT, () => {
    console.log(`🎬 NetFricks server running on port ${PORT}`);
    console.log(`   TMDB API: ${TMDB_KEY ? '✅ Connected' : '❌ No key (using fallback APIs)'}`);
    console.log(`   OMDB API: ${OMDB_KEY ? '✅ Connected' : '❌ No key (ratings unavailable)'}`);
    console.log(`   Jikan API: ✅ Connected (no key needed)`);
});
