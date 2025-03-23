import json
import requests
import re
import base64
import os
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import webbrowser

load_dotenv()

app = FastAPI()

# 🔹 Spotify API Configuration
SPOTIFY_API_URL = "https://api.spotify.com/v1/search"
TOKEN_URL = "https://accounts.spotify.com/api/token"
PODCAST_FILE = "recently_played_podcasts.json"

# 🔹 Load credentials from .env
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

# 🔹 Store tokens in memory (use a database in production)
tokens = {}


def open_login_page():
    url = "http://localhost:3000/login"
    webbrowser.open(url)
    
    
@app.get("/open-login")
def trigger_login():
    """Opens the login page in the browser when this endpoint is accessed."""
    open_login_page()
    return {"message": "Login page opened in browser"}


def get_access_token():
     """Fetch the access token from the Node.js server."""
     try:
         response = requests.get("http://localhost:3000/access-token")
         response.raise_for_status()
         return response.json().get("access_token")
     except requests.exceptions.RequestException as e:
         print(f"❌ Error fetching access token: {e}")
         return None


def load_podcasts():
    """Load the podcast history from a JSON file."""
    try:
        with open(PODCAST_FILE, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return []


def extract_podcast_names(podcasts, limit=10):
    """Extract podcast names from the last `limit` episodes."""
    return [podcast['podcast_name'] for podcast in podcasts][:limit]


def get_recommendations(podcast_name):
    """Fetch podcast recommendations from Spotify based on a given podcast name."""
    access_token = get_access_token()

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    params = {
        "q": podcast_name,
        "type": "show",
        "limit": 5
    }

    try:
        response = requests.get(SPOTIFY_API_URL, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        return [show["name"] for show in data.get("shows", {}).get("items", [])]
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching recommendations: {e}")
        return []


def get_combined_recommendations(podcast_names, limit=10):
    """Generate a list of podcast recommendations based on recent listens."""
    all_recommendations = set()

    for podcast in podcast_names:
        recommendations = get_recommendations(podcast)
        all_recommendations.update(recommendations)

    # Define regex pattern to allow only English letters, numbers, spaces, and common symbols
    pattern = re.compile(r'[^a-zA-Z0-9\s!@#$%^&*(),.?":{}|<>]')

    # Filter out names that contain non-English characters
    filtered_recommendations = [podcast for podcast in all_recommendations if not pattern.search(podcast)]

    return filtered_recommendations[:limit]


@app.get("/")
def root():
    """Root endpoint to check if the API is running."""
    return {"message": "Welcome to the CastSeek API!"}


@app.get("/recent-podcasts")
def recent_podcasts():
    """Endpoint to get the user's last 10 played podcasts."""
    podcasts = load_podcasts()
    if not podcasts:
        raise HTTPException(status_code=404, detail="No podcast history found.")
    
    return {"recent_podcasts": extract_podcast_names(podcasts)}


@app.get("/recommendations")
def recommendations():
    """Endpoint to get podcast recommendations based on recent listens."""
    podcasts = load_podcasts()
    podcast_names = extract_podcast_names(podcasts)

    if not podcast_names:
        raise HTTPException(status_code=404, detail="No podcast history found.")

    recs = get_combined_recommendations(podcast_names)
    return {"recommendations": recs}
