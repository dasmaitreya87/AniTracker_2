
import React from 'react';
import { useStore } from '../services/store';
import { LayoutDashboard, Library, User, LogOut, PlusCircle, Star } from 'lucide-react';
import { ViewState } from '../types';
import { NotificationToast } from './NotificationToast';

interface LayoutProps {
  children: React.ReactNode;
  onOpenSearch: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onOpenSearch }) => {
  const { logout, setView, view, notifications, dismissNotification } = useStore();

  const NavItem = ({ label, icon: Icon, targetView }: { label: string, icon: any, targetView: ViewState }) => (
    <button 
      onClick={() => setView(targetView)}
      className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all w-full text-left font-medium
        ${view === targetView 
          ? 'bg-zinc-800 text-white border-l-4 border-red-600' 
          : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
        }`}
    >
      <Icon size={22} className={view === targetView ? 'text-white' : 'text-zinc-500'} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-zinc-100 font-sans relative">
      {/* Sidebar (Desktop) / Bottom Bar (Mobile) */}
      <nav className="fixed md:sticky bottom-0 md:top-0 w-full md:w-64 md:h-screen bg-black border-t md:border-t-0 md:border-r border-zinc-800 z-50 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
        
        {/* Desktop Logo */}
        <div className="hidden md:flex items-center gap-3 px-6 py-8">
          <button 
            onClick={() => setView('HOME')}
            className="text-3xl font-brand text-rose-500 tracking-tight hover:scale-105 transition-transform"
            aria-label="Go to Home Page"
          >
            AniTrackr
          </button>
        </div>

        {/* Navigation Items - Horizontal on Mobile, Vertical on Desktop */}
        <div className="flex md:flex-col justify-around md:justify-start gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-0 flex-1">
            <NavItem label="Dashboard" icon={LayoutDashboard} targetView="DASHBOARD" />
            <NavItem label="My List" icon={Library} targetView="LIBRARY" />
            <NavItem label="Favorites" icon={Star} targetView="FAVORITES" />
            <NavItem label="Profile" icon={User} targetView="PROFILE" />
            
            {/* Mobile-only Add Button in nav */}
            <button 
              onClick={onOpenSearch}
              className="md:hidden flex flex-col items-center justify-center text-red-600 p-2"
            >
              <PlusCircle size={28} className="mb-1" />
            </button>
        </div>

        {/* Desktop Logout Footer */}
        <div className="hidden md:block p-6 mt-auto border-t border-zinc-900">
           <button 
             onClick={logout}
             className="flex items-center gap-4 px-4 py-3 text-zinc-500 hover:text-zinc-300 w-full transition-colors text-sm font-medium"
           >
             <LogOut size={20} />
             <span>Exit AniTrackr</span>
           </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto mb-20 md:mb-0 max-w-7xl mx-auto w-full relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 sticky top-0 bg-black/90 backdrop-blur z-30 py-4 -mt-4 px-2 border-b border-zinc-800">
          <button onClick={() => setView('HOME')} className="text-2xl font-brand text-rose-500 tracking-tight">
            AniTrackr
          </button>
          <button onClick={logout} className="text-zinc-400"><LogOut size={20}/></button>
        </div>

        {children}
      </main>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto">
             <NotificationToast notification={n} onDismiss={dismissNotification} />
          </div>
        ))}
      </div>
    </div>
  );
};
