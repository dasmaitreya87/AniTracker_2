
import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Heart, MessageCircle, Share2, Flag, Send, Calendar, User, ExternalLink } from 'lucide-react';

export const NewsDetail = () => {
  const { selectedNewsId, newsPosts, newsComments, likedNews, toggleLikeNews, addNewsComment, reportNews, setView, isAuthenticated, user, viewUserProfile, fetchComments } = useStore();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fetch comments on mount
  useEffect(() => {
    if (selectedNewsId) {
        fetchComments(selectedNewsId);
    }
  }, [selectedNewsId]);

  const post = newsPosts.find(p => p.id === selectedNewsId);
  const comments = selectedNewsId ? newsComments[selectedNewsId] || [] : [];
  const isLiked = post ? likedNews.has(post.id) : false;

  if (!post) return <div className="p-10 text-center text-zinc-500">Post not found</div>;

  const handleLike = () => toggleLikeNews(post.id);

  const handleShare = async () => {
      const url = `${window.location.origin}/#/news/${post.id}`;
      const shareData = {
          title: post.title,
          text: (post.body || '').substring(0, 100) + '...',
          url: url
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
              return;
          } catch (e) {
              // Share failed or cancelled
          }
      }

      try {
          await navigator.clipboard.writeText(url);
          alert("Link copied to clipboard!");
      } catch (e) {
          prompt("Copy link:", url);
      }
  };

  const handleReport = () => {
      if (confirm("Report this post?")) {
          reportNews(post.id, "User flagged from detail view");
      }
  };

  const handleSubmitComment = async () => {
      if (!commentText.trim()) return;
      setIsSubmitting(true);
      const success = await addNewsComment(post.id, commentText);
      setIsSubmitting(false);
      
      if (success) {
          setCommentText('');
      }
  };

  const handleUserClick = (userId: string) => {
      if (userId) viewUserProfile(userId);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
        <Button variant="ghost" onClick={() => setView('HOME')} className="mb-6 pl-0 gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} /> Back to Feed
        </Button>

        {/* Article Header */}
        <article className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden mb-8 shadow-2xl">
            {post.imageUrl && (
                <div className="w-full h-64 md:h-96 relative">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-80" />
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
                        <div className="flex flex-wrap gap-2 mb-4">
                             {post.sourceName && (
                                <span className="bg-rose-600 text-white px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                                    Source: {post.sourceName}
                                </span>
                             )}
                             <span className="bg-black/50 backdrop-blur text-white px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-2">
                                <Calendar size={12} /> {new Date(post.createdAt || Date.now()).toLocaleDateString()}
                             </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-xl">
                            {post.title}
                        </h1>
                    </div>
                </div>
            )}

            <div className="p-6 md:p-10">
                {/* Author Bar */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-6">
                    <button 
                        onClick={() => handleUserClick(post.userId)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left group"
                        disabled={post.isAnonymous}
                    >
                         <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 group-hover:border-rose-500 transition-colors">
                             {post.authorAvatar && !post.isAnonymous ? (
                                 <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                             ) : (
                                 <User className="text-zinc-500" />
                             )}
                         </div>
                         <div>
                             <p className={`text-white font-bold ${!post.isAnonymous && 'group-hover:text-rose-400 transition-colors'}`}>{post.authorName || 'Anonymous'}</p>
                             <p className="text-xs text-zinc-500">Posted by {post.isAnonymous ? 'Anonymous' : 'Community Member'}</p>
                         </div>
                    </button>

                    <div className="flex gap-2">
                         <Button 
                            onClick={handleLike} 
                            variant="secondary" 
                            className={`rounded-full px-4 ${isLiked ? 'text-red-500 bg-red-500/10 border-red-500/50' : ''}`}
                         >
                             <Heart size={20} fill={isLiked ? "currentColor" : "none"} className="mr-2" /> {post.likesCount || 0}
                         </Button>
                         <Button variant="secondary" className="rounded-full px-3" onClick={handleShare}>
                             <Share2 size={20} />
                         </Button>
                         <Button variant="secondary" className="rounded-full px-3" onClick={handleReport}>
                             <Flag size={20} />
                         </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="prose prose-invert prose-lg max-w-none text-zinc-300 mb-8 whitespace-pre-wrap">
                    {post.body}
                </div>

                {post.sourceUrl && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                        <span className="text-sm text-zinc-500">Read original source</span>
                        <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="text-rose-500 hover:underline flex items-center gap-2 text-sm font-bold">
                            Visit {post.sourceName || 'Website'} <ExternalLink size={14} />
                        </a>
                    </div>
                )}
            </div>
        </article>

        {/* Comments Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageCircle className="text-rose-500" /> Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            {isAuthenticated ? (
                <div className="flex gap-4 mb-10">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                        <img src={user?.avatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <textarea 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none h-24"
                            placeholder="What do you think?"
                        />
                        <div className="flex justify-end mt-2">
                            <Button 
                                onClick={handleSubmitComment} 
                                disabled={!commentText.trim() || isSubmitting}
                                isLoading={isSubmitting}
                            >
                                Post Comment
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-zinc-950/50 rounded-xl p-6 text-center border border-zinc-800 border-dashed mb-8">
                    <p className="text-zinc-500">Please sign in to join the discussion.</p>
                </div>
            )}

            {/* List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <p className="text-zinc-600 text-center py-4">No comments yet. Be the first!</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-4 animate-fade-in">
                            <button 
                                onClick={() => handleUserClick(comment.userId)}
                                className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                            >
                                <img src={comment.avatarUrl} alt="" className="w-full h-full object-cover" />
                            </button>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <button 
                                        onClick={() => handleUserClick(comment.userId)}
                                        className="font-bold text-white text-sm hover:text-rose-400 transition-colors"
                                    >
                                        {comment.username}
                                    </button>
                                    <span className="text-xs text-zinc-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed">{comment.body}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    </div>
  );
};
