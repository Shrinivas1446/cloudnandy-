const fs = require('fs');
const https = require('https');

// 1. Fetch raw HTML from skyrooms.in
https.get('https://bookings.skyrooms.in/roombooking?bkgpropid=1035&&bkgrooms=1', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', async () => {
    // 2. Parse out room blocks
    const rooms = [];
    const roomBlocks = data.split('<div class="room-container').slice(1);
    
    for (let block of roomBlocks) {
      // Find Room Name
      const nameMatch = block.match(/<h4 class="room-title">([^<]+)<\/h4>/);
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      
      // Find Price
      const priceMatch = block.match(/<span class="room-amount[^>]*>(?:<i[^>]+><\/i>\s*)?([0-9.,]+)/);
      let price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      
      // Find Images
      const imgMatches = [...block.matchAll(/<img[^>]+src="([^"]+)"/g)];
      const imgs = imgMatches.map(m => m[1]).filter(url => !url.includes('favicon') && url.includes('roomimage') && !url.includes('?X-Amz'));
      
      if (name !== 'Unknown') {
        rooms.push({ name, price, images: [...new Set(imgs)] });
      }
    }
    
    console.log(JSON.stringify(rooms, null, 2));
    
    // We will save to a JSON file so the agent can read it, or directly to supabase
    fs.writeFileSync('skyrooms_scraped.json', JSON.stringify(rooms, null, 2));
  });
});
