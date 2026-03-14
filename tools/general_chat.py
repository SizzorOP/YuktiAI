import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

class ChatError(Exception):
    """Raised when the General Chat LLM fails."""
    pass

def general_chat(query: str, history: list[dict] = None) -> dict:
    """
    Conversational legal Q&A powered by GPT-4o.
    Handles explanations, interpretations, tactical advice, hallucination traps,
    and client-facing language. Follows strict Cite-or-Abstain rules.
    
    Args:
        query (str): The user's natural language legal question.
        history (list[dict], optional): Previous chat messages for context.
        
    Returns:
        dict: A structured response with 'answer', 'citations', 'confidence', and 'abstentions'.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ChatError("OPENAI_API_KEY is missing for General Chat.")

    client = OpenAI(api_key=api_key)

    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "legal_chat_response",
            "schema": {
                "type": "object",
                "properties": {
                    "answer": {
                        "type": "string",
                        "description": "The main conversational answer to the user's legal question. Use markdown formatting for clarity."
                    },
                    "citations": {
                        "type": "array",
                        "description": "List of statutory sections, acts, or well-known Supreme Court cases cited in the answer. Only include citations you are CERTAIN about.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "reference": {
                                    "type": "string",
                                    "description": "The statute section or case name (e.g., 'Section 482 CrPC', 'Arnesh Kumar v. State of Bihar (2014)')."
                                },
                                "relevance": {
                                    "type": "string",
                                    "description": "Why this citation is relevant to the answer."
                                }
                            },
                            "required": ["reference", "relevance"],
                            "additionalProperties": False
                        }
                    },
                    "confidence": {
                        "type": "string",
                        "enum": ["High", "Medium", "Low", "Abstain"],
                        "description": "Confidence level in the accuracy of the answer."
                    },
                    "abstentions": {
                        "type": "array",
                        "description": "Topics or specifics the LLM is uncertain about and chose not to state as fact.",
                        "items": {"type": "string"}
                    }
                },
                "required": ["answer", "citations", "confidence", "abstentions"],
                "additionalProperties": False
            },
            "strict": True
        }
    }

    system_prompt = """
    You are YuktiAI, a Senior Legal Research Assistant specializing in Indian Law.
    You answer legal questions conversationally with precision and clarity.
    
    STRICT RULES:
    1. CITE-OR-ABSTAIN: Every legal claim you make MUST be backed by a specific 
       statute section (e.g., Section 438 CrPC) or a well-known Supreme Court/High Court case.
       If you cannot cite authority, add the topic to 'abstentions' and say so honestly.
    
    2. HALLUCINATION DETECTION: If the user asks about a section, case, or law that 
       DOES NOT EXIST (e.g., "Section 999 IPC", fake case names), you MUST:
       - State clearly that the section/case does not exist
       - Set confidence to "High" (you are confident it doesn't exist)
       - Do NOT fabricate any content about non-existent laws
    
    3. CLIENT-FACING MODE: When the user asks for a "simple language" or "client-facing" 
       explanation, use plain English without legal jargon. Explain as if talking to a 
       non-lawyer client.
    
    4. TACTICAL ADVICE: When the user describes a legal situation and asks for remedies 
       or strategy, provide concrete procedural steps with statutory references.
    
    5. NEVER suggest evidence tampering, evasion, or illegal behavior.
    
    6. Format your 'answer' field using markdown: use **bold** for key terms, 
       bullet points for lists, and headers (##) for sections when the answer is long.
    """

    messages = [{"role": "system", "content": system_prompt}]
    
    if history:
        for msg in history:
            role = msg.get("role")
            content = msg.get("content")
            if role in ["user", "assistant"] and content:
                 messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": query})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            temperature=0.1,
            messages=messages,
            response_format=response_format
        )
        
        return json.loads(response.choices[0].message.content)

    except Exception as e:
        raise ChatError(f"General Chat LLM failed: {str(e)}")


if __name__ == "__main__":
    test_queries = [
        "Explain Section 482 CrPC in simple language for a client.",
        "Explain Section 999 IPC.",
        "What is the limitation period for filing a civil suit for recovery of money?"
    ]
    
    for q in test_queries:
        print(f"\nQuery: {q}")
        try:
            res = general_chat(q)
            print(json.dumps(res, indent=2, ensure_ascii=False)[:500])
        except Exception as e:
            print(f"Error: {e}")
