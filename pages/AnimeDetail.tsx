
import React, { useEffect, useState } from 'react';
import { useStore } from '../services/store';
import { getAnimeById, getEpisodeRatings, getAnimeNews, AnimeNewsItem } from '../services/anilistService';
import { AnimeMetadata, EpisodeRating, AnimeStatus, UserAnimeEntry } from '../types';
import { Button } from '../components/ui/Button';
import { EpisodeRatingsChart } from '../components/EpisodeRatingsChart';
import { ArrowLeft, Plus, Star, Calendar, ExternalLink, MessageSquare, Share2, Edit3, ArrowUpRight, AlertCircle, Link, Twitter, Check, Heart } from 'lucide-react';

export const AnimeDetail = () => {
  const { selectedAnimeId, setView, library, openModal, user, toggleFavorite } = useStore();
  const [anime, setAnime] = useState<AnimeMetadata | null>(null);
  const [ratings, setRatings] = useState<EpisodeRating[]>([]);
  const [news, setNews] = useState<AnimeNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Share Menu State
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Check if in library
  const libraryEntry = library.find(l => l.animeId === selectedAnimeId);
  // Check if favorite
  const isFavorite = user?.favorites?.some(f => f.animeId === selectedAnimeId) || false;

  useEffect(() => {
    const loadData = async () => {
      if (!selectedAnimeId) return;
      setLoading(true);
      
      const [meta, newsData] = await Promise.all([
        getAnimeById(selectedAnimeId),
        getAnimeNews(selectedAnimeId)
      ]);
      
      setAnime(meta);
      setNews(newsData);

      if (meta) {
          const ratingData = await getEpisodeRatings(meta);
          setRatings(ratingData);
      }
      
      setLoading(false);
    };
    loadData();
  }, [selectedAnimeId]);

  const handleDirectAdd = () => {
    if (!anime) return;
    
    // Construct a temporary entry to pass to the modal for direct adding
    // The SearchAddFlow will detect this 'initialEntry' and skip the search step
    const tempEntry: UserAnimeEntry = {
        id: 'temp_id', // Placeholder, will be ignored by add logic
        animeId: anime.id,
        metadata: anime,
        status: AnimeStatus.WATCHING,
        progress: 0,
        score: 0,
        notes: '',
        updatedAt: Date.now()
    };
    
    openModal('ADD', tempEntry);
  };

  const handleShare = (platform: 'COPY' | 'TWITTER') => {
    if (!anime) return;
    
    const url = window.location.href; // In a real app this would be a permalink
    const text = `Check out ${anime.title.english || anime.title.romaji} on AniTrackr!`;

    if (platform === 'COPY') {
        navigator.clipboard.writeText(`${text} ${url}`);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    } else if (platform === 'TWITTER') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        setShowShareMenu(false);
    }
  };

  const handleFavorite = () => {
      if (anime) toggleFavorite(anime);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
    );
  }

  if (!anime) return <div>Anime not found</div>;

  return (
    <div className="animate-fade-in pb-12" onClick={() => setShowShareMenu(false)}>
      <Button variant="ghost" onClick={() => setView('DASHBOARD')} className="mb-4 pl-0 gap-2 hover:bg-transparent hover:text-rose-500">
         <ArrowLeft size={20} /> Back to Dashboard
      </Button>

      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 group">
         <img 
            src={anime.bannerImage || anime.coverImage.large} 
            className="w-full h-full object-cover blur-[2px] opacity-60 group-hover:scale-105 transition-transform duration-700" 
            alt="Banner" 
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
         
         <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex items-end gap-6">
            <img 
                src={anime.coverImage.large} 
                className="hidden md:block w-40 h-60 rounded-lg shadow-2xl border-4 border-zinc-900 object-cover" 
                alt="Poster" 
            />
            <div className="flex-1 mb-2">
                <div className="flex flex-wrap gap-2 mb-3">
                   {anime.genres.slice(0, 3).map(g => (
                       <span key={g} className="px-2 py-1 bg-rose-600/90 text-white text-xs font-bold rounded uppercase tracking-wider shadow-lg">
                           {g}
                       </span>
                   ))}
                   <span className="px-2 py-1 bg-zinc-800/80 text-zinc-300 text-xs font-bold rounded uppercase tracking-wider backdrop-blur-md">
                       {anime.seasonYear || 'Unknown Year'}
                   </span>
                   <span className="px-2 py-1 bg-zinc-800/80 text-zinc-300 text-xs font-bold rounded uppercase tracking-wider backdrop-blur-md">
                       {anime.format}
                   </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg">
                    {anime.title.english || anime.title.romaji}
                </h1>
                <p className="text-zinc-300 font-medium text-lg drop-shadow-md flex items-center gap-2">
                    {anime.studios.nodes[0]?.name}
                    {anime.averageScore && (
                        <>
                         <span className="w-1 h-1 bg-zinc-500 rounded-full"/>
                         <span className="text-green-400 flex items-center gap-1">
                             <Star size={16} fill="currentColor" /> {anime.averageScore}%
                         </span>
                        </>
                    )}
                </p>
            </div>
            
            <div className="hidden md:flex items-center gap-3 shrink-0 relative">
               <Button 
                   onClick={handleFavorite}
                   variant="secondary"
                   className={`rounded-full px-3 ${isFavorite ? 'text-red-500 bg-red-500/10 border-red-500/30' : 'bg-black/50 hover:bg-black/70 border-zinc-600'}`}
                   title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
               >
                   <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
               </Button>
               
               {libraryEntry ? (
                   <Button onClick={() => openModal('EDIT', libraryEntry)} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white shadow-lg">
                       <Edit3 size={18} className="mr-2" /> Update Progress
                   </Button>
               ) : (
                   <Button size="lg" onClick={handleDirectAdd} className="shadow-xl shadow-rose-600/20">
                       <Plus size={20} className="mr-2" /> Add to Shelf
                   </Button>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata, Synopsis, Charts */}
        <div className="lg:col-span-2 space-y-8">
            {/* Mobile Actions */}
            <div className="md:hidden flex gap-4">
               {libraryEntry ? (
                   <Button onClick={() => openModal('EDIT', libraryEntry)} variant="secondary" className="flex-1 bg-zinc-800 border-zinc-700 text-white">
                        <Edit3 size={18} className="mr-2" /> Update
                   </Button>
               ) : (
                   <Button size="lg" onClick={handleDirectAdd} className="flex-1 shadow-xl">
                       <Plus size={20} className="mr-2" /> Add to Shelf
                   </Button>
               )}
               
               <Button 
                   onClick={handleFavorite}
                   variant="secondary"
                   className={`px-4 ${isFavorite ? 'text-red-500 bg-red-500/10 border-red-500/30' : ''}`}
               >
                   <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
               </Button>

               <div className="relative">
                   <Button 
                        variant="secondary" 
                        className="px-4"
                        onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                   >
                       <Share2 size={20}/>
                   </Button>
                   {/* Mobile Share Dropdown */}
                   {showShareMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                            <button 
                                onClick={() => handleShare('COPY')}
                                className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300 flex items-center gap-2"
                            >
                                {linkCopied ? <Check size={16} className="text-green-500"/> : <Link size={16}/>}
                                {linkCopied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button 
                                onClick={() => handleShare('TWITTER')}
                                className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300 flex items-center gap-2 border-t border-zinc-800"
                            >
                                <Twitter size={16} /> Share on X
                            </button>
                        </div>
                    )}
               </div>
            </div>

             {/* Desktop Share Button (Floated right inside container if needed, or placed elsewhere) */}
             <div className="hidden md:flex justify-end mb-2 relative">
                 <Button 
                    variant="ghost" 
                    className="gap-2 text-zinc-400 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                 >
                     <Share2 size={18} /> Share
                 </Button>

                 {showShareMenu && (
                    <div className="absolute top-10 right-0 w-52 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                        <button 
                            onClick={() => handleShare('COPY')}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300 flex items-center gap-3 transition-colors"
                        >
                            <div className="p-1.5 bg-zinc-800 rounded-full text-white group-hover:bg-zinc-700">
                                {linkCopied ? <Check size={14} className="text-green-500"/> : <Link size={14}/>}
                            </div>
                            {linkCopied ? 'Link Copied!' : 'Copy Link'}
                        </button>
                        <button 
                            onClick={() => handleShare('TWITTER')}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-sm text-zinc-300 flex items-center gap-3 border-t border-zinc-800 transition-colors"
                        >
                            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-full">
                                <Twitter size={14} />
                            </div>
                            Share on X
                        </button>
                    </div>
                )}
             </div>

            <section>
                <h2 className="text-2xl font-bold text-white mb-4">Synopsis</h2>
                <div 
                    className="text-zinc-300 leading-relaxed text-lg prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: anime.description }}
                />
            </section>

            <section className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Episode Ratings <Star size={18} className="text-yellow-500" fill="currentColor"/>
                        </h2>
                        <p className="text-sm text-zinc-500">Source: OMDb / IMDb</p>
                    </div>
                </div>
                
                {ratings.length > 0 ? (
                    <EpisodeRatingsChart data={ratings} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                        <AlertCircle size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">Currently data is not available</p>
                        <p className="text-sm">It will be updated later</p>
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">Episodes</h2>
                {ratings.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-900 text-zinc-400 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-medium w-16">#</th>
                                <th className="p-4 font-medium w-16">Image</th>
                                <th className="p-4 font-medium">Title</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Rating</th>
                                <th className="p-4 font-medium text-right">Votes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
                            {ratings.map(ep => (
                                <tr key={ep.episode} className="hover:bg-zinc-800/50 transition-colors group">
                                    <td className="p-4 text-zinc-500 font-mono">{ep.episode}</td>
                                    <td className="p-4">
                                        <div className="w-16 h-9 bg-zinc-800 rounded overflow-hidden">
                                            {ep.thumbnail && (
                                                <img src={ep.thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-white group-hover:text-rose-400 transition-colors">
                                        {ep.title}
                                    </td>
                                    <td className="p-4 text-zinc-400 text-sm">{ep.airDate}</td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-1 text-yellow-500 font-bold">
                                            <Star size={14} fill="currentColor"/> {ep.rating}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-zinc-500 text-sm">
                                        {ep.votes.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                ) : (
                    <div className="bg-zinc-900/30 rounded-xl border border-zinc-800 p-12 text-center text-zinc-500 flex flex-col items-center">
                         <p>Episode list unavailable.</p>
                    </div>
                )}
            </section>
        </div>

        {/* Right Column: News Sidebar */}
        <div className="lg:col-span-1 space-y-8">
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="text-rose-500" />
                    <h2 className="text-xl font-bold text-white">Related News 📰</h2>
                </div>
                
                <div className="space-y-4">
                    {news.map(item => (
                        <a 
                            key={item.id} 
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative bg-zinc-900/40 hover:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800/50 hover:border-zinc-700 transition-all group duration-300"
                        >
                            {/* Image Container */}
                            <div className="relative h-44 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"/>
                                <img 
                                    src={item.image} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=600&auto=format&fit=crop";
                                    }}
                                />
                                {/* Source Badge - Top Left */}
                                <div className="absolute top-3 left-3 z-20">
                                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 shadow-sm flex items-center gap-1">
                                         {item.source}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-4 relative">
                                {/* Tag & Date Row */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                        {item.tag}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                                        <Calendar size={10} /> {item.date}
                                    </span>
                                </div>

                                {/* Title */}
                                <h4 className="text-white font-bold leading-snug group-hover:text-rose-400 transition-colors line-clamp-2 text-base">
                                    {item.title}
                                </h4>
                                
                                {/* Read More link visual */}
                                <div className="mt-3 flex items-center text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors font-medium">
                                    Read article <ArrowUpRight size={14} className="ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};
