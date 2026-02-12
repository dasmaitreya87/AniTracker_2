
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../services/store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BadgeCard } from '../components/BadgeCard';
import { Settings, Shield, Award, LogIn, X, Image as ImageIcon, Upload, Loader, Eye, EyeOff } from 'lucide-react';
import { PostLoginPreference } from '../types';
import { uploadToCloudinary } from '../services/cloudinaryService';

export const Profile = () => {
  const { user, updateUser } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    avatarUrl: '',
    bannerUrl: '',
    bio: ''
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl || '',
        bio: user.bio
      });
    }
  }, [user, isEditing]);

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  const handlePrefChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateUser({ postLoginDefault: e.target.value as PostLoginPreference });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'bannerUrl') => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              alert("File size must be under 5MB");
              return;
          }
          
          setIsUploading(true);
          try {
            // Show local preview immediately if needed, but here we wait for cloud URL
            const secureUrl = await uploadToCloudinary(file);
            setFormData(prev => ({ ...prev, [field]: secureUrl }));
          } catch (error) {
            alert("Failed to upload image. Please try again.");
          } finally {
            setIsUploading(false);
          }
      }
  };

  const togglePublicProfile = () => {
      if (!user) return;
      updateUser({ isPrivate: !user.isPrivate });
  };

  const toggleAdultContent = () => {
      if (!user) return;
      updateUser({ showAdultContent: !user.showAdultContent });
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* Redesigned Profile Header with Wallpaper */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden group">
        
        {/* Banner Section */}
        <div className="relative h-48 md:h-64 w-full bg-zinc-800">
            {/* Display Image (User data or Live Preview) */}
            {(isEditing ? formData.bannerUrl : user.bannerUrl) ? (
                <img 
                    src={isEditing ? formData.bannerUrl : user.bannerUrl} 
                    alt="Profile Wallpaper" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-rose-900 opacity-80" />
            )}
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

            {/* Edit Toggle Button */}
            <button 
                onClick={() => setIsEditing(!isEditing)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-105 z-20 shadow-lg"
                title={isEditing ? "Close Editor" : "Edit Profile"}
            >
                {isEditing ? <X size={20} /> : <Settings size={20} />}
            </button>
        </div>

        {/* Profile Content Section */}
        <div className="px-6 md:px-10 pb-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                
                {/* Avatar - Overlapping Banner */}
                <div className="relative -mt-20 shrink-0 z-20">
                    <div className="p-1.5 bg-zinc-900 rounded-2xl shadow-2xl">
                        <img 
                            src={isEditing ? formData.avatarUrl : user.avatarUrl} 
                            alt={user.username} 
                            className="w-36 h-36 md:w-44 md:h-44 rounded-xl object-cover bg-zinc-800 border border-zinc-800"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://picsum.photos/200/200';
                            }}
                        />
                    </div>
                </div>

                {/* Info / Edit Form */}
                <div className="flex-1 w-full pt-2 md:pt-4">
                    {isEditing ? (
                        <div className="animate-fade-in bg-zinc-800/30 p-6 rounded-xl border border-zinc-700/50 space-y-4">
                            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                                <Settings size={18} className="text-rose-500"/> Edit Profile
                            </h3>
                            
                            <div className="space-y-4">
                                <Input 
                                    label="Display Name" 
                                    value={formData.username} 
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    placeholder="OtakuKing"
                                    className="bg-zinc-900 border-zinc-700"
                                />

                                {/* Avatar Input Group */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Avatar Image</label>
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <Input 
                                                value={formData.avatarUrl} 
                                                onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                                                placeholder="https://... or upload"
                                                className="bg-zinc-900 border-zinc-700"
                                            />
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={avatarInputRef} 
                                            className="hidden" 
                                            accept="image/png, image/jpeg, image/gif, image/webp"
                                            onChange={(e) => handleFileUpload(e, 'avatarUrl')}
                                        />
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => avatarInputRef.current?.click()}
                                            className="px-3 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 h-[42px]"
                                            title="Upload from device"
                                            disabled={isUploading}
                                        >
                                            {isUploading ? <Loader className="animate-spin" size={18} /> : <Upload size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            
                                {/* Banner Input Group */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Wallpaper Image</label>
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1 relative">
                                            <Input 
                                                value={formData.bannerUrl} 
                                                onChange={(e) => setFormData({...formData, bannerUrl: e.target.value})}
                                                placeholder="https://... or upload"
                                                className="bg-zinc-900 border-zinc-700 pl-10"
                                            />
                                            <ImageIcon size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={bannerInputRef} 
                                            className="hidden" 
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={(e) => handleFileUpload(e, 'bannerUrl')}
                                        />
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => bannerInputRef.current?.click()}
                                            className="px-3 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 h-[42px]"
                                            title="Upload from device"
                                            disabled={isUploading}
                                        >
                                             {isUploading ? <Loader className="animate-spin" size={18} /> : <Upload size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Bio</label>
                                <textarea 
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent transition-all"
                                    rows={3}
                                    value={formData.bio}
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    placeholder="Tell us about your anime taste..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isUploading}>Cancel</Button>
                                <Button onClick={handleSave} isLoading={isUploading}>Save Changes</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{user.username}</h2>
                            <p className="text-zinc-400 text-lg leading-relaxed mb-4 max-w-2xl">{user.bio}</p>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                                {user.favoriteGenres.map(g => (
                                    <span key={g} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wide border border-zinc-700 rounded-full">
                                        {g}
                                    </span>
                                ))}
                            </div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                                Member since {user.joinedAt ? new Date(user.joinedAt).getFullYear() : '2024'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8">
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
             <Award size={24} />
           </div>
           <div>
              <h3 className="text-xl font-bold text-white">Achievements</h3>
              <p className="text-sm text-zinc-500">
                {user.badges ? user.badges.length : 0} badges unlocked
              </p>
           </div>
        </div>

        {user.badges && user.badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {user.badges.map((badge) => (
              <BadgeCard key={badge.badgeId} userBadge={badge} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-black/20 rounded-lg border border-zinc-800/50 border-dashed">
            <p className="text-zinc-500 mb-2">No badges earned yet.</p>
            <p className="text-xs text-zinc-600">Watch more anime to unlock achievements!</p>
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 space-y-6">
         <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
           <Shield size={20} className="text-zinc-500"/> Account & Preferences
         </h3>
         
         {/* Post Login Preference */}
         <div className="flex items-center justify-between p-4 border-b border-zinc-800">
             <div>
                 <h4 className="font-medium text-white flex items-center gap-2">
                    <LogIn size={16} className="text-rose-500"/> On next login, go to:
                 </h4>
                 <p className="text-sm text-zinc-500">Choose your startup page.</p>
             </div>
             <select 
                value={user.postLoginDefault || 'ASK'}
                onChange={handlePrefChange}
                className="bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm"
             >
                 <option value="ASK">Always Ask</option>
                 <option value="DASHBOARD">Dashboard</option>
                 <option value="LANDING">Trending / Landing</option>
             </select>
         </div>

         {/* Public Profile Toggle */}
         <div className="flex items-center justify-between p-4 border-b border-zinc-800">
           <div>
             <h4 className="font-medium text-white flex items-center gap-2">
                 {user.isPrivate ? <EyeOff size={16} /> : <Eye size={16} />} 
                 Public Profile
             </h4>
             <p className="text-sm text-zinc-500">
               {user.isPrivate 
                 ? "Your profile is private. Other users cannot search for you or see your anime list."
                 : "Allow other users to view your profile and anime list."}
             </p>
           </div>
           <div 
             className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors ${!user.isPrivate ? 'bg-red-600' : 'bg-zinc-700'}`}
             onClick={togglePublicProfile}
             title="Toggle Visibility"
           >
             <div className={`absolute top-1 h-4 w-4 bg-white rounded-full transition-all ${!user.isPrivate ? 'left-6' : 'left-1'}`}></div>
           </div>
         </div>

         {/* Adult Content Toggle */}
         <div className="flex items-center justify-between p-4">
           <div>
             <h4 className="font-medium text-white">Show Adult Content</h4>
             <p className="text-sm text-zinc-500">Allow searching for NSFW/18+ content.</p>
           </div>
           <div 
             className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors ${user.showAdultContent ? 'bg-red-600' : 'bg-zinc-700'}`}
             onClick={toggleAdultContent}
           >
             <div className={`absolute top-1 h-4 w-4 bg-white rounded-full transition-all ${user.showAdultContent ? 'left-6' : 'left-1'}`}></div>
           </div>
         </div>
      </div>
    </div>
  );
};
