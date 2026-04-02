import io
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import PyPDF2
from pydantic import BaseModel
import re

from sentence_transformers import SentenceTransformer, util
from sklearn.feature_extraction.text import CountVectorizer

app = FastAPI(title="Offline Resume Shortlisting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoreBreakup(BaseModel):
    semantic_score: float
    keyword_score: float

class EvaluationResult(BaseModel):
    candidate_name: str
    filename: str
    final_score: int
    score_breakup: ScoreBreakup
    reasoning: str

print("Loading local NLP Model... This may take a moment.")
try:
    model = SentenceTransformer('all-MiniLM-L6-v2') 
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text
    except Exception as e:
        print(f"PDF Parse Error: {e}")
        return ""

def extract_keywords(text: str, top_n=15) -> List[str]:
    try:
        vectorizer = CountVectorizer(stop_words='english', ngram_range=(1, 1), max_features=top_n)
        vectorizer.fit([text])
        return vectorizer.get_feature_names_out().tolist()
    except:
        return []

def guess_name(text: str, filename: str) -> str:
    # Heuristically guess the candidate's name based on the first text line of the document
    lines = text.strip().split('\n')
    for line in lines:
        cleaned = line.strip()
        # Look for a decent length alphanumeric line at the top
        if 2 < len(cleaned) < 40 and re.match(r"^[A-Za-z\s\.]+$", cleaned):
            return cleaned.title()
    # Fallback to filename (without extension)
    return filename.replace('.pdf', '').replace('_', ' ').title()

@app.post("/shortlist", response_model=List[EvaluationResult])
async def shortlist_resumes(
    jd: str = Form(...),
    resumes: List[UploadFile] = File(...)
):
    results = []
    
    if jd.strip():
        jd_embedding = model.encode(jd, convert_to_tensor=True)
        jd_keywords = extract_keywords(jd, top_n=15)
    else:
        jd_embedding = None
        jd_keywords = []
    
    for resume in resumes:
        try:
            contents = await resume.read()
            text = extract_text_from_pdf(contents)
            
            candidate_name = guess_name(text, resume.filename)
            
            if not text or jd_embedding is None:
                results.append(EvaluationResult(
                    candidate_name=candidate_name,
                    filename=resume.filename,
                    final_score=0,
                    score_breakup=ScoreBreakup(semantic_score=0, keyword_score=0),
                    reasoning="Could not extract text or invalid JD."
                ))
                continue
                
            # --- THE LOGIC ---
            
            # 1. Semantic Score (The AI Context)
            # Embeddings capture the "meaning" of the words. A resume using different 
            # words but meaning the same thing as the JD will score highly here.
            resume_embedding = model.encode(text, convert_to_tensor=True)
            cosine_score = util.cos_sim(jd_embedding, resume_embedding).item()
            semantic_score = max(0.0, min(100.0, (cosine_score * 100)))
            
            # 2. Keyword Score (The Exact Matches)
            # We extract top 15 important words/phrases from JD and strictly compare them 
            # against the resume to catch missing explicit technologies.
            text_lower = text.lower()
            matched_keywords = [kw for kw in jd_keywords if kw.lower() in text_lower]
            missing_keywords = [kw for kw in jd_keywords if kw.lower() not in text_lower]
            
            keyword_score = 0.0
            if len(jd_keywords) > 0:
                keyword_score = (len(matched_keywords) / len(jd_keywords)) * 100.0
                
            # 3. Final Score
            # We blend them! 70% weight on the deep AI meaning, 30% weight on exact keyword hits.
            final_score = int((semantic_score * 0.7) + (keyword_score * 0.3))
            
            if len(matched_keywords) > 0:
                reasoning = f"Keywords Met: {', '.join(matched_keywords[:5])}."
                if len(missing_keywords) > 0:
                    reasoning += f" Missing: {', '.join(missing_keywords[:3])}."
            else:
                reasoning = "Resume doesn't explicitly mention the main JD keywords."
                
            results.append(EvaluationResult(
                candidate_name=candidate_name,
                filename=resume.filename,
                final_score=final_score,
                score_breakup=ScoreBreakup(
                    semantic_score=round(semantic_score, 1), 
                    keyword_score=round(keyword_score, 1)
                ),
                reasoning=reasoning
            ))
            
        except Exception as e:
            results.append(EvaluationResult(
                candidate_name=resume.filename,
                filename=resume.filename,
                final_score=0,
                score_breakup=ScoreBreakup(semantic_score=0, keyword_score=0),
                reasoning=f"Error evaluating file: {str(e)}"
            ))
            
    # Sort results by the final blended score descending
    results.sort(key=lambda x: x.final_score, reverse=True)
    return results

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
