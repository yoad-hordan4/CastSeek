import json
import requests
import re
import time
import os
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import webbrowser
import subprocess

load_dotenv()

app = FastAPI()

# 🔹 Spotify API Configuration
SPOTIFY_API_URL = "https://api.spotify.com/v1/search"
TOKEN_URL = "https://accounts.spotify.com/api/token"
PODCAST_FILE = "recently_played_podcasts.json"

# 🔹 Load credentials from .env
NODE_SERVER_URL = os.getenv("NODE_SERVER_URL")
FASTAPI_URL = os.getenv("FASTAPI_URL")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

# 🔹 Store tokens in memory (use a database in production)
tokens = {}



@app.get("/start-node-server")
def start_node_server():
    """Start the Node.js server (server.js) automatically."""
    try:
        subprocess.Popen(["node", "server.js"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return {"message": "Node.js server started successfully"}
    except Exception as e:
        return {"error": str(e)}
    


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
    return {"message": "Welcome to the CastSeek API!"}


@app.get("/recent-podcasts")
def recent_podcasts():
    podcasts = load_podcasts()
    if not podcasts:
        raise HTTPException(status_code=404, detail="No podcast history found.")
    
    return {"recent_podcasts": extract_podcast_names(podcasts)}


@app.get("/recommendations")
def recommendations():
    podcasts = load_podcasts()
    podcast_names = extract_podcast_names(podcasts)

    if not podcast_names:
        raise HTTPException(status_code=404, detail="No podcast history found.")

    recs = get_combined_recommendations(podcast_names)
    return {"recommendations": recs}




@app.get("/full-recommendations")
def full_recommendations():
    """Runs the entire process: start server, login, get podcasts, get recommendations."""

    # 1️⃣ Start Node.js server
    try:
        subprocess.Popen(["node", "server.js"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(3)  # Wait a few seconds to ensure the server starts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting Node.js server: {e}")

    # 2️⃣ Open login page
    webbrowser.open(f"{NODE_SERVER_URL}/login")
    time.sleep(10)  # Give the user time to log in manually

    # 3️⃣ Fetch recent podcasts
    recent_podcasts_url = f"{FASTAPI_URL}/recent-podcasts"
    print(f"Fetching recent podcasts from: {recent_podcasts_url}")  # Debugging

    try:
        response = requests.get(recent_podcasts_url)
        response.raise_for_status()
        recent_podcasts = response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recent podcasts: {e}")

    # 4️⃣ Fetch recommendations
    recommendations_url = f"{FASTAPI_URL}/recommendations"
    print(f"Fetching recommendations from: {recommendations_url}")  # Debugging

    try:
        response = requests.get(recommendations_url)
        response.raise_for_status()
        recommendations = response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recommendations: {e}")

    return {
        "message": "Full recommendation process completed!",
        "recent_podcasts": recent_podcasts,
        "recommendations": recommendations
    }