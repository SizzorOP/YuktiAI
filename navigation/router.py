from typing import Dict, Any
import json
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

class RoutingError(Exception):
    pass

def map_intent_to_tool(user_query: str, history: list[dict] = None) -> Dict[str, Any]:
    """
    Layer 2 Navigation Router: Maps a raw user query from WhatsApp or Web to the correct tool.
    Uses OpenAI to classify intent and extract required arguments reliably.
    
    Args:
        user_query (str): The raw text from the user.
        history (list[dict], optional): The previous messages in the session for routing context.
        
    Returns:
        Dict: Contains 'target_tool' and 'extracted_kwargs'.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RoutingError("OPENAI_API_KEY is missing for Navigation Router.")

    client = OpenAI(api_key=api_key)

    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "intent_routing",
            "schema": {
                "type": "object",
                "properties": {
                    "target_tool": {
                        "type": "string",
                        "enum": [
                            "legal_search", 
                            "web_search", 
                            "adversarial_engine", 
                            "procedural_navigator",
                            "document_processor",
                            "general_chat",
                            "drafting_agent",
                            "unknown"
                        ],
                        "description": "The specific tool this query should be routed to."
                    },
                    "extracted_kwargs": {
                        "type": "object",
                        "description": "Key-value pairs extracted from the query needed by the target tool.",
                        "properties": {
                            "query": {"type": ["string", "null"]},
                            "case_stage": {"type": ["string", "null"]},
                            "law_code": {"type": ["string", "null"]},
                            "draft_type": {"type": ["string", "null"]}
                        },
                        "required": ["query", "case_stage", "law_code", "draft_type"],
                        "additionalProperties": False
                    },
                    "reasoning": {
                        "type": "string",
                        "description": "Brief explanation of why this route was chosen."
                    }
                },
                "required": ["target_tool", "extracted_kwargs", "reasoning"],
                "additionalProperties": False
            },
            "strict": True
        }
    }

    system_prompt = """
    You are the central Navigation Router for YuktiAI (an Indian Legal Assistant).
    Your job is to strictly classify the user's intent into one of the available tools 
    and extract the minimum necessary parameters.
    
    ROUTING RULES (follow this decision tree strictly):

    1. 'legal_search': ONLY when the user wants to FIND or SEARCH for specific case laws, 
       judgments, or court orders from Indian Kanoon database. 
       The 'query' MUST be a CONCISE boolean keyword string using only core legal concepts:
       sections, acts, and legal issues. Example: Section 438 CrPC anticipatory bail economic offence.
       NEVER include conversational words like find, explain, what is, judgments, views, recent.

    2. 'general_chat': For ALL of these:
       - Explaining a legal concept or section (e.g., "Explain Section 482 CrPC")
       - Answering questions about limitation periods, legal rights, remedies
       - Client-facing or simple-language explanations
       - Questions about whether a section/case exists (hallucination detection)
       - Tactical legal advice (e.g., "My client missed the appeal deadline, what remedy?")
       - Interpreting or comparing legal principles
       - Questions about fake or non-existent sections/cases
       - Any question that needs an EXPLANATION rather than a database search
       Set 'query' to the full original user question.

    3. 'adversarial_engine': When the user provides a DOCUMENT, DRAFT, or DETAILED CASE FACTS 
       and asks to stress-test, review, find weaknesses, generate opposing arguments, or 
       identify procedural risks. Also use for criminal defense simulations.
       Set 'query' to the full text/facts provided.

    4. 'procedural_navigator': When asking about specific procedural TIMELINES, NEXT STEPS, 
       or LIMITATION PERIODS tied to a specific stage in litigation. 
       Extract 'case_stage' and 'law_code'.

    5. 'web_search': ONLY for queries about recent legal NEWS, amendments, or developments 
       that would not be on Indian Kanoon. Set 'query' to a search-engine-friendly string.

    6. 'document_processor': When the user provides raw legal document TEXT and asks for 
       summarization, translation, timeline extraction, or bullet-point extraction.
       Set 'query' to the document text.

    7. 'drafting_agent': When the user asks to write, draft, generate, or create a legal 
       document, agreement, notice, petition, or complaint. 
       Extract 'draft_type' if clearly specified (e.g., 'civil complaint', 'NDA', 'legal notice').
       Set 'query' to the full user instructions.

    8. 'unknown': ONLY if the query is completely unrelated to law (e.g., weather, sports).
    
    IMPORTANT: When in doubt between legal_search and general_chat, prefer general_chat.
    legal_search is ONLY for finding specific cases in the Kanoon database.
    """

    messages = [{"role": "system", "content": system_prompt}]
    
    # Send up to the last 2 interactions to give the router context without overloading it
    if history:
        context_str = "Recent Context:\n"
        for msg in history[-4:]:
            role = msg.get("role")
            content = msg.get("content")
            if role in ["user", "assistant"] and content:
                 # Truncate very long LLM responses to save tokens, we just need the gist
                 short_content = content[:300] + "..." if len(content) > 300 else content
                 context_str += f"{role.upper()}: {short_content}\n"
        
        messages.append({"role": "user", "content": context_str})

    messages.append({"role": "user", "content": f"New query to route: '{user_query}'"})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            temperature=0.0,
            messages=messages,
            response_format=response_format
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        raise RoutingError(f"Router LLM execution failed: {str(e)}")

if __name__ == "__main__":
    test_queries = [
        "Find me judgments on Section 138 NI Act with compounding",
        "What is the limitation limit for filing a written statement in a commercial suit under CPC?",
        "Fetch the latest news on Bharatiya Nyaya Sanhita amendments",
        "Explain Section 482 CrPC in simple language for a client.",
        "Explain Section 999 IPC.",
    ]
    
    print("Testing Router Logic...")
    for q in test_queries:
        print(f"\nQuery: {q}")
        try:
            res = map_intent_to_tool(q)
            print(json.dumps(res, indent=2))
        except Exception as e:
            print(f"Error: {e}")
