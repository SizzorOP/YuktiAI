import json
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
import PyPDF2
from io import BytesIO

from database import get_db
from models import ContractAnalysis
from tools.contract_analyzer import extract_and_score_clauses, generate_alternative_clause
from tools.legal_search import legal_search

router = APIRouter(
    prefix="/api/contracts",
    tags=["contracts"],
)

class ContractAnalyzeRequest(BaseModel):
    document_text: str
    case_id: str = None
    title: str = None

class ClauseRewriteRequest(BaseModel):
    clause_text: str
    stance: str  # "Aggressive/Pro-Client", "Neutral/Balanced", "Standard"

class ClausePrecedentRequest(BaseModel):
    clause_text: str

@router.post("/upload")
async def upload_contract_pdf(file: UploadFile = File(...)):
    """Upload a PDF contract and extract its text."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(BytesIO(contents))
        
        extracted_text = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
                
        full_text = "\n".join(extracted_text)
        
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF. It might be scanned or image-based.")
            
        return {"text": full_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@router.post("/analyze")
def analyze_contract(req: ContractAnalyzeRequest, db: Session = Depends(get_db)):
    """Extract and score clauses from a contract."""
    if not req.document_text.strip():
        raise HTTPException(status_code=400, detail="Document text is empty.")
        
    try:
        # Save placeholder record to DB
        analysis_record = ContractAnalysis(
            case_id=req.case_id,
            title=req.title or "Untitled Contract",
            original_text=req.document_text,
            status="processing"
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)
        
        # Analyze using LLM
        result = extract_and_score_clauses(req.document_text)
        
        # Update record
        analysis_record.status = "completed"
        analysis_record.clauses = json.dumps(result.get("clauses", []))
        db.commit()
        
        return {
            "analysis_id": analysis_record.id,
            "status": "completed",
            "clauses": result.get("clauses", [])
        }
    except Exception as e:
        if 'analysis_record' in locals():
            try:
                analysis_record.status = "failed"
                db.commit()
            except Exception:
                db.rollback()
        raise HTTPException(status_code=500, detail=f"Analysis Error: {str(e)}")


@router.post("/rewrite")
def rewrite_clause(req: ClauseRewriteRequest):
    """Generate an alternative version of a specific clause based on stance."""
    if not req.clause_text.strip():
         raise HTTPException(status_code=400, detail="Clause text is empty.")
         
    try:
        result = generate_alternative_clause(req.clause_text, req.stance)
        return result
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Rewrite failed: {str(e)}")


@router.post("/precedents")
def find_precedents(req: ClausePrecedentRequest):
    """
    Search Indian Kanoon for litigation precedents related to this clause.
    We just use the legal_search tool with a tailored search term.
    """
    if not req.clause_text.strip():
        raise HTTPException(status_code=400, detail="Clause text is empty.")
        
    try:
        # Instead of feeding the whole clause which might break Kanoon,
        # we can use the LLM to extract the core legal concepts first?
        # Actually standard Kanoon search might be fine if the user is 
        # specifically requesting precedents for this text, but let's pass it directly
        # and rely on the legal_search's internal term extractor.
        
        # legal_search internally extracts boolean terms from the raw query
        search_prompt = f"Find precedents for this contract clause: {req.clause_text}"
        result = legal_search(search_prompt)
        return {"precedents": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Precedent search failed: {str(e)}")
