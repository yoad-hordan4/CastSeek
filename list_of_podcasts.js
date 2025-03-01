const { accessToken } = require("./server"); // Import the variable
console.log("🎧 Podcast List:", accessToken);


// list of recently played tracks
async function getRecentlyPlayed(accessToken) {
    try {
      const response = await axios.get(
        "https://api.spotify.com/v1/me/player/recently-played?limit=50",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      return response.data.items; // Array of recently played tracks (including podcasts)
    } catch (error) {
      console.error("❌ Error fetching recently played:", error.response?.data || error.message);
      return [];
    }
}


// only podcasts listened to
async function getRecentlyPlayedPodcasts(accessToken) {
    const items = await getRecentlyPlayed(accessToken);
  
    const podcasts = items
      .filter((item) => item.context && item.context.type === "show")
      .map((item) => ({
        name: item.track.name,
        podcast: item.context.href, // Link to the podcast show
        episode_url: item.track.external_urls.spotify,
        played_at: item.played_at,
      }));
  
    return podcasts;
}


async function savePodcastsToFile(accessToken) {
    const podcasts = await getRecentlyPlayedPodcasts(accessToken);
  
    fs.writeFileSync("recently_played_podcasts.json", JSON.stringify(podcasts, null, 2));
  
    console.log("✅ Podcast data saved to recently_played_podcasts.json");
}
  