const express = require("express");//express → A framework to create a web server in Node.js.
const axios = require("axios");//axios → A library for making HTTP requests (fetching data from the internet).
const cors = require("cors"); // cors → Stands for Cross-Origin Resource Sharing, allowing your backend to accept requests from different origins (e.g., frontend hosted elsewhere).
require("dotenv").config(); //dotenv → A package that lets us store sensitive information (like API keys) in a .env file instead of hardcoding them in our code.


const app = express();
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;  
const CLIENT_SECRET = process.env.CLIENT_SECRET; 
const REDIRECT_URI = "http://localhost:3000/callback";

app.get("/login", (req, res) => {
  const scope = "user-read-email user-top-read user-library-read";
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(scope)}`;
  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
    const code = req.query.code;
  
    if (!code) {
      return res.json({ error: "Missing authorization code" });
    }
  
    try {
        const response = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
              grant_type: "authorization_code",
              code,
              redirect_uri: REDIRECT_URI,
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET, // ✅ Should be here
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
          
  
        console.log("✅ Access Token Response:", response.data);
        res.json(response.data); // Sends back the access token
    }   catch (error) {
        console.error("❌ Error Getting Access Token:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to get access token", details: error.response?.data || error.message });
    }
});
  

async function getUserPlaylists(accessToken) {
    try {
      const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data; // Return the playlist data
    } catch (error) {
      console.error("Error fetching playlists:", error.response?.data || error);
      return { error: "Failed to fetch playlists" };
    }
}
app.get("/playlists", async (req, res) => {
    const accessToken = req.query.token; // Get token from URL
    if (!accessToken) {
      return res.status(400).json({ error: "Missing access token" });
    }
  
    const playlists = await getUserPlaylists(accessToken);
    res.json(playlists);
});
  



app.listen(3000, () => console.log("Server running on http://localhost:3000"));
