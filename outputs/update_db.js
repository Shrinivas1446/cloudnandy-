const fs = require('fs');
const content = fs.readFileSync('sky_raw.html', 'utf8');

// Find all image URLs and group them
const regex = /<img src="([^"?]+)[^>]+class="roomimg_(\d+)"/g;
let match;
const roomImages = {};

while ((match = regex.exec(content)) !== null) {
  const url = match[1];
  const roomId = match[2];
  if (!roomImages[roomId]) roomImages[roomId] = [];
  if (!roomImages[roomId].includes(url)) roomImages[roomId].push(url);
}

// Find room names and prices
// Format in skyrooms html: 
// <h4 class="room-title">...</h4>
// ... <span class="room-amount ...">...<i class="..."></i> 4,761.90</span>
// <div class="swiper-slide"><img ... class="roomimg_X" ...
const rooms = [];
const blocks = content.split('<div class="room-container');
for (let i = 1; i < blocks.length; i++) {
  const block = blocks[i];
  const nameMatch = block.match(/<h4 class="room-title">([^<]+)<\/h4>/);
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
  
  const priceMatch = block.match(/<span class="room-amount[^>]*>.*?([\d,]+\.\d+)/);
  const priceStr = priceMatch ? priceMatch[1].replace(/,/g, '') : '0';
  
  const imgClassMatch = block.match(/class="roomimg_(\d+)"/);
  const roomId = imgClassMatch ? imgClassMatch[1] : null;
  
  rooms.push({
    name,
    price: parseFloat(priceStr),
    images: roomId ? roomImages[roomId] : []
  });
}

console.log(JSON.stringify(rooms, null, 2));

// Update supabase
const updateSupabase = async () => {
  const SUPABASE_URL = "https://wyjkehxbybkakgxdnoje.supabase.co";
  const SUPABASE_KEY = "sb_publishable_FmN54Y2I0thkiRcGsoZWzg_VSfI6Dia";
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const dbRooms = await res.json();
  
  for (const dbRoom of dbRooms) {
    // Find matching room in scraped data (use substring match for safety)
    const scrapedRoom = rooms.find(r => dbRoom.name.toLowerCase().includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(dbRoom.name.toLowerCase()));
    
    if (scrapedRoom) {
      console.log(`Updating ${dbRoom.name} with price ${scrapedRoom.price} and ${scrapedRoom.images.length} images`);
      // Update!
      await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${dbRoom.id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': SUPABASE_KEY, 
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price: scrapedRoom.price, // Store the inclusive base price so our new logic works
          image: scrapedRoom.images[0] || "",
          image_urls: scrapedRoom.images
        })
      });
    }
  }
};
updateSupabase().catch(console.error);
