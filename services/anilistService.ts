
import { AnimeMetadata, EpisodeRating } from '../types';
import { ANILIST_API_URL } from '../constants';

const FRAGMENT_MEDIA = `
  id
  title { romaji english }
  coverImage { large medium }
  bannerImage
  episodes
  duration
  status
  format
  genres
  averageScore
  seasonYear
  studios(isMain: true) { nodes { name } }
  description
  nextAiringEpisode { episode airingAt }
  streamingEpisodes {
    title
    thumbnail
    url
  }
  externalLinks {
    site
    url
  }
`;

const SEARCH_QUERY = `
query ($search: String, $isAdult: Boolean) {
  Page(perPage: 10) {
    media(search: $search, isAdult: $isAdult, type: ANIME, sort: POPULARITY_DESC) {
      ${FRAGMENT_MEDIA}
    }
  }
}
`;

const DETAILS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    ${FRAGMENT_MEDIA}
  }
}
`;

const TRENDING_QUERY = `
query {
  Page(perPage: 10) {
    media(type: ANIME, sort: TRENDING_DESC) {
      ${FRAGMENT_MEDIA}
    }
  }
}
`;

const MOVIE_QUERY = `
query {
  Page(perPage: 10) {
    media(type: ANIME, format: MOVIE, sort: POPULARITY_DESC) {
      ${FRAGMENT_MEDIA}
    }
  }
}
`;

const AIRING_QUERY = `
query {
  Page(perPage: 10) {
    media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
      ${FRAGMENT_MEDIA}
    }
  }
}
`;

const RECOMMENDATION_QUERY = `
query ($genres: [String], $format: MediaFormat, $sort: [MediaSort]) {
  Page(perPage: 20) {
    media(genre_in: $genres, format: $format, type: ANIME, sort: $sort) {
      ${FRAGMENT_MEDIA}
    }
  }
}
`;

// --- FALLBACK MOCK DATA ---
// Used when the API is unreachable (e.g., network error, ad-blockers)
const FALLBACK_ANIME_LIST: AnimeMetadata[] = [
  {
    id: 1,
    title: { romaji: "Cowboy Bebop", english: "Cowboy Bebop" },
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx1-CXtrrkMpJ8Zq.png",
      medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx1-CXtrrkMpJ8Zq.png"
    },
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1-T3PklVYzOP5s.jpg",
    episodes: 26,
    duration: 24,
    status: "FINISHED",
    format: "TV",
    genres: ["Action", "Adventure", "Sci-Fi"],
    averageScore: 86,
    seasonYear: 1998,
    studios: { nodes: [{ name: "Sunrise" }] },
    description: "The year is 2071. The solar system is now easily accessible...",
    nextAiringEpisode: null,
    streamingEpisodes: []
  },
  {
    id: 21,
    title: { romaji: "One Piece", english: "One Piece" },
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/nx21-tXMN3Y20PIL9.jpg",
      medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/nx21-tXMN3Y20PIL9.jpg"
    },
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg",
    episodes: null,
    duration: 24,
    status: "RELEASING",
    format: "TV",
    genres: ["Action", "Adventure", "Comedy"],
    averageScore: 88,
    seasonYear: 1999,
    studios: { nodes: [{ name: "Toei Animation" }] },
    description: "Gol D. Roger was known as the Pirate King, the strongest and most infamous being to have sailed the Grand Line...",
    nextAiringEpisode: { episode: 1100, airingAt: Date.now() / 1000 + 86400 },
    streamingEpisodes: []
  },
  {
    id: 140960,
    title: { romaji: "Spy x Family", english: "Spy x Family" },
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx140960-v7Hu12rPvKYl.jpg",
      medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx140960-v7Hu12rPvKYl.jpg"
    },
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/140960-Z7xSPlh6IHyB.jpg",
    episodes: 25,
    duration: 24,
    status: "FINISHED",
    format: "TV",
    genres: ["Action", "Comedy", "Slice of Life"],
    averageScore: 85,
    seasonYear: 2022,
    studios: { nodes: [{ name: "WIT STUDIO" }] },
    description: "Master spy Twilight is the best at what he does when it comes to going undercover on dangerous missions in the name of a better world...",
    nextAiringEpisode: null,
    streamingEpisodes: []
  },
  {
    id: 999999,
    title: { romaji: "Akira", english: "Akira" },
    coverImage: {
       large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx47-RIG59VpD5XfR.png",
       medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx47-RIG59VpD5XfR.png"
    },
    episodes: 1,
    duration: 124,
    status: "FINISHED",
    format: "MOVIE",
    genres: ["Sci-Fi", "Action"],
    averageScore: 82,
    seasonYear: 1988,
    studios: { nodes: [{ name: "Tokyo Movie Shinsha" }] },
    description: "A secret military project endangers Neo-Tokyo when it turns a biker gang member into a rampaging psychic psychopath...",
    nextAiringEpisode: null,
    streamingEpisodes: []
  }
];

const fetchAnilist = async (query: string, variables: any = {}) => {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      console.warn("AniList API returned errors:", result.errors);
      return null;
    }
    return result.data;
  } catch (error) {
    console.warn("Failed to fetch from AniList (using fallback data):", error);
    return null;
  }
};

export const searchAnime = async (query: string, isAdult: boolean = false): Promise<AnimeMetadata[]> => {
  if (!query) return [];

  // Search for standard anime (isAdult: false)
  const standardPromise = fetchAnilist(SEARCH_QUERY, { search: query, isAdult: false });

  // If adult content is enabled, also search for adult content
  let adultPromise: Promise<any> | null = null;
  if (isAdult) {
    adultPromise = fetchAnilist(SEARCH_QUERY, { search: query, isAdult: true });
  }

  const [standardData, adultData] = await Promise.all([
    standardPromise,
    adultPromise ? adultPromise : Promise.resolve(null)
  ]);

  let results: AnimeMetadata[] = [];
  
  // Add standard results
  if (standardData?.Page?.media) {
    results = [...results, ...standardData.Page.media];
  }
  
  // Add adult results if available
  if (adultData?.Page?.media) {
    results = [...results, ...adultData.Page.media];
  }

  // Deduplicate results based on ID
  const uniqueIds = new Set();
  const uniqueResults = results.filter(item => {
    if (uniqueIds.has(item.id)) return false;
    uniqueIds.add(item.id);
    return true;
  });

  // If API fails, check if we have any fallback data matching the query roughly
  if (uniqueResults.length === 0 && !standardData && !adultData) {
      const lowerQ = query.toLowerCase();
      return FALLBACK_ANIME_LIST.filter(a => 
        (a.title.english && a.title.english.toLowerCase().includes(lowerQ)) ||
        (a.title.romaji && a.title.romaji.toLowerCase().includes(lowerQ))
      );
  }
  
  return uniqueResults;
};

export const getAnimeById = async (id: number): Promise<AnimeMetadata | null> => {
  const data = await fetchAnilist(DETAILS_QUERY, { id });
  if (!data?.Media) {
      return FALLBACK_ANIME_LIST.find(a => a.id === id) || FALLBACK_ANIME_LIST[0];
  }
  return data.Media;
};

export const getTrendingAnime = async (): Promise<AnimeMetadata[]> => {
  const data = await fetchAnilist(TRENDING_QUERY);
  return data?.Page?.media || FALLBACK_ANIME_LIST;
};

export const getTrendingMovies = async (): Promise<AnimeMetadata[]> => {
  const data = await fetchAnilist(MOVIE_QUERY);
  // Filter mock data for movies
  const mockMovies = FALLBACK_ANIME_LIST.filter(a => a.format === 'MOVIE');
  return data?.Page?.media || (mockMovies.length ? mockMovies : FALLBACK_ANIME_LIST);
};

export const getAiringAnime = async (): Promise<AnimeMetadata[]> => {
  const data = await fetchAnilist(AIRING_QUERY);
  // Filter mock data for releasing
  const mockAiring = FALLBACK_ANIME_LIST.filter(a => a.status === 'RELEASING');
  return data?.Page?.media || (mockAiring.length ? mockAiring : FALLBACK_ANIME_LIST);
};

export const getRecommendationsByGenres = async (genres: string[], format: 'TV' | 'MOVIE'): Promise<AnimeMetadata[]> => {
    // If no genres provided, fallback to trending
    if (!genres || genres.length === 0) {
        return format === 'TV' ? getTrendingAnime() : getTrendingMovies();
    }

    const variables = {
        genres: genres.slice(0, 3), // Limit to top 3 genres to avoid overly restrictive queries
        format: format,
        sort: ['POPULARITY_DESC', 'SCORE_DESC']
    };

    const data = await fetchAnilist(RECOMMENDATION_QUERY, variables);
    return data?.Page?.media || FALLBACK_ANIME_LIST;
};

// Fallback images for news when no specific image is available
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop", // Anime style landscape
  "https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=600&auto=format&fit=crop", // Nature/Anime vibe
  "https://images.unsplash.com/photo-1620554601366-5014383c2763?q=80&w=600&auto=format&fit=crop", // Abstract dark
  "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop"  // Cyberpunk
];

const getRandomFallback = () => FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];

// Mock Episode Ratings (Simulating OMDb/TMDb) with Real Titles if available
export const getEpisodeRatings = async (anime: AnimeMetadata): Promise<EpisodeRating[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  // We rely on streamingEpisodes as the "verified" source of episode data
  const realEpisodes = anime.streamingEpisodes || [];

  // If no verified episode data is available, we return empty to trigger the "Data not available" UI
  if (realEpisodes.length === 0) {
      return [];
  }

  return realEpisodes.map((ep: any, index: number) => {
    // Generate a placeholder rating since AniList doesn't provide per-episode ratings
    let currentRating = 7.5;
    const change = (Math.random() - 0.4) * 0.8;
    currentRating = Math.max(5, Math.min(9.8, currentRating + change));
    
    return {
      episode: index + 1,
      title: ep.title,
      rating: parseFloat(currentRating.toFixed(1)),
      votes: Math.floor(Math.random() * 2000) + 500,
      airDate: new Date().toISOString().split('T')[0],
      description: "Synopsis unavailable.",
      thumbnail: ep.thumbnail || getRandomFallback()
    };
  });
};

// Mock News Service
export interface AnimeNewsItem {
  id: string;
  title: string;
  image: string;
  date: string;
  tag: string;
  source: string;
  url: string;
}

export const getAnimeNews = async (animeId?: number): Promise<AnimeNewsItem[]> => {
  const generalNews: AnimeNewsItem[] = [
    {
      id: '1',
      title: "Studio Ghibli Announces New 'Mystery' Feature Film for 2025",
      image: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=600&auto=format&fit=crop",
      date: "2 hours ago",
      tag: "Movie News",
      source: "ANN",
      url: "https://www.animenewsnetwork.com/"
    },
    {
      id: '2',
      title: "Why 'Frieren' is Sweeping the Anime Awards This Season",
      image: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop",
      date: "5 hours ago",
      tag: "Editorial",
      source: "Crunchyroll",
      url: "https://www.crunchyroll.com/news"
    },
    {
      id: '3',
      title: "Official: Chainsaw Man Movie 'Reze Arc' Release Date Leaked?",
      image: "", // Empty to trigger fallback logic
      date: "1 day ago",
      tag: "Rumor",
      source: "Twitter",
      url: "https://twitter.com/search?q=chainsaw+man"
    }
  ];

  let news = generalNews;

  if (animeId) {
    // Prepend some "specific" news for this ID
    news = [
      {
        id: `spec-${animeId}`,
        title: "Production Committee Comments on Recent Episode Quality",
        image: "", // Empty to trigger fallback logic
        date: "Just now",
        tag: "Production",
        source: "Official Site",
        url: "https://www.animenewsnetwork.com/interest/"
      },
      ...generalNews
    ];
  }

  // Ensure every news item has an image
  return news.map(item => ({
    ...item,
    image: item.image || getRandomFallback()
  }));
};
