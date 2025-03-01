const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const CLIENT_ID = "783715a9cebc4d2ea192a544652bd00c";
const CLIENT_SECRET = "9dbbd3a11e1d46c28bf5b7d19d46d1b1";
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

    res.json(response.data); // Returns access_token
  } catch (error) {
    res.json({ error: "Failed to get access token" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
