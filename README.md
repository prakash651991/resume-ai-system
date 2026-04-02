# AI Resume Shortlisting Engine

An intelligent, production-grade AI dashboard designed to automate the technical recruitment screening process. This tool allows hiring teams to upload bulk resumes (PDFs) and instantly rank them against a specific Job Description (JD) using a dual-layered algorithm. 

It runs **100% offline** without requiring expensive API keys (like OpenAI or Google Gemini), ensuring total data privacy for applicant resumes.

---

## 🎯 The Purpose

Reviewing hundreds of technical resumes is tedious and prone to human error. This system solves three major pain points in recruiting:
1. **Semantic Understanding**: Traditional filters easily miss great candidates who use different synonyms (e.g. *Backend Engineer* vs *Server-side Developer*). This engine uses advanced NLP to understand the underlying *meaning* of the text.
2. **Strict Compliance Validation**: It mathematically scans for explicit hard-skills requested in the JD, guaranteeing candidates don't get highly scored without mentioning the core technologies.
3. **Data Privacy**: By using small, highly-optimized open-source AI models entirely on your own server, applicant data is never sent to third-party APIs.

---

## 🛠 Technologies Used

### Backend Stack (The Engine)
- **FastAPI / Python**: A modern, high-performance web framework for building asynchronous APIs.
- **Sentence-Transformers (HuggingFace)**: An open-source, mathematically optimized Deep Learning NLP model (`all-MiniLM-L6-v2`) used to calculate the dense vector "Cosine Similarity" between the JD and the resume.
- **Scikit-Learn (TF-IDF)**: The industry standard Machine Learning library, utilized here to mathematically extract the most paramount explicit *unigram* keywords from the JD to evaluate hard-skill compliance.
- **PyPDF2**: Engine for securely parsing unformatted string data out of raw PDF files.

### Frontend Stack (The Dashboard)
- **React + Vite**: A lightning-fast, component-driven UI architecture.
- **Axios**: Promised-based HTTP client handling the multipart/form-data upload streams.
- **jsPDF & autoTable**: Front-end secure generation engines that process the ranked dashboard data and download heavily formatted, printable PDF matrix reports to the user's disk.
- **Lucide React**: Premium consistent SVG iconography.
- **Vanilla CSS3**: Beautiful, hardware-accelerated "Glassmorphism" design aesthetic utilizing deep blurs and dynamic transition layers. 

---

## 🚀 Setup & Running Locally

### 1. Start the Backend API
The first time you start the server, it will dynamically download the ~90MB open-source AI language model from HuggingFace to your local disk.
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### 2. Start the Frontend Dashboard
Open a new, separate terminal window:
```powershell
cd frontend
npm install
npm run dev
```

### 3. Open the App!
Navigate to `http://localhost:5173` in your browser. Paste your job description, upload a bulk selection of PDFs, and hit "Process"! 

Download your findings directly via the **Download PDF Report** button.
