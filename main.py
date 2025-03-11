from fastapi import FastAPI, HTTPException
import json
import requests
from dotenv import load_dotenv
import os
from magicShow import get_combined_recommendations

load_dotenv()

app = FastAPI()

FILE_POD_LIST = "recently_played_podcasts.json"

def load_podcasts():
    try:
        with open(FILE_POD_LIST, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return []

@app.get("/")
def root():
    return {"message": "Podcast Recommendation API is running!"}

@app.get("/recently-played")
def recently_played():
    podcasts = load_podcasts()
    if not podcasts:
        raise HTTPException(status_code=404, detail="No podcast history found.")
    return {"recently_played": podcasts[:10]}

@app.get("/recommendations")
def recommendations():
    podcasts = load_podcasts()
    if not podcasts:
        raise HTTPException(status_code=404, detail="No podcast history found.")

    podcast_names = [p["name"] for p in podcasts][:10]
    recommended = get_combined_recommendations(podcast_names)

    return {"recommendations": recommended if recommended else "No recommendations found."}
