# backend/main.py

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from career import chat_with_navi, get_structured_roadmap
from recommender import search_youtube
from agent_orchestra import run_full_pipeline

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatReq(BaseModel):
    message: str

class RoadmapReq(BaseModel):
    background: str | None = None
    skills: str | None = None
    goal: str
    motivation: str | None = None
    success: str | None = None
    hours_per_week: str | None = None
    preferred_time: str | None = None
    deadline: str | None = None
    learning_style: str | None = None
    tools: str | None = None
    checkins: str | None = None
    support: str | None = None
    obstacles: str | None = None
    constraints: str | None = None

class PipelineReq(BaseModel):
    goal: str

@app.post("/api/chat")
def api_chat(req: ChatReq):
    return {"reply": chat_with_navi(req.message)}

@app.post("/api/roadmap")
def api_roadmap(req: RoadmapReq):
    try:
        result = get_structured_roadmap(req.dict())
        return result
    except Exception as e:
        print("🚨 Error generating structured roadmap:", e)
        raise HTTPException(status_code=500, detail="Invalid roadmap format")

@app.get("/api/search_videos")
def api_search_videos(
    query: str = Query(...), max_results: int = Query(5)
):
    return search_youtube(query, max_results)

@app.post("/api/full_pipeline")
def api_full_pipeline(req: PipelineReq):
    return run_full_pipeline(req.goal)
