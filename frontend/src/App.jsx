import { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, BarChart3, Users, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';

function App() {
  const [jd, setJd] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!jd.trim()) {
      setError('Please provide a Job Description.');
      return;
    }
    if (files.length === 0) {
      setError('Please upload at least one resume.');
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('jd', jd);
    files.forEach(file => {
      formData.append('resumes', file);
    });

    try {
      const endpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000/shortlist';
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResults(response.data);
    } catch (err) {
      setError('Failed to process resumes. Ensure backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("AI Resume Shortlisting Report", 14, 15);
    
    const tableColumn = ["Rank", "Candidate Name", "Filename", "Final Score", "Semantic (70%)", "Keyword (30%)", "Reasoning / Summary"];
    const tableRows = [];

    results.forEach((r, idx) => {
      const rowData = [
        idx + 1,
        r.candidate_name,
        r.filename,
        r.final_score + "%",
        r.score_breakup.semantic_score + "%",
        r.score_breakup.keyword_score + "%",
        r.reasoning
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save("resume_shortlist_report.pdf");
  };

  const getScoreClass = (score) => {
    if (score >= 80) return '';
    if (score >= 50) return 'medium';
    return 'low';
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>AI Resume Scanner</h1>
        <p>Intelligent, fully-offline bulk shortlisting via Semantics</p>
      </header>

      <div className="glass-panel" style={{ fontSize: '0.9rem', marginBottom: '2rem', background: 'rgba(79, 70, 229, 0.1)', borderColor: 'rgba(79, 70, 229, 0.3)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> How the Scoring Engine Works
        </h3>
        <p style={{ margin: '0.5rem 0' }}><strong style={{ color: 'var(--primary)' }}>Semantic Score (70% weight):</strong> Uses an offline AI model to understand the human <em>meaning</em> of the text. It detects concepts, so if the JD asks for a "Backend Developer" and the resume says "Server-side Engineer", the AI knows they are linked.</p>
        <p style={{ margin: 0 }}><strong style={{ color: 'var(--secondary)' }}>Keyword Score (30% weight):</strong> A strict algorithmic filter that automatically identifies the most critical individual words in your Job Description and explicitly checks if the candidate wrote them down. This ensures candidates don't pass without mentioning the required hard skills.</p>
      </div>

      <div className="glass-panel">
        <div className="form-group">
          <label><FileText size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'5px'}}/> Job Description (JD)</label>
          <textarea 
            placeholder="Paste the full job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label><Upload size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'5px'}}/> Upload Resumes (PDF)</label>
          <div className="file-upload-wrapper">
            <input 
              type="file" 
              multiple 
              accept=".pdf"
              onChange={handleFileChange}
            />
            <Upload size={40} className="file-upload-icon" />
            <div className="file-upload-text">Drag & drop or click to select PDFs</div>
            <div className="file-upload-sub">Upload multiple files at once</div>
          </div>
          
          {files.length > 0 && (
            <div className="file-list">
              {files.map((f, i) => (
                <div key={i} className="file-chip">
                  {f.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <button 
          className="btn-primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <><div className="loader"/> Analyzing semantic meaning...</> : <><CheckCircle size={20}/> Process Resumes</>}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{animation: 'fadeInUp 0.8s ease-out'}}>
          <div className="glass-panel" style={{display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: '2rem'}}>
            <div>
              <Users size={32} color="var(--primary)" style={{marginBottom:'0.5rem'}}/>
              <h2>{results.length}</h2>
              <p style={{color:'var(--text-secondary)'}}>Total Candidates</p>
            </div>
            <div>
              <BarChart3 size={32} color="var(--secondary)" style={{marginBottom:'0.5rem'}}/>
              <h2>{Math.round(results.reduce((a, b) => a + b.final_score, 0) / results.length)}%</h2>
              <p style={{color:'var(--text-secondary)'}}>Average Match</p>
            </div>
            <div>
              <CheckCircle size={32} color="#34D399" style={{marginBottom:'0.5rem'}}/>
              <h2>{results.filter(r => r.final_score >= 80).length}</h2>
              <p style={{color:'var(--text-secondary)'}}>Top Matches (&gt;80%)</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <h2 style={{color: 'var(--text-primary)', margin: 0}}>
              Detailed Rankings
            </h2>
            <button className="btn-secondary" onClick={downloadPDF}>
              <Download size={16}/> Download PDF Report
            </button>
          </div>
          
          <div className="table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate Name</th>
                  <th>Final Score</th>
                  <th>Semantic (70%)</th>
                  <th>Keyword (30%)</th>
                  <th>Summary Focus</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="table-row">
                    <td>#{index + 1}</td>
                    <td>
                      <strong style={{ color: 'white' }}>{result.candidate_name}</strong>
                      <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{result.filename}</div>
                    </td>
                    <td>
                      <div className={`score-badge inline-badge ${getScoreClass(result.final_score)}`}>
                        {result.final_score}%
                      </div>
                    </td>
                    <td>{result.score_breakup.semantic_score}%</td>
                    <td>{result.score_breakup.keyword_score}%</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '300px' }}>{result.reasoning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
