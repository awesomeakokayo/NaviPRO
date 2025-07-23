# backend/agent_orchestra.py

import os
import json
from uuid import uuid4
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx

load_dotenv()

# ─── Configuration ──────────────────────────────────────────────────────────────
GROQ_API_KEY  = os.getenv("GROQ_API_KEY")
# Remove the trailing path from base URL
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# In-memory user store (for demo)
user_store: dict[str, dict] = {}

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ─────────────────────────────────────────────────────────────────────
from typing import Optional

class FullPipelineReq(BaseModel):
    goal: str
    target_role: Optional[str] = ""
    why: str
    timeframe: str
    hours_per_week: Optional[str] = "10"
    skills: Optional[list[str]] = []
    learning_style: Optional[str] = "visual"
    learning_speed: Optional[str] = "average"
    skill_level: Optional[str] = "beginner"

def regroup_by_year(flat_months: list[dict], months_per_year: int = 12) -> list[dict]:
    years = []
    for i in range(0, len(flat_months), months_per_year):
        year_index = i // months_per_year + 1
        months_chunk = flat_months[i:i + months_per_year]
        years.append({
            "year": year_index,
            "months": months_chunk
        })
    return years

# ─── Helper: regroup flat weeks into months ─────────────────────────────────────
def regroup_by_month(flat_weeks: list[dict], weeks_per_month: int = 4) -> list[dict]:
    months = []
    for i in range(0, len(flat_weeks), weeks_per_month):
        month_index = i // weeks_per_month + 1
        weeks_chunk = flat_weeks[i:i + weeks_per_month]
        months.append({
            "month": month_index,
            "weeks": weeks_chunk
        })
    return months

# ─── 1) LLM-based Roadmap Generation via GROQ ─────────────────────────────────
def llm_generate_roadmap(req: FullPipelineReq) -> dict:
    print(f"🔄 Starting roadmap generation for goal: {req.goal}")
    
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY not found in environment variables")
        raise HTTPException(500, "GROQ_API_KEY not configured")
    
    # Separate system prompt and user prompt
    system_prompt = """You are Navi, a realistic and practical career strategist AI.

Your job is to design a personalized full stack development roadmap that fits the user's situation. You must be detailed, realistic, and output in valid JSON.

Instructions:
1. Think step-by-step like a mentor coaching a student from scratch.
2. Break the roadmap into clear weekly or bi-weekly stages based on their learning speed.
3. Match tasks and concepts with the user's skill level.
4. Ensure everything can fit within the timeframe realistically.
5. Use only **free resources** (e.g., FreeCodeCamp, Scrimba, MDN, Youtube).
6. Output only valid JSON in the format below.

JSON format:
{
    "goal": "...",
    "why": "...",
    "timeframe": "...",
    "learning_speed": "...",
    "skill_level": "...",
    "roadmap": [
        {
            "month": 1,
            "focus": "Main focus of this stage",
            "weeks": [
                {
                "week": 1,
                "tasks": [
                    { "title": "Learn HTML basics", "estimated_time": "2 hours" },
                    { "title": "Build first webpage", "estimated_time": "3 hours" }
                ]
                }
            ]
        }
    ]
}"""

    user_prompt = f"""Please create a roadmap for me with the following details:

- Goal: {req.goal}
- Target Role: {req.target_role}
- Why: {req.why}
- Timeframe: {req.timeframe}
- Hours per week: {req.hours_per_week}
- Current Skills: {', '.join(req.skills)}
- Learning Style: {req.learning_style}
- Learning Speed: {req.learning_speed} (slow, average, fast)
- Skill Level: {req.skill_level} (beginner, intermediate, advanced)

Please generate a detailed roadmap that fits my situation and return it as valid JSON only."""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": "llama-3.1-8b-instant",  # Use a more reliable model
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.4,
        "max_tokens": 4000
    }

    try:
        # Fix the URL construction - remove the double slash
        api_url = f"{GROQ_BASE_URL}/chat/completions"
        print(f"🌐 Making request to Groq API: {api_url}")
        print(f"📝 Using model: {body['model']}")
        
        # Create client with specific timeout and retry logic
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                api_url,
                headers=headers,
                json=body
            )
        
        print(f"📊 Response status: {resp.status_code}")
        
        resp.raise_for_status()
        response_data = resp.json()
        print(f"✅ Got response from Groq API")
        
        raw = response_data["choices"][0]["message"]["content"]
        print(f"📄 Raw response length: {len(raw)} characters")
        print(f"📄 First 200 chars: {raw[:200]}...")
        
        # Clean the response to extract JSON
        raw = raw.strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()
        
        print(f"🧹 Cleaned response length: {len(raw)} characters")
        
        try:
            data = json.loads(raw)
            print("✅ Successfully parsed JSON response")
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON: {e}")
            print(f"Raw response: {raw}")
            # Return a fallback structure
            return {
                "goal": req.goal, 
                "target_role": req.target_role, 
                "why": req.why, 
                "timeframe": req.timeframe,
                "learning_speed": req.learning_speed,
                "skill_level": req.skill_level,
                "roadmap": [{
                    "stage": "Getting Started",
                    "duration_weeks": 4,
                    "focus": "Foundation",
                    "milestone": "Basic understanding",
                    "tasks": [{
                        "title": "Start learning basics",
                        "description": "Begin with fundamentals",
                        "estimated_time": "10 hours"
                    }]
                }]
            }

        # Ensure roadmap has the correct structure with tasks
        if "roadmap" in data:
            print(f"🗺️ Processing roadmap with {len(data['roadmap'])} stages")
            for stage in data["roadmap"]:
                if "tasks" not in stage:
                    stage["tasks"] = [{
                        "title": f"Learn {stage.get('focus', 'concepts')}",
                        "description": stage.get('milestone', 'Complete stage milestone'),
                        "estimated_time": "8 hours"
                    }]

        # If it's already nested with months/weeks, skip regroup
        if all("weeks" in m for m in data.get("roadmap", [])):
            print("🔄 Roadmap already has month/week structure")
            return data

        # Otherwise, regroup flat weeks
        flat_roadmap = data.get("roadmap", [])
        print(f"🔄 Regrouping {len(flat_roadmap)} stages into months")
        data["roadmap"] = regroup_by_month(flat_roadmap)
        print(f"✅ Roadmap generation completed successfully")
        return data
        
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e.response.status_code}")
        print(f"❌ Response body: {e.response.text}")
        raise HTTPException(500, f"API Error: {e.response.status_code} - {e.response.text}")
    except httpx.ConnectError as e:
        print(f"❌ Connection Error: {e}")
        print("💡 Troubleshooting tips:")
        print("   - Check your internet connection")
        print("   - Verify GROQ_API_KEY is valid")
        print("   - Try pinging api.groq.com")
        print("   - Check if you're behind a firewall/proxy")
        raise HTTPException(500, "Failed to connect to Groq API - check internet connection and API key")
    except httpx.TimeoutException as e:
        print(f"❌ Timeout Error: {e}")
        raise HTTPException(500, "Request to Groq API timed out")
    except Exception as e:
        print(f"❌ Unexpected error in llm_generate_roadmap: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Internal error during roadmap generation: {str(e)}")

# ─── 2) YouTube Search Helper ─────────────────────────────────────────────────
def youtube_search(query: str, max_results: int = 5) -> list[dict]:
    if not YOUTUBE_API_KEY:
        print("⚠️ No YouTube API key configured, skipping video search")
        return []
    
    try:
        search_url = "https://www.googleapis.com/youtube/v3/search"
        details_url = "https://www.googleapis.com/youtube/v3/videos"

        with httpx.Client(timeout=30.0) as client:
            sr = client.get(search_url, params={
                "key": YOUTUBE_API_KEY,
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": max_results
            }).json()
            
            ids = [item["id"]["videoId"] for item in sr.get("items", [])]
            if not ids:
                return []

            dr = client.get(details_url, params={
                "key": YOUTUBE_API_KEY,
                "part": "snippet,contentDetails,statistics",
                "id": ",".join(ids)
            }).json()

        out = []
        for item in dr.get("items", []):
            out.append({
                "title":     item["snippet"]["title"],
                "url":       f"https://www.youtube.com/watch?v={item['id']}",
                "duration":  item["contentDetails"]["duration"],
                "views":     item["statistics"].get("viewCount", "0"),
                "channel":   item["snippet"]["channelTitle"]
            })
        return out
    except Exception as e:
        print(f"❌ YouTube search error: {e}")
        return []

# ─── 3) Enrich Roadmap with Videos ─────────────────────────────────────────────
def enrich_with_videos(roadmap: dict) -> dict:
    print("🎥 Enriching roadmap with video content...")
    for month in roadmap.get("roadmap", []):
        if "weeks" in month:
            for week in month.get("weeks", []):
                for task in week.get("tasks", []):
                    task["videos"] = youtube_search(task["title"])
        else:
            # Handle flat structure
            if "tasks" in month:
                for task in month.get("tasks", []):
                    task["videos"] = youtube_search(task["title"])
    print("✅ Video enrichment complete")
    return roadmap

# ─── 4) Slice Next Daily Task ─────────────────────────────────────────────────
def slice_daily_task(roadmap: dict) -> dict:
    for month in roadmap.get("roadmap", []):
        if "weeks" in month:
            for week in month.get("weeks", []):
                for task in week.get("tasks", []):
                    if not task.get("done", False):
                        return {
                            "title":          task["title"],
                            "goal":           roadmap["goal"],
                            "why":            roadmap["why"],
                            "estimated_time": task.get("estimated_time", ""),
                            "videos":         task.get("videos", []),
                            "done":           False
                        }
        else:
            # Handle flat structure
            if "tasks" in month:
                for task in month.get("tasks", []):
                    if not task.get("done", False):
                        return {
                            "title":          task["title"],
                            "goal":           roadmap["goal"],
                            "why":            roadmap["why"],
                            "estimated_time": task.get("estimated_time", ""),
                            "videos":         task.get("videos", []),
                            "done":           False
                        }
    return {}

# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.post("/api/full_pipeline")
def api_full_pipeline(req: FullPipelineReq):
    try:
        print(f"📥 Received request: {req.model_dump()}")
        rm = llm_generate_roadmap(req)

        # init done flags
        for m in rm.get("roadmap", []):
            if "weeks" in m:
                for w in m.get("weeks", []):
                    for t in w.get("tasks", []):
                        t["done"] = False
            else:
                # Handle flat structure
                if "tasks" in m:
                    for t in m.get("tasks", []):
                        t["done"] = False

        rm = enrich_with_videos(rm)

        user_id = str(uuid4())
        user_store[user_id] = rm
        print(f"✅ Pipeline completed successfully for user: {user_id}")
        return {"user_id": user_id, "roadmap": rm}
    except Exception as e:
        print(f"❌ Pipeline error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to generate roadmap: {str(e)}")

@app.get("/api/user_roadmap/{user_id}")
def api_user_roadmap(user_id: str):
    rd = user_store.get(user_id)
    if not rd:
        raise HTTPException(404, "User not found")
    return rd

@app.get("/api/user_daily_task/{user_id}")
def api_user_daily_task(user_id: str):
    rd = user_store.get(user_id)
    if not rd:
        raise HTTPException(404, "User not found")
    task = slice_daily_task(rd)
    if not task:
        raise HTTPException(404, "All tasks completed")
    return task

@app.post("/api/mark_task_done/{user_id}")
def api_mark_task_done(user_id: str):
    rd = user_store.get(user_id)
    if not rd:
        raise HTTPException(404, "User not found")
    
    for month in rd.get("roadmap", []):
        if "weeks" in month:
            for week in month.get("weeks", []):
                for task in week.get("tasks", []):
                    if not task.get("done"):
                        task["done"] = True
                        return {"status": "ok", "marked": task}
        else:
            # Handle flat structure
            if "tasks" in month:
                for task in month.get("tasks", []):
                    if not task.get("done"):
                        task["done"] = True
                        return {"status": "ok", "marked": task}
    
    raise HTTPException(400, "No pending task")

@app.get("/api/debug")
def api_debug():
    return {"status": "Backend is running", "user_count": len(user_store)}

@app.post("/api/debug_request")
def api_debug_request(data: dict):
    print(f"📥 Raw request data: {data}")
    return {"received": data, "type": type(data)}

# Health check endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "groq_configured": bool(GROQ_API_KEY),
        "youtube_configured": bool(YOUTUBE_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("agent_orchestra:app", host="127.0.0.1", port=8000, reload=True)