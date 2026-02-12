
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../services/store';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Image as ImageIcon, CheckCircle, Upload } from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinaryService';

export const AddNewsModal = () => {
  const { addNewsModal, closeAddNewsModal, addNewsPost, user } = useStore();
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  
  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [relatedAnimeId, setRelatedAnimeId] = useState<number | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate form from initial data when opened
  useEffect(() => {
    if (addNewsModal.isOpen && addNewsModal.initialData) {
        setTitle(addNewsModal.initialData.title || '');
        setBody(addNewsModal.initialData.body || '');
        setRelatedAnimeId(addNewsModal.initialData.relatedAnimeId);
    }
  }, [addNewsModal.isOpen, addNewsModal.initialData]);

  if (!addNewsModal.isOpen || !user) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
          alert("File too large. Max 8MB.");
          return;
      }
      setImageFile(file);
      // Create preview URL for immediate feedback
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = async () => {
    if (!title || !body) return;
    setIsLoading(true);

    try {
        let finalImageUrl = imagePreview;

        // If a new file was selected, upload it to Cloudinary
        if (imageFile) {
            finalImageUrl = await uploadToCloudinary(imageFile);
        } else if (!imagePreview) {
            // Default placeholder if no image provided
            finalImageUrl = "https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=1200&auto=format&fit=crop";
        }

        addNewsPost({
            userId: user.id,
            authorName: isAnonymous ? 'Anonymous' : user.username,
            authorAvatar: isAnonymous ? undefined : user.avatarUrl,
            isAnonymous,
            title,
            body,
            imageUrl: finalImageUrl,
            sourceName,
            sourceUrl,
            relatedAnimeId
        });
        
        setStep('SUCCESS');
    } catch (error) {
        alert("Failed to create post. Please try again.");
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClose = () => {
      closeAddNewsModal();
      // Reset form after closing
      setTimeout(() => {
          setStep('FORM');
          setTitle('');
          setBody('');
          setSourceName('');
          setSourceUrl('');
          setRelatedAnimeId(undefined);
          setImageFile(null);
          setImagePreview('');
          setIsAnonymous(false);
      }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
            <h2 className="text-xl font-bold text-white">
                {step === 'FORM' ? 'Share Anime News' : 'Success'}
            </h2>
            <button onClick={handleClose} className="text-zinc-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
            {step === 'FORM' ? (
                <div className="space-y-6">
                    <div>
                        <Input 
                            label="Headline (Required)" 
                            placeholder="Short, catchy headline (max 150 chars)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value.slice(0, 150))}
                            maxLength={150}
                            className="bg-zinc-800 border-zinc-700 focus:border-rose-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Image (Recommended)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer relative overflow-hidden group"
                        >
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                                    <div className="relative z-10 flex flex-col items-center">
                                        <CheckCircle className="text-green-500 mb-2" size={32} />
                                        <span className="text-white font-medium">Image Selected</span>
                                        <span className="text-xs">Click to change</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ImageIcon size={40} className="mb-3 opacity-50" />
                                    <span className="font-medium">Click to upload</span>
                                    <span className="text-xs mt-1">Max 8MB (jpg, png, webp)</span>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Story (Required)</label>
                        <textarea 
                            className="w-full h-40 bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                            placeholder="Write the news — links allowed. Keep it friendly."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                        <div className="text-right text-xs text-zinc-500 mt-1">{body.length}/3000</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Source Name (Optional)" 
                            placeholder="e.g. Crunchyroll"
                            value={sourceName}
                            onChange={(e) => setSourceName(e.target.value)}
                            className="bg-zinc-800 border-zinc-700"
                        />
                        <Input 
                            label="Source URL (Optional)" 
                            placeholder="https://..."
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            className="bg-zinc-800 border-zinc-700"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="anon" 
                            checked={isAnonymous} 
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-rose-500 focus:ring-rose-500"
                        />
                        <label htmlFor="anon" className="text-sm text-zinc-300 cursor-pointer select-none">
                            Post as Anonymous <span className="text-zinc-500">(hide username)</span>
                        </label>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6">
                        <Upload size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Published!</h3>
                    <p className="text-zinc-400 max-w-sm mb-8">
                        Your news post has been submitted and is now visible on the feed.
                    </p>
                    <Button onClick={handleClose}>Back to Feed</Button>
                </div>
            )}
        </div>

        {/* Footer */}
        {step === 'FORM' && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
                <Button variant="ghost" onClick={handleClose} disabled={isLoading}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    isLoading={isLoading} 
                    disabled={!title || !body}
                    className="bg-rose-600 hover:bg-rose-500"
                >
                    Publish
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};
