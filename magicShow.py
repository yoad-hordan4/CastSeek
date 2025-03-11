import json
import requests
import requests
import os
from dotenv import load_dotenv

load_dotenv()
SPOTIFY_API_URL = "https://api.spotify.com/v1/search"

file_pod_list = "recently_played_podcasts.json"

def get_access_token():
    #Fetch the access token from the Node.js server
    try:
        response = requests.get("http://localhost:3000/access-token")
        response.raise_for_status()
        return response.json().get("access_token")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching access token: {e}")
        return None


def load_podcasts(file_path):
    #Load the podcast history from a JSON file.
    try:
        with open(file_path, "r") as file:
            podcasts = json.load(file)
        return podcasts
    except FileNotFoundError:
        print("❌ Error: recently_played_podcasts.json not found.")
        return []


def names_podcasts(podcasts):
    #Extract podcast names from the last 10 episodes.
    return [podcast['name'] for podcast in podcasts][:10]  # Get last 10 (newest first)


SPOTIFY_API_URL = "https://api.spotify.com/v1/search"

def get_recommendations(podcast_name):
    access_token = get_access_token()
    if not access_token:
        return []

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

        return [
            show["name"] for show in data.get("shows", {}).get("items", [])
        ]
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching recommendations: {e}")
        return []

def get_combined_recommendations(podcast_names):
    all_recommendations = set()

    for podcast in podcast_names:
        recommendations = get_recommendations(podcast)
        all_recommendations.update(recommendations)

    return list(all_recommendations)

def main():
    podcasts = load_podcasts(file_pod_list)
    podcast_names = names_podcasts(podcasts)

    if not podcast_names:
        print("❌ No podcast history found.")
        return

    print("\n🎧 Your last 10 played podcasts:")
    for name in podcast_names:
        print(f"- {name}")

    recommendations = get_combined_recommendations(podcast_names)

    print("\n🔥 Based on your recent listens, you might like these:")
    print("\n".join(recommendations) if recommendations else "No recommendations found.")


if __name__ == "__main__":
    main()
