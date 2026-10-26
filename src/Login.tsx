import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Smile, Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
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
  const [successMsg, setSuccessMsg] = useState('');

  // Helper: Send Welcome Email to User's Gmail
  const sendWelcomeEmail = async (targetEmail: string, targetName: string) => {
    try {
      await emailjs.send(
        'service_i3xusfo',      
        'template_uw7z0fs',     
        {
          email: targetEmail,
          to_email: targetEmail,
          user_email: targetEmail,
          name: targetName,
          to_name: targetName,
          user_name: targetName,
          message: `Welcome to Samuela Dental Clinic, ${targetName}! Your patient portal account has been successfully registered. You can now sign in and book appointments online.`
        },
        'zfhT9yUDdqKQyMJ8X'  
      );
      console.log("✅ Welcome email sent to:", targetEmail);
    } catch (emailError) {
      console.error("⚠️ Failed to send welcome email via EmailJS:", emailError);
    }
  };

  // Helper: Track & Verify Registered Accounts Locally + via Supabase Profiles
  const markEmailAsRegistered = (userEmail: string) => {
    const clean = userEmail.trim().toLowerCase();
    const list: string[] = JSON.parse(localStorage.getItem('samuela_registered_emails') || '[]');
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem('samuela_registered_emails', JSON.stringify(list));
    }
  };

  const isEmailRegisteredLocally = (userEmail: string) => {
    const clean = userEmail.trim().toLowerCase();
    const list: string[] = JSON.parse(localStorage.getItem('samuela_registered_emails') || '[]');
    return list.includes(clean);
  };

  // ─── STRICT ROUTING & ROLE CHECK HELPER ───
  const routeUser = async (userId: string, userEmail?: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.warn("Profile lookup warning:", profileError.message);
    }

    // Save email to verified list so future logins are recognized
    if (userEmail) {
      markEmailAsRegistered(userEmail);
    }

    if (profile?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/'); 
    }
  };

  // ─── GOOGLE AUTH HANDLER (STRICT SIGN-UP VS SIGN-IN) ───
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });

      if (error) throw error;
      if (!data.user) {
        throw new Error('Could not retrieve Google account details.');
      }

      const gUser = data.user;
      if (!gUser.email) {
        throw new Error('Google account email is missing.');
      }

      const gEmail = gUser.email.toLowerCase();
      const gName = gUser.user_metadata?.full_name || gUser.user_metadata?.name || 'Patient';

      // Check if user already exists in the `profiles` table
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', gUser.id)
        .maybeSingle();

      // Check if Google account was just created within the last 20 seconds
      const isNewlyCreatedAuth = new Date(gUser.created_at).getTime() > Date.now() - 20000;
      const isAlreadyRegistered = Boolean(existingProfile) || isEmailRegisteredLocally(gEmail);

      // CASE 1: User is on the "Create Account" (Sign Up) tab
      if (!isLogin) {
        if (!existingProfile) {
          await supabase.from('profiles').upsert([
            { id: gUser.id, role: 'patient' }
          ]).select();
        }

        markEmailAsRegistered(gEmail);

        // Send Gmail confirmation via EmailJS
        await sendWelcomeEmail(gEmail, gName);

        // Sign out immediately so they see the confirmation message and log in properly
        await supabase.auth.signOut();
        setIsLogin(true);
        setSuccessMsg(`You registered successfully with Google (${gEmail})! A confirmation email has been sent to your Gmail. Please sign in below.`);
        return;
      }

      // CASE 2: User is on the "Welcome Back" (Sign In) tab
      if (isLogin) {
        if (isNewlyCreatedAuth && !isEmailRegisteredLocally(gEmail) && existingProfile?.role !== 'admin') {
          await supabase.auth.signOut();
          setErrorMsg('This Google account is not registered yet. Please click "Sign up" below to create an account first.');
          return;
        }

        if (!isAlreadyRegistered && existingProfile?.role !== 'admin') {
          await supabase.auth.signOut();
          setErrorMsg('Account not found. Only registered accounts can sign in. Please sign up first.');
          return;
        }

        await routeUser(gUser.id, gEmail);
      }

    } catch (error: any) {
      setErrorMsg(error.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── EMAIL & PASSWORD AUTH HANDLER ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isLogin) {
        // 1. STRICT LOGIN: Verify credentials with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (authError) {
          throw new Error('Invalid email or password. Please make sure your account is registered.');
        }

        if (!authData.user) {
          throw new Error('Sign in failed. Account not found.');
        }

        // 2. Route Admin to /admin and Registered Patient to /
        await routeUser(authData.user.id, cleanEmail);
        
      } else {
        // 1. SIGN UP: Validate inputs
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName.trim() }
          }
        });

        if (error) throw error;

        // Anti-Duplicate Check: If identities array is empty, the email is already registered
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('This email is already registered. Please sign in instead.');
        }

        // Save profile row in Supabase if table allows it
        if (data.user) {
          await supabase.from('profiles').upsert([
            { id: data.user.id, role: 'patient' }
          ]);
        }

        // Mark as registered
        markEmailAsRegistered(cleanEmail);
        
        // 2. SEND WELCOME EMAIL TO USER'S GMAIL
        await sendWelcomeEmail(cleanEmail, fullName.trim());

        // 3. Sign out any auto-session so they must log in on the Sign In view
        await supabase.auth.signOut();
        
        // 4. Show On-Screen Success Banner & Switch to Sign In view
        setIsLogin(true);
        setPassword('');
        setSuccessMsg(`You registered successfully! A confirmation email has been sent to ${cleanEmail}. You may now sign in.`);
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Authentication error occurred.');
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

        {/* On-Screen Registration Success Banner */}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-start gap-3 mb-6 text-sm font-medium animate-fade-in-up border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">Registration Successful!</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Error Message Banner */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center gap-2.5 mb-6 text-sm font-medium animate-fade-in-up border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
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
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); setPassword(''); }} 
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