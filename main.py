import os
from dotenv import load_dotenv

# Load all environment variables at the very beginning of the application lifecycle
load_dotenv(override=True)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
import uvicorn
import traceback
from fastapi.responses import JSONResponse

# Import router and tools
from navigation.router import map_intent_to_tool
from tools.legal_search import legal_search
from tools.web_search import web_search
from tools.adversarial_engine import analyze_draft
from tools.procedural_navigator import get_procedural_timeline
from tools.document_processor import process_legal_document
from tools.general_chat import general_chat
from tools.drafting_agent import generate_draft

# Import new routers and database
from database import engine
from models import Base
from routers.cases import router as cases_router
from routers.documents import router as documents_router
from routers.calendar import router as calendar_router
from routers.contracts import router as contracts_router
from routers.notifications import router as notifications_router

app = FastAPI(title="YuktiAI API", description="Backend for the Lawbot Assistant")

# Added Custom Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        if "server" in response.headers:
            del response.headers["server"]
        return response

app.add_middleware(SecurityHeadersMiddleware)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_details = traceback.format_exc()
    print("GLOBAL EXCEPTION:", error_details)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error_message": str(exc), "traceback": error_details}
    )

# Allow all frontend origins to prevent CORS errors across Vercel/Netlify/Local testing
allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Register new API routers
app.include_router(cases_router)
app.include_router(documents_router)
app.include_router(calendar_router)
app.include_router(contracts_router)
app.include_router(notifications_router)


@app.on_event("startup")
def on_startup():
    """Create all database tables on server startup."""
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Failed to create database tables (this is normal if using an external DB without the correct IP configuration): {e}")


class QueryRequest(BaseModel):
    query: str
    document_type: str = None  # Optional context for adversarial engine
    jurisdiction: str = None   # Optional context for adversarial engine

@app.get("/")
def read_root():
    return {"status": "online", "message": "YuktiAI API is running."}

@app.post("/api/query")
def process_query(request: QueryRequest):
    """
    Main endpoint to process a natural language query.
    Routes the query to the appropriate tool using the Navigation Router.
    """
    raw_query = request.query
    if not raw_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        # Step 1: Map Intent
        route_info = map_intent_to_tool(raw_query)
        target_tool = route_info.get("target_tool")
        kwargs = route_info.get("extracted_kwargs", {})
        reasoning = route_info.get("reasoning", "")
        
        print(f"DEBUG: Route={target_tool} | Reasoning={reasoning}")

        # Step 2: Execute Corresponding Tool
        if target_tool == "legal_search":
            search_term = kwargs.get("query", raw_query)
            print(f"DEBUG: Kanoon Search Term -> {search_term}")
            result = legal_search(search_term)
            return {"route": "legal_search", "search_term_used": search_term, "result": result}
            
        elif target_tool == "general_chat":
            result = general_chat(raw_query)
            return {"route": "general_chat", "result": result}
            
        elif target_tool == "web_search":
            search_term = kwargs.get("query", raw_query)
            result = web_search(search_term)
            return {"route": "web_search", "result": result}
            
        elif target_tool == "adversarial_engine":
            draft_text = kwargs.get("query", raw_query)
            doc_type = request.document_type or "Legal Document"
            jurisdiction = request.jurisdiction or "Indian Court"
            result = analyze_draft(draft_text, doc_type, jurisdiction)
            return {"route": "adversarial_engine", "result": result}
            
        elif target_tool == "procedural_navigator":
            stage = kwargs.get("case_stage")
            code = kwargs.get("law_code")
            if not stage or not code:
                 return {"route": "procedural_navigator", "error": "Could not extract case stage or law code from the query. Please be more specific."}
            result = get_procedural_timeline(stage, code)
            return {"route": "procedural_navigator", "result": result}
            
        elif target_tool == "document_processor":
            document_text = kwargs.get("query", raw_query)
            doc_type = request.document_type or "legal_document"
            result = process_legal_document(document_text, doc_type)
            return {"route": "document_processor", "result": result}
            
        elif target_tool == "drafting_agent":
            draft_prompt = kwargs.get("query", raw_query)
            result = generate_draft(draft_prompt)
            return {"route": "drafting_agent", "result": result}
            
        elif target_tool == "unknown":
            return {"route": "unknown", "message": "I am YuktiAI, an AI Legal Assistant. This query seems outside my scope. I can help with Indian legal research, case law search, procedural timelines, document analysis, and legal explanations."}
            
        else:
            raise HTTPException(status_code=500, detail=f"Unrecognized routing logic target: {target_tool}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while processing the request: {str(e)}")

if __name__ == "__main__":
    print("Starting YuktiAI API Server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

