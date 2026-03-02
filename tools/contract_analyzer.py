import os
import json
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

class ContractAnalyzerError(Exception):
    """Raised when the Contract Analyzer fails."""
    pass

def extract_and_score_clauses(contract_text: str) -> dict:
    """
    Extracts clauses from a bespoke contract and assigns an absolute risk score
    based on standard legal principles.
    
    Args:
        contract_text (str): The raw text of the contract.
        
    Returns:
        dict: A structured JSON containing the list of clauses with risk scores.
    """
    if not contract_text or not contract_text.strip():
        return {
            "clauses": []
        }

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ContractAnalyzerError("OPENAI_API_KEY is missing for Contract Analyzer.")

    client = OpenAI(api_key=api_key)

    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "contract_analysis",
            "schema": {
                "type": "object",
                "properties": {
                    "clauses": {
                        "type": "array",
                        "description": "List of extracted clauses from the contract.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "clause_title": {
                                    "type": "string",
                                    "description": "Short, descriptive title for the clause (e.g., 'Indemnification', 'Term and Termination')."
                                },
                                "original_text": {
                                    "type": "string",
                                    "description": "The exact original text of the clause extracted from the document."
                                },
                                "risk_score": {
                                    "type": "integer",
                                    "description": "Absolute legal risk score from 1 (very low risk) to 10 (extremely high risk) based on standard legal principles."
                                },
                                "risk_reasoning": {
                                    "type": "string",
                                    "description": "Explanation of why this risk score was assigned. What makes this clause risky or safe?"
                                }
                            },
                            "required": ["clause_title", "original_text", "risk_score", "risk_reasoning"],
                            "additionalProperties": False
                        }
                    }
                },
                "required": ["clauses"],
                "additionalProperties": False
            },
            "strict": True
        }
    }

    system_prompt = """
    You are an expert Corporate Lawyer and Contract Analyst.
    Your task is to analyze the provided contract text, extract distinct material clauses, and assign each an ABSOLUTE risk score from 1 to 10.
    
    Risk scoring guidelines:
    - 1-3: Low risk, standard boilerplate, balanced terms.
    - 4-7: Medium risk, slightly one-sided or requires attention.
    - 8-10: High risk, unlimited liability, highly punitive terms, non-standard aggressive clauses.
    
    For each extracted clause, provide its exact original text, a descriptive title, the risk score, and a clear reasoning for the assigned score.
    Do not hallucinate clauses that are not present in the text.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            temperature=0.0,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Contract Text to Analyze:\n\n{contract_text}"}
            ],
            response_format=response_format
        )
        
        raw_output = response.choices[0].message.content
        return json.loads(raw_output)
        
    except Exception as e:
        raise ContractAnalyzerError(f"LLM processing failed: {str(e)}")


def generate_alternative_clause(clause_text: str, stance: str) -> dict:
    """
    Generates alternative wording for a specific contract clause based on a given stance.
    
    Args:
        clause_text (str): The original text of the clause to rewrite.
        stance (str): The desired stance (e.g., 'Aggressive/Pro-Client', 'Neutral/Balanced', 'Standard').
        
    Returns:
        dict: A structured JSON containing the alternative text and key changes.
    """
    if not clause_text or not clause_text.strip():
        return {
            "alternative_text": "",
            "stance_used": stance,
            "key_changes": []
        }

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ContractAnalyzerError("OPENAI_API_KEY is missing for Contract Analyzer.")

    client = OpenAI(api_key=api_key)

    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "alternative_clause_generation",
            "schema": {
                "type": "object",
                "properties": {
                    "alternative_text": {
                        "type": "string",
                        "description": "The rewritten clause reflecting the requested stance."
                    },
                    "stance_used": {
                        "type": "string",
                        "description": "The stance that was applied to the rewrite."
                    },
                    "key_changes": {
                        "type": "array",
                        "description": "List of key modifications made to the original text.",
                        "items": {"type": "string"}
                    }
                },
                "required": ["alternative_text", "stance_used", "key_changes"],
                "additionalProperties": False
            },
            "strict": True
        }
    }

    system_prompt = f"""
    You are an expert Corporate Lawyer drafting contract clauses.
    Your task is to rewrite the provided contract clause to reflect a '{stance}' stance.
    
    Stance definitions:
    - Aggressive/Pro-Client: Highly favorable to your client, shifting risk to the other party, adding protections/caps for your client.
    - Neutral/Balanced: Fair to both parties, mutual obligations, standard industry middle-ground.
    - Standard: Baseline standard legal boilerplate without specific aggressive edge cases.
    
    Provide the rewritten alternative text and list the key changes you made.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            temperature=0.2, # slight creativity for drafting
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Original Clause Text:\n\n{clause_text}"}
            ],
            response_format=response_format
        )
        
        raw_output = response.choices[0].message.content
        return json.loads(raw_output)
        
    except Exception as e:
        raise ContractAnalyzerError(f"LLM processing failed: {str(e)}")

# Quick test
if __name__ == "__main__":
    test_contract = """
    LIMITATION OF LIABILITY
    In no event shall the Service Provider be liable for any indirect, incidental, special, or consequential damages. The Service Provider's total liability under this agreement shall not exceed the total fees paid by the Client in the one month preceding the claim.
    
    INDEMNIFICATION
    The Client agrees to indemnify, defend, and hold harmless the Service Provider from any and all claims, losses, damages, or expenses arising from the Client's use of the services, regardless of any negligence on the part of the Service Provider.
    """
    
    print("Extracting and scoring...")
    res = extract_and_score_clauses(test_contract)
    print(json.dumps(res, indent=2))
    
    if res.get("clauses"):
        first_clause = res["clauses"][0]["original_text"]
        print("\n\nGenerating alternative...")
        alt = generate_alternative_clause(first_clause, "Neutral/Balanced")
        print(json.dumps(alt, indent=2))
