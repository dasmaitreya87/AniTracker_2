
import React, { useEffect, useState, useRef } from 'react';
import { getTrendingAnime, getAiringAnime, getTrendingMovies } from '../services/anilistService';
import { AnimeMetadata, Badge } from '../types';
import { BADGES_CATALOG } from '../constants';
import { Button } from './ui/Button';
import { LoginModal } from './LoginModal';
import { AddNewsModal } from './AddNewsModal'; // Import News Modal
import { NewsCard } from './NewsCard'; // Import News Card
import { useStore } from '../services/store';
import { SocialProofTicker } from './SocialProofTicker';
import { UserMenu } from './UserMenu'; // New Component
import { 
  Plus, ChevronRight, ChevronLeft, Info, TrendingUp, Calendar, Star, LayoutDashboard, Award, Newspaper, Search
} from 'lucide-react';

interface LandingPageProps {
  onAddAnime?: (anime: AnimeMetadata) => void;
}

const FeatureCard: React.FC<{ icon?: any; title: string; desc: string; emoji: string; badge?: string }> = ({ icon: Icon, title, desc, emoji, badge }) => (
  <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all group hover:bg-zinc-900 relative overflow-hidden">
    {badge && (
      <div className="absolute top-0 left-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-br-xl shadow-sm uppercase tracking-wider z-10">
        {badge}
      </div>
    )}
    <div className={`text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg ${badge ? 'mt-2' : ''}`}>
      {emoji}
    </div>
    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">
      {title}
    </h3>
    <p className="text-zinc-400 text-sm leading-relaxed">
      {desc}
    </p>
  </div>
);

const LandingBadgeCard: React.FC<{ badge: Badge }> = ({ badge }) => {
  const tierColors = {
    BRONZE: 'border-orange-700/50 bg-orange-900/10 text-orange-200',
    SILVER: 'border-slate-400/50 bg-slate-800/30 text-slate-200',
    GOLD: 'border-yellow-500/50 bg-yellow-900/10 text-yellow-200'
  };

  const tierGlow = {
    BRONZE: 'shadow-orange-900/20',
    SILVER: 'shadow-slate-500/20',
    GOLD: 'shadow-yellow-500/20'
  };

  return (
    <div className={`
      relative flex flex-col items-center justify-center p-4 rounded-xl border-2 
      ${tierColors[badge.tier]} 
      ${tierGlow[badge.tier]} shadow-xl 
      transition-all hover:scale-105 hover:bg-zinc-800/80 group h-full
    `}>
      <div className="text-4xl mb-3 drop-shadow-md transform group-hover:-translate-y-1 transition-transform">
        {badge.emoji}
      </div>
      
      <h4 className="font-bold text-sm text-center mb-1 text-white">{badge.name}</h4>
      
      <p className="text-[10px] text-center opacity-70 px-2 leading-tight">
        {badge.description}
      </p>

      {/* Tier Badge */}
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${badge.tier === 'GOLD' ? 'bg-yellow-500' : badge.tier === 'SILVER' ? 'bg-slate-400' : 'bg-orange-700'}`}></div>
    </div>
  );
};

const PublicAnimeCard: React.FC<{ anime: AnimeMetadata; compact?: boolean; onAdd: () => void; onInfo: () => void }> = ({ anime, compact = false, onAdd, onInfo }) => {
  const isAiring = anime.status === 'RELEASING';
  const isMovie = anime.format === 'MOVIE';

  return (
    <div className={`relative group shrink-0 ${compact ? 'w-40' : 'w-56'} snap-start cursor-pointer transition-all duration-300 hover:z-20 hover:-translate-y-1`}>
      <div className={`relative overflow-hidden rounded-2xl bg-zinc-800 shadow-lg ${compact ? 'h-56' : 'h-80'}`}>
        <img 
          src={anime.coverImage.large} 
          alt={anime.title.english || anime.title.romaji} 
          loading="lazy"
          className="w-full h-full object-cover"
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Status Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
             {isAiring && (
              <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                 AIRING
              </div>
            )}
            {isMovie && (
                <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                    MOVIE
                </div>
            )}
        </div>

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-[2px]">
           <Button 
             onClick={(e) => { e.stopPropagation(); onAdd(); }} 
             className="rounded-full w-12 h-12 flex items-center justify-center !p-0 border-2 border-white bg-black/50 hover:bg-white hover:text-black hover:scale-110 transition-all"
             title="Add to My Shelf"
           >
             <Plus size={24} />
           </Button>
           <Button 
             onClick={(e) => { e.stopPropagation(); onInfo(); }} 
             variant="glass"
             className="rounded-full w-12 h-12 flex items-center justify-center !p-0 border border-white/30 hover:bg-white hover:text-black hover:scale-110 transition-all"
             title="More Info"
           >
             <Info size={24} />
           </Button>
        </div>
        
        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-4">
           <h4 className="text-white font-bold text-sm line-clamp-1 drop-shadow-md group-hover:text-rose-300 transition-colors">
             {anime.title.english || anime.title.romaji}
           </h4>
           <div className="flex items-center gap-2 mt-1">
             <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5">
                <Star size={10} fill="currentColor" /> {Math.round(anime.averageScore || 75)}%
             </span>
             <span className="text-[10px] text-zinc-300 px-1.5 py-0.5 bg-zinc-800/80 rounded backdrop-blur-sm border border-zinc-700">
                {isMovie && anime.duration ? `${anime.duration}m` : (anime.format || 'TV')}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className={`shrink-0 ${compact ? 'w-40 h-56' : 'w-56 h-80'} bg-zinc-800 rounded-2xl animate-pulse`}></div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onAddAnime }) => {
  // Use store safely
  let store;
  try { store = useStore(); } catch (e) {}

  const isAuthenticated = store?.isAuthenticated || false;
  const setView = store?.setView || (() => {});
  const viewAnimeDetails = store?.viewAnimeDetails || (() => {});
  const openAddNewsModal = store?.openAddNewsModal || (() => {});
  const openModal = store?.openModal || (() => {});
  const newsPosts = store?.newsPosts || [];

  const [trending, setTrending] = useState<AnimeMetadata[]>([]);
  const [movies, setMovies] = useState<AnimeMetadata[]>([]);
  const [airing, setAiring] = useState<AnimeMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'TV' | 'MOVIE'>('ALL');

  const trendingRef = useRef<HTMLDivElement>(null);
  const airingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [trendData, airData, movieData] = await Promise.all([
        getTrendingAnime(),
        getAiringAnime(),
        getTrendingMovies()
      ]);
      setTrending(trendData);
      setAiring(airData);
      setMovies(movieData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getDisplayList = () => {
    if (filter === 'MOVIE') return movies;
    if (filter === 'TV') return trending.filter(t => t.format !== 'MOVIE');
    return trending;
  };

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
      if (ref.current) {
          const scrollAmount = ref.current.clientWidth * 0.75;
          ref.current.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
      }
  };

  const handleAddClick = (anime: AnimeMetadata) => {
      if (isAuthenticated && onAddAnime) {
          onAddAnime(anime);
      } else {
          setShowLogin(true);
      }
  };

  const handleInfoClick = (id: number) => {
      if (isAuthenticated) {
          viewAnimeDetails(id);
      } else {
          setShowLogin(true);
      }
  };

  const handleAddNewsClick = () => {
      if (isAuthenticated) {
          openAddNewsModal();
      } else {
          setShowLogin(true);
      }
  };

  const heroAnime = filter === 'MOVIE' && movies.length > 0 ? movies[0] : trending[0];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-rose-500 selection:text-white pb-20">
      {/* Top Nav - Fixed, Z-50, Blurred */}
      <nav className="fixed w-full top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5 transition-all duration-500">
        
        {/* Social Proof Ticker */}
        <SocialProofTicker />

        <div className="max-w-[1920px] mx-auto px-4 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
             <button 
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setFilter('ALL'); }}
                className="text-3xl font-brand text-rose-500 hover:text-rose-400 focus:outline-none tracking-tight transition-colors"
                aria-label="Go to AniTrackr home"
             >
               AniTrackr
             </button>
             {/* Desktop Menu Links */}
             <div className="hidden md:flex gap-1 text-sm font-medium bg-zinc-900/50 p-1 rounded-full border border-white/10 backdrop-blur-md">
               <button 
                 onClick={() => setFilter('ALL')} 
                 className={`px-4 py-1.5 rounded-full transition-all ${filter === 'ALL' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
               >
                 Home
               </button>
               <button 
                 onClick={() => setFilter('TV')} 
                 className={`px-4 py-1.5 rounded-full transition-all ${filter === 'TV' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
               >
                 Series
               </button>
               <button 
                 onClick={() => setFilter('MOVIE')} 
                 className={`px-4 py-1.5 rounded-full transition-all ${filter === 'MOVIE' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
               >
                 Movies
               </button>
               
               {/* Add News Button */}
               <button 
                 onClick={handleAddNewsClick} 
                 className="px-4 py-1.5 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
               >
                 <Plus size={14} /> Add News
               </button>
             </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
                <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => openModal('ADD')} 
                    className="text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-full w-10 h-10 flex items-center justify-center !p-0 mr-2"
                    title="Search Anime"
                >
                    <Search size={20} />
                </Button>
            )}

            {isAuthenticated ? (
               <div className="flex items-center gap-4">
                  <Button size="sm" onClick={() => setView('DASHBOARD')} className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                     <LayoutDashboard size={16} /> Dashboard
                  </Button>
                  <UserMenu />
               </div>
            ) : (
                <Button size="sm" onClick={() => setShowLogin(true)} className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-6 py-2 rounded-full shadow-lg shadow-rose-900/20">
                    Sign In
                </Button>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <div className="relative w-full min-h-[90vh] flex items-center pt-32 pb-20 overflow-hidden bg-zinc-900">
           {/* Background Layer */}
           {heroAnime ? (
             <div className="absolute inset-0 w-full h-full z-0">
               <img 
                 src={heroAnime.bannerImage || heroAnime.coverImage.large} 
                 className="w-full h-full object-cover opacity-70 scale-105" 
                 alt="Hero Background" 
               />
               {/* Improved contrast gradients - Lighter to show image */}
               <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
             </div>
           ) : (
             <div className="absolute inset-0 bg-zinc-900 z-0" />
           )}
           
           {/* Hero Content - Centered Container */}
           <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full">
              <div className="max-w-3xl">
                  {heroAnime && (
                      <div className="flex gap-3 mb-6 animate-fade-in">
                          {heroAnime.format === 'MOVIE' && <span className="bg-indigo-500/80 backdrop-blur px-3 py-1 text-xs font-bold rounded-lg border border-indigo-400/30 shadow-lg">MOVIE</span>}
                          {heroAnime.status === 'RELEASING' && <span className="bg-rose-500/80 backdrop-blur px-3 py-1 text-xs font-bold rounded-lg border border-rose-400/30 shadow-lg">NEW EPISODE</span>}
                      </div>
                  )}
                  
                  <h1 
                    aria-level={1}
                    className="text-[clamp(2.5rem,6vw,5.5rem)] font-extrabold mb-6 leading-none tracking-tight drop-shadow-2xl text-white break-keep whitespace-normal"
                  >
                    {heroAnime ? (heroAnime.title.english || heroAnime.title.romaji) : "Your Anime Journey Starts Here."}
                  </h1>
                  
                  <h2 className="text-xl md:text-2xl text-rose-200 font-medium mb-4 drop-shadow-md">
                    Track episode-by-episode, collect badges, and share your shelf!
                  </h2>

                  <p 
                    id="hero-desc"
                    className="text-lg text-zinc-300 drop-shadow-md line-clamp-3 mb-8 leading-relaxed max-w-xl font-medium"
                  >
                    {heroAnime 
                      ? (heroAnime.description || "").replace(/<[^>]*>?/gm, '') 
                      : "Join the cutest community of anime fans. Track your progress, discover hidden gems, and get AI-powered recommendations."}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                        size="lg" 
                        onClick={() => heroAnime && handleAddClick(heroAnime)} 
                        className="px-6 py-3 rounded-xl text-lg hover:scale-105 transition-transform bg-rose-500 hover:bg-rose-400 shadow-xl shadow-rose-500/20"
                        title="Add this anime to your shelf"
                    >
                      <Plus className="mr-2" size={24} /> Add to My Shelf
                    </Button>
                    <Button 
                        size="lg" 
                        variant="secondary"
                        onClick={() => handleInfoClick(heroAnime?.id || 0)} 
                        className="px-6 py-3 rounded-xl text-lg hover:scale-105 transition-transform bg-zinc-800/80 text-zinc-100 border border-zinc-700 hover:bg-zinc-700/90 backdrop-blur-md"
                    >
                      <Info className="mr-2" size={24} /> More Info
                    </Button>
                  </div>
              </div>
           </div>
        </div>

        {/* Content Section */}
        <div className="relative z-20 space-y-20 pb-20 bg-black">
            
            {/* Trending / Filtered Strip */}
            <section className="px-6 md:px-12 pt-8 group/trending">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-white group cursor-pointer w-fit">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {filter === 'MOVIE' ? 'Trending Movies' : (filter === 'TV' ? 'Popular Series' : 'Trending Now')}
                            <ChevronRight size={24} className="text-rose-500 group-hover:translate-x-1 transition-transform" />
                        </h2>
                    </div>
                    {/* Navigation Buttons */}
                    <div className="hidden md:flex gap-2 opacity-0 group-hover/trending:opacity-100 transition-opacity duration-300">
                        <button 
                            onClick={() => scroll(trendingRef, 'left')}
                            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-zinc-500 transition-all shadow-lg backdrop-blur"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={() => scroll(trendingRef, 'right')}
                            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-zinc-500 transition-all shadow-lg backdrop-blur"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div 
                    ref={trendingRef}
                    className="flex overflow-x-auto gap-4 pb-8 snap-x scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth"
                >
                    {loading 
                    ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : getDisplayList().map(anime => (
                        <PublicAnimeCard 
                            key={anime.id} 
                            anime={anime} 
                            onAdd={() => handleAddClick(anime)} 
                            onInfo={() => handleInfoClick(anime.id)}
                        />
                    ))
                    }
                    {!loading && getDisplayList().length === 0 && (
                    <div className="h-64 w-full flex items-center justify-center text-zinc-500 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
                        No content found for this category right now.
                    </div>
                    )}
                </div>
            </section>

             {/* News Feed - DYNAMIC */}
             <section className="px-6 md:px-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Newspaper className="text-rose-500" />
                        <h2 className="text-2xl font-bold text-white">Latest Anime News 📰</h2>
                    </div>
                    {/* Mobile Only Add Button */}
                    <button 
                        onClick={handleAddNewsClick} 
                        className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600/10 text-rose-500 text-xs font-bold border border-rose-600/20 active:scale-95 transition-all shadow-sm hover:bg-rose-600/20"
                    >
                        <Plus size={14} /> 
                        <span>Add News</span>
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {newsPosts.map(post => (
                        <NewsCard key={post.id} post={post} />
                    ))}
                    {newsPosts.length === 0 && (
                         <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
                             <p className="text-zinc-500 mb-2">No news yet.</p>
                             <Button onClick={handleAddNewsClick} variant="secondary">Be the first to post!</Button>
                         </div>
                    )}
                </div>
            </section>

            {/* Now Airing */}
            <section className="px-6 md:px-12 group/airing">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white pl-1">Live & Upcoming</h2>
                     {/* Navigation Buttons */}
                     <div className="hidden md:flex gap-2 opacity-0 group-hover/airing:opacity-100 transition-opacity duration-300">
                        <button 
                            onClick={() => scroll(airingRef, 'left')}
                            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-zinc-500 transition-all shadow-lg backdrop-blur"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={() => scroll(airingRef, 'right')}
                            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-zinc-500 transition-all shadow-lg backdrop-blur"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                
                <div 
                    ref={airingRef}
                    className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide scroll-smooth"
                >
                {loading 
                    ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} compact />)
                    : airing.map(anime => (
                        <PublicAnimeCard 
                            key={anime.id} 
                            anime={anime} 
                            compact 
                            onAdd={() => handleAddClick(anime)} 
                            onInfo={() => handleInfoClick(anime.id)}
                        />
                    ))
                }
                </div>
            </section>

            {/* Badges Showcase */}
            <section className="px-6 md:px-12 py-8 bg-zinc-900/20 border-y border-zinc-800/50">
               <div className="flex items-center gap-2 mb-8 justify-center md:justify-start">
                  <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                    <Award size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Earn Achievements</h2>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {BADGES_CATALOG.map(badge => (
                      <LandingBadgeCard key={badge.id} badge={badge} />
                  ))}
               </div>
            </section>

            {/* Features Grid */}
            <section className="px-6 md:px-12">
                <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-12 border border-zinc-800">
                    <div className="max-w-7xl mx-auto text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                            More Reasons to Join
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            AniTrackr is built by fans, for fans. No ads, just pure anime tracking joy.
                        </p>
                    </div>

                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                            emoji="🎯"
                            title="Track Every Episode"
                            desc="Never forget where you left off. One-click progress updates."
                        />
                        <FeatureCard 
                            emoji="🔔"
                            title="Real-time Notifications"
                            desc="Get notified exactly when the next episode airs in Japan."
                        />
                        <FeatureCard 
                            emoji="🏆"
                            title="Badges & Achievements"
                            desc="Earn bragging rights for your binge-watching sessions."
                        />
                        <FeatureCard 
                            emoji="🍿"
                            title="Personalized Picks"
                            desc="AI-powered recommendations based on your unique taste."
                        />
                        <FeatureCard 
                            emoji="🔍"
                            title="Instant Search"
                            desc="Find any anime in seconds with our lightning-fast search."
                        />
                        <FeatureCard 
                            emoji="👥"
                            title="Connect with Fans"
                            desc="See what your friends are watching and rating right now."
                            badge="Upcoming"
                        />
                    </div>
                </div>
            </section>
        </div>

        <footer className="border-t border-zinc-900 py-16 px-6 md:px-12 bg-black text-zinc-500">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
              <div>
                  <h4 className="text-white font-brand text-2xl mb-4">AniTrackr</h4>
                  <p className="max-w-xs text-sm">The cutest way to track your anime journey. Data provided by AniList.</p>
              </div>
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="flex flex-col gap-2">
                    <span className="text-white font-semibold mb-2">Community</span>
                    <a href="#" className="hover:text-rose-500 transition-colors">Discord</a>
                    <a href="#" className="hover:text-rose-500 transition-colors">Twitter</a>
                    <a href="#" className="hover:text-rose-500 transition-colors">Blog</a>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-white font-semibold mb-2">Legal</span>
                    <a href="#" className="hover:text-rose-500 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-rose-500 transition-colors">Terms of Service</a>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto mt-12 text-xs text-zinc-600 border-t border-zinc-900 pt-8 text-center">
                © 2026 AniTrackr. All rights reserved.
            </div>
        </footer>
      </main>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} triggerAction="Login" />
      <AddNewsModal />
    </div>
  );
};
