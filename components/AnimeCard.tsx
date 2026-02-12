
import React, { useState, useEffect } from 'react';
import { UserAnimeEntry, AnimeStatus } from '../types';
import { useStore } from '../services/store';
import { Button } from './ui/Button';
import { Plus, Check, MoreVertical, Trash2, Edit3, Loader, Play, Radio } from 'lucide-react';

interface AnimeCardProps {
  entry: UserAnimeEntry;
  readOnly?: boolean;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ entry, readOnly = false }) => {
  const { updateAnime, deleteAnime, viewAnimeDetails, openModal } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isLive, setIsLive] = useState(false);

  const { title, coverImage, episodes, nextAiringEpisode } = entry.metadata;
  const progressPercentage = episodes ? (entry.progress / episodes) * 100 : 0;

  // Update timer every minute to keep relative time accurate
  useEffect(() => {
    const updateTime = () => {
        if (!nextAiringEpisode) {
            setTimeRemaining('');
            setIsLive(false);
            return;
        }

        const now = Date.now();
        const airingTime = nextAiringEpisode.airingAt * 1000;
        const diff = airingTime - now;

        if (diff <= 0) {
            setIsLive(true);
            setTimeRemaining('LIVE');
        } else {
            setIsLive(false);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeRemaining(`Ep ${nextAiringEpisode.episode} in ${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeRemaining(`Ep ${nextAiringEpisode.episode} in ${hours}h ${minutes}m`);
            } else {
                setTimeRemaining(`Ep ${nextAiringEpisode.episode} in ${minutes}m`);
            }
        }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [nextAiringEpisode]);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    if (episodes && entry.progress >= episodes) return;
    
    setIsUpdating(true);
    // Simulate API delay
    setTimeout(() => {
      const newProgress = entry.progress + 1;
      updateAnime(entry.id, { 
        progress: newProgress 
      });
      setIsUpdating(false);
    }, 400);
  };

  const getStatusColor = (status: AnimeStatus) => {
    switch (status) {
      case AnimeStatus.WATCHING: return 'text-green-500';
      case AnimeStatus.COMPLETED: return 'text-blue-500';
      case AnimeStatus.PLAN_TO_WATCH: return 'text-zinc-400';
      case AnimeStatus.DROPPED: return 'text-red-500';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="group relative bg-zinc-900 rounded-md overflow-hidden border border-zinc-800 transition-all hover:bg-zinc-800 flex flex-row h-40">
      {/* Poster - Clickable */}
      <div 
         className="relative w-28 h-full shrink-0 cursor-pointer"
         onClick={() => viewAnimeDetails(entry.animeId)}
      >
        <img 
          src={coverImage.large} 
          alt={title.english || title.romaji} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        {isLive && (
             <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg animate-pulse">
                 <Radio size={10} /> LIVE
             </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className="pr-4">
                <h3 
                    className="font-bold text-base text-white line-clamp-1 mb-1 cursor-pointer hover:text-rose-500 transition-colors" 
                    title={title.english || title.romaji}
                    onClick={() => viewAnimeDetails(entry.animeId)}
                >
                    {title.english || title.romaji}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                    <span className={`font-semibold uppercase tracking-wider ${getStatusColor(entry.status)}`}>{entry.status.replace(/_/g, ' ')}</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-400">{entry.metadata.seasonYear || 'N/A'}</span>
                </div>
            </div>
            
            {/* Context Menu Button - Hidden in Read Only */}
            {!readOnly && (
                <div className="relative">
                    <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-700 transition-colors"
                    >
                    <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                    <div className="absolute right-0 top-8 z-20 w-40 bg-zinc-900 rounded border border-zinc-700 py-1 shadow-xl">
                        <button 
                        onClick={() => { viewAnimeDetails(entry.animeId); setShowMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                        >
                            Info
                        </button>
                        <button 
                        onClick={() => { openModal('EDIT', entry); setShowMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                        >
                            <Edit3 size={14} /> Update Progress
                        </button>
                        <button 
                        onClick={() => { deleteAnime(entry.id); setShowMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-zinc-800 flex items-center gap-2 border-t border-zinc-800 mt-1 pt-2"
                        >
                        <Trash2 size={14} /> Remove
                        </button>
                    </div>
                    )}
                </div>
            )}
        </div>

        {/* Progress Control */}
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-2">
             <span>Ep {entry.progress} of {episodes || '?'}</span>
             {entry.score > 0 && <span className="text-yellow-500 font-bold">★ {entry.score}</span>}
          </div>
          
          <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between h-8">
             <div className="text-xs text-zinc-500 font-medium truncate max-w-[120px] sm:max-w-none">
               {isLive ? (
                   <span className="text-red-500 font-bold flex items-center gap-1"><Radio size={12} className="animate-pulse" /> AIRING NOW</span>
               ) : (
                   timeRemaining || (entry.status === AnimeStatus.COMPLETED ? 'Completed' : '')
               )}
             </div>

             {!readOnly && entry.status !== AnimeStatus.COMPLETED && (
               <Button 
                  size="sm" 
                  className="rounded-full w-8 h-8 !p-0 flex items-center justify-center bg-white text-black hover:bg-zinc-200"
                  onClick={handleIncrement}
                  disabled={isUpdating}
               >
                 {isUpdating ? <Loader className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
               </Button>
             )}
             
             {entry.status === AnimeStatus.COMPLETED && (
               <div className="text-zinc-500 p-2">
                 <Check size={18} />
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
