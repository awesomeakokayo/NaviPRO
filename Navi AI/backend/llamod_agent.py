import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LLAMA_MODEL = "mixtral-8x7b-32768"  # Or use "mistral-7b-8k"

def chat_with_llama(message, history=[]):
    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": LLAMA_MODEL,
        "messages": [{"role": "system", "content": "You are a helpful and intelligent assistant."}] + history + [{"role": "user", "content": message}],
        "temperature": 0.7,
        "top_p": 0.9,
        "max_tokens": 512,
        "stream": False
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        return f"Error: {response.status_code} - {response.text}"
