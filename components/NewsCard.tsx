
import React, { useState } from 'react';
import { NewsPost } from '../types';
import { useStore } from '../services/store';
import { Heart, MessageCircle, Eye, Share2, MoreVertical, Flag } from 'lucide-react';

interface Props {
  post: NewsPost;
}

export const NewsCard: React.FC<Props> = ({ post }) => {
  const { viewNewsDetails, likedNews, toggleLikeNews, reportNews } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const isLiked = likedNews.has(post.id);

  const handleShare = async (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = `${window.location.origin}/#/news/${post.id}`;
      
      const shareData = {
          title: post.title,
          text: post.body.substring(0, 100) + '...',
          url: url
      };

      // Try native share first (Mobile)
      if (navigator.share) {
          try {
              await navigator.share(shareData);
              return;
          } catch (err) {
              console.log('Share cancelled or failed, falling back to clipboard');
          }
      }
      
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        // Using a simple alert for feedback as we don't have a toast trigger here easily accessible without passing dispatch
        alert("Link copied to clipboard!"); 
      } catch (err) {
        prompt("Copy this link:", url);
      }
  };

  const toggleMenu = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMenu(!showMenu);
  };

  const handleReport = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMenu(false);
      if (confirm("Report this post for violating community guidelines?")) {
          reportNews(post.id, "User flagged");
      }
  };

  return (
    <div 
        onClick={() => viewNewsDetails(post.id)}
        className="group flex flex-col md:flex-row gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all cursor-pointer relative"
    >
        {/* Image Thumbnail */}
        <div className="w-full md:w-48 h-48 md:h-32 shrink-0 rounded-xl overflow-hidden bg-zinc-800">
            <img 
                src={post.imageUrl || "https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=600&auto=format&fit=crop"} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
            <div>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap">
                        {post.authorAvatar && !post.isAnonymous && (
                            <img src={post.authorAvatar} className="w-4 h-4 rounded-full" alt="" />
                        )}
                        <span className={post.isAnonymous ? "italic" : "font-medium text-zinc-400"}>
                            {post.authorName}
                        </span>
                        <span>•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.sourceName && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline text-rose-500 font-bold">{post.sourceName}</span>
                            </>
                        )}
                    </div>
                    
                    {/* Menu Trigger - High Z-index when open to float above other cards */}
                    <div className={`relative ${showMenu ? 'z-[60]' : 'z-10'}`}>
                        <button 
                            onClick={toggleMenu}
                            className="text-zinc-600 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
                            title="More options"
                        >
                            <MoreVertical size={16} />
                        </button>
                        
                        {showMenu && (
                            <div className="absolute right-0 top-6 w-32 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                                <button 
                                    onClick={handleReport}
                                    className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                                >
                                    <Flag size={12} /> Report
                                </button>
                                {/* Future: Add Edit/Delete here if owner */}
                            </div>
                        )}
                    </div>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-white mb-2 leading-tight group-hover:text-rose-400 transition-colors">
                    {post.title}
                </h3>
                
                <p className="text-sm text-zinc-400 line-clamp-2 md:line-clamp-1 mb-4">
                    {post.body}
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleLikeNews(post.id); }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${isLiked ? 'text-red-500 bg-red-500/10' : 'hover:text-red-400 hover:bg-zinc-800'}`}
                >
                    <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                    {post.likesCount}
                </button>
                
                <div className="flex items-center gap-1.5 px-2 py-1">
                    <MessageCircle size={14} />
                    {post.commentsCount}
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1">
                    <Eye size={14} />
                    {post.viewCount}
                </div>

                <div className="flex-1" />

                <button 
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-2 py-1 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <Share2 size={14} />
                </button>
            </div>
        </div>
        
        {/* Overlay for closing menu when clicking outside */}
        {showMenu && (
            <div 
                className="fixed inset-0 z-[55] cursor-default" 
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
            />
        )}
    </div>
  );
};
