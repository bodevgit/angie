import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useUser } from '../lib/user-context';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function Welcome() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileType, setProfileType] = useState<'angy' | 'bozy'>('angy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // UserContext will pick up the session change and redirect via useEffect
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              profile_type: profileType,
            },
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Legacy guest mode (hidden or secondary)
  const handleGuest = (type: 'angy' | 'bozy') => {
    setUser(type);
    navigate('/');
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#111214]">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 flex flex-col items-center gap-8 w-full max-w-md px-4"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-400 drop-shadow-sm tracking-tight text-center">
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h1>
          
          <form onSubmit={handleAuth} className="w-full space-y-4 bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1E1F22] text-white p-3 pl-10 rounded-xl border border-gray-700 focus:border-blue-500 outline-none transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1E1F22] text-white p-3 pl-10 rounded-xl border border-gray-700 focus:border-blue-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Who are you?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setProfileType('angy')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${profileType === 'angy' ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-[#1E1F22] border-gray-700 text-gray-500 hover:bg-white/5'}`}
                  >
                    <User size={20} />
                    <span className="font-bold">Angy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileType('bozy')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${profileType === 'bozy' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-[#1E1F22] border-gray-700 text-gray-500 hover:bg-white/5'}`}
                  >
                    <User size={20} />
                    <span className="font-bold">Bozy</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
            
            {/* Divider */}
            <div className="flex items-center gap-4 w-full opacity-30">
              <div className="h-px bg-white flex-1" />
              <span className="text-xs text-white">OR</span>
              <div className="h-px bg-white flex-1" />
            </div>

            {/* Guest Mode Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={() => handleGuest('angy')}
                className="text-xs text-gray-500 hover:text-pink-400 transition-colors"
              >
                Guest: Angy
              </button>
              <button 
                onClick={() => handleGuest('bozy')}
                className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
              >
                Guest: Bozy
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
