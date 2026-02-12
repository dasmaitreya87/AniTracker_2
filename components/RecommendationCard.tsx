import React from 'react';
import { Recommendation } from '../types';
import { Button } from './ui/Button';
import { Plus, Info, ThumbsDown, Check } from 'lucide-react';

interface Props {
  item: Recommendation;
  onAdd: (rec: Recommendation) => void;
  onInfo: (id: number) => void;
  onFeedback: (id: number, action: 'like' | 'dislike') => void;
  isAdded: boolean;
}

export const RecommendationCard: React.FC<Props> = ({ item, onAdd, onInfo, onFeedback, isAdded }) => {
  return (
    <div className="group relative w-72 shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden flex flex-col snap-start">
       {/* Poster Area */}
       <div className="relative h-40 overflow-hidden cursor-pointer" onClick={() => onInfo(item.animeId)}>
           <img 
             src={item.coverImage} 
             alt={item.title} 
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
           
           {/* Badges */}
           <div className="absolute top-2 left-2 flex gap-1">
              <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur text-[10px] font-bold text-white rounded border border-white/10">
                {item.type}
              </span>
              <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur text-[10px] font-bold text-zinc-300 rounded border border-white/10">
                {item.year}
              </span>
              {item.confidence && (
                  <span className="px-1.5 py-0.5 bg-green-500/20 backdrop-blur text-[10px] font-bold text-green-400 rounded border border-green-500/30">
                    {item.confidence}% Match
                  </span>
              )}
           </div>

           {/* Hover Actions Overlay */}
           <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
               {isAdded ? (
                   <span className="flex items-center gap-2 text-green-500 font-bold bg-black/50 px-3 py-1.5 rounded-full border border-green-500/30">
                       <Check size={16} /> Added
                   </span>
               ) : (
                   <Button 
                     size="sm" 
                     onClick={(e) => { e.stopPropagation(); onAdd(item); }} 
                     className="rounded-full w-10 h-10 !p-0 flex items-center justify-center shadow-lg"
                     title="Add to Shelf"
                   >
                       <Plus size={20} />
                   </Button>
               )}
               <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={(e) => { e.stopPropagation(); onInfo(item.animeId); }} 
                  className="rounded-full w-10 h-10 !p-0 flex items-center justify-center border-zinc-500 bg-black/40 hover:bg-white hover:text-black"
                  title="More Info"
               >
                   <Info size={20} />
               </Button>
           </div>
       </div>

       {/* Content */}
       <div className="p-4 flex flex-col flex-1 justify-between">
           <div>
               <h4 
                 className="font-bold text-white leading-tight mb-2 line-clamp-1 cursor-pointer hover:text-rose-500 transition-colors"
                 onClick={() => onInfo(item.animeId)}
                 title={item.title}
               >
                   {item.title}
               </h4>
               
               <div className="flex flex-wrap gap-1 mb-3">
                   {item.genres.map(g => (
                       <span key={g} className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                           {g}
                       </span>
                   ))}
               </div>

               <p className="text-xs text-zinc-400 italic leading-relaxed border-l-2 border-rose-500 pl-2 mb-4">
                  Gemini: "{item.reason}"
               </p>
           </div>

           {/* Feedback Controls */}
           <div className="flex items-center justify-end border-t border-zinc-800 pt-3 mt-auto relative z-10">
               <button 
                 type="button"
                 onClick={(e) => { e.stopPropagation(); onFeedback(item.animeId, 'dislike'); }}
                 className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                 aria-label="Mark recommendation as not interested"
               >
                   <ThumbsDown size={14} /> Not Interested
               </button>
           </div>
       </div>
    </div>
  );
};
