
export enum AnimeStatus {
  WATCHING = 'WATCHING',
  COMPLETED = 'COMPLETED',
  PLAN_TO_WATCH = 'PLAN_TO_WATCH',
  DROPPED = 'DROPPED',
}

export interface AnimeMetadata {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    large: string;
    medium: string;
  };
  episodes: number | null;
  duration: number | null; // Duration in minutes
  status: string; // 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED'
  format: string; // 'TV' | 'MOVIE' | 'OVA' etc.
  genres: string[];
  averageScore: number | null;
  seasonYear: number | null;
  studios: {
    nodes: { name: string }[];
  };
  description: string;
  nextAiringEpisode: {
    episode: number;
    airingAt: number;
  } | null;
  bannerImage?: string; // Added for detail page hero
  streamingEpisodes?: {
    title: string;
    thumbnail: string;
    url: string;
  }[];
  externalLinks?: {
    site: string;
    url: string;
  }[];
}

export interface EpisodeRating {
  episode: number;
  title: string;
  rating: number; // 0-10
  votes: number;
  airDate: string;
  description?: string;
  thumbnail?: string;
}

export interface UserAnimeEntry {
  id: string; // Unique ID for the entry (can be different from animeId if we allow rewatches)
  animeId: number;
  metadata: AnimeMetadata;
  status: AnimeStatus;
  progress: number;
  score: number; // 0-10 or 0-100
  notes: string;
  updatedAt: number;
  // AI Enhanced Fields
  aiBlurb?: string[];
}

export interface Recommendation {
  animeId: number;
  title: string;
  coverImage: string;
  type: string;
  year: number;
  genres: string[];
  reason: string;
  confidence?: number;
  metadata: AnimeMetadata;
}

export interface RecommendationFeedback {
  animeId: number;
  action: 'like' | 'dislike' | 'hide';
  timestamp: number;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  emoji: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  criteria: {
    type: 'EPISODES_TOTAL' | 'COMPLETED_SHOWS' | 'NEWS_POSTS';
    threshold: number;
  };
}

export interface UserBadge {
  badgeId: string;
  awardedAt: number;
  isNew?: boolean; // For UI highlighting
}

export interface AppNotification {
  id: string;
  type: 'BADGE' | 'INFO' | 'NUDGE';
  title: string;
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface FavoriteItem {
  animeId: number;
  title: string;
  coverImage: string;
  format: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string;
  bannerUrl?: string; // Profile wallpaper
  bio: string;
  favoriteGenres: string[];
  isPrivate: boolean;
  badges: UserBadge[];
  recommendationFeedback?: RecommendationFeedback[];
  favorites?: FavoriteItem[];
  showAdultContent?: boolean;
  joinedAt?: number;
}

// --- NEWS SYSTEM TYPES ---

export interface NewsComment {
  id: string;
  postId: string;
  userId: string;
  username: string; // Snapshot of username at time of comment
  avatarUrl: string;
  body: string;
  createdAt: number;
}

export interface NewsPost {
  id: string;
  userId: string; // Owner
  authorName: string; // Display name or "Anonymous"
  authorAvatar?: string; // Hidden if anonymous
  isAnonymous: boolean;
  title: string;
  body: string; // Limited Markdown
  imageUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  relatedAnimeId?: number; // Optional link to an anime
  likesCount: number;
  commentsCount: number;
  viewCount: number;
  createdAt: number;
}

export type ViewState = 'HOME' | 'DASHBOARD' | 'LIBRARY' | 'FAVORITES' | 'PROFILE' | 'AUTH' | 'DETAILS' | 'NEWS_DETAIL' | 'PUBLIC_PROFILE';
