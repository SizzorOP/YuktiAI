import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def generate_draft(prompt: str, history: list[dict] = None) -> dict:
    """
    Analyzes a user prompt to determine if they are requesting a specific legal draft.
    If the draft type is unclear, prompts the user to specify one.
    If clear, generates a structured legal draft or template.
    Optionally considers conversation history for iterative refinement.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"error": "OPENAI_API_KEY is missing."}

    client = OpenAI(api_key=api_key)

    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "drafting_response",
            "schema": {
                "type": "object",
                "properties": {
                    "is_draft_type_clear": {
                        "type": "boolean",
                        "description": "True if the user clearly specified the type of legal document to draft (e.g. complaint, bail application, legal notice)."
                    },
                    "detected_draft_type": {
                        "type": ["string", "null"],
                        "description": "The specific type of draft detected, if clear."
                    },
                    "response_message": {
                        "type": "string",
                        "description": "A message to the user. If the draft type is unclear, ask them to specify. If clear, introduce the generated template."
                    },
                    "generated_template": {
                        "type": ["string", "null"],
                        "description": "The generated legal draft or template with placeholders [LIKE THIS] for missing information. Null if draft type is unclear."
                    }
                },
                "required": ["is_draft_type_clear", "detected_draft_type", "response_message", "generated_template"],
                "additionalProperties": False
            },
            "strict": True
        }
    }

    system_prompt = """
    You are an expert Indian Legal Drafting Assistant for YuktiAI.
    Your task is to help the user draft legal documents, agreements, and notices.

    RULES:
    1. First check if the user has clearly specified the TYPE of legal draft they need 
       (e.g., "Draft a bail petition", "Write a 138 NI Act legal notice", "Create an NDA", "Draft a civil complaint").
    2. If the draft type is UNCLEAR or NOT SPECIFIED (e.g., "Draft something for me", "I need a legal document"):
       - Set 'is_draft_type_clear' to false.
       - Set 'detected_draft_type' to null.
       - In 'response_message', politely explain that without a clear mention of the desired draft (e.g., complaint, legal notice, plea agreement), the system cannot generate a meaningful template. Ask them to specify.
       - Set 'generated_template' to null.
    3. If the draft type IS CLEAR:
       - Set 'is_draft_type_clear' to true.
       - Set 'detected_draft_type' to the type of document requested.
       - Generate the appropriate legal draft/template based strictly on Indian Legal formats and jurisdiction.
       - Use placeholders like brackets [CLIENT NAME], [COURT NAME], [DATE] wherever factual details are missing.
       - Return the comprehensive template in 'generated_template' using Markdown format. Ensure proper formal legal structuring.
       - Set 'response_message' briefly introducing the draft and offering to fill in the placeholders if they provide details.
    """

    messages = [{"role": "system", "content": system_prompt}]

    if history:
        for msg in history:
            role = msg.get("role")
            content = msg.get("content")
            if role in ["user", "assistant"] and content:
                 messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": prompt})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            temperature=0.2, # Low temperature for reliable legal formats
            messages=messages,
            response_format=response_format
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        return {"error": f"Drafting LLM execution failed: {str(e)}"}

if __name__ == "__main__":
    # Test cases
    print(json.dumps(generate_draft("I need a draft."), indent=2))
    print(json.dumps(generate_draft("Draft a legal notice for section 138 cheque bounce."), indent=2))
