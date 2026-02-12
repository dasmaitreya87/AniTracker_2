import React from 'react';
import { useStore } from '../services/store';
import { Heart, Tv, Film } from 'lucide-react';
import { FavoriteItem } from '../types';

const FavCard: React.FC<{ item: FavoriteItem }> = ({ item }) => {
  const { viewAnimeDetails } = useStore();
  
  return (
    <div 
        onClick={() => viewAnimeDetails(item.animeId)} 
        className="group relative cursor-pointer rounded-xl overflow-hidden aspect-[2/3] bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all hover:-translate-y-1 shadow-lg"
    >
      <img 
        src={item.coverImage} 
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
         <div className="bg-red-500 p-1.5 rounded-full shadow-lg">
            <Heart size={14} fill="currentColor" className="text-white" />
         </div>
      </div>

      <div className="absolute bottom-0 left-0 p-4 w-full">
         <h3 className="text-white font-bold line-clamp-2 leading-tight group-hover:text-rose-400 transition-colors text-sm md:text-base drop-shadow-md">
            {item.title}
         </h3>
         <span className="text-[10px] bg-white/10 backdrop-blur px-2 py-0.5 rounded text-zinc-200 mt-2 inline-block border border-white/10">
            {item.format}
         </span>
      </div>
    </div>
  );
};

export const Favorites = () => {
  const { user } = useStore();
  const favorites = user?.favorites || [];
  const series = favorites.filter(f => f.format !== 'MOVIE');
  const movies = favorites.filter(f => f.format === 'MOVIE');

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Heart size={32} className="text-red-500" fill="currentColor" />
        <h2 className="text-3xl font-bold text-white">My Favorites</h2>
      </div>

      {/* Series Section */}
      <section>
          <div className="flex items-center gap-2 mb-4 text-rose-400">
             <Tv size={20} />
             <h3 className="text-xl font-bold text-white">Favorite Series</h3>
             <span className="text-zinc-500 text-sm font-normal ml-2">({series.length})</span>
          </div>
          
          {series.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {series.map(item => <FavCard key={item.animeId} item={item} />)}
             </div>
          ) : (
             <div className="py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500">
                 No favorite series yet.
             </div>
          )}
      </section>

      {/* Movies Section */}
      <section>
          <div className="flex items-center gap-2 mb-4 text-indigo-400">
             <Film size={20} />
             <h3 className="text-xl font-bold text-white">Favorite Movies</h3>
             <span className="text-zinc-500 text-sm font-normal ml-2">({movies.length})</span>
          </div>

          {movies.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {movies.map(item => <FavCard key={item.animeId} item={item} />)}
             </div>
          ) : (
             <div className="py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500">
                 No favorite movies yet.
             </div>
          )}
      </section>
    </div>
  );
};