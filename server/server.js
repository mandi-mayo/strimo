const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API endpoints

// 1. Trending
app.get('/api/trending', async (req, res) => {
    try {
        // We will fetch popular shows from TVMaze as trending
        const response = await axios.get('https://api.tvmaze.com/shows');
        // Return top 20 shows based on rating
        let shows = response.data.sort((a, b) => b.rating.average - a.rating.average).slice(0, 20);
        
        const results = shows.map(show => ({
            id: show.id,
            imdb_id: show.externals?.imdb,
            title: show.name,
            type: 'series',
            image: show.image?.original || show.image?.medium,
            rating: show.rating?.average,
            description: show.summary?.replace(/<[^>]+>/g, ''), // Strip HTML tags
            year: show.premiered ? show.premiered.substring(0, 4) : 'N/A'
        }));
        
        // Also fetch some top movies from IMDbOT for variety if possible?
        // Let's just return these for now, or combine.
        res.json(results);
    } catch (error) {
        console.error("Error fetching trending:", error);
        res.status(500).json({ error: 'Failed to fetch trending content' });
    }
});

// 2. Search
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    try {
        // Run both searches in parallel
        const tvPromise = axios.get(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`).catch(() => ({ data: [] }));
        const moviePromise = axios.get(`https://search.imdbot.workers.dev/?q=${encodeURIComponent(q)}`).catch(() => ({ data: { description: [] } }));
        
        const [tvRes, movieRes] = await Promise.all([tvPromise, moviePromise]);
        
        const tvResults = tvRes.data.map(item => ({
            id: item.show.id,
            imdb_id: item.show.externals?.imdb,
            title: item.show.name,
            type: 'series',
            image: item.show.image?.original || item.show.image?.medium,
            rating: item.show.rating?.average,
            description: item.show.summary?.replace(/<[^>]+>/g, ''),
            year: item.show.premiered ? item.show.premiered.substring(0, 4) : 'N/A'
        }));
        
        let movieData = [];
        if (movieRes.data && movieRes.data.description && Array.isArray(movieRes.data.description)) {
            movieData = movieRes.data.description.map(item => ({
                id: item['#IMDB_ID'],
                imdb_id: item['#IMDB_ID'],
                title: item['#TITLE'],
                type: 'movie',
                image: item['#IMG_POSTER'],
                rating: null,
                description: item['#AKA'],
                year: item['#YEAR']
            }));
        }
        
        // Mix results
        const combined = [...tvResults, ...movieData].filter(item => item.image);
        res.json(combined);
    } catch (error) {
        console.error("Error searching:", error);
        res.status(500).json({ error: 'Failed to search content' });
    }
});

// 3. Details
app.get('/api/details/:id', async (req, res) => {
    const { id } = req.params;
    const { type, imdb } = req.query;
    
    try {
        if (type === 'series') {
            const response = await axios.get(`https://api.tvmaze.com/shows/${id}?embed=episodes`);
            const show = response.data;
            const episodes = show._embedded?.episodes?.map(ep => ({
                id: ep.id,
                name: ep.name,
                season: ep.season,
                number: ep.number,
                image: ep.image?.original || ep.image?.medium,
                summary: ep.summary?.replace(/<[^>]+>/g, '')
            })) || [];
            
            res.json({
                id: show.id,
                imdb_id: show.externals?.imdb,
                title: show.name,
                type: 'series',
                image: show.image?.original || show.image?.medium,
                rating: show.rating?.average,
                description: show.summary?.replace(/<[^>]+>/g, ''),
                year: show.premiered ? show.premiered.substring(0, 4) : 'N/A',
                episodes,
                genres: show.genres
            });
        } else {
            // It's a movie using IMDbOT
            const imdbId = imdb || id;
            const response = await axios.get(`https://search.imdbot.workers.dev/?tt=${imdbId}`);
            
            const movie = response.data;
            res.json({
                id: imdbId,
                imdb_id: imdbId,
                title: movie.short?.name,
                type: 'movie',
                image: movie.short?.image,
                rating: movie.short?.aggregateRating?.ratingValue,
                description: movie.short?.description,
                year: movie.short?.datePublished?.substring(0, 4) || 'N/A',
                genres: typeof movie.short?.genre === 'string' ? [movie.short.genre] : movie.short?.genre || [],
                actors: movie.short?.actor?.map(a => a.name) || []
            });
        }
    } catch (error) {
        console.error("Error fetching details:", error);
        res.status(500).json({ error: 'Failed to fetch details' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
