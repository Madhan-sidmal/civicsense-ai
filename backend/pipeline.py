import os
import json
from google import genai
from typing import Dict, Any

# Configure Gemini with API key from environment
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = None
if api_key:
    client = genai.Client(api_key=api_key)

def run_gemini_pipeline(image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    """
    Uses Google Gemini Vision to analyze a civic issue image and categorize it.
    """
    if not client:
        print("WARNING: GEMINI_API_KEY is not set. Using fallback mock.")
        return get_fallback_mock()

    try:
        model_name = 'gemini-2.5-flash'
        
        prompt = """
        You are a civic issue analysis AI. You examine images of urban problems (potholes, garbage, broken streetlights, etc.).
        Analyze the provided image and output a raw JSON object (with no markdown wrappers) matching this schema exactly:
        {
          "labels": ["list", "of", "detected", "objects", "or", "issues"],
          "severity": "HIGH", "MEDIUM", or "LOW" based on public risk in uppercase,
          "priority": "CRITICAL" or "NORMAL" in uppercase,
          "authority": "The specific municipal department that should handle this (e.g. Public Works Dept, Waste Management Dept)",
          "explanation": "A 1-2 sentence contextual explanation of the issue and why the severity was chosen."
        }
        
        CRITICAL RULE: If the image does not depict any civic issue (e.g., it is a selfie, a meme, a random animal, or completely irrelevant), you MUST set severity to "LOW", priority to "NORMAL", authority to "None (Invalid Report)", and explicitly state in the explanation that no actionable civic issue was detected.
        """

        response = client.models.generate_content(
            model=model_name,
            contents=[
                genai.types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ]
        )
        
        # Parse the JSON from the text
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        result_dict = json.loads(response_text)
        return result_dict

    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return get_fallback_mock()

def get_fallback_mock():
    return {
        "labels": ["civic issue", "error fallback"],
        "severity": "MEDIUM",
        "priority": "NORMAL",
        "authority": "General Municipality",
        "explanation": "Error analyzing image. This is a fallback due to an API issue."
    }
