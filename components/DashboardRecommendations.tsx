import React, { useEffect, useState } from 'react';
import { useStore } from '../services/store';
import { fetchRecommendations } from '../services/recommendationService';
import { Recommendation } from '../types';
import { RecommendationCard } from './RecommendationCard';
import { Sparkles, ChevronRight, ChevronLeft, Film, Tv } from 'lucide-react';
import { UserAnimeEntry, AnimeStatus } from '../types';

export const DashboardRecommendations = () => {
  const { user, library, openModal, addAnime, handleRecommendationFeedback, viewAnimeDetails } = useStore();
  const [seriesRecs, setSeriesRecs] = useState<Recommendation[]>([]);
  const [movieRecs, setMovieRecs] = useState<Recommendation[]>([]);
  const [signals, setSignals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate if user has watched anything to gate recommendations
  const totalEpisodesWatched = library.reduce((acc, curr) => acc + curr.progress, 0);
  const hasWatched = totalEpisodesWatched > 0;

  // Load Recs on mount. 
  useEffect(() => {
    // Optimization: Don't fetch if user hasn't watched anything yet
    if (!hasWatched) {
        setLoading(false);
        return;
    }

    const load = async () => {
        setLoading(true);
        const [series, movies] = await Promise.all([
            fetchRecommendations(user, library, 'TV'),
            fetchRecommendations(user, library, 'MOVIE')
        ]);
        setSeriesRecs(series.recommendations);
        setMovieRecs(movies.recommendations);
        setSignals(series.signals);
        setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasWatched]); 

  const handleAdd = (rec: Recommendation) => {
      const entry: UserAnimeEntry = {
        id: crypto.randomUUID(),
        animeId: rec.animeId,
        metadata: rec.metadata,
        status: AnimeStatus.PLAN_TO_WATCH,
        progress: 0,
        score: 0,
        notes: '',
        updatedAt: Date.now()
      };
      openModal('ADD', entry);
  };

  const handleFeedback = (id: number, action: 'like' | 'dislike') => {
      // 1. Record feedback in store (updates user profile)
      handleRecommendationFeedback(id, action);
      
      // 2. If dislike, remove from view immediately
      if (action === 'dislike') {
          setSeriesRecs(prev => prev.filter(r => r.animeId !== id));
          setMovieRecs(prev => prev.filter(r => r.animeId !== id));
      }
  };

  // Helper for rendering a row
  const RecoRow = ({ title, icon: Icon, items }: { title: string, icon: any, items: Recommendation[] }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = 300;
            scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
        }
    };

    if (items.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Icon className="text-rose-500" size={20} /> {title}
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => scroll('left')} className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => scroll('right')} className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
            >
                {items.map(rec => (
                    <RecommendationCard 
                        key={rec.animeId} 
                        item={rec} 
                        onAdd={handleAdd}
                        onInfo={viewAnimeDetails}
                        onFeedback={handleFeedback}
                        isAdded={library.some(l => l.animeId === rec.animeId)}
                    />
                ))}
            </div>
        </div>
    );
  };

  if (!hasWatched) return null;

  if (loading) {
      return (
          <div className="space-y-8 animate-pulse">
              <div className="h-8 w-48 bg-zinc-800 rounded"></div>
              <div className="flex gap-4 overflow-hidden">
                  {[1,2,3].map(i => <div key={i} className="w-72 h-64 bg-zinc-800 rounded-xl shrink-0"></div>)}
              </div>
          </div>
      );
  }

  if (seriesRecs.length === 0 && movieRecs.length === 0) return null;

  return (
    <div className="animate-fade-in mt-8 border-t border-zinc-800 pt-8">
        <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-yellow-500" size={24} />
            <div>
                <h2 className="text-2xl font-bold text-white">Recommendations for You</h2>
                <p className="text-sm text-zinc-400">
                    Based on: <span className="text-rose-400 font-medium">{signals.join(', ')}</span>
                </p>
            </div>
        </div>

        <RecoRow title="Recommended Series for you 🎯" icon={Tv} items={seriesRecs} />
        <RecoRow title="Recommended Movies for you 🎬" icon={Film} items={movieRecs} />
    </div>
  );
};
