const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();
const TOKEN_FILE = "tokens.json";

const app = express();
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/callback";

let accessToken = null;
let refreshToken = null;
let tokenExpiration = null; // Timestamp when token expires

loadTokens();
console.log("📂 Loaded saved tokens:", { accessToken, refreshToken, tokenExpiration });

function getAccessToken() {
    return accessToken;
}
module.exports = { getAccessToken };
  
const scopes = [
    "user-read-email",
    "user-read-private",
    "user-library-read",
    "user-library-modify",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-recently-played",
    "user-top-read",
    "app-remote-control",
    "streaming",
    "user-follow-read",
    "user-follow-modify"
];
  

const { sql, connectDB } = require("./db");

// Function to save tokens
async function saveTokensToDB(accessToken, refreshToken, tokenExpiration) {
    try {
        await sql.connect();
        await sql.query`INSERT INTO tokens (access_token, refresh_token, token_expiration) 
                    VALUES (${accessToken}, ${refreshToken}, ${tokenExpiration})`;
        console.log("✅ Tokens saved to database!");
    } catch (err) {
        console.error("❌ Error saving tokens:", err);
    }
}

// Call saveTokensToDB inside the callback route
app.get("/callback", async (req, res) => {
    // After getting tokens from Spotify
    await saveTokensToDB(accessToken, refreshToken, tokenExpiration);
});


// Redirect user to Spotify login
app.get("/login", (req, res) => {
  const scope = "user-read-email user-top-read user-library-read";
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${scopes.join("%20")}`;
  res.redirect(authUrl);
});

// 🎵 Handle Spotify callback & save tokens
app.get("/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.json({ error: "Missing authorization code" });
  
    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
  
      accessToken = response.data.access_token;
      refreshToken = response.data.refresh_token;
      tokenExpiration = Date.now() + response.data.expires_in * 1000; // Set expiration time
  
      // ✅ Save tokens to file
      saveTokens();
  
      console.log("✅ Access Token:", accessToken);
      console.log("🔄 Refresh Token:", refreshToken);
  
      const savePodcastsToFile = require("./list_podcasts");
      savePodcastsToFile(accessToken);
  
      res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: response.data.expires_in,
      });
    } catch (error) {
      console.error("❌ Error Getting Access Token:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to get access token", details: error.response?.data || error.message });
    }
});
  

// 🎵 Function to refresh the access token
async function refreshAccessToken() {
  if (!refreshToken) {
    console.error("❌ No refresh token available. User needs to log in again.");
    return null;
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    accessToken = response.data.access_token;
    tokenExpiration = Date.now() + response.data.expires_in * 1000; // Update expiration time
    saveTokens();
    console.log("🔄 Token refreshed successfully!");
    return accessToken;
  } catch (error) {
    console.error("❌ Error refreshing access token:", error.response?.data || error.message);
    return null;
  }
}


// here is the podcast list
const pod_file = require("./list_podcasts");
pod_file(accessToken);

function saveTokens() {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ accessToken, refreshToken, tokenExpiration }, null, 2));
}
function loadTokens() {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
      tokenExpiration = data.tokenExpiration;
    }
}


// 🎵 Middleware to ensure access token is fresh
async function ensureAccessToken(req, res, next) {
  if (!accessToken || Date.now() >= tokenExpiration) {
    console.log("🔄 Access token expired, refreshing...");
    accessToken = await refreshAccessToken();
  }
  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized, please log in again." });
  }
  next();
}

// 🎵 Example route using the updated token
app.get("/playlists", ensureAccessToken, async (req, res) => {
  try {
    const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching playlists:", error.response?.data || error);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

// Start the server
app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
