
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../services/store';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Loader, Mail } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerAction?: string; // Optional context like "add this anime"
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, triggerAction }) => {
  const { login, signUp } = useStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Track if component is mounted to prevent state updates after close
  const isMounted = useRef(true);

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    
    // Timeout promise to prevent indefinite hanging
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. Please check your connection.")), 15000)
    );
    
    try {
        if (isSignUp) {
            const result = await Promise.race([
                signUp(email, password, username),
                timeoutPromise
            ]) as any;

            if (isMounted.current) {
                if (!result.error && result.data.user && !result.data.session) {
                     setSuccessMsg(`Account created! Please check ${email} to verify your account.`);
                } else if (result.error) {
                    setError(result.error.message);
                } else if (!result.error) {
                    onClose();
                }
            }
        } else {
            const result = await Promise.race([
                login(email, password),
                timeoutPromise
            ]) as { error: any };

            if (isMounted.current) {
                if (result.error) {
                    setError(result.error.message);
                } else {
                    onClose();
                }
            }
        }
    } catch (e: any) {
        if (isMounted.current) {
            setError(e.message || 'Authentication failed');
        }
    } finally {
        if (isMounted.current) {
            setIsLoading(false);
        }
    }
  };

  const resetState = () => {
      setError('');
      setSuccessMsg('');
      setIsSignUp(!isSignUp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-zinc-900 w-full max-w-md rounded-lg shadow-2xl border border-zinc-800 overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-10">
          {successMsg ? (
              <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                      <Mail size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                  <p className="text-zinc-400 mb-6">{successMsg}</p>
                  <Button onClick={() => { setSuccessMsg(''); setIsSignUp(false); }} className="w-full">
                      Back to Sign In
                  </Button>
              </div>
          ) : (
              <>
                  <div className="text-left mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </h2>
                    <p className="text-zinc-500 text-sm">
                      {triggerAction 
                        ? `${isSignUp ? 'Sign up' : 'Sign in'} to access this feature.` 
                        : 'Welcome back to AniTrackr.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                     {error && (
                         <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded text-center border border-red-500/20">
                             {error}
                         </div>
                     )}

                     <form onSubmit={handleSubmit} className="space-y-4">
                       {isSignUp && (
                           <Input 
                             placeholder="Username" 
                             required={isSignUp}
                             className="bg-zinc-800 border-transparent focus:bg-zinc-700 text-white rounded h-12"
                             value={username}
                             onChange={(e) => setUsername(e.target.value)}
                           />
                       )}

                       <Input 
                         placeholder="Email" 
                         type="email" 
                         required 
                         className="bg-zinc-800 border-transparent focus:bg-zinc-700 text-white rounded h-12"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                       />
                       <Input 
                         placeholder="Password" 
                         type="password" 
                         required 
                         className="bg-zinc-800 border-transparent focus:bg-zinc-700 text-white rounded h-12"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                       />
                       
                       <Button type="submit" className="w-full flex items-center justify-center gap-2 h-12 font-bold bg-red-600 hover:bg-red-700" isLoading={isLoading}>
                         {isSignUp ? 'Sign Up' : 'Sign In'}
                       </Button>
                     </form>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-800">
                    <div className="text-zinc-500 text-base text-center">
                       {isSignUp ? "Already have an account?" : "New to AniTrackr?"} 
                       <button 
                           onClick={resetState}
                           className="ml-2 text-rose-500 hover:text-rose-400 font-bold hover:underline focus:outline-none"
                       >
                           {isSignUp ? "Sign In" : "Sign Up"}
                       </button>
                    </div>
                  </div>
              </>
          )}
        </div>
      </div>
    </div>
  );
};
