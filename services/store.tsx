
import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { UserProfile, UserAnimeEntry, ViewState, AnimeStatus, AppNotification, PostLoginPreference, RecommendationFeedback, NewsPost, NewsComment, Badge, AnimeMetadata, FavoriteItem, UserBadge } from '../types';
import { MOCK_USER, BADGES_CATALOG } from '../constants';
import { evaluateBadges } from './badgeService';
import { supabase } from './supabaseClient';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface ModalState {
  isOpen: boolean;
  mode: 'ADD' | 'EDIT';
  data?: UserAnimeEntry;
}

interface AddNewsModalState {
    isOpen: boolean;
    initialData?: {
        title?: string;
        body?: string;
        relatedAnimeId?: number;
    };
}

interface AppState {
  user: UserProfile | null;
  library: UserAnimeEntry[];
  view: ViewState;
  selectedAnimeId: number | null;
  selectedNewsId: string | null;
  isAuthenticated: boolean;
  modal: ModalState;
  addNewsModal: AddNewsModalState;
  notifications: AppNotification[];
  isPostLoginModalOpen: boolean;
  newsPosts: NewsPost[];
  newsComments: Record<string, NewsComment[]>; 
  likedNews: Set<string>; 
  
  // Public Profile State
  viewedProfile: UserProfile | null;
  viewedLibrary: UserAnimeEntry[];

  // Actions
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ data: any; error: any }>;
  logout: () => void;
  setView: (view: ViewState) => void;
  viewAnimeDetails: (animeId: number) => void;
  viewNewsDetails: (newsId: string) => void;
  addAnime: (entry: UserAnimeEntry) => void;
  updateAnime: (id: string, updates: Partial<UserAnimeEntry>) => void;
  deleteAnime: (id: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  openModal: (mode: 'ADD' | 'EDIT', data?: UserAnimeEntry) => void;
  closeModal: () => void;
  openAddNewsModal: (initialData?: AddNewsModalState['initialData']) => void;
  closeAddNewsModal: () => void;
  dismissNotification: (id: string) => void;
  setPostLoginChoice: (choice: PostLoginPreference, remember: boolean) => void;
  closePostLoginModal: () => void;
  handleRecommendationFeedback: (animeId: number, action: 'like' | 'dislike' | 'hide') => void;
  toggleFavorite: (anime: AnimeMetadata) => void;
  
  // Public Profile Actions
  viewUserProfile: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<UserProfile[]>;

  // News Actions
  addNewsPost: (post: Omit<NewsPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'viewCount'>) => void;
  toggleLikeNews: (id: string) => void;
  addNewsComment: (postId: string, body: string) => Promise<boolean>;
  fetchComments: (postId: string) => Promise<void>; 
  reportNews: (id: string, reason: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const useStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useStore must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [library, setLibrary] = useState<UserAnimeEntry[]>([]);
  const [view, setView] = useState<ViewState>('AUTH');
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'ADD' });
  const [addNewsModal, setAddNewsModal] = useState<AddNewsModalState>({ isOpen: false });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isPostLoginModalOpen, setIsPostLoginModalOpen] = useState(false);
  
  // Public Profile State
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [viewedLibrary, setViewedLibrary] = useState<UserAnimeEntry[]>([]);
  
  // News State
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [newsComments, setNewsComments] = useState<Record<string, NewsComment[]>>({});
  const [likedNews, setLikedNews] = useState<Set<string>>(new Set());

  // --- SUPABASE INTEGRATION ---

  useEffect(() => {
    fetchNews();

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        initUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        // We only want to re-fetch if we don't have user data or if it's a fresh login
        // Also safeguard against redundant fetches if we are already authenticated with same ID
        if (!user || user.id !== session.user.id || event === 'SIGNED_IN') {
             await initUserData(session.user.id);
        }
      } else {
        setUser(null);
        setLibrary([]);
        setLikedNews(new Set());
        setView('AUTH');
        setIsPostLoginModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initUserData = async (userId: string) => {
      try {
          // Fetch the profile object first without setting state
          const userProfile = await fetchUserProfile(userId);
          
          if (userProfile) {
               // Fetch library and likes in parallel
               await Promise.all([
                   fetchUserLibrary(userId),
                   fetchUserLikes(userId)
               ]);
               
               // Determine target view based on preferences BEFORE setting user state
               // This prevents the UI from flickering to Dashboard (default) then back to Home
               const pref = userProfile.postLoginDefault;
               let targetView: ViewState = 'HOME';
               let showModal = false;

               if (pref === 'DASHBOARD') {
                   targetView = 'DASHBOARD';
               } else if (pref === 'LANDING') {
                   targetView = 'HOME';
               } else {
                   // 'ASK' or undefined
                   targetView = 'HOME'; 
                   showModal = true;
               }

               // Apply view state first
               setView(targetView);
               setIsPostLoginModalOpen(showModal);
               
               // Then set user state to unlock the UI
               setUser(userProfile);
          }
      } catch (e) {
          console.error("Failed to init user data", e);
          setUser(null);
      }
  };

  const fetchNews = async () => {
      const { data, error } = await supabase
        .from('news_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
          const mappedPosts: NewsPost[] = data.map((p: any) => ({
              id: p.id,
              userId: p.user_id,
              authorName: p.author_name || 'Anonymous',
              authorAvatar: p.author_avatar,
              isAnonymous: p.is_anonymous,
              title: p.title || 'Untitled',
              body: p.body || '',
              imageUrl: p.image_url,
              sourceName: p.source_name,
              sourceUrl: p.source_url,
              relatedAnimeId: p.related_anime_id,
              likesCount: p.likes_count || 0,
              commentsCount: p.comments_count || 0,
              viewCount: p.view_count || 0,
              createdAt: new Date(p.created_at).getTime()
          }));
          setNewsPosts(mappedPosts);
      } else if (error) {
          console.error("Error fetching news:", error);
      }
  };

  const fetchUserLikes = async (userId: string) => {
      const { data } = await supabase.from('news_likes').select('post_id').eq('user_id', userId);
      if (data) {
          setLikedNews(new Set(data.map((l: any) => l.post_id)));
      }
  };

  const fetchComments = async (postId: string) => {
      const { data, error } = await supabase
          .from('news_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
      
      if (error) {
          console.error(`Error fetching comments for ${postId}:`, error);
          return;
      }
      
      if (data) {
          const mappedComments: NewsComment[] = data.map((c: any) => ({
              id: c.id,
              postId: c.post_id,
              userId: c.user_id,
              username: c.username || 'User',
              avatarUrl: c.avatar_url,
              body: c.body,
              createdAt: new Date(c.created_at).getTime()
          }));
          setNewsComments(prev => ({ ...prev, [postId]: mappedComments }));
      }
  };

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    // 1. Try to fetch existing profile
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    // 2. If no profile found, try to create one (Robust Fallback)
    if (!profile) {
        console.log("Profile not found, attempting creation...");
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
            const username = authUser.user_metadata.username || authUser.email?.split('@')[0] || 'Otaku';
            const avatarUrl = authUser.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
            
            // Try Insert
            const { data: newProfile, error } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    username,
                    avatar_url: avatarUrl,
                    bio: 'Just joined AniTrackr!',
                    favorite_genres: []
                })
                .select()
                .single();
            
            if (newProfile) {
                profile = newProfile;
            } else {
                console.warn("Insert failed (possible race condition), retrying fetch...", error);
                // 3. Retry fetch in case of race condition (DB trigger might have created it)
                const { data: retryProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
                if (retryProfile) {
                    profile = retryProfile;
                } else {
                    // 4. Ultimate Fallback to avoid app crash
                    console.error("Profile creation/fetch failed completely.");
                    profile = {
                        id: userId,
                        username: username,
                        avatar_url: avatarUrl,
                        bio: 'Just joined AniTrackr!',
                        favorite_genres: [],
                        is_private: false,
                        show_adult_content: false,
                        created_at: new Date().toISOString()
                    };
                }
            }
        }
    }

    // Process Profile Data
    if (profile) {
        const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', userId);
        const formattedFavorites: FavoriteItem[] = favData 
            ? favData.map((f: any) => ({
                animeId: f.anime_id,
                title: f.title,
                coverImage: f.cover_image,
                format: f.format
            })) 
            : [];

        const { data: badgeData } = await supabase.from('user_badges').select('*').eq('user_id', userId);
        const formattedBadges: UserBadge[] = badgeData
            ? badgeData.map((b: any) => ({
                badgeId: b.badge_id,
                awardedAt: new Date(b.awarded_at).getTime()
            }))
            : [];

        return {
            id: profile.id,
            username: profile.username || 'User',
            avatarUrl: profile.avatar_url,
            bannerUrl: profile.banner_url,
            bio: profile.bio || '',
            favoriteGenres: profile.favorite_genres || [],
            isPrivate: profile.is_private || false,
            showAdultContent: profile.show_adult_content || false,
            postLoginDefault: profile.post_login_default as PostLoginPreference,
            badges: formattedBadges, 
            favorites: formattedFavorites,
            joinedAt: profile.created_at ? new Date(profile.created_at).getTime() : Date.now()
        };
    }

    return null;
  };

  const fetchUserLibrary = async (userId: string) => {
    const { data } = await supabase
      .from('library')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (data) {
      const formattedLibrary: UserAnimeEntry[] = data.map((item: any) => ({
        id: item.id,
        animeId: item.anime_id,
        status: (item.status || 'WATCHING').toUpperCase() as AnimeStatus,
        progress: item.progress || 0,
        score: item.score || 0,
        notes: item.notes || '',
        updatedAt: typeof item.updated_at === 'string' ? new Date(item.updated_at).getTime() : item.updated_at,
        metadata: item.metadata 
      }));
      setLibrary(formattedLibrary);
    }
  };

  // --- Public Profile Logic ---
  const viewUserProfile = async (userId: string) => {
      if (!userId) {
          console.error("viewUserProfile called with empty userId");
          return;
      }

      // 1. Own profile check
      if (user && user.id === userId) {
          setView('PROFILE');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
      }

      // 2. Fetch Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile) {
          console.error("Profile fetch error:", profileError);
          setNotifications(prev => [...prev, {
              id: crypto.randomUUID(),
              type: 'INFO',
              title: 'Error',
              message: 'User not found.',
              icon: '❌'
          }]);
          return;
      }

      // 3. Fetch Public Library with robust error handling
      const { data: libData, error: libError } = await supabase
        .from('library')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (libError) {
          console.error("[viewUserProfile] Library fetch error (Likely RLS):", libError);
      }

      // Parse and Map Library Data
      const publicLibrary: UserAnimeEntry[] = libData ? libData
          .map((item: any) => {
             let meta = item.metadata;
             if (typeof meta === 'string') {
                 try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
             }
             if (!meta) meta = {};

             if (!meta.title) {
                 meta.title = { romaji: 'Unknown Title', english: 'Unknown Title' };
             }
             if (!meta.coverImage) {
                 meta.coverImage = { large: 'https://via.placeholder.com/200x300?text=?', medium: 'https://via.placeholder.com/100x150?text=?' };
             }
             
             const statusRaw = (item.status || 'WATCHING').toUpperCase(); 
             
             return {
                id: item.id,
                animeId: item.anime_id || 0,
                metadata: meta, 
                status: statusRaw as AnimeStatus,
                progress: typeof item.progress === 'number' ? item.progress : 0,
                score: typeof item.score === 'number' ? item.score : 0,
                notes: item.notes || '',
                updatedAt: typeof item.updated_at === 'string' ? new Date(item.updated_at).getTime() : (item.updated_at || Date.now())
             };
          })
          : [];

      // 4. Fetch Badges & Favorites
      const { data: badgeData } = await supabase.from('user_badges').select('*').eq('user_id', userId);
      const publicBadges = badgeData ? badgeData.map((b: any) => ({
          badgeId: b.badge_id,
          awardedAt: new Date(b.awarded_at).getTime()
      })) : [];

      const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', userId);
      const publicFavs = favData ? favData.map((f: any) => ({
            animeId: f.anime_id,
            title: f.title,
            coverImage: f.cover_image,
            format: f.format
        })) : [];

      // 5. Update State
      setViewedProfile({
          id: profile.id,
          username: profile.username,
          avatarUrl: profile.avatar_url,
          bannerUrl: profile.banner_url,
          bio: profile.bio,
          favoriteGenres: profile.favorite_genres || [],
          isPrivate: profile.is_private,
          badges: publicBadges,
          favorites: publicFavs,
          joinedAt: profile.created_at ? new Date(profile.created_at).getTime() : Date.now()
      });
      setViewedLibrary(publicLibrary);
      setView('PUBLIC_PROFILE');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchUsers = async (query: string): Promise<UserProfile[]> => {
      // Relaxed query: Don't filter is_private in SQL to avoid NULL issues
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(10);
      
      if (!data) return [];

      // Filter in memory for better reliability if DB has mixed data types/nulls
      const publicUsers = data.filter((p: any) => p.is_private !== true);

      return publicUsers.map((p: any) => ({
          id: p.id,
          username: p.username,
          avatarUrl: p.avatar_url,
          bio: p.bio,
          favoriteGenres: p.favorite_genres || [],
          isPrivate: p.is_private || false,
          badges: [], 
          joinedAt: p.created_at ? new Date(p.created_at).getTime() : undefined
      }));
  };

  // --- Badge Logic ---
  const triggerBadgeCheck = (updatedLibrary: UserAnimeEntry[]) => {
    if (!user) return;
    const earnedBadges = evaluateBadges(updatedLibrary, user.badges || []);
    if (earnedBadges.length > 0) {
      awardBadges(earnedBadges);
    }
  };

  const awardBadges = async (badges: Badge[]) => {
      if (!user) return;
      
      const newBadgeEntries = badges.map(b => ({
        badgeId: b.id,
        awardedAt: Date.now(),
        isNew: true
      }));

      const existingIds = new Set(user.badges.map(b => b.badgeId));
      const uniqueNewBadges = newBadgeEntries.filter(b => !existingIds.has(b.badgeId));
      
      if (uniqueNewBadges.length === 0) return;

      setUser(prev => prev ? { ...prev, badges: [...prev.badges, ...uniqueNewBadges] } : null);
      
      const dbInserts = uniqueNewBadges.map(b => ({
          user_id: user.id,
          badge_id: b.badgeId,
          awarded_at: new Date(b.awardedAt).toISOString()
      }));

      const { error } = await supabase.from('user_badges').insert(dbInserts);
      if (error) { console.error("Failed to persist badges:", error); }
      
      const newNotes: AppNotification[] = badges.filter(b => !existingIds.has(b.id)).map(b => ({
        id: crypto.randomUUID(),
        type: 'BADGE',
        title: `Badge Unlocked: ${b.name}`,
        message: b.description,
        icon: b.emoji
      }));
      setNotifications(prev => [...prev, ...newNotes]);
  };

  const triggerNudge = (type: 'EPISODE' | 'ADD' | 'COMPLETE', context: { title: string, ep?: number, id?: number }) => {
      const lastNudge = localStorage.getItem('anitrackr_last_nudge');
      const now = Date.now();
      if (lastNudge && (now - parseInt(lastNudge)) < 30000) return;
      localStorage.setItem('anitrackr_last_nudge', now.toString());

      let message = '';
      let actionLabel = 'Add News';
      let initialBody = '';
      let initialTitle = '';

      switch (type) {
          case 'EPISODE':
              message = `Just finished Ep ${context.ep}? Share a quick thought with the community!`;
              initialBody = `I just watched Episode ${context.ep} of ${context.title} and...`;
              initialTitle = `My thoughts on ${context.title} Ep ${context.ep}`;
              break;
          case 'ADD':
              message = `Added ${context.title} to your shelf! Know something interesting about it?`;
              initialBody = `I'm starting ${context.title}! Has anyone else seen it?`;
              initialTitle = `Starting ${context.title}`;
              break;
          case 'COMPLETE':
              message = `Finished ${context.title}! Write a short review.`;
              initialBody = `I just completed ${context.title}. My rating: ...`;
              initialTitle = `Review: ${context.title}`;
              actionLabel = 'Write Review';
              break;
      }

      setNotifications(prev => [...prev, {
          id: crypto.randomUUID(),
          type: 'NUDGE',
          title: 'Community needs your voice 📰',
          message,
          icon: '✍️',
          actionLabel,
          onAction: () => openAddNewsModal({ title: initialTitle, body: initialBody, relatedAnimeId: context.id })
      }]);
  };

  const login = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            return { error };
        }
        
        if (data.session) {
          // Initialize data first
          await initUserData(data.session.user.id);
        }
        
        return { error: null };
    } catch (e: any) {
        return { error: { message: e.message || 'Login failed' } };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
        const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
            username: username,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
            }
        }
        });

        if (error) return { data: null, error };

        if (data.session) {
             await initUserData(data.session.user.id);
        }

        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: { message: e.message || 'Signup failed' } };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLibrary([]);
    setLikedNews(new Set());
    setView('AUTH');
  };

  const setPostLoginChoice = (choice: PostLoginPreference, remember: boolean) => {
    if (choice === 'DASHBOARD') setView('DASHBOARD');
    if (choice === 'LANDING') setView('HOME');
    if (remember && user) { updateUser({ postLoginDefault: choice }); }
    setIsPostLoginModalOpen(false);
  };

  const closePostLoginModal = () => {
      setIsPostLoginModalOpen(false);
      setView('DASHBOARD');
  };

  const viewAnimeDetails = (animeId: number) => {
    setSelectedAnimeId(animeId);
    setView('DETAILS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const incrementViewCountDB = async (postId: string) => {
      const { error } = await supabase.rpc('increment_news_view', { post_id: postId });
      if (error) {
          const { data } = await supabase.from('news_posts').select('view_count').eq('id', postId).single();
          if (data) {
               await supabase.from('news_posts').update({ view_count: (data.view_count || 0) + 1 }).eq('id', postId);
          }
      }
  };

  const viewNewsDetails = (newsId: string) => {
    setSelectedNewsId(newsId);
    setNewsPosts(prev => prev.map(p => p.id === newsId ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p));
    setView('NEWS_DETAIL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchComments(newsId);
    incrementViewCountDB(newsId);
  };

  const applyStatusRules = (item: UserAnimeEntry): UserAnimeEntry => {
    const newItem = { ...item };
    if (newItem.metadata.episodes && newItem.progress > newItem.metadata.episodes) newItem.progress = newItem.metadata.episodes;
    if (newItem.progress < 0) newItem.progress = 0;
    if (newItem.score > 10) newItem.score = 10;
    if (newItem.score < 0) newItem.score = 0;
    if (newItem.status === AnimeStatus.COMPLETED && newItem.metadata.episodes && newItem.progress < newItem.metadata.episodes) newItem.status = AnimeStatus.WATCHING;
    if (newItem.status === AnimeStatus.PLAN_TO_WATCH && newItem.progress > 0) newItem.status = AnimeStatus.WATCHING;
    if (newItem.status === AnimeStatus.WATCHING && newItem.metadata.episodes && newItem.progress >= newItem.metadata.episodes) newItem.status = AnimeStatus.COMPLETED;
    return newItem;
  };

  const addAnime = async (entry: UserAnimeEntry) => {
    if (!user) return;
    if (library.some(item => item.animeId === entry.animeId)) {
        setNotifications(prev => [...prev, {
            id: crypto.randomUUID(),
            type: 'INFO',
            title: 'Duplicate Entry',
            message: 'Already in your library.',
            icon: '⚠️'
        }]);
        return;
    }
    const processedEntry = applyStatusRules(entry);
    const tempId = crypto.randomUUID();
    const optimisticEntry = { ...processedEntry, id: tempId };
    setLibrary(prev => [optimisticEntry, ...prev]);

    const { data, error } = await supabase.from('library').insert({
          user_id: user.id,
          anime_id: processedEntry.animeId,
          status: processedEntry.status,
          progress: processedEntry.progress,
          score: processedEntry.score,
          notes: processedEntry.notes,
          metadata: processedEntry.metadata,
          updated_at: Date.now()
      }).select().single();

    if (error) {
        setLibrary(prev => prev.filter(i => i.id !== tempId));
    } else if (data) {
        setLibrary(prev => prev.map(i => i.id === tempId ? { ...i, id: data.id } : i));
        triggerBadgeCheck([optimisticEntry, ...library]);
        triggerNudge('ADD', { title: entry.metadata.title.english || entry.metadata.title.romaji, id: entry.animeId });
    }
  };

  const updateAnime = async (id: string, updates: Partial<UserAnimeEntry>) => {
    if (!user) return;
    let nudgeType: 'EPISODE' | 'COMPLETE' | null = null;
    let nudgeContext: { title: string; ep?: number; id?: number } = { title: '', ep: 0, id: 0 };

    setLibrary(prev => {
        const existing = prev.find(i => i.id === id);
        const next = prev.map(item => {
            if (item.id === id) {
                const updated = applyStatusRules({ ...item, ...updates });
                if (existing) {
                    if (updated.progress > existing.progress) {
                        nudgeType = 'EPISODE';
                        nudgeContext = { title: updated.metadata.title.english || updated.metadata.title.romaji, ep: updated.progress, id: updated.animeId };
                    }
                    if (updated.status === AnimeStatus.COMPLETED && existing.status !== AnimeStatus.COMPLETED) {
                        nudgeType = 'COMPLETE';
                        nudgeContext = { title: updated.metadata.title.english || updated.metadata.title.romaji, id: updated.animeId };
                    }
                }
                return updated;
            }
            return item;
        });
        triggerBadgeCheck(next);
        return next;
    });

    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
    if (updates.score !== undefined) dbUpdates.score = updates.score;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    dbUpdates.updated_at = Date.now();

    await supabase.from('library').update(dbUpdates).eq('id', id);
    setTimeout(() => { if (nudgeType) triggerNudge(nudgeType, nudgeContext); }, 500);
  };

  const deleteAnime = async (id: string) => {
      setLibrary(prev => prev.filter(item => item.id !== id));
      await supabase.from('library').delete().eq('id', id);
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
      if (!user) return;
      setUser(prev => prev ? { ...prev, ...updates } : null);
      const dbUpdates: any = {};
      if (updates.username) dbUpdates.username = updates.username;
      if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.bannerUrl) dbUpdates.banner_url = updates.bannerUrl;
      if (updates.bio) dbUpdates.bio = updates.bio;
      if (updates.isPrivate !== undefined) dbUpdates.is_private = updates.isPrivate;
      if (updates.showAdultContent !== undefined) dbUpdates.show_adult_content = updates.showAdultContent;
      if (updates.postLoginDefault) dbUpdates.post_login_default = updates.postLoginDefault;
      await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
  };

  const openModal = (mode: 'ADD' | 'EDIT', data?: UserAnimeEntry) => setModal({ isOpen: true, mode, data });
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false, data: undefined }));
  
  const openAddNewsModal = (initialData?: AddNewsModalState['initialData']) => setAddNewsModal({ isOpen: true, initialData });
  const closeAddNewsModal = () => setAddNewsModal({ isOpen: false });

  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleRecommendationFeedback = (animeId: number, action: 'like' | 'dislike' | 'hide') => {
      if (!user) return;
      const newFeedback: RecommendationFeedback = { animeId, action, timestamp: Date.now() };
      setUser({ ...user, recommendationFeedback: [...(user.recommendationFeedback || []), newFeedback] });
  };

  const toggleFavorite = async (anime: AnimeMetadata) => {
    if (!user) return;
    const favs = user.favorites || [];
    const exists = favs.find(f => f.animeId === anime.id);
    let newFavs;
    if (exists) {
        newFavs = favs.filter(f => f.animeId !== anime.id);
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('anime_id', anime.id);
    } else {
        newFavs = [...favs, { animeId: anime.id, title: anime.title.english || anime.title.romaji, coverImage: anime.coverImage.large || anime.coverImage.medium, format: anime.format }];
        await supabase.from('favorites').insert({ user_id: user.id, anime_id: anime.id, title: anime.title.english || anime.title.romaji, cover_image: anime.coverImage.large || anime.coverImage.medium, format: anime.format });
    }
    setUser({ ...user, favorites: newFavs });
  };

  const addNewsPost = async (postData: Omit<NewsPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'viewCount'>) => {
      if (!user) return;
      const { data, error } = await supabase.from('news_posts').insert({
          user_id: user.id,
          author_name: postData.authorName,
          author_avatar: postData.authorAvatar,
          is_anonymous: postData.isAnonymous,
          title: postData.title,
          body: postData.body,
          image_url: postData.imageUrl,
          source_name: postData.sourceName,
          source_url: postData.sourceUrl,
          related_anime_id: postData.relatedAnimeId
      }).select().single();
      if (data) {
          const newPost: NewsPost = { id: data.id, userId: data.user_id, authorName: data.author_name, authorAvatar: data.author_avatar, isAnonymous: data.is_anonymous, title: data.title, body: data.body, imageUrl: data.image_url, sourceName: data.source_name, sourceUrl: data.source_url, relatedAnimeId: data.related_anime_id, likesCount: 0, commentsCount: 0, viewCount: 0, createdAt: new Date(data.created_at).getTime() };
          setNewsPosts(prev => [newPost, ...prev]);
          setNotifications(prev => [...prev, { id: crypto.randomUUID(), type: 'INFO', title: 'News Published', message: 'Your post is live on the feed!', icon: '📰' }]);
      }
  };

  const toggleLikeNews = async (id: string) => {
      if (!user) return;
      const isLiked = likedNews.has(id);
      setLikedNews(prev => { const next = new Set(prev); if (isLiked) next.delete(id); else next.add(id); return next; });
      setNewsPosts(posts => posts.map(p => { if (p.id === id) return { ...p, likesCount: p.likesCount + (isLiked ? -1 : 1) }; return p; }));
      if (isLiked) { await supabase.from('news_likes').delete().eq('post_id', id).eq('user_id', user.id); } 
      else { await supabase.from('news_likes').insert({ post_id: id, user_id: user.id }); }
  };

  const addNewsComment = async (postId: string, body: string): Promise<boolean> => {
      if (!user) return false;
      const isPrivate = user.isPrivate;
      const username = isPrivate ? 'Anonymous' : (user.username || 'User');
      const avatarUrl = isPrivate ? 'https://github.com/shadcn.png' : (user.avatarUrl || 'https://github.com/shadcn.png');
      
      const { data, error } = await supabase.from('news_comments').insert({ 
          post_id: postId, 
          user_id: user.id, 
          username, 
          avatar_url: avatarUrl, 
          body 
      }).select().single();
      
      if (error) {
          console.error("Error posting comment:", error);
          setNotifications(prev => [...prev, {
              id: crypto.randomUUID(),
              type: 'INFO',
              title: 'Error',
              message: 'Failed to post comment. Please try again.',
              icon: '❌'
          }]);
          return false;
      }

      if (data) {
          const newComment: NewsComment = { 
              id: data.id, 
              postId, 
              userId: user.id, 
              username: data.username, 
              avatarUrl: data.avatar_url, 
              body: data.body, 
              createdAt: new Date(data.created_at).getTime() 
          };
          
          setNewsComments(prev => ({ 
              ...prev, 
              [postId]: [...(prev[postId] || []), newComment] 
          }));
          
          setNewsPosts(posts => posts.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
          
          setNotifications(prev => [...prev, {
              id: crypto.randomUUID(),
              type: 'INFO',
              title: 'Success',
              message: 'Comment posted!',
              icon: '✅'
          }]);
          return true;
      }
      return false;
  };

  const reportNews = (id: string, reason: string) => {
      setNotifications(prev => [...prev, { id: crypto.randomUUID(), type: 'INFO', title: 'Report Submitted', message: 'Thanks for keeping the community safe.', icon: '🛡️' }]);
  };

  return (
    <AppContext.Provider value={{
      user,
      library,
      view,
      selectedAnimeId,
      selectedNewsId,
      isAuthenticated: !!user,
      modal,
      addNewsModal,
      notifications,
      isPostLoginModalOpen,
      newsPosts,
      newsComments,
      likedNews,
      viewedProfile,
      viewedLibrary,
      login,
      signUp,
      logout,
      setView,
      viewAnimeDetails,
      viewNewsDetails,
      addAnime,
      updateAnime,
      deleteAnime,
      updateUser,
      openModal,
      closeModal,
      openAddNewsModal,
      closeAddNewsModal,
      dismissNotification,
      setPostLoginChoice,
      closePostLoginModal,
      handleRecommendationFeedback,
      toggleFavorite,
      viewUserProfile,
      searchUsers,
      addNewsPost,
      toggleLikeNews,
      addNewsComment,
      fetchComments,
      reportNews
    }}>
      {children}
    </AppContext.Provider>
  );
};
