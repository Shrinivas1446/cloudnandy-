const roomsData = [
  {
    name: "Mountain View",
    images: [
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-1-1788174456.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-1-1788177002.jpeg"
    ]
  },
  {
    name: "Dlx Mountain View",
    images: [
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-2-1788174499.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-2-1788177013.jpeg"
    ]
  },
  {
    name: "Superior Afram Cabin",
    images: [
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-3-1788174540.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-3-1788174545.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-3-1788177028.jpeg"
    ]
  },
  {
    name: "Wooden Cabin",
    images: [
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-4-1788174584.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-4-1788174591.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-4-1788177053.jpeg"
    ]
  },
  {
    name: "Premium Room",
    images: [
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-6-1788174654.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-6-1788174663.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-6-1788174669.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-6-1788174680.jpeg",
      "https://skyhmsstorage.s3.ap-south-1.amazonaws.com/images-1035/roomimages/roomimage-6-1788177066.jpeg"
    ]
  }
];

const SUPABASE_URL = "https://wyjkehxbybkakgxdnoje.supabase.co";
const SUPABASE_KEY = "sb_publishable_FmN54Y2I0thkiRcGsoZWzg_VSfI6Dia";

const updateSupabase = async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const dbRooms = await res.json();
  
  for (const dbRoom of dbRooms) {
    const scrapedRoom = roomsData.find(r => dbRoom.name.toLowerCase().includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(dbRoom.name.toLowerCase()));
    
    if (scrapedRoom) {
      console.log(`Updating ${dbRoom.name} with ${scrapedRoom.images.length} images`);
      await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${dbRoom.id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': SUPABASE_KEY, 
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          image_urls: scrapedRoom.images,
          image: scrapedRoom.images[0]
        })
      });
    }
  }
  console.log("Done updating!");
};

updateSupabase().catch(console.error);
