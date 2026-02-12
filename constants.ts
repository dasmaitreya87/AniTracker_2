
import { Badge, UserProfile } from './types';

export const ANILIST_API_URL = 'https://graphql.anilist.co';

export const THEME = {
  primary: '#6366f1', // Indigo 500
  secondary: '#ec4899', // Pink 500
  bgDark: '#0f172a', // Slate 900
  bgCard: '#1e293b', // Slate 800
};

export const MOCK_USER: UserProfile = {
  id: 'u1',
  username: 'OtakuKing',
  avatarUrl: 'https://picsum.photos/200/200',
  bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
  bio: 'Just a fan of mecha and slice of life.',
  favoriteGenres: ['Action', 'Sci-Fi'],
  isPrivate: false,
  showAdultContent: false,
  badges: [],
  favorites: []
};

export const BADGES_CATALOG: Badge[] = [
  // Episode Milestones
  {
    id: 'b1',
    slug: 'ep-collector-bronze',
    name: 'Episode Collector',
    description: 'Watched 10 total episodes.',
    emoji: '🥉',
    tier: 'BRONZE',
    criteria: { type: 'EPISODES_TOTAL', threshold: 10 }
  },
  {
    id: 'b2',
    slug: 'ep-collector-silver',
    name: 'Episode Hoarder',
    description: 'Watched 50 total episodes.',
    emoji: '🥈',
    tier: 'SILVER',
    criteria: { type: 'EPISODES_TOTAL', threshold: 50 }
  },
  {
    id: 'b3',
    slug: 'ep-collector-gold',
    name: 'Episode Master',
    description: 'Watched 100 total episodes.',
    emoji: '🥇',
    tier: 'GOLD',
    criteria: { type: 'EPISODES_TOTAL', threshold: 100 }
  },
  // Completion Milestones
  {
    id: 'b4',
    slug: 'binge-beginner',
    name: 'Binge Beginner',
    description: 'Completed your first anime.',
    emoji: '🍿',
    tier: 'BRONZE',
    criteria: { type: 'COMPLETED_SHOWS', threshold: 1 }
  },
  {
    id: 'b5',
    slug: 'series-finisher',
    name: 'Series Finisher',
    description: 'Completed 5 anime series.',
    emoji: '📚',
    tier: 'SILVER',
    criteria: { type: 'COMPLETED_SHOWS', threshold: 5 }
  },
  {
    id: 'b6',
    slug: 'otaku-legend',
    name: 'Otaku Legend',
    description: 'Completed 10 anime series.',
    emoji: '👑',
    tier: 'GOLD',
    criteria: { type: 'COMPLETED_SHOWS', threshold: 10 }
  },
  // News Milestones
  {
    id: 'b7',
    slug: 'news-contributor',
    name: 'News Contributor',
    description: 'Posted your first news update.',
    emoji: '📰',
    tier: 'BRONZE',
    criteria: { type: 'NEWS_POSTS', threshold: 1 }
  }
];
