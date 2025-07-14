#  backend/career.py
import openai, traceback, json
from dotenv import load_dotenv
import os

load_dotenv()
openai.api_key  = os.getenv("GROQ_API_KEY")
openai.api_base = os.getenv("GROQ_BASE_URL")  # correct property

# DEBUG — confirm what the client thinks your base is:
print("🔧 Using OpenAI API base:", openai.api_base)

# Step 1: Generate raw roadmap JSON string via LLM
SYSTEM_PROMPT = (
    "You are Navi, an expert career strategist. "
    "Output ONLY valid JSON with the following schema: "
    "{ \"roadmap\": { \"Month 1\": { \"week1\": { \"tasks\": [ ... ] }, ... }, ... } }"
)

def generate_roadmap(inputs: dict) -> str:
    # Build prompt including onboarding inputs
    prompt = (
        "Background: " + (inputs.get('background') or "N/A") + "\n"
        "Skills: " + (inputs.get('skills') or "N/A") + "\n"
        "Primary Goal: " + inputs.get('goal', "") + "\n"
        "Motivation: " + (inputs.get('motivation') or "N/A") + "\n"
        "Time per week: " + (inputs.get('hours_per_week') or "N/A") + "\n"
        "Preferred time: " + (inputs.get('preferred_time') or "N/A") + "\n"
        "Deadline: " + (inputs.get('deadline') or "N/A") + "\n"
        "Learning style: " + (inputs.get('learning_style') or "N/A") + "\n"
        "Tools: " + (inputs.get('tools') or "N/A") + "\n"
        "Check‑ins: " + (inputs.get('checkins') or "N/A") + "\n"
        "Support: " + (inputs.get('support') or "N/A") + "\n"
        "Obstacles: " + (inputs.get('obstacles') or "N/A") + "\n"
        "Constraints: " + (inputs.get('constraints') or "N/A") + "\n"
    )
    try:
        resp = openai.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        traceback.print_exc()
        return "{\"roadmap\": {}}"

# Step 2: Normalize raw structure to front-end schema

def normalize_roadmap(raw_data):
    transformed = []
    for i, (month_name, weeks_data) in enumerate(raw_data.items(), 1):
        month_block = {"month": i, "title": month_name, "weeks": []}
        for week_key, week_content in weeks_data.items():
            # extract week number from key, e.g. 'week1' -> 1
            num = ''.join(filter(str.isdigit, week_key)) or str(len(month_block['weeks'])+1)
            week_block = {"week": int(num), "tasks": []}
            for task_text in week_content.get('tasks', []):
                week_block['tasks'].append({"title": task_text, "videos": []})
            month_block['weeks'].append(week_block)
        transformed.append(month_block)
    return transformed

# Combined function used by main.py

def get_structured_roadmap(inputs: dict) -> dict:
    raw_str = generate_roadmap(inputs)
    # log raw output
    print("🛠️ Raw model output:", raw_str)
    try:
        raw_json = json.loads(raw_str)
        roadmap_raw = raw_json.get('roadmap', {})
        structured = normalize_roadmap(roadmap_raw)
        return {
            "goal": inputs.get('goal', ''),
            "timeframe": f"{len(structured)} months",
            "roadmap": structured
        }
    except json.JSONDecodeError as e:
        print("❌ JSON decode failed:", e)
        return {"goal": inputs.get('goal', ''), "timeframe": "", "roadmap": []}

# Chat helper

def chat_with_navi(message: str) -> str:
    try:
        response = openai.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You're Navi, an AI career guide."},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Chat error:", e)
        return "Sorry, something went wrong."
