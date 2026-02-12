
import React, { useState } from 'react';
import { useStore } from '../services/store';
import { generateTasteProfile } from '../services/geminiService';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Sparkles, PlayCircle, Clock, Trophy, Compass } from 'lucide-react';
import { AnimeStatus } from '../types';
import { DashboardRecommendations } from '../components/DashboardRecommendations';
import { DashboardNewsNudge } from '../components/DashboardNewsNudge';

export const Dashboard = () => {
  const { library, user, setView } = useStore();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const totalWatched = library.filter(a => a.status === AnimeStatus.COMPLETED).length;
  const totalEpisodes = library.reduce((acc, curr) => acc + curr.progress, 0);
  // Estimate 24 min per ep
  const totalHours = Math.round((totalEpisodes * 24) / 60);

  // Stats for chart with enhanced colors
  const statusCounts = [
    { name: 'Watching', count: library.filter(a => a.status === AnimeStatus.WATCHING).length, color: '#34d399' }, // Emerald 400
    { name: 'Completed', count: library.filter(a => a.status === AnimeStatus.COMPLETED).length, color: '#818cf8' }, // Indigo 400
    { name: 'Planned', count: library.filter(a => a.status === AnimeStatus.PLAN_TO_WATCH).length, color: '#e879f9' }, // Fuchsia 400
    { name: 'Dropped', count: library.filter(a => a.status === AnimeStatus.DROPPED).length, color: '#f87171' }, // Red 400
  ];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await generateTasteProfile(library);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 flex items-center gap-4 hover:bg-zinc-800 transition-colors">
      <div className={`p-3 rounded-full bg-black/50 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm text-zinc-500 font-medium">{label}</div>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-90">
          <p className="font-bold text-white mb-1">{label}</p>
          <p className="text-sm font-medium" style={{ color: payload[0].stroke }}>
            {payload[0].value} Titles
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2">Home</h2>
           <p className="text-zinc-500">Welcome back, {user?.username}.</p>
        </div>
        <Button 
            onClick={() => setView('HOME')} 
            variant="secondary"
            className="gap-2 shadow-lg"
        >
           <Compass size={20} /> Explore Trending
        </Button>
      </header>

      {/* Community Nudge for low activity users */}
      <DashboardNewsNudge />

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Trophy} label="Completed Anime" value={totalWatched} color="text-yellow-500" />
        <StatCard icon={PlayCircle} label="Episodes Watched" value={totalEpisodes} color="text-red-500" />
        <StatCard icon={Clock} label="Hours Watched" value={`${totalHours}h`} color="text-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 flex flex-col">
           <h3 className="text-lg font-bold text-white mb-6">Library Breakdown</h3>
           <div className="h-72 w-full flex-1 min-h-[16rem]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={statusCounts} margin={{ top: 10, right: 0, left: -25, bottom: 5 }}>
                 <defs>
                    {statusCounts.map((entry, index) => (
                        <linearGradient key={`grad-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={entry.color} stopOpacity={0.2}/>
                        </linearGradient>
                    ))}
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                 <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    interval={0}
                 />
                 <YAxis 
                    stroke="#71717a" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                 />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                 <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50} animationDuration={1500}>
                    {statusCounts.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient-${index})`} 
                        stroke={entry.color} 
                        strokeWidth={1}
                      />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* AI Insight */}
        <div className="bg-gradient-to-br from-zinc-900 to-black p-6 rounded-lg border border-zinc-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-600">
             <Sparkles size={120} />
           </div>
           
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-4">
               <Sparkles className="text-red-500" size={20} />
               <h3 className="text-lg font-bold text-white">Gemini Profile Analysis</h3>
             </div>
             
             {aiAnalysis ? (
               <div className="prose prose-invert">
                 <p className="text-zinc-300 italic mb-6 leading-relaxed">"{aiAnalysis}"</p>
                 <Button variant="secondary" size="sm" onClick={() => setAiAnalysis(null)}>Clear Analysis</Button>
               </div>
             ) : (
               <div className="text-center py-8">
                 <p className="text-zinc-400 mb-6">Unlock insights about your watching habits and get personalized recommendations.</p>
                 <Button onClick={handleAnalyze} isLoading={isAnalyzing} className="w-full md:w-auto bg-white text-black hover:bg-zinc-200">
                   Analyze My Taste
                 </Button>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* New Recommendations Section */}
      <DashboardRecommendations />
    </div>
  );
};
