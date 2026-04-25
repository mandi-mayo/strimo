const axios = require('axios');

const endpoints = [
  'https://vidsrc.cc/v2/embed/movie/tt0111161',
  'https://vidsrc.net/embed/movie?imdb=tt0111161',
  'https://vidsrc.in/embed/movie?imdb=tt0111161',
  'https://vidsrc.pm/embed/movie?imdb=tt0111161',
  'https://vidsrc.xyz/embed/movie?imdb=tt0111161',
  'https://vidlink.pro/movie/tt0111161',
  'https://autoembed.co/movie/imdb/tt0111161',
  'https://autoembed.to/movie/imdb/tt0111161',
  'https://player.autoembed.cc/embed/movie/tt0111161',
  'https://embed.smashystream.com/playere.php?imdb=tt0111161',
  'https://2embed.cc/embed/tt0111161'
];

async function checkEndpoints() {
  for (const url of endpoints) {
    try {
      const res = await axios.get(url, { timeout: 3000 });
      console.log(`[OK] ${url} (Status: ${res.status}) - length: ${res.data.length}`);
      if (res.headers['x-frame-options']) {
        console.log(`  -> HAS X-FRAME-OPTIONS: ${res.headers['x-frame-options']}`);
      }
      if (res.data.includes('Application error')) {
        console.log(`  -> HAS NEXT.JS 500 ERROR IN BODY`);
      }
      if (res.data.includes('parked') || res.data.includes('domain')) {
         console.log(`  -> MIGHT BE PARKED DOMAIN`);
      }
    } catch (e) {
      console.log(`[FAIL] ${url} - ${e.message}`);
    }
  }
}

checkEndpoints();
