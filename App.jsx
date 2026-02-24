import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend 
} from 'recharts';
import { 
  Upload, Brain, Heart, User, Sparkles, ChevronRight, 
  FileText, CheckCircle2, AlertCircle, Loader2, GraduationCap,
  TrendingUp, Briefcase, BookOpen
} from 'lucide-react';

// Enhanced API key detection for compatibility across different environments
const getApiKey = () => {
  try {
    // Check for Vite-style environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
    // Fallback for standard Node/React environment variables
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GEMINI_API_KEY) {
      return process.env.REACT_APP_GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn("Environment check failed, defaulting to empty string.");
  }
  return ""; 
};

const apiKey = getApiKey();

const App = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [academicData, setAcademicData] = useState(null);
  const [aptitudeScores, setAptitudeScores] = useState({
    numerical: 50, verbal: 50, logical: 50, spatial: 50, 
    abstract: 50, mechanical: 50, clerical: 50, coding: 50
  });
  const [interests, setInterests] = useState({
    activity: 'Gaming', youtube: 'Science & Tech', problemSolving: 'Analytical', workStyle: 'Solo'
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // --- CSV Handling ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      if (rows.length < 2) return;

      const headers = rows[0].split(',');
      const data = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, i) => {
          obj[header.trim()] = values[i]?.trim();
          return obj;
        }, {});
      });
      setAcademicData(data);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const generateSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Class,Exam,English,Language_II,Math,Science,Social_Science\n"
      + "9,PT1,38,35,39,37,36\n"
      + "9,PT2,37,36,40,38,35\n"
      + "9,PT3,39,34,38,39,37\n"
      + "9,Half_Yearly,76,70,78,75,72\n"
      + "9,Annual,75,72,79,77,74\n"
      + "10,PT1,36,34,39,38,35\n"
      + "10,PT2,37,35,40,39,36\n"
      + "10,PT3,38,36,38,37,38\n"
      + "10,Half_Yearly,74,72,77,76,73\n"
      + "10,Annual,76,74,78,79,75";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_academic_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analyzeData = async () => {
    setLoading(true);
    setError(null);
    
    if (!apiKey) {
      setError("API Key missing. Please ensure your VITE_GEMINI_API_KEY is configured.");
      setLoading(false);
      return;
    }

    const systemPrompt = `You are an expert Career Counselor and AI Data Architect. 
    Analyze the provided student data (Academic CSV, Aptitude Scores, Interests) to recommend a 11th-grade stream.
    Output must be a valid JSON object.`;

    const userQuery = `
      ACADEMIC DATA: ${JSON.stringify(academicData)}
      APTITUDE SCORES: ${JSON.stringify(aptitudeScores)}
      INTERESTS/PERSONALITY: ${JSON.stringify(interests)}
      
      Generate a JSON Decision Package with:
      1. primaryStream, 2. confidenceScores (Science, Commerce, Humanities), 3. explanation, 4. careerPathways, 5. visualSummary.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const jsonResult = JSON.parse(data.candidates[0].content.parts[0].text);
      setResult(jsonResult);
      setStep(5);
    } catch (err) {
      console.error(err);
      setError("AI Analysis failed. " + err.message);
      setLoading(false);
    }
  };

  const ProgressHeader = () => (
    <div className="flex justify-between items-center mb-8 px-4">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="flex flex-col items-center flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all duration-300 ${
            step >= s ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'
          }`}>
            {step > s ? <CheckCircle2 size={20} /> : s}
          </div>
          <span className={`text-xs font-semibold ${step >= s ? 'text-emerald-700' : 'text-slate-400'}`}>
            {['Academic', 'Aptitude', 'Interests', 'Analysis', 'Results'][s-1]}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mb-4">
            <Sparkles size={16} /> AI STREAM-SYNC
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Student Stream Recommendation</h1>
        </header>

        <ProgressHeader />

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[400px]">
          {step === 1 && (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Step 1: Upload CSV</h2>
              <p className="text-slate-500 mb-6">Provide your Class 9 & 10 marks for all Periodic Tests and Exams.</p>
              <div className="flex flex-col items-center gap-4 mt-8">
                <label className="cursor-pointer bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
                  <Upload size={20} /> Choose CSV File
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={generateSampleCSV} className="text-emerald-600 font-semibold text-sm underline hover:text-emerald-800">
                  Download Sample Template
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">Step 2: Aptitude Scores</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(aptitudeScores).map(key => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold capitalize">
                      <span className="text-slate-600">{key.replace('_', ' ')} Ability</span>
                      <span className="text-emerald-600">{aptitudeScores[key]}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={aptitudeScores[key]} 
                      onChange={(e) => setAptitudeScores({...aptitudeScores, [key]: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none accent-emerald-600 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setStep(3)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                  Next <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">Step 3: Personal Interests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="font-bold text-slate-700">Favorite Activity</label>
                  <select 
                    value={interests.activity}
                    onChange={(e) => setInterests({...interests, activity: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>Gaming</option>
                    <option>Reading</option>
                    <option>Debating</option>
                    <option>Arts</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-slate-700">YouTube Genre</label>
                  <select 
                    value={interests.youtube}
                    onChange={(e) => setInterests({...interests, youtube: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>Science & Tech</option>
                    <option>Business & Finance</option>
                    <option>Creative Design</option>
                    <option>History & Arts</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-slate-700">Problem-solving Style</label>
                  <div className="flex gap-2">
                    {['Creative', 'Analytical'].map(style => (
                      <button 
                        key={style}
                        onClick={() => setInterests({...interests, problemSolving: style})}
                        className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                          interests.problemSolving === style ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-slate-700">Preferred Work</label>
                  <div className="flex gap-2">
                    {['Solo', 'Group'].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setInterests({...interests, workStyle: mode})}
                        className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                          interests.workStyle === mode ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-end">
                <button 
                  onClick={() => { setStep(4); analyzeData(); }} 
                  className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                >
                  Analyze My Future <Sparkles size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-20 text-center">
              <Loader2 className="animate-spin text-emerald-600 mx-auto mb-6" size={60} />
              <h2 className="text-2xl font-bold mb-2">AI Architect at Work...</h2>
              <p className="text-slate-500">Synthesizing academic trends, aptitude peaks, and personality markers.</p>
              {error && (
                <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl inline-flex items-center gap-2 border border-red-100">
                  <AlertCircle size={20} /> {error}
                </div>
              )}
            </div>
          )}

          {step === 5 && result && (
            <div className="p-8 animate-in fade-in duration-700">
              <div className="bg-emerald-600 text-white p-8 rounded-3xl mb-8 shadow-xl shadow-emerald-100">
                <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-2 block">Primary Stream Suggestion</span>
                <h2 className="text-4xl font-black mb-4">{result.primaryStream}</h2>
                <p className="mt-4 text-lg text-emerald-50 leading-relaxed">{result.explanation}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700">
                    <TrendingUp size={20} className="text-emerald-600" /> Match Confidence
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(result.confidenceScores).map(([stream, score]) => (
                      <div key={stream}>
                        <div className="flex justify-between text-xs font-bold mb-1 text-slate-500 uppercase">
                          <span>{stream}</span>
                          <span>{score}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-1000" 
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700">
                    <Briefcase size={20} className="text-emerald-600" /> Career Pathways
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.careerPathways.map(career => (
                      <span key={career} className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 shadow-sm">
                        {career}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-100 text-center italic text-slate-500">
                "{result.visualSummary}"
              </div>

              <div className="mt-10 flex justify-center">
                <button 
                  onClick={() => { setStep(1); setResult(null); setAcademicData(null); }}
                  className="text-slate-400 hover:text-emerald-600 font-bold transition-colors"
                >
                  Restart Assessment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
