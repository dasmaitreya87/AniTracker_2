
import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, CheckCircle } from 'lucide-react';

export const Auth = () => {
  const { login, signUp } = useStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
        let result;
        if (isSignUp) {
            result = await signUp(email, password, username);
            if (!result.error && result.data.user && !result.data.session) {
                // Email confirmation required case
                setSuccessMsg(`Account created! Please check ${email} to verify your account before logging in.`);
            } else if (result.error) {
                setError(result.error.message);
            }
        } else {
            result = await login(email, password);
            if (result.error) {
                setError(result.error.message);
            }
        }
    } catch (e: any) {
        setError(e.message || 'An unexpected error occurred');
    } finally {
        setLoading(false);
    }
  };

  if (successMsg) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                    <Mail size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                <p className="text-slate-300 mb-6">{successMsg}</p>
                <Button onClick={() => { setSuccessMsg(''); setIsSignUp(false); }} className="w-full">
                    Back to Sign In
                </Button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-brand font-normal bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 mb-2 py-2">AniTrackr</h1>
          <p className="text-slate-400">Track, Share, and Discover Anime.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm text-center">
                  {error}
              </div>
          )}
          
          {isSignUp && (
             <Input 
                label="Username" 
                placeholder="OtakuKing" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={isSignUp}
             />
          )}

          <Input 
             label="Email" 
             type="email" 
             placeholder="shinji@nerve.org" 
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required 
          />
          <Input 
             label="Password" 
             type="password" 
             placeholder="••••••••" 
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required 
          />
          
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
             <span className="text-slate-400">
                 {isSignUp ? "Already have an account?" : "Don't have an account?"}
             </span>
             <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}
                className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
             >
                 {isSignUp ? "Sign In" : "Sign Up"}
             </button>
        </div>
      </div>
    </div>
  );
};
