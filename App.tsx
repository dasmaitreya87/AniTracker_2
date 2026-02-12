
import React from 'react';
import { AppProvider, useStore } from './services/store';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { Profile } from './pages/Profile';
import { AnimeDetail } from './pages/AnimeDetail';
import { NewsDetail } from './pages/NewsDetail'; // New Page
import { Favorites } from './pages/Favorites'; // New Page
import { LandingPage } from './components/LandingPage';
import { SearchAddFlow } from './components/SearchAddFlow';
import { PostLoginChoiceModal } from './components/PostLoginChoiceModal';
import { AddNewsModal } from './components/AddNewsModal';
import { PublicProfile } from './pages/PublicProfile'; // New Page
import { Button } from './components/ui/Button';
import { Plus } from 'lucide-react';
import { AnimeMetadata, UserAnimeEntry, AnimeStatus } from './types';

const AppContent = () => {
  const { view, isAuthenticated, modal, openModal, closeModal } = useStore();

  const handleAddAnime = (anime: AnimeMetadata) => {
    const tempEntry: UserAnimeEntry = {
        id: 'temp_id',
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

  if (!isAuthenticated) {
    return (
        // Allow accessing News Detail even if not authenticated if needed?
        // Current design defaults Landing for unauth.
        // If view is NEWS_DETAIL via hash link etc, we could show it, but for now simple check:
        view === 'NEWS_DETAIL' ? (
           <div className="bg-black min-h-screen text-white">
               <NewsDetail />
               <AddNewsModal />
           </div>
        ) : (
           <LandingPage onAddAnime={handleAddAnime} />
        )
    );
  }

  // If user wants to see the "Home Page" (Landing content) while logged in
  if (view === 'HOME') {
    return (
        <>
            <LandingPage onAddAnime={handleAddAnime} />
            <SearchAddFlow 
              isOpen={modal.isOpen} 
              onClose={closeModal} 
              mode={modal.mode}
              initialEntry={modal.data}
            />
            <PostLoginChoiceModal />
        </>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD': return <Dashboard />;
      case 'LIBRARY': return <Library />;
      case 'FAVORITES': return <Favorites />;
      case 'PROFILE': return <Profile />;
      case 'DETAILS': return <AnimeDetail />;
      case 'NEWS_DETAIL': return <NewsDetail />;
      case 'PUBLIC_PROFILE': return <PublicProfile />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout onOpenSearch={() => openModal('ADD')}>
      <div className="mb-6 flex justify-between items-center md:hidden">
          {/* Mobile sub-header spacer if needed */}
      </div>

      {/* Floating Action Button for Desktop */}
      {view !== 'DETAILS' && view !== 'NEWS_DETAIL' && view !== 'PUBLIC_PROFILE' && (
        <div className="flex justify-end mb-4 hidden md:flex">
           <Button onClick={() => openModal('ADD')} className="gap-2 shadow-lg shadow-indigo-500/30">
             <Plus size={20} /> Add Anime
           </Button>
        </div>
      )}

      {renderView()}
      
      <SearchAddFlow 
        isOpen={modal.isOpen} 
        onClose={closeModal} 
        mode={modal.mode}
        initialEntry={modal.data}
      />
      <AddNewsModal />
      <PostLoginChoiceModal />
    </Layout>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
