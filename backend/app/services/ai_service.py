import os
import json
import re

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def analyze_with_ai(language: str, code: str):
    prompt = f"""
You are an expert software engineer.

Analyze the following {language} code.

IMPORTANT:
Return ONLY a valid JSON object.
Do not add explanations.
Do not wrap the JSON inside markdown.

Return exactly in this format:

{{
    "summary": "...",
    "bugs": ["..."],
    "suggestions": ["..."],
    "complexity": "...",
    "tests": ["..."]
}}

Code:

{code}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content

    print("\n========== AI RESPONSE ==========")
    print(content)
    print("=================================\n")

    try:
        # Remove markdown code fences if present
        cleaned = re.sub(r"```json|```", "", content).strip()

        # Extract JSON object
        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start != -1 and end != -1:
            cleaned = cleaned[start:end + 1]

        return json.loads(cleaned)

    except Exception as e:
        print("\nJSON Parsing Error:", e)
        print("Raw AI Response:")
        print(content)

        return {
            "summary": "AI returned an unexpected response.",
            "bugs": [],
            "suggestions": [
                "Unable to parse the AI response."
            ],
            "complexity": "Unknown",
            "tests": []
        }