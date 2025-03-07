const fs = require("fs");
const axios = require("axios");

const { getAccessToken } = require("./server");

async function getRecentlyPlayed(accessToken) {
    try {
        const response = await axios.get(
            "https://api.spotify.com/v1/me/player/recently-played?limit=50",
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        return response.data.items;
    } catch (error) {
        console.error("❌ Error fetching recently played:", error.response?.data || error.message);
        return [];
    }
}

async function getSavedPodcastEpisodes(accessToken) {
    try {
        const response = await axios.get(
            "https://api.spotify.com/v1/me/episodes?limit=50",
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        const podcasts = response.data.items.map((item) => ({
            name: item.episode.name, // Episode title
            podcast: item.episode.show.name, // Show name
            episode_url: item.episode.external_urls.spotify, // Link to episode
            release_date: item.episode.release_date, // When released
        }));

        return podcasts;
    } catch (error) {
        console.error("❌ Error fetching saved podcasts:", error.response?.data || error.message);
        return [];
    }
}


async function savePodcastsToFile() {
    const accessToken = getAccessToken(); // Get the latest access token

    if (!accessToken) {
        console.error("❌ No access token available. Please log in.");
        return;
    }

    const podcasts = await getSavedPodcastEpisodes(accessToken);
    fs.writeFileSync("recently_played_podcasts.json", JSON.stringify(podcasts, null, 2));
    console.log("✅ Podcast data saved to recently_played_podcasts.json");
}

/*const { sql, connectDB } = require("./db");

async function savePodcastsToDB(podcasts) {
  try {
    await sql.connect();
    for (const podcast of podcasts) {
      await sql.query`INSERT INTO podcasts (name, episode_title, release_date) 
                      VALUES (${podcast.name}, ${podcast.episode_title}, ${podcast.release_date})`;
    }
    console.log("✅ Podcasts saved to database!");
  } catch (err) {
    console.error("❌ Error saving podcasts:", err);
  }
}

module.exports = savePodcastsToDB;
*/

module.exports = savePodcastsToFile;