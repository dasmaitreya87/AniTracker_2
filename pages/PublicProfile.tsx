
import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Button } from '../components/ui/Button';
import { AnimeCard } from '../components/AnimeCard';
import { BadgeCard } from '../components/BadgeCard';
import { ArrowLeft, PlayCircle, Trophy, Clock, Search } from 'lucide-react';
import { AnimeStatus } from '../types';
import { Input } from '../components/ui/Input';

export const PublicProfile = () => {
  const { viewedProfile, viewedLibrary, setView } = useStore();
  const [filterStatus, setFilterStatus] = useState<AnimeStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  if (!viewedProfile) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500">
          <p className="text-xl mb-4">User not found or profile is private.</p>
          <Button onClick={() => setView('DASHBOARD')}>Back Home</Button>
      </div>
  );

  // Stats Calculation
  const totalWatched = viewedLibrary.filter(a => a.status === AnimeStatus.COMPLETED).length;
  const totalEpisodes = viewedLibrary.reduce((acc, curr) => acc + (curr.progress || 0), 0);
  const totalHours = Math.round((totalEpisodes * 24) / 60);

  const filtered = viewedLibrary.filter(entry => {
    // Basic defensive check if metadata is somehow missing entirely
    if (!entry.metadata) return false;
    
    const matchesStatus = filterStatus === 'ALL' || entry.status === filterStatus;
    
    const query = search.toLowerCase();
    const titleEng = entry.metadata.title?.english || '';
    const titleRom = entry.metadata.title?.romaji || '';
    
    const matchesSearch = titleEng.toLowerCase().includes(query) || 
                          titleRom.toLowerCase().includes(query);
                          
    return matchesStatus && matchesSearch;
  });

  const tabs = ['ALL', ...Object.values(AnimeStatus)];

  return (
    <div className="animate-fade-in pb-12 space-y-8">
      <Button variant="ghost" onClick={() => setView('DASHBOARD')} className="pl-0 gap-2 text-zinc-400 hover:text-white">
        <ArrowLeft size={20} /> Back to Dashboard
      </Button>

      {/* Profile Header */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden relative group">
        <div className="h-48 md:h-64 w-full bg-zinc-800 relative">
             {viewedProfile.bannerUrl ? (
                <img src={viewedProfile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-rose-900 opacity-80" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
        </div>
        
        <div className="px-6 md:px-10 pb-8 relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start -mt-20">
             <div className="relative shrink-0">
                <div className="p-1.5 bg-zinc-900 rounded-2xl shadow-2xl">
                    <img 
                        src={viewedProfile.avatarUrl} 
                        alt={viewedProfile.username} 
                        className="w-36 h-36 md:w-44 md:h-44 rounded-xl object-cover bg-zinc-800 border border-zinc-800"
                    />
                </div>
             </div>
             
             <div className="flex-1 text-center md:text-left pt-2 md:pt-20">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{viewedProfile.username}</h1>
                <p className="text-zinc-400 text-lg leading-relaxed mb-4 max-w-2xl mx-auto md:mx-0">{viewedProfile.bio || 'No bio yet.'}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {viewedProfile.favoriteGenres.map(g => (
                        <span key={g} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wide border border-zinc-700 rounded-full">
                            {g}
                        </span>
                    ))}
                </div>
             </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 flex items-center gap-4">
            <div className="p-3 rounded-full bg-black/50 text-yellow-500"><Trophy size={24} /></div>
            <div>
                <div className="text-3xl font-bold text-white">{totalWatched}</div>
                <div className="text-sm text-zinc-500 font-medium">Completed</div>
            </div>
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 flex items-center gap-4">
            <div className="p-3 rounded-full bg-black/50 text-red-500"><PlayCircle size={24} /></div>
            <div>
                <div className="text-3xl font-bold text-white">{totalEpisodes}</div>
                <div className="text-sm text-zinc-500 font-medium">Episodes</div>
            </div>
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 flex items-center gap-4">
            <div className="p-3 rounded-full bg-black/50 text-blue-500"><Clock size={24} /></div>
            <div>
                <div className="text-3xl font-bold text-white">{totalHours}h</div>
                <div className="text-sm text-zinc-500 font-medium">Hours Watched</div>
            </div>
        </div>
      </div>

      {/* Badges */}
      {viewedProfile.badges && viewedProfile.badges.length > 0 && (
         <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
             <h3 className="text-xl font-bold text-white mb-4">Achievements</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {viewedProfile.badges.map(b => (
                    <BadgeCard key={b.badgeId} userBadge={b} showDate={false} />
                ))}
             </div>
         </div>
      )}

      {/* Favorites */}
      {viewedProfile.favorites && viewedProfile.favorites.length > 0 && (
         <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
             <h3 className="text-xl font-bold text-white mb-4">Favorites</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {viewedProfile.favorites.map(f => (
                    <div key={f.animeId} className="relative group cursor-default">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800">
                            <img src={f.coverImage} alt={f.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="mt-2 text-xs text-center text-zinc-400 font-medium truncate">{f.title}</p>
                    </div>
                ))}
             </div>
         </div>
      )}

      {/* Library */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Library <span className="text-zinc-500 text-base font-normal">({viewedLibrary.length})</span></h2>
            
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                <Input 
                    placeholder="Search titles..." 
                    className="pl-10 h-10 bg-black border border-zinc-700 focus:border-white rounded-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
            <button
                key={tab}
                onClick={() => setFilterStatus(tab as any)}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors border-b-2
                ${filterStatus === tab 
                    ? 'border-red-600 text-white' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
            >
                {tab.replace(/_/g, ' ')}
            </button>
            ))}
        </div>

        {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(entry => (
                <AnimeCard key={entry.id} entry={entry} readOnly />
            ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-zinc-900/30 rounded border border-dashed border-zinc-800">
                <p className="text-zinc-500 text-lg">
                    {viewedLibrary.length === 0 ? "This user has not added any anime yet." : "No anime found in this category."}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
