# backend.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import openai
import traceback
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
CORS(app)

# Set GROQ API config
openai.api_key = os.getenv("GROQ_API_KEY")
openai.base_url = "https://api.groq.com/openai/v1/"

if not openai.api_key:
    raise ValueError("GROQ_API_KEY environment variable not set.")

SYSTEM_PROMPT = (
    "You are Navi, a highly intelligent AI career assistant. You help users plan their careers, "
    "break large goals into step-by-step tasks, and give actionable advice. "
    "Always reply professionally and clearly. Your role is to guide users in building career strategies, "
    "setting long-term and short-term goals, and giving daily/weekly/monthly plans to reach them."
)

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"reply": "Please enter a message."}), 400

        response = openai.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
        )

        reply = response.choices[0].message.content
        return jsonify({"reply": reply})

    except Exception as e:
        traceback.print_exc()  # ✅ Add this to show full error log
        print("GROQ API error:", e)
        return jsonify({"reply": "Sorry, something went wrong with the AI response."}), 500
    

if __name__ == "__main__":
    app.run(debug=True)
