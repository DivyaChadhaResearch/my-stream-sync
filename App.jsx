import React, { useState, useEffect } from 'react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip
} from 'recharts';
import { 
  Upload, Brain, Heart, Sparkles, ChevronRight, 
  FileText, CheckCircle2, AlertCircle, Loader2,
  TrendingUp, Briefcase, Info
} from 'lucide-react';

// Enhanced API key detection for Netlify/Vite
const getApiKey = () => {
  try {
    if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    // Fallback for non-Vite environments
  }
  return ""; 
};

const apiKey = getApiKey();

const App = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [academicData, setAcademicData] = useState(null);
  
  // Custom Aptitude Scores based on user requirements
  const [aptitudeScores, setAptitudeScores] = useState({
    numerical: 50,
    verbal: 50,
    logical: 50,
    spatial: 50,
    abstract: 50,
    mechanical: 50,
    clerical: 50,
    coding: 50
  });

  const [interests, setInterests] = useState({
    activity: 'Gaming',
    youtube: 'Science & Tech',
    problemSolving: 'Analytical',
    workStyle: 'Solo'
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
      + "9,PT1,35,32,38,36,34\n"
      + "9,PT2,36,33,39,37,35\n"
      + "9,PT3,34,31,40,38,36\n"
      + "9,Half_Yearly,72,68,78,74,70\n"
      + "9,Annual,74,70,79,76,72\n"
      + "10,PT1,36,34,39,38,35\n"
      + "10,PT2,37,35,40,39,36\n"
      + "10,PT3,38,36,38,37,38\n"
      + "10,Half_Yearly,74,72,77,76,73\n"
      + "10,Annual,76,74,78,79,75";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "academic_records_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analyzeData = async () => {
    setLoading(true);
    setError(null);
    
    if (!apiKey) {
      setError("API Key missing! Go to Netlify settings and add VITE_GEMINI_API_KEY.");
      setLoading(false);
      return;
    }

    const systemPrompt = `You are a Career Counselor. Analyze Academic marks, Aptitude scores, and Interests. 
    Recommend a stream (Science PCM/PCB, Commerce, Humanities).
    Return ONLY a JSON object.`;

    const userQuery = `
      ACADEMICS: ${JSON.stringify(academicData)}
      APTITUDE: ${JSON.stringify(aptitudeScores)}
      PERSONALITY: ${JSON.stringify(interests)}
      
      JSON keys: primaryStream, confidenceScores (object), explanation (the "Why"), careerPathways (array), visualSummary.
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
      const jsonResult = JSON.parse(data.candidates[0].content.parts[0].text);
      setResult(jsonResult);
      setStep(5);
    } catch (err) {
      setError("AI failed to respond. Check your API Key and internet connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation / Header */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-4">
            <Sparkles size={14} /> AI-POWERED CAREER GUIDANCE
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Stream Suggestion Architect</h1>
        </header>

        {/* Step Progress */}
        <div className="flex justify-between mb-12 max-w-2xl mx-auto">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
            </div>
          ))}
        </div>

        <main className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Upload Academic Marks</h2>
              <p className="text-slate-500 mb-8">Upload your Class 9 & 10 CSV file (PTs, Half Yearly, Annual).</p>
              
              <div className="flex flex-col items-center gap-4">
                <label className="cursor-pointer bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                  <FileText size={18} /> Choose CSV File
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={generateSampleCSV} className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                  <Info size={14} /> Download Sample CSV Template
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: APTITUDE */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6 text-blue-600">
                <Brain size={24} />
                <h2 className="text-xl font-bold text-slate-800">Aptitude & Skills</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {Object.keys(aptitudeScores).map(key => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                      <span>{key.replace('_', ' ')}</span>
                      <span className="text-blue-600">{aptitudeScores[key]}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={aptitudeScores[key]} 
                      onChange={(e) => setAptitudeScores({...aptitudeScores, [key]: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-10 flex justify-end">
                <button onClick={() => setStep(3)} className="bg-slate-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                  Next: Interests
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INTERESTS */}
          {step === 3 && (
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6 text-pink-500">
                <Heart size={24} />
                <h2 className="text-xl font-bold text-slate-800">Interests & Hobbies</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 uppercase">Favorite Activity</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={interests.activity}
                    onChange={(e) => setInterests({...interests, activity: e.target.value})}
                  >
                    <option>Gaming</option><option>Reading</option><option>Debating</option><option>Arts</option><option>Coding</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 uppercase">Problem Solving Style</label>
                  <div className="flex gap-2">
                    {['Creative', 'Analytical'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setInterests({...interests, problemSolving: s})}
                        className={`flex-1 p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                          interests.problemSolving === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-12 flex justify-end">
                <button 
                  onClick={() => { setStep(4); analyzeData(); }}
                  className="bg-blue-600 text-white px-12 py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  Generate Recommendation
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: LOADING */}
          {step === 4 && (
            <div className="p-24 text-center">
              <Loader2 className="animate-spin text-blue-600 mx-auto mb-6" size={48} />
              <h2 className="text-2xl font-bold mb-2">Architecting Your Results</h2>
              <p className="text-slate-400">Processing academic metrics and neural aptitude peaks...</p>
              {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
                  <AlertCircle size={16} className="inline mr-2" /> {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: RESULTS */}
          {step === 5 && result && (
            <div className="p-8 animate-in fade-in duration-1000">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 rounded-3xl mb-8 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Primary Stream Suggestion</span>
                  <h2 className="text-4xl font-black mt-3 mb-4">{result.primaryStream}</h2>
                  <p className="text-blue-50 leading-relaxed max-w-2xl opacity-90">{result.explanation}</p>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-700 uppercase text-xs tracking-widest">
                      <TrendingUp size={16} /> Confidence Breakdown
                    </h3>
                    <div className="space-y-5">
                      {Object.entries(result.confidenceScores).map(([stream, score]) => (
                        <div key={stream}>
                          <div className="flex justify-between text-xs font-black mb-1.5 text-slate-500 uppercase">
                            <span>{stream}</span>
                            <span>{score}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${score}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase text-xs tracking-widest">
                      <Briefcase size={16} /> Career Pathways
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.careerPathways.map(path => (
                        <span key={path} className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                          {path}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase text-xs tracking-widest">
                    <Brain size={16} /> Aptitude Web
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={Object.entries(aptitudeScores).map(([k, v]) => ({ subject: k, value: v }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl text-xs font-bold text-blue-800 italic leading-relaxed">
                    "{result.visualSummary}"
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <button 
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-blue-600 font-bold text-sm transition-all"
                >
                  Start New Evaluation
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
