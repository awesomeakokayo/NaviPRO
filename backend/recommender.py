from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from typing import List
import requests
import os

load_dotenv()

app = FastAPI()

# ✅ Enable frontend requests (adjust origin in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEO_DETAILS_URL = "https://www.googleapis.com/youtube/v3/videos"


@app.get("/api/search_videos")
def search_youtube(query: str = Query(..., description="Search query for YouTube"), max_results: int = 5):
    # Search YouTube
    search_params = {
        "key": YOUTUBE_API_KEY,
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
    }

    search_response = requests.get(YOUTUBE_SEARCH_URL, params=search_params).json()
    video_ids = [item["id"]["videoId"] for item in search_response.get("items", [])]

    if not video_ids:
        return []

    # Get details
    details_params = {
        "key": YOUTUBE_API_KEY,
        "part": "snippet,contentDetails,statistics",
        "id": ",".join(video_ids)
    }

    details_response = requests.get(YOUTUBE_VIDEO_DETAILS_URL, params=details_params).json()

    results = []

    for item in details_response["items"]:
        video_id = item["id"]
        title = item["snippet"]["title"]
        channel = item["snippet"]["channelTitle"]
        published = item["snippet"]["publishedAt"]
        duration = item["contentDetails"]["duration"]
        views = item["statistics"].get("viewCount", "0")
        thumbnail = item["snippet"]["thumbnails"]["high"]["url"]
        url = f"https://www.youtube.com/watch?v={video_id}"

        results.append({
            "title": title,
            "channel": channel,
            "published": published,
            "duration": duration,
            "views": views,
            "url": url,
            "thumbnail": thumbnail
        })

    return results