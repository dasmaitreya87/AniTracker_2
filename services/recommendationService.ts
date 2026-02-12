
import { UserAnimeEntry, Recommendation, UserProfile } from '../types';
import { getRecommendationsByGenres } from './anilistService';

// Utilities to analyze library and extract signals
const extractTopGenres = (library: UserAnimeEntry[]): string[] => {
  const genreCounts: Record<string, number> = {};
  
  library.forEach(entry => {
    // Weight genres by user score (or 5 if no score)
    const weight = entry.score > 0 ? entry.score : 5;
    entry.metadata.genres.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + weight;
    });
  });

  // Sort by weight desc
  return Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([g]) => g);
};

const getFavoriteTitles = (library: UserAnimeEntry[]): string[] => {
    return library
        .filter(l => l.score >= 8)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(l => l.metadata.title.english || l.metadata.title.romaji);
};

export const fetchRecommendations = async (
    user: UserProfile | null, 
    library: UserAnimeEntry[], 
    type: 'TV' | 'MOVIE'
): Promise<{ recommendations: Recommendation[], signals: string[] }> => {
    
    // 1. Signal Extraction
    let topGenres: string[] = [];
    let favoriteTitles: string[] = [];

    if (library.length > 0) {
        topGenres = extractTopGenres(library);
        favoriteTitles = getFavoriteTitles(library);
    } else if (user && user.favoriteGenres.length > 0) {
        // Fallback to user profile preferences if library is empty
        topGenres = user.favoriteGenres.slice(0, 3);
    } else {
        // Default fallbacks
        topGenres = type === 'TV' ? ['Action', 'Adventure', 'Fantasy'] : ['Drama', 'Romance', 'Fantasy'];
    }

    // 2. Fetch Candidates
    const candidates = await getRecommendationsByGenres(topGenres, type);
    
    // 3. Filter & Rank
    const libraryIds = new Set(library.map(l => l.animeId));
    // Also filter dislikes if we had them in a robust backend
    
    const filtered = candidates.filter(c => !libraryIds.has(c.id));

    // 4. Transform to Recommendations with Reasons
    const recommendations: Recommendation[] = filtered.map(anime => {
        // Generate Reason (Simulated Gemini Output)
        const commonGenres = anime.genres.filter(g => topGenres.includes(g));
        let reason = "";
        
        if (favoriteTitles.length > 0 && Math.random() > 0.5) {
             reason = `Because you liked ${favoriteTitles[0]} — similar vibes: '${commonGenres.join(', ')}'`;
        } else {
             reason = `Top pick for ${commonGenres[0] || 'anime'} fans based on your taste.`;
        }
        
        // Calculate fake confidence
        const confidence = 70 + Math.floor(Math.random() * 25);

        return {
            animeId: anime.id,
            title: anime.title.english || anime.title.romaji,
            coverImage: anime.coverImage.large,
            type: anime.format,
            year: anime.seasonYear || 0,
            genres: anime.genres.slice(0, 3),
            reason,
            confidence,
            metadata: anime
        };
    });

    return {
        recommendations: recommendations.slice(0, 12),
        signals: topGenres
    };
};
