import React, { useState } from 'react';
import { useStore } from '../services/store';
import { AnimeCard } from '../components/AnimeCard';
import { AnimeStatus } from '../types';
import { Search } from 'lucide-react';
import { Input } from '../components/ui/Input';

export const Library = () => {
  const { library } = useStore();
  const [filterStatus, setFilterStatus] = useState<AnimeStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = library.filter(entry => {
    const matchesStatus = filterStatus === 'ALL' || entry.status === filterStatus;
    const matchesSearch = (entry.metadata.title.english?.toLowerCase().includes(search.toLowerCase()) || 
                           entry.metadata.title.romaji.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const tabs = ['ALL', ...Object.values(AnimeStatus)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-white">My List <span className="text-zinc-500 text-lg font-normal">({library.length})</span></h2>
        
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

      {/* Tabs */}
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

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(entry => (
            <AnimeCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/30 rounded border border-dashed border-zinc-800">
           <p className="text-zinc-500 text-lg">Your shelf is empty.</p>
        </div>
      )}
    </div>
  );
};