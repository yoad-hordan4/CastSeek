const fs = require("fs");
const axios = require("axios");
const { getAccessToken } = require("./server");

async function getShowDetails(showId, accessToken) {
    try {
        const response = await axios.get(
            `https://api.spotify.com/v1/shows/${showId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        return {
            show_name: response.data.name,
            popularity: response.data.popularity || "N/A", // Popularity score (0-100)
            show_description: response.data.description,
            publisher: response.data.publisher,
        };
    } catch (error) {
        console.error(`❌ Error fetching details for show ${showId}:`, error.response?.data || error.message);
        return null;
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

        let podcasts = [];

        for (const item of response.data.items) {
            const episode = item.episode;
            const showId = episode.show.id;

            const showDetails = await getShowDetails(showId, accessToken);
            if (!showDetails) continue;


            podcasts.push({
                episode_title: episode.name,
                podcast_name: showDetails.show_name,
                show_description: showDetails.show_description,
                publisher: showDetails.publisher,
                episode_description: episode.description,
                episode_url: episode.external_urls.spotify,
                release_date: episode.release_date,
                popularity: showDetails.popularity,
            });
        }

        return podcasts;
    } catch (error) {
        console.error("❌ Error fetching saved podcasts:", error.response?.data || error.message);
        return [];
    }
}

async function savePodcastsToFile() {
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
            console.error("❌ No access token available. Please log in.");
            return;
        }

        const podcasts = await getSavedPodcastEpisodes(accessToken);
        console.log("🎵 Fetched", podcasts.length, "saved podcasts --------");
        fs.writeFileSync("recently_played_podcasts.json", JSON.stringify(podcasts, null, 2));
        console.log("✅ Podcast data saved to recently_played_podcasts.json");
    } catch (error) {
        console.error("❌ Error saving podcast data:", error.message);
    }
}


module.exports = savePodcastsToFile;
