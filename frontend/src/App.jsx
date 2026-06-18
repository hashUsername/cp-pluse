import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';

function App() {
  // --- STATE ---
  const [problems, setProblems] = useState([]);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [notes, setNotes] = useState(''); 
  const [editingId, setEditingId] = useState(null);
  const [magicUrl, setMagicUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null); 
  const [showOnlyDue, setShowOnlyDue] = useState(false);

  // --- API CALLS ---
  const fetchProblems = () => {
	  fetch('https://cp-pluse-backend.onrender.com/api/problems')
      .then((res) => res.json())
      .then((data) => setProblems(data))
      .catch((err) => console.error("Fetch error:", err));
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problemData = { title, platform, difficulty, notes };

    if (editingId) {
      await fetch(`http://localhost:5000/api/problems/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(problemData) });
      setEditingId(null);
    } else {
      await fetch('http://localhost:5000/api/problems', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(problemData) });
    }
    setTitle(''); setPlatform(''); setDifficulty('Easy'); setNotes('');
    fetchProblems();
  };

  const handleMarkReviewed = async (prob) => {
    // Send PUT request to update the timestamp
    await fetch(`http://localhost:5000/api/problems/${prob._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prob, lastReviewed: new Date() }),
    });
    fetchProblems();
  };

  const handleDelete = async (idToDelete) => {
    await fetch(`http://localhost:5000/api/problems/${idToDelete}`, { method: 'DELETE' });
    fetchProblems();
  };

  const handleEditClick = (prob) => {
    setTitle(prob.title); setPlatform(prob.platform); setDifficulty(prob.difficulty); setNotes(prob.notes || ''); 
    setEditingId(prob._id); setExpandedId(prob._id);
  };

  const handleMagicFetch = async () => {
    if (!magicUrl) return;
    setIsFetching(true);
    try {
      const response = await fetch('http://localhost:5000/api/fetch-problem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: magicUrl }) });
      const data = await response.json();
      if (response.ok) {
        setTitle(data.title); setPlatform(data.platform); setDifficulty(data.difficulty); setMagicUrl('');
      } else { alert(data.error); }
    } catch (error) { alert("Network error."); }
    setIsFetching(false);
  };

  // --- LOGIC ---
  const isReviewDue = (prob) => {
    if (!prob.lastReviewed) return true;
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(prob.lastReviewed)) / (1000 * 60 * 60 * 24)) - 1; 
    if (prob.difficulty === 'Hard' && diffDays >= 3) return true;
    if (prob.difficulty === 'Medium' && diffDays >= 7) return true;
    if (prob.difficulty === 'Easy' && diffDays >= 14) return true;
    return false;
  };

  const filteredProblems = problems.filter((prob) => {
    const matchesSearch = prob.title.toLowerCase().includes(searchTerm.toLowerCase()) || prob.platform.toLowerCase().includes(searchTerm.toLowerCase());
    return showOnlyDue ? (matchesSearch && isReviewDue(prob)) : matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto p-8 mt-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-8 text-center">CP Pulse Dashboard</h1>
      <Dashboard problems={problems} />

      <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-lg border border-slate-700 mb-8 shadow-inner">
        <h3 className="text-xl font-bold text-slate-200 mb-4">{editingId ? "✏️ Edit Problem" : "✨ Add a New Problem"}</h3>
        {!editingId && (
          <div className="flex gap-2 mb-6 p-4 bg-slate-900/50 rounded-lg border border-dashed border-cyan-500/50">
            <input type="text" placeholder="✨ Paste LeetCode URL..." value={magicUrl} onChange={(e) => setMagicUrl(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 text-slate-100 rounded-md p-2 text-sm focus:outline-none focus:border-cyan-500" />
            <button type="button" onClick={handleMagicFetch} disabled={isFetching} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-bold">{isFetching ? "Fetching..." : "Auto-Fill"}</button>
          </div>
        )}
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-md p-3 mb-4" />
        <input type="text" placeholder="Platform" value={platform} onChange={(e) => setPlatform(e.target.value)} required className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-md p-3 mb-4" />
        <textarea placeholder="Notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-md p-3 mb-4 min-h-[100px] font-mono text-sm" />
        <div className="flex gap-4">
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 text-slate-100 rounded-md p-3">
            <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
          </select>
          <button type="submit" className={`flex-1 font-bold py-3 px-6 rounded-md text-white ${editingId ? 'bg-amber-600' : 'bg-cyan-600'}`}>
            {editingId ? "Update" : "Save"}
          </button>
        </div>
      </form>

      <div className="mb-6 flex gap-3">
        <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-slate-900 border border-slate-600 text-slate-100 rounded-full py-3 px-6" />
        <button onClick={() => setShowOnlyDue(!showOnlyDue)} className={`px-5 py-3 rounded-full font-bold text-sm ${showOnlyDue ? 'bg-amber-500' : 'bg-slate-700'}`}>Due for Review</button>
      </div>

      <ul className="space-y-3">
        {filteredProblems.map((prob) => (
          <li key={prob._id} className={`bg-slate-900 rounded-lg border transition-colors ${isReviewDue(prob) ? 'border-amber-500' : 'border-slate-700'}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === prob._id ? null : prob._id)}>
              <div>
                <span className="font-bold text-lg text-slate-200">{prob.title}</span>
                <span className={`ml-3 px-2 py-0.5 text-[10px] rounded-full ${prob.difficulty === 'Easy' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>{prob.difficulty}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleEditClick(prob); }} className="bg-slate-700 px-3 py-1 rounded text-sm">Edit</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(prob._id); }} className="bg-red-900 px-3 py-1 rounded text-sm">Delete</button>
              </div>
            </div>
            {expandedId === prob._id && (
              <div className="p-5 bg-slate-800 border-t border-slate-700">
                <button onClick={() => handleMarkReviewed(prob)} className="bg-emerald-700 text-white text-xs px-3 py-1 rounded mb-4">🔄 Reset Timer</button>
                <pre className="text-sm text-slate-300 font-mono">{prob.notes || "No notes."}</pre>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
