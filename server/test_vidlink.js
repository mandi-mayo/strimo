const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('https://vidlink.pro/movie/278');
    console.log(res.data.includes('adOv') ? 'Has adOv' : 'No adOv');
    console.log(res.data.includes('window.open') ? 'Has window.open' : 'No window.open');
  } catch (e) {
    console.log('Error', e.message);
  }
}
run();
