import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, Mail, Lock, User, ArrowRight, Github, Chrome, Loader2 } from 'lucide-react';
import type { User as UserType } from '../types';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (authError) {
          if (authError.message.toLowerCase().includes('confirm')) {
            throw new Error('Please verify your email to continue. Check your inbox for the confirmation link.');
          }
          throw authError;
        }

        if (data.user) {
          onLogin({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User'
          });
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        
        if (authError) throw authError;
        
        if (data.user) {
          if (data.session) {
            onLogin({
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.full_name || name
            });
          } else {
            setSuccess('Registration successful! Please check your email for the confirmation link.');
            setIsLogin(true); // Switch to login view so they can try signing in after confirming
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      });

      if (authError) throw authError;

      if (data?.url) {
        const authWindow = window.open(
          data.url,
          'supabase_oauth_popup',
          'width=600,height=700'
        );

        if (!authWindow) {
          setError('Popup blocked! Please allow popups for this site.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        // Auth state change listener in App.tsx will handle the user state
        // We just need to clear any errors here
        setError('');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        onLogin({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [onLogin]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-100/50 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-green-900/5 p-8 border border-white relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-6 shadow-lg shadow-green-200"
          >
            <Sprout className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            Farmex AI
          </h1>
          <p className="text-gray-500 font-medium">
            Your intelligent farming companion
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-gray-100/50 p-1.5 rounded-2xl flex relative mb-8">
          <motion.div
            className="absolute inset-y-1.5 bg-white rounded-xl shadow-sm z-0"
            initial={false}
            animate={{
              x: isLogin ? 0 : '100%',
              width: 'calc(50% - 6px)'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 text-sm font-bold relative z-10 transition-colors ${isLogin ? 'text-green-600' : 'text-gray-400'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 text-sm font-bold relative z-10 transition-colors ${!isLogin ? 'text-green-600' : 'text-gray-400'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin ? (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all font-medium"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div layout className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs font-bold text-red-500 text-center bg-red-50 py-3 px-4 rounded-2xl border border-red-100"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs font-bold text-green-600 text-center bg-green-50 py-3 px-4 rounded-2xl border border-green-100"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="px-4 bg-white text-gray-400">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all font-bold text-sm text-gray-700 shadow-sm active:scale-[0.98]"
          >
            <Chrome className="w-5 h-5 text-blue-500" />
            Continue with Google
          </button>
          
          {/* Developer Bypass */}
          <button 
            onClick={() => onLogin({ id: 'dev-user', email: 'dev@example.com', name: 'Developer User' })}
            className="text-[10px] text-gray-300 hover:text-gray-400 transition-colors mt-2"
          >
            Skip Login (Dev Mode)
          </button>
        </div>

        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          {isLogin ? "New to Farmex?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 font-bold hover:text-green-700 transition-colors"
          >
            {isLogin ? 'Create one now' : 'Sign in here'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
