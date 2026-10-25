import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Smile, Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from './lib/supabase';
import { GoogleLogin } from '@react-oauth/google';
import emailjs from '@emailjs/browser';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ─── ROUTING HELPER ───
  const routeUser = async (userId: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    if (profile?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/'); 
    }
  };

  // ─── GOOGLE AUTH HANDLER ───
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });

      if (error) throw error;
      
      if (data.user) {
        // Check if the Google account was created in the last 15 seconds (New User)
        const isNewUser = new Date(data.user.created_at).getTime() > Date.now() - 15000;

        if (isNewUser) {
          // 1. Send the welcome email
          try {
            await emailjs.send(
              'service_i3xusfo',      
              'template_uw7z0fs',     
              {
                email: data.user.email,         
                name: data.user.user_metadata?.full_name || 'Patient'        
              },
              'zfhT9yUDdqKQyMJ8X'  
            );
            console.log("Google Welcome email sent successfully!");
          } catch (emailError) {
            console.error("Failed to send Google welcome email:", emailError);
          }

          // 2. STOP AUTO-LOGIN: Sign them out and force manual login
          await supabase.auth.signOut();
          alert("Account successfully registered! Please sign in to access your portal.");
          setIsLogin(true); 
          return; // Stop execution here so it doesn't route to the homepage
        }
        
        // If it's an existing user, route them normally to the home page
        await routeUser(data.user.id);
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── EMAIL AUTH HANDLER ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // LOGIN
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        if (authData.user) await routeUser(authData.user.id);
        
      } else {
        // SIGNUP
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (error) throw error;

        // Anti-Duplicate Check: If identities array is empty, the email already exists!
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error("This email is already registered. Please sign in instead.");
        }
        
        // SEND WELCOME EMAIL VIA EMAILJS
        try {
          await emailjs.send(
            'service_i3xusfo',      
            'template_uw7z0fs',     
            {
              email: email,         
              name: fullName        
            },
            'zfhT9yUDdqKQyMJ8X'  
          );
          console.log("Email/Password Welcome email sent successfully!");
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
        
        // Form stays on Login page, switches view, and asks them to sign in manually
        alert("Registration successful! You can now sign in.");
        setIsLogin(true);
        setPassword('');
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 antialiased hero-gradient min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-dental-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full p-8 sm:p-10 relative z-10 animate-fade-in-up border border-white">
        
        <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-dental-600 transition flex items-center gap-1 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Header */}
        <div className="text-center mt-6 mb-6">
          <div className="bg-dental-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-dental-600/30 transform rotate-3">
            <Smile className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-gray-900">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isLogin ? 'Sign in to access your portal.' : 'Join us to manage your appointments.'}
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 mb-6 text-sm font-medium animate-fade-in-up border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Google Authentication - Cleanly Centered */}
        <div className="mb-6 flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErrorMsg('Google sign-in was closed or failed.')}
            theme="outline"
            size="large"
            text={isLogin ? 'signin_with' : 'signup_with'}
            shape="rectangular"
            logo_alignment="center"
          />
        </div>

        {/* Divider */}
        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
            Or continue with email
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        
        {/* Email Form */}
        <form className="space-y-4 block animate-fade-in-up" onSubmit={handleSubmit}>
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white text-sm" 
                  placeholder="Juan Dela Cruz" 
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white text-sm" 
                placeholder="you@email.com" 
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              {isLogin && (
                <a href="#" className="text-xs text-dental-600 hover:text-dental-800 font-medium transition-colors">
                  Forgot password?
                </a>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white text-sm" 
                placeholder={isLogin ? "••••••••" : "Create a strong password"} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center mt-2 mb-4">
              <input 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
                className="h-4 w-4 text-dental-600 focus:ring-dental-500 border-gray-300 rounded cursor-pointer" 
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                Remember me
              </label>
            </div>
          )}

          <button disabled={loading} type="submit" className="w-full bg-dental-600 text-white font-bold py-3.5 rounded-xl hover:bg-dental-700 transition shadow-lg shadow-dental-600/20 transform hover:-translate-y-0.5 mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
          
          <p className="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-gray-100">
            {isLogin ? "Don't have an account?" : "Already have an account?"} 
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setPassword(''); }} 
              className="text-dental-600 font-bold hover:text-dental-800 transition-colors ml-1.5"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}