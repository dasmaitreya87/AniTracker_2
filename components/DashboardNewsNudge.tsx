
import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { Button } from './ui/Button';
import { X, Newspaper, PenTool } from 'lucide-react';

export const DashboardNewsNudge = () => {
  const { user, newsPosts, openAddNewsModal } = useStore();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if dismissed recently (persist dismissal for 7 days)
    const dismissedAt = localStorage.getItem('anitrackr_nudge_dismissed');
    if (dismissedAt) {
        const days = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (days < 7) {
            setIsVisible(false);
            return;
        }
    }
  }, []);

  if (!user || !isVisible) return null;

  // Logic: Show if user has < 1 post
  const userPosts = newsPosts.filter(p => p.userId === user.id);
  if (userPosts.length > 0) return null;

  const handleDismiss = () => {
      setIsVisible(false);
      localStorage.setItem('anitrackr_nudge_dismissed', Date.now().toString());
  };

  return (
    <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 relative overflow-hidden shadow-lg animate-fade-in mb-8 group">
       <button 
         onClick={handleDismiss}
         className="absolute top-2 right-2 p-2 text-zinc-500 hover:text-white transition-colors z-10"
         title="Not now"
       >
         <X size={16} />
       </button>
       
       <div className="flex flex-col md:flex-row items-center gap-6 relative z-0">
          <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 shrink-0">
             <Newspaper size={32} />
          </div>
          
          <div className="flex-1 text-center md:text-left">
             <h3 className="text-xl font-bold text-white mb-2">Community needs your voice 📰</h3>
             <p className="text-zinc-400 text-sm max-w-lg">
                You haven't posted any news yet! Share anime updates, hot takes, or reviews. 
                Your contributions help fellow fans discover great content.
             </p>
          </div>

          <div className="shrink-0">
             <Button 
                onClick={() => openAddNewsModal()}
                className="shadow-xl shadow-rose-500/20 gap-2"
             >
                <PenTool size={16} /> Add News
             </Button>
          </div>
       </div>

       {/* Decorative BG element */}
       <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors" />
    </div>
  );
};
