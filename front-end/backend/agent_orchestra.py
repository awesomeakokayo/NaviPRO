# langgraph_pipeline.py

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage
from langchain_core.runnables import Runnable
from langchain_core.tools import tool
import requests
import os
import json
from dotenv import load_dotenv
import openai

load_dotenv()

# Set up OpenAI for Groq (replace with your proper base URL and key)
openai.api_key = os.getenv("GROQ_API_KEY")
openai.base_url = os.getenv("GROQ_BASE_URL")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


### Step 1: Roadmap Generator ###
@tool
def generate_roadmap_tool(goal: str) -> dict:
    """Generate a step-by-step roadmap for a specific career goal."""
    # ... your function logic ...
    print("Generating roadmap for:", goal)
    roadmap_prompt = (
        f"You are Navi, an expert career strategist.\n\n"
        f"Create a 3-month roadmap to achieve this goal: '{goal}'. "
        f"Structure it month-by-month and week-by-week. Each week should have 2–3 tasks.\n"
        f"Format your response as valid JSON like this:\n"
        f"{{ \"goal\": \"...\", \"roadmap\": [{{ \"month\": 1, \"weeks\": [{{ \"week\": 1, \"tasks\": [{{\"title\": \"...\"}}] }}] }}] }}"
    )

    response = openai.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": "Output valid JSON only. No explanations."},
            {"role": "user", "content": roadmap_prompt}
        ]
    )
    raw_json = response.choices[0].message.content.strip()
    try:
        return json.loads(raw_json)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON format returned from model."}


### Step 2: YouTube Searcher ###
@tool
def search_videos(task: str, max_results: int = 3) -> list:
    """Search YouTube for videos related to a learning task."""
    print("Searching videos for:", task)
    query = f"{task} course -shorts"
    search_url = "https://www.googleapis.com/youtube/v3/search"
    details_url = "https://www.googleapis.com/youtube/v3/videos"

    # Step 1: Search YouTube
    search_params = {
        "key": YOUTUBE_API_KEY,
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results
    }
    search_res = requests.get(search_url, params=search_params).json()
    video_ids = [item["id"]["videoId"] for item in search_res.get("items", [])]

    if not video_ids:
        return []

    # Step 2: Fetch details
    details_params = {
        "key": YOUTUBE_API_KEY,
        "part": "snippet,contentDetails,statistics",
        "id": ",".join(video_ids)
    }
    details_res = requests.get(details_url, params=details_params).json()
    result = []

    for item in details_res["items"]:
        result.append({
            "title": item["snippet"]["title"],
            "channel": item["snippet"]["channelTitle"],
            "duration": item["contentDetails"]["duration"],
            "views": item["statistics"].get("viewCount", "0"),
            "url": f"https://www.youtube.com/watch?v={item['id']}",
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"]
        })

    return result


### Step 3: Assemble Weekly Tasks ###
@tool
def assemble_video_tasks(roadmap: dict) -> dict:
    """Attach relevant YouTube videos to each task in the roadmap."""
    print("Assembling weekly tasks...")
    enriched = roadmap.copy()
    for month in enriched["roadmap"]:
        for week in month["weeks"]:
            for task in week["tasks"]:
                query = task["title"]
                task["videos"] = search_videos(query)
    return enriched


### Step 4: Optional Chat Follow-up ###
@tool
def respond_to_chat(message: str) -> str:
    """Generate a helpful and professional AI response to the user's message."""
    response = openai.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content":  "You are Navi, a highly intelligent, friendly, and professional AI career assistant. "
            "Your job is to help users gain clarity on their goals, guide them through building a solid career strategy, "
            "and break large ambitions into actionable, step-by-step plans. "
            "Always respond in a concise, warm and conversational tone while staying professional and helpful. "
            "Ask thoughtful and engaging questions that help users reflect on what they truly want. "
            "When asking more than one question, present each of them in a clear list format (bullets or numbered) so they’re easy to answer. "
            "Never reintroduce yourself unless asked. Be encouraging, and give useful guidance with practical next steps."},
            {"role": "user", "content": message}
        ]
    )
    return response.choices[0].message.content.strip()


### Step 5: LangGraph Setup ###
def build_graph():
    graph = StateGraph()

    graph.add_node("input_goal", lambda state: {"goal": state["goal"]})
    graph.add_node("generate_roadmap", lambda state: {"roadmap": generate_roadmap_tool(state["goal"])})
    graph.add_node("enrich_with_videos", lambda state: {"enriched": assemble_video_tasks(state["roadmap"])})
    graph.add_node("chat", lambda state: {"chat_response": respond_to_chat(state["user_input"])})
    graph.add_node("output_summary", lambda state: {
        "summary": state.get("enriched") or state.get("roadmap") or state.get("chat_response")
    })

    # Chain the logic
    graph.set_entry_point("input_goal")
    graph.add_edge("input_goal", "generate_roadmap")
    graph.add_edge("generate_roadmap", "enrich_with_videos")
    graph.add_edge("enrich_with_videos", "output_summary")

    graph.set_finish_point("output_summary")
    return graph.compile()


### Example Usage ###
# backend/agent_orchestra.py
# … your LangGraph code …
def run_full_pipeline(goal: str) -> dict:
    flow = build_graph()
    return flow.invoke({"goal": goal})["summary"]
