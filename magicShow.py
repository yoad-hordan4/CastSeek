import json
import requests

file_pod_list = "recently_played_podcasts.json"

def get_access_token():
    """Fetch the access token from the Node.js server"""
    try:
        response = requests.get("http://localhost:3000/access-token")
        response.raise_for_status()
        return response.json().get("access_token")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching access token: {e}")
        return None


def load_podcasts(file_path):
    try:
        with open(file_path, "r") as file:
            podcasts = json.load(file)
        return podcasts
    except FileNotFoundError:
        print("❌ Error: recently_played_podcasts.json not found.")
        return []


def names_podcasts(podcasts):
    return [podcast['name'] for podcast in podcasts]


SPOTIFY_API_URL = "https://api.spotify.com/v1/search"

def get_recommendations(podcast_name):
    """Fetch similar podcasts from Spotify API."""
    
    access_token = get_access_token()  # Get the latest token
    if not access_token:
        print("❌ No access token available. Please log in.")
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

        recommendations = [
            show["name"] for show in data.get("shows", {}).get("items", [])
        ]

        return recommendations if recommendations else ["No recommendations found."]
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching recommendations: {e}")
        return []
    
    


def main():
    podcasts = load_podcasts(file_pod_list)
    names = names_podcasts(podcasts)
    recommendations = get_recommendations(names[1])
    print("you listened to", names[1], "We think you'll like these:")
    print("\n".join(recommendations))

if __name__ == "__main__":
    main()