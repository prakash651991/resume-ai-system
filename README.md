# AI Resume Shortlisting System (Offline)

An intelligent AI-powered dashboard that uses **Sentence Transformers** and **scikit-learn** to compare multiple PDF resumes against a Job Description completely offline without any paid APIs.

## Features
- **FastAPI Backend**: Fast, asynchronous file processing with PyPDF2.
- **100% Offline AI**: Uses `SentenceTransformers` (`all-MiniLM-L6-v2`) to compute semantic matching scores contextually, rather than simple keyword overlapping. No API keys needed!
- **React Frontend**: Beautiful glassmorphism aesthetic built with vanilla CSS.
- **Bulk Upload**: Upload multiple PDF resumes simultaneously.
- **Intelligent Scoring**: Semantic matching score with keyword extraction to justify reasoning.

## Requirements
- Node.js & npm
- Python 3.8+

## Setup & Running

### 1. Start the Backend
Open a terminal and:
```powershell
cd backend
pip install -r requirements.txt

# Start the server on http://localhost:8000
python -m uvicorn main:app --reload
```
*(Note: It will download a ~90MB AI model on the first startup)*

### 2. Start the Frontend
Open a second terminal and:
```powershell
cd frontend
npm install   # Already installed by script but good to ensure
npm run dev
```

### 3. Open Dashboard
Browser will automatically open (or go to `http://localhost:5173`) to view your new shortlisting system!
