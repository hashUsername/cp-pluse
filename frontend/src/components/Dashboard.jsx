import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard({ problems }) {
  // If there are no problems, don't draw the charts
  if (!problems || problems.length === 0) return null;

  // 1. Calculate Difficulty Stats
  const difficultyData = [
    { name: 'Easy', value: problems.filter(p => p.difficulty === 'Easy').length, color: '#4ade80' },
    { name: 'Medium', value: problems.filter(p => p.difficulty === 'Medium').length, color: '#fbbf24' },
    { name: 'Hard', value: problems.filter(p => p.difficulty === 'Hard').length, color: '#f87171' },
  ].filter(d => d.value > 0);

  // 2. Calculate Platform Stats
  const platformCounts = problems.reduce((acc, curr) => {
    acc[curr.platform] = (acc[curr.platform] || 0) + 1; 
    return acc;
  }, {});
  
  const platformData = Object.keys(platformCounts).map(key => ({ 
    name: key, count: platformCounts[key] 
  }));

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-inner flex flex-col items-center">
        <h3 className="text-slate-300 font-bold mb-2">Difficulty Breakdown</h3>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
              <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                {difficultyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 text-sm mt-2">
          {difficultyData.map(d => <span key={d.name} style={{ color: d.color }} className="font-semibold">{d.name}: {d.value}</span>)}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-inner flex flex-col items-center">
        <h3 className="text-slate-300 font-bold mb-2">Problems by Platform</h3>
        <div className="w-full h-48 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
              <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
