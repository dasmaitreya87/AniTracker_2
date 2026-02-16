
import React, { useState, useEffect } from 'react';
import { X, Search, Loader, Plus, Save, Info, AlertTriangle, Check, User, ArrowRight, Trash2 } from 'lucide-react';
import { searchAnime } from '../services/anilistService';
import { generateAnimeBlurb } from '../services/geminiService';
import { AnimeMetadata, AnimeStatus, UserAnimeEntry, UserProfile } from '../types';
import { useStore } from '../services/store';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ADD' | 'EDIT';
  initialEntry?: UserAnimeEntry;
}

export const SearchAddFlow: React.FC<Props> = ({ isOpen, onClose, mode, initialEntry }) => {
  const { addAnime, updateAnime, viewAnimeDetails, user, library, searchUsers, viewUserProfile, deleteAnime } = useStore();
  const [step, setStep] = useState<'SEARCH' | 'CONFIRM'>('SEARCH');
  const [searchType, setSearchType] = useState<'ANIME' | 'USER'>('ANIME');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeMetadata[]>([]);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<AnimeMetadata | null>(null);
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  
  // Confirm form state
  const [status, setStatus] = useState<AnimeStatus>(AnimeStatus.WATCHING);
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState<number | string>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialEntry) {
        setStep('CONFIRM');
        setSelectedAnime(initialEntry.metadata);
        setStatus(mode === 'EDIT' ? initialEntry.status : AnimeStatus.WATCHING);
        setProgress(mode === 'EDIT' ? initialEntry.progress : 0);
        setScore(mode === 'EDIT' ? initialEntry.score : 0);
        setResults([]);
        setUserResults([]);
        setQuery('');
      } else {
        setStep('SEARCH');
        setQuery('');
        setResults([]);
        setUserResults([]);
        setSelectedAnime(null);
        setStatus(AnimeStatus.WATCHING);
        setProgress(0);
        setScore(0);
        setNsfwEnabled(!!user?.showAdultContent);
        setSearchType('ANIME');
      }
    }
  }, [isOpen, mode, initialEntry, user?.showAdultContent]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (step === 'SEARCH' && query.trim().length > 2) {
        setLoading(true);
        if (searchType === 'ANIME') {
            const data = await searchAnime(query, nsfwEnabled);
            setResults(data);
        } else {
            const users = await searchUsers(query);
            setUserResults(users);
        }
        setLoading(false);
      } else if (query.trim().length <= 2) {
          setResults([]);
          setUserResults([]);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [query, step, nsfwEnabled, searchType]);

  const handleSelect = (anime: AnimeMetadata) => {
    setSelectedAnime(anime);
    setStep('CONFIRM');
    setProgress(0);
    setStatus(AnimeStatus.WATCHING);
  };

  const handleUserClick = (userId: string) => {
      viewUserProfile(userId);
      onClose();
  };

  const handleInfoClick = () => {
    if (selectedAnime) {
        viewAnimeDetails(selectedAnime.id);
        onClose();
    }
  };

  const handleDelete = () => {
    if (initialEntry) {
        deleteAnime(initialEntry.id);
        onClose();
    }
  };

  const handleConfirm = async () => {
    if (!selectedAnime) return;
    setIsProcessing(true);

    const numericScore = typeof score === 'string' ? parseFloat(score) || 0 : score;
    const finalProgress = Math.min(Math.max(0, progress), selectedAnime.episodes || 9999);
    const finalScore = Math.min(Math.max(0, numericScore), 10);

    if (mode === 'EDIT' && initialEntry) {
        updateAnime(initialEntry.id, {
            status,
            progress: finalProgress,
            score: finalScore,
            updatedAt: Date.now()
        });
    } else {
        let aiBlurbs: string[] = [];
        if (selectedAnime.description) {
            aiBlurbs = await generateAnimeBlurb(
                selectedAnime.title.english || selectedAnime.title.romaji,
                selectedAnime.description
            );
        }

        const newEntry: UserAnimeEntry = {
          id: crypto.randomUUID(),
          animeId: selectedAnime.id,
          metadata: selectedAnime,
          status,
          progress: finalProgress,
          score: finalScore,
          notes: '',
          updatedAt: Date.now(),
          aiBlurb: aiBlurbs
        };
        addAnime(newEntry);
    }

    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-zinc-900 w-full max-w-2xl rounded-lg shadow-2xl border border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black">
          <h2 className="text-xl font-bold text-white">
            {mode === 'EDIT' ? 'Update Progress' : (step === 'SEARCH' ? 'Find...' : 'Details & Progress')}
          </h2>
          <div className="flex items-center gap-3">
            {step === 'SEARCH' && searchType === 'ANIME' && user?.showAdultContent && (
                <button 
                  onClick={() => setNsfwEnabled(!nsfwEnabled)}
                  className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border transition-colors ${nsfwEnabled ? 'text-red-500 border-red-500 bg-red-500/10' : 'text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}
                  title="Toggle 18+ Content"
                >
                    <AlertTriangle size={14} /> NSFW
                </button>
            )}
            
            {step === 'CONFIRM' && selectedAnime && (
                <button 
                    onClick={handleInfoClick}
                    className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                    title="View Full Details Page"
                >
                    <Info size={24} />
                </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-900">
          {step === 'SEARCH' ? (
            <div className="space-y-4">
              <div className="flex gap-2 mb-2">
                 <button 
                   onClick={() => { setSearchType('ANIME'); setQuery(''); setResults([]); }}
                   className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${searchType === 'ANIME' ? 'border-rose-500 text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                 >
                   Anime & Movies
                 </button>
                 <button 
                   onClick={() => { setSearchType('USER'); setQuery(''); setUserResults([]); }}
                   className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${searchType === 'USER' ? 'border-rose-500 text-white' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                 >
                   People
                 </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
                <Input 
                  placeholder={searchType === 'ANIME' ? "Titles, characters, genres..." : "Search username..."}
                  className="pl-10 h-12 text-lg bg-black border-zinc-800 rounded-none focus:border-red-600"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {loading && <div className="text-center py-8 text-zinc-500"><Loader className="animate-spin inline mr-2"/> Searching...</div>}

              {searchType === 'ANIME' ? (
                <div className="grid grid-cols-1 gap-1">
                    {results.map(anime => {
                    const isAdded = library.some(l => l.animeId === anime.id);
                    return (
                        <button 
                        key={anime.id}
                        onClick={() => !isAdded && handleSelect(anime)}
                        disabled={isAdded}
                        className={`flex items-center gap-4 p-3 hover:bg-zinc-800 transition-colors text-left group border-b border-zinc-800 last:border-0 ${isAdded ? 'opacity-60 cursor-default' : ''}`}
                        >
                        <img 
                            src={anime.coverImage.medium} 
                            alt="" 
                            className="w-12 h-16 object-cover rounded-sm shadow-sm"
                        />
                        <div className="flex-1">
                            <h4 className="font-semibold text-white group-hover:text-red-500 transition-colors flex items-center gap-2">
                            {anime.title.english || anime.title.romaji}
                            {isAdded && <span className="text-[10px] bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">Added</span>}
                            </h4>
                            <p className="text-sm text-zinc-500">
                            {anime.seasonYear} • {anime.studios.nodes[0]?.name || 'Unknown Studio'}
                            {anime.genres.includes('Hentai') && <span className="ml-2 text-xs text-red-500 border border-red-500 px-1 rounded">18+</span>}
                            </p>
                        </div>
                        {isAdded ? <Check className="text-green-500" /> : <Plus className="text-zinc-600 group-hover:text-white" />}
                        </button>
                    );
                    })}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                    {userResults.map(u => (
                        <button 
                            key={u.id}
                            onClick={() => handleUserClick(u.id)}
                            className="flex items-center gap-4 p-3 hover:bg-zinc-800 transition-colors text-left group border-b border-zinc-800 last:border-0"
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800">
                                <img src={u.avatarUrl} alt="" className="w-full h-full object-cover"/>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-white group-hover:text-rose-500 transition-colors">
                                    {u.username}
                                </h4>
                                <p className="text-xs text-zinc-500 line-clamp-1">{u.bio || 'Anime fan'}</p>
                            </div>
                            <ArrowRight size={18} className="text-zinc-600 group-hover:text-white" />
                        </button>
                    ))}
                </div>
              )}
              
              {!loading && query.length > 2 && (searchType === 'ANIME' ? results.length === 0 : userResults.length === 0) && (
                   <p className="text-center text-zinc-500 py-4">No matches found.</p>
              )}
            </div>
          ) : (
            selectedAnime && (
              <div className="space-y-6">
                <div className="flex gap-4">
                   <img src={selectedAnime.coverImage.large} className="w-32 h-48 object-cover rounded shadow-lg" alt="Cover" />
                   <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{selectedAnime.title.english || selectedAnime.title.romaji}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedAnime.genres.slice(0,3).map(g => (
                          <span key={g} className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300">{g}</span>
                        ))}
                      </div>
                      <p className="text-sm text-zinc-400 line-clamp-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedAnime.description }} />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black p-4 rounded border border-zinc-800">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Status</label>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      value={status}
                      onChange={(e) => {
                        const newStatus = e.target.value as AnimeStatus;
                        setStatus(newStatus);
                        if (newStatus === AnimeStatus.COMPLETED && selectedAnime.episodes) {
                            setProgress(selectedAnime.episodes);
                        }
                      }}
                    >
                      {Object.values(AnimeStatus).map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                       Progress (Episodes)
                    </label>
                    <div className="flex items-center gap-3">
                       <Input 
                         type="number" 
                         min="0" 
                         max={selectedAnime.episodes || 9999}
                         value={progress}
                         className="bg-zinc-900 border-zinc-700"
                         onChange={(e) => {
                             let val = parseInt(e.target.value) || 0;
                             const max = selectedAnime.episodes || 9999;
                             if (val > max) val = max;
                             if (val < 0) val = 0;
                             setProgress(val);
                             if (selectedAnime.episodes && val < selectedAnime.episodes && status === AnimeStatus.COMPLETED) {
                                 setStatus(AnimeStatus.WATCHING);
                             }
                             if (selectedAnime.episodes && val === selectedAnime.episodes) {
                                 setStatus(AnimeStatus.COMPLETED);
                             }
                         }}
                       />
                       <span className="text-zinc-500 whitespace-nowrap">
                         / {selectedAnime.episodes || '?'}
                       </span>
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Score (0-10)
                     </label>
                     <Input 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.1"
                        value={score}
                        className="bg-zinc-900 border-zinc-700"
                        onChange={(e) => {
                           const valStr = e.target.value;
                           if (valStr.includes('.') && valStr.split('.')[1].length > 1) { return; }
                           setScore(valStr);
                        }}
                        onBlur={() => {
                            const val = parseFloat(score.toString()) || 0;
                            let clamped = val;
                            if (val > 10) clamped = 10;
                            if (val < 0) clamped = 0;
                            clamped = Math.floor(clamped * 10) / 10;
                            setScore(clamped);
                        }}
                     />
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between gap-3 bg-black">
          {step === 'CONFIRM' && mode === 'EDIT' && initialEntry ? (
              <Button 
                variant="danger" 
                onClick={handleDelete} 
                className="bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/50 hover:border-red-500/50"
                title="Remove from Library"
              >
                  <Trash2 size={18} />
              </Button>
          ) : (
             <div></div> 
          )}

          <div className="flex gap-3">
            {step === 'CONFIRM' && mode === 'ADD' && !initialEntry && (
                <Button variant="ghost" onClick={() => setStep('SEARCH')}>Back</Button>
            )}
            {step === 'CONFIRM' ? (
                <Button onClick={handleConfirm} isLoading={isProcessing} className={mode === 'EDIT' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20' : ''}>
                {mode === 'EDIT' ? (
                    <><Save size={18} className="mr-2"/> Save Changes</>
                ) : (
                    'Add to Library'
                )}
                </Button>
            ) : (
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
