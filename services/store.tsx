
import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren, useRef } from 'react';
import { UserProfile, UserAnimeEntry, ViewState, AnimeStatus, AppNotification, RecommendationFeedback, NewsPost, NewsComment, Badge, AnimeMetadata, FavoriteItem, UserBadge } from '../types';
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
  const [view, setViewState] = useState<ViewState>('AUTH');
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'ADD' });
  const [addNewsModal, setAddNewsModal] = useState<AddNewsModalState>({ isOpen: false });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Public Profile State
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [viewedLibrary, setViewedLibrary] = useState<UserAnimeEntry[]>([]);
  
  // News State
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [newsComments, setNewsComments] = useState<Record<string, NewsComment[]>>({});
  const [likedNews, setLikedNews] = useState<Set<string>>(new Set());

  const currentAuthUserId = useRef<string | null>(null);

  // Helper to update view and persist
  const setView = (newView: ViewState) => {
      setViewState(newView);
      localStorage.setItem('anitrackr_last_view', newView);
  };

  // --- SUPABASE INTEGRATION ---

  useEffect(() => {
    fetchNews();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (currentAuthUserId.current !== session.user.id) {
            handleSessionOk(session.user.id, 'INITIAL_SESSION');
        }
      } else {
        handleSessionGone();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        const userId = session.user.id;
        // If the user is already authenticated and we get another SIGNED_IN event (e.g. from tab focus),
        // we generally just want to refresh data, not reset the whole app state.
        // However, handleSessionOk handles state restoration, so it's safe to run it.
        if (currentAuthUserId.current === userId && event !== 'SIGNED_IN') {
             return;
        }
        handleSessionOk(userId, event);
      } else {
        handleSessionGone();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSessionOk = async (userId: string, event: string) => {
      currentAuthUserId.current = userId;
      const profile = await initUserData(userId);
      if (profile) {
           // Always prioritize restoring the user's last known location.
           // This prevents redirecting to Home when the window is minimized/maximized or tab is refreshed.
           const lastView = localStorage.getItem('anitrackr_last_view') as ViewState | null;
           
           if (lastView && lastView !== 'AUTH') {
               // Restore specific context data needed for the view
               if (lastView === 'DETAILS') {
                   const aid = localStorage.getItem('anitrackr_selected_anime');
                   if (aid) setSelectedAnimeId(parseInt(aid));
               } else if (lastView === 'NEWS_DETAIL') {
                   const nid = localStorage.getItem('anitrackr_selected_news');
                   if (nid) {
                       setSelectedNewsId(nid);
                       fetchComments(nid);
                   }
               } else if (lastView === 'PUBLIC_PROFILE') {
                    const uid = localStorage.getItem('anitrackr_viewed_user');
                    if (uid) {
                        // Attempt to view profile. This sets view internally.
                        await viewUserProfile(uid); 
                        return; 
                    }
               }
               
               setView(lastView);
           } else {
               // If no history exists (fresh login), default to HOME
               setView('HOME');
           }
      }
  };

  const handleSessionGone = () => {
      currentAuthUserId.current = null;
      setUser(null);
      setLibrary([]);
      setLikedNews(new Set());
      setViewState('AUTH'); // Don't use setView here to avoid overwriting last_view immediately if we want to debug, but standard flow suggests auth reset
      localStorage.setItem('anitrackr_last_view', 'AUTH');
  };

  const initUserData = async (userId: string) => {
      try {
          const userProfile = await fetchUserProfile(userId);
          if (userProfile) {
               await Promise.all([
                   fetchUserLibrary(userId),
                   fetchUserLikes(userId)
               ]);
               setUser(userProfile);
               return userProfile;
          }
          return null;
      } catch (e) {
          console.error("Failed to init user data", e);
          return null;
      }
  };

  const fetchNews = async () => {
      const { data, error } = await supabase.from('news_posts').select('*').order('created_at', { ascending: false });
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
      }
  };

  const fetchUserLikes = async (userId: string) => {
      const { data } = await supabase.from('news_likes').select('post_id').eq('user_id', userId);
      if (data) {
          setLikedNews(new Set(data.map((l: any) => l.post_id)));
      }
  };

  const fetchComments = async (postId: string) => {
      const { data, error } = await supabase.from('news_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
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
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const username = authUser.user_metadata.username || authUser.email?.split('@')[0] || 'Otaku';
            const avatarUrl = authUser.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
            const { data: newProfile } = await supabase.from('profiles').insert({
                    id: userId,
                    username,
                    avatar_url: avatarUrl,
                    bio: 'Just joined AniTrackr!',
                    favorite_genres: []
                }).select().single();
            if (newProfile) {
                profile = newProfile;
            } else {
                await new Promise(r => setTimeout(r, 500));
                const { data: retryProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
                if (retryProfile) profile = retryProfile;
                else profile = { id: userId, username: username, avatar_url: avatarUrl, bio: 'Welcome!', favorite_genres: [], is_private: false, show_adult_content: false, created_at: new Date().toISOString() };
            }
        }
    }
    if (profile) {
        const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', userId);
        const formattedFavorites: FavoriteItem[] = favData ? favData.map((f: any) => ({ animeId: f.anime_id, title: f.title, coverImage: f.cover_image, format: f.format })) : [];
        const { data: badgeData } = await supabase.from('user_badges').select('*').eq('user_id', userId);
        const formattedBadges: UserBadge[] = badgeData ? badgeData.map((b: any) => ({ badgeId: b.badge_id, awardedAt: new Date(b.awarded_at).getTime() })) : [];

        return {
            id: profile.id,
            username: profile.username || 'User',
            avatarUrl: profile.avatar_url,
            bannerUrl: profile.banner_url,
            bio: profile.bio || '',
            favoriteGenres: profile.favorite_genres || [],
            isPrivate: profile.is_private || false,
            showAdultContent: profile.show_adult_content || false,
            badges: formattedBadges, 
            favorites: formattedFavorites,
            joinedAt: profile.created_at ? new Date(profile.created_at).getTime() : Date.now()
        };
    }
    return null;
  };

  const fetchUserLibrary = async (userId: string) => {
    const { data } = await supabase.from('library').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
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

  const viewUserProfile = async (userId: string) => {
      if (!userId || (user && user.id === userId)) {
          if (user && user.id === userId) { setView('PROFILE'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
          return;
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!profile) {
          setNotifications(prev => [...prev, { id: crypto.randomUUID(), type: 'INFO', title: 'Error', message: 'User not found.', icon: '❌' }]);
          return;
      }
      const { data: libData } = await supabase.from('library').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
      const publicLibrary: UserAnimeEntry[] = libData ? libData.map((item: any) => {
             let meta = item.metadata;
             if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch (e) { meta = {}; } }
             if (!meta) meta = {};
             if (!meta.title) meta.title = { romaji: 'Unknown Title', english: 'Unknown Title' };
             if (!meta.coverImage) meta.coverImage = { large: 'https://via.placeholder.com/200x300?text=?', medium: 'https://via.placeholder.com/100x150?text=?' };
             return { id: item.id, animeId: item.anime_id || 0, metadata: meta, status: (item.status || 'WATCHING').toUpperCase() as AnimeStatus, progress: item.progress || 0, score: item.score || 0, notes: item.notes || '', updatedAt: item.updated_at || Date.now() };
          }) : [];
      const { data: badgeData } = await supabase.from('user_badges').select('*').eq('user_id', userId);
      const publicBadges = badgeData ? badgeData.map((b: any) => ({ badgeId: b.badge_id, awardedAt: new Date(b.awarded_at).getTime() })) : [];
      const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', userId);
      const publicFavs = favData ? favData.map((f: any) => ({ animeId: f.anime_id, title: f.title, coverImage: f.cover_image, format: f.format })) : [];

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
      
      // Update state directly here but use wrapper for consistency if needed, but here we set specific storage first
      localStorage.setItem('anitrackr_viewed_user', userId);
      setView('PUBLIC_PROFILE');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchUsers = async (query: string): Promise<UserProfile[]> => {
      const { data } = await supabase.from('profiles').select('*').ilike('username', `%${query}%`).limit(10);
      if (!data) return [];
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

  const triggerBadgeCheck = (updatedLibrary: UserAnimeEntry[]) => {
    if (!user) return;
    const earnedBadges = evaluateBadges(updatedLibrary, user.badges || []);
    if (earnedBadges.length > 0) awardBadges(earnedBadges);
  };

  const awardBadges = async (badges: Badge[]) => {
      if (!user) return;
      const newBadgeEntries = badges.map(b => ({ badgeId: b.id, awardedAt: Date.now(), isNew: true }));
      const existingIds = new Set(user.badges.map(b => b.badgeId));
      const uniqueNewBadges = newBadgeEntries.filter(b => !existingIds.has(b.badgeId));
      if (uniqueNewBadges.length === 0) return;

      setUser(prev => prev ? { ...prev, badges: [...prev.badges, ...uniqueNewBadges] } : null);
      const dbInserts = uniqueNewBadges.map(b => ({ user_id: user.id, badge_id: b.badgeId, awarded_at: new Date(b.awardedAt).toISOString() }));
      await supabase.from('user_badges').insert(dbInserts);
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
      let message = '', actionLabel = 'Add News', initialBody = '', initialTitle = '';
      if (type === 'EPISODE') { message = `Just finished Ep ${context.ep}? Share a quick thought!`; initialBody = `Watched Ep ${context.ep} of ${context.title}...`; initialTitle = `Thoughts: ${context.title} Ep ${context.ep}`; }
      if (type === 'ADD') { message = `Added ${context.title}! Know something about it?`; initialBody = `Starting ${context.title}!`; initialTitle = `Starting ${context.title}`; }
      if (type === 'COMPLETE') { message = `Finished ${context.title}! Write a review.`; initialBody = `Completed ${context.title}. Rating: ...`; initialTitle = `Review: ${context.title}`; actionLabel = 'Write Review'; }
      setNotifications(prev => [...prev, { id: crypto.randomUUID(), type: 'NUDGE', title: 'Community needs your voice 📰', message, icon: '✍️', actionLabel, onAction: () => openAddNewsModal({ title: initialTitle, body: initialBody, relatedAnimeId: context.id }) }]);
  };

  const login = async (email: string, password: string) => {
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error };
        return { error: null };
    } catch (e: any) { return { error: { message: e.message || 'Login failed' } }; }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username: username, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` } } });
        if (error) return { data: null, error };
        return { data, error: null };
    } catch (e: any) { return { data: null, error: { message: e.message || 'Signup failed' } }; }
  };

  const logout = async () => { 
      await supabase.auth.signOut(); 
      localStorage.removeItem('anitrackr_last_view');
      localStorage.removeItem('anitrackr_selected_anime');
      localStorage.removeItem('anitrackr_selected_news');
      localStorage.removeItem('anitrackr_viewed_user');
      handleSessionGone(); 
  };
  
  const viewAnimeDetails = (animeId: number) => { 
      setSelectedAnimeId(animeId); 
      localStorage.setItem('anitrackr_selected_anime', animeId.toString());
      setView('DETAILS'); 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const viewNewsDetails = (newsId: string) => { 
      setSelectedNewsId(newsId); 
      localStorage.setItem('anitrackr_selected_news', newsId);
      setNewsPosts(prev => prev.map(p => p.id === newsId ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p)); 
      setView('NEWS_DETAIL'); 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
      fetchComments(newsId); 
  };
  
  const applyStatusRules = (item: UserAnimeEntry): UserAnimeEntry => {
    const newItem = { ...item };
    if (newItem.metadata.episodes && newItem.progress > newItem.metadata.episodes) newItem.progress = newItem.metadata.episodes;
    if (newItem.progress < 0) newItem.progress = 0;
    if (newItem.score > 10) newItem.score = 10;
    if (newItem.score < 0) newItem.score = 0;
    
    // Status Logic
    if (newItem.status === AnimeStatus.COMPLETED && newItem.metadata.episodes && newItem.progress < newItem.metadata.episodes) newItem.status = AnimeStatus.WATCHING;
    if (newItem.status === AnimeStatus.PLAN_TO_WATCH && newItem.progress > 0) newItem.status = AnimeStatus.WATCHING;
    if (newItem.status === AnimeStatus.WATCHING && newItem.metadata.episodes && newItem.progress >= newItem.metadata.episodes) newItem.status = AnimeStatus.COMPLETED;
    
    return newItem;
  };

  const addAnime = async (entry: UserAnimeEntry) => {
    if (!user) return;
    if (library.some(item => item.animeId === entry.animeId)) { setNotifications(prev => [...prev, { id: crypto.randomUUID(), type: 'INFO', title: 'Duplicate Entry', message: 'Already in your library.', icon: '⚠️' }]); return; }
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

    if (error) { setLibrary(prev => prev.filter(i => i.id !== tempId)); }
    else if (data) { setLibrary(prev => prev.map(i => i.id === tempId ? { ...i, id: data.id } : i)); triggerBadgeCheck([optimisticEntry, ...library]); triggerNudge('ADD', { title: entry.metadata.title.english || entry.metadata.title.romaji, id: entry.animeId }); }
  };

  const updateAnime = async (id: string, updates: Partial<UserAnimeEntry>) => {
    if (!user) return;
    
    // Find the current item
    const existingItem = library.find(i => i.id === id);
    if (!existingItem) return;

    // Calculate the new state with rules applied
    const mergedItem = { ...existingItem, ...updates };
    const finalItem = applyStatusRules(mergedItem);
    
    // Nudge Logic Checks
    let nudgeType: 'EPISODE' | 'COMPLETE' | null = null;
    let nudgeContext: { title: string; ep?: number; id?: number } = { title: '', ep: 0, id: 0 };
    
    if (finalItem.progress > existingItem.progress) {
         nudgeType = 'EPISODE';
         nudgeContext = { 
             title: finalItem.metadata.title.english || finalItem.metadata.title.romaji, 
             ep: finalItem.progress, 
             id: finalItem.animeId 
         };
    }
    
    if (finalItem.status === AnimeStatus.COMPLETED && existingItem.status !== AnimeStatus.COMPLETED) {
         nudgeType = 'COMPLETE';
         nudgeContext = { 
             title: finalItem.metadata.title.english || finalItem.metadata.title.romaji, 
             id: finalItem.animeId 
         };
    }

    // Update Local State
    setLibrary(prev => prev.map(item => item.id === id ? finalItem : item));
    triggerBadgeCheck(library.map(item => item.id === id ? finalItem : item));

    // Update Database with calculated fields
    const dbPayload = {
        status: finalItem.status,
        progress: finalItem.progress,
        score: finalItem.score,
        notes: finalItem.notes,
        updated_at: Date.now()
    };

    const { error } = await supabase.from('library').update(dbPayload).eq('id', id);
    
    if (error) {
        console.error("Failed to update anime", error);
        // Revert local state if DB fails
        setLibrary(prev => prev.map(item => item.id === id ? existingItem : item));
        setNotifications(prev => [...prev, { id: crypto.randomUUID(), type: 'INFO', title: 'Update Failed', message: 'Could not save changes.', icon: '❌' }]);
    } else {
        if (nudgeType) setTimeout(() => triggerNudge(nudgeType!, nudgeContext), 500);
    }
  };

  const deleteAnime = async (id: string) => {
      const itemToDelete = library.find(i => i.id === id);
      if (!itemToDelete) return;

      // Optimistic Delete
      setLibrary(prev => prev.filter(item => item.id !== id));
      
      const { error } = await supabase.from('library').delete().eq('id', id);

      if (error) {
          console.error("Failed to delete", error);
          setLibrary(prev => [...prev, itemToDelete]);
          setNotifications(prev => [...prev, { id: crypto.randomUUID(), type: 'INFO', title: 'Error', message: 'Failed to delete anime.', icon: '❌' }]);
      } else {
          setNotifications(prev => [...prev, { 
              id: crypto.randomUUID(), 
              type: 'INFO', 
              title: 'Removed', 
              message: 'Anime removed from library.', 
              icon: '🗑️',
              actionLabel: 'Undo',
              onAction: () => {
                  // Re-insert the item immediately
                  addAnime(itemToDelete);
              }
          }]);
      }
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
      await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
  };

  const openModal = (mode: 'ADD' | 'EDIT', data?: UserAnimeEntry) => setModal({ isOpen: true, mode, data });
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false, data: undefined }));
  const openAddNewsModal = (initialData?: AddNewsModalState['initialData']) => setAddNewsModal({ isOpen: true, initialData });
  const closeAddNewsModal = () => setAddNewsModal({ isOpen: false });
  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const handleRecommendationFeedback = (animeId: number, action: 'like' | 'dislike' | 'hide') => { if (!user) return; const newFeedback: RecommendationFeedback = { animeId, action, timestamp: Date.now() }; setUser({ ...user, recommendationFeedback: [...(user.recommendationFeedback || []), newFeedback] }); };
  const toggleFavorite = async (anime: AnimeMetadata) => {
    if (!user) return;
    const favs = user.favorites || [];
    const exists = favs.find(f => f.animeId === anime.id);
    let newFavs;
    if (exists) { newFavs = favs.filter(f => f.animeId !== anime.id); await supabase.from('favorites').delete().eq('user_id', user.id).eq('anime_id', anime.id); } 
    else { newFavs = [...favs, { animeId: anime.id, title: anime.title.english || anime.title.romaji, coverImage: anime.coverImage.large || anime.coverImage.medium, format: anime.format }]; await supabase.from('favorites').insert({ user_id: user.id, anime_id: anime.id, title: anime.title.english || anime.title.romaji, cover_image: anime.coverImage.large || anime.coverImage.medium, format: anime.format }); }
    setUser({ ...user, favorites: newFavs });
  };
  const addNewsPost = async (postData: Omit<NewsPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'viewCount'>) => {
      if (!user) return;
      const { data } = await supabase.from('news_posts').insert({ user_id: user.id, author_name: postData.authorName, author_avatar: postData.authorAvatar, is_anonymous: postData.isAnonymous, title: postData.title, body: postData.body, image_url: postData.imageUrl, source_name: postData.sourceName, source_url: postData.sourceUrl, related_anime_id: postData.relatedAnimeId }).select().single();
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
      if (isLiked) { await supabase.from('news_likes').delete().eq('post_id', id).eq('user_id', user.id); } else { await supabase.from('news_likes').insert({ post_id: id, user_id: user.id }); }
  };
  const addNewsComment = async (postId: string, body: string): Promise<boolean> => {
      if (!user) return false;
      const isPrivate = user.isPrivate;
      const username = isPrivate ? 'Anonymous' : (user.username || 'User');
      const avatarUrl = isPrivate ? 'https://github.com/shadcn.png' : (user.avatarUrl || 'https://github.com/shadcn.png');
      const { data, error } = await supabase.from('news_comments').insert({ post_id: postId, user_id: user.id, username, avatar_url: avatarUrl, body }).select().single();
      if (error) { setNotifications(prev => [...prev, { id: crypto.randomUUID(), type: 'INFO', title: 'Error', message: 'Failed to post comment.', icon: '❌' }]); return false; }
      if (data) {
          const newComment: NewsComment = { id: data.id, postId, userId: user.id, username: data.username, avatarUrl: data.avatar_url, body: data.body, createdAt: new Date(data.created_at).getTime() };
          setNewsComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
          setNewsPosts(posts => posts.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
          return true;
      }
      return false;
  };
  const reportNews = (id: string, reason: string) => { setNotifications(prev => [...prev, { id: crypto.randomUUID(), type: 'INFO', title: 'Report Submitted', message: 'Thanks for keeping the community safe.', icon: '🛡️' }]); };

  return (
    <AppContext.Provider value={{ user, library, view, selectedAnimeId, selectedNewsId, isAuthenticated: !!user, modal, addNewsModal, notifications, newsPosts, newsComments, likedNews, viewedProfile, viewedLibrary, login, signUp, logout, setView, viewAnimeDetails, viewNewsDetails, addAnime, updateAnime, deleteAnime, updateUser, openModal, closeModal, openAddNewsModal, closeAddNewsModal, dismissNotification, handleRecommendationFeedback, toggleFavorite, viewUserProfile, searchUsers, addNewsPost, toggleLikeNews, addNewsComment, fetchComments, reportNews }}>
      {children}
    </AppContext.Provider>
  );
};
