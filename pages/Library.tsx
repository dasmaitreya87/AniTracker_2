import React, { useState } from 'react';
import { useStore } from '../services/store';
import { AnimeCard } from '../components/AnimeCard';
import { AnimeStatus } from '../types';
import { Search, ArrowUpDown } from 'lucide-react';
import { Input } from '../components/ui/Input';

type SortOption = 'TITLE_ASC' | 'TITLE_DESC' | 'SCORE_DESC' | 'SCORE_ASC' | 'PROGRESS_DESC' | 'LAST_UPDATED';

export const Library = () => {
  const { library } = useStore();
  const [filterStatus, setFilterStatus] = useState<AnimeStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('LAST_UPDATED');

  const filtered = library.filter(entry => {
    const matchesStatus = filterStatus === 'ALL' || entry.status === filterStatus;
    const matchesSearch = (entry.metadata.title.english?.toLowerCase().includes(search.toLowerCase()) || 
                           entry.metadata.title.romaji.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'TITLE_ASC':
        return (a.metadata.title.english || a.metadata.title.romaji).localeCompare(b.metadata.title.english || b.metadata.title.romaji);
      case 'TITLE_DESC':
        return (b.metadata.title.english || b.metadata.title.romaji).localeCompare(a.metadata.title.english || a.metadata.title.romaji);
      case 'SCORE_DESC':
        return b.score - a.score;
      case 'SCORE_ASC':
        return a.score - b.score;
      case 'PROGRESS_DESC':
        return b.progress - a.progress;
      case 'LAST_UPDATED':
        return b.updatedAt - a.updatedAt;
      default:
        return 0;
    }
  });

  const tabs = ['ALL', ...Object.values(AnimeStatus)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-3xl font-bold text-white">My List <span className="text-zinc-500 text-lg font-normal">({library.length})</span></h2>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <ArrowUpDown size={14} className="text-zinc-400" />
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-md focus:ring-red-500 focus:border-red-500 block w-full pl-9 p-2.5 appearance-none cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              <option value="LAST_UPDATED">Last Updated</option>
              <option value="TITLE_ASC">Title (A-Z)</option>
              <option value="TITLE_DESC">Title (Z-A)</option>
              <option value="SCORE_DESC">Score (High-Low)</option>
              <option value="SCORE_ASC">Score (Low-High)</option>
              <option value="PROGRESS_DESC">Progress (Most)</option>
            </select>
          </div>
        </div>
        
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
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(entry => (
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