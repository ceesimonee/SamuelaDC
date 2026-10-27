import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Smile, Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck, CalendarCheck, Clock } from 'lucide-react';
import { supabase } from './lib/supabase';
import { GoogleLogin } from '@react-oauth/google';
import emailjs from '@emailjs/browser';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false); // NEW: Detects if user clicked email reset link
  
  // Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── CHECK FOR PASSWORD RECOVERY LINK ON LOAD ───
  useEffect(() => {
    // Listen for the password recovery event triggered by clicking the email link
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setIsForgotPassword(false);
        setIsLogin(false);
      }
    });

    // Fallback URL hash check
    if (window.location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
      setIsForgotPassword(false);
      setIsLogin(false);
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ─── HELPER: Send Welcome Email to User's Gmail ───
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
    } catch (emailError) {
      console.error("⚠️ Failed to send welcome email via EmailJS:", emailError);
    }
  };

  // ─── HELPER: Track & Verify Registered Accounts Locally ───
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (userEmail) {
      markEmailAsRegistered(userEmail);
    }

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
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });

      if (error) throw error;
      
      const gUser = data.user;
      
      if (!gUser || !gUser.email) {
        throw new Error('Could not retrieve Google account details.');
      }

      const gEmail = gUser.email.toLowerCase();
      const gName = gUser.user_metadata?.full_name || gUser.user_metadata?.name || 'Patient';

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', gUser.id)
        .maybeSingle();

      const isNewlyCreatedAuth = new Date(gUser.created_at).getTime() > Date.now() - 20000;
      const isAlreadyRegistered = Boolean(existingProfile) || isEmailRegisteredLocally(gEmail);

      // SIGN UP
      if (!isLogin) {
        if (!existingProfile) {
          await supabase.from('profiles').upsert([{ id: gUser.id, role: 'patient' }]);
        }
        markEmailAsRegistered(gEmail);
        await sendWelcomeEmail(gEmail, gName);
        await supabase.auth.signOut();
        setIsLogin(true);
        setSuccessMsg(`Registration successful! A confirmation email was sent to ${gEmail}. Please sign in below.`);
        return;
      }

      // SIGN IN
      if (isLogin) {
        if (isNewlyCreatedAuth && !isEmailRegisteredLocally(gEmail) && existingProfile?.role !== 'admin') {
          await supabase.auth.signOut();
          setErrorMsg('Account not registered yet. Please click "Register here" to create an account first.');
          return;
        }
        if (!isAlreadyRegistered && existingProfile?.role !== 'admin') {
          await supabase.auth.signOut();
          setErrorMsg('Account not found. Only registered accounts can sign in.');
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
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (authError) throw new Error('Invalid email or password. Please make sure your account is registered.');
        if (!authData.user) throw new Error('Sign in failed. Account not found.');
        
        await routeUser(authData.user.id, cleanEmail);
        
      } else {
        if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: fullName.trim() } }
        });

        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('This email is already registered. Please sign in instead.');
        }

        if (data.user) {
          await supabase.from('profiles').upsert([{ id: data.user.id, role: 'patient' }]);
        }

        markEmailAsRegistered(cleanEmail);
        await sendWelcomeEmail(cleanEmail, fullName.trim());
        await supabase.auth.signOut();
        
        setIsLogin(true);
        setPassword('');
        setSuccessMsg(`Registration successful! A confirmation email has been sent to ${cleanEmail}. You may now sign in.`);
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ─── SEND FORGOT PASSWORD EMAIL ───
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login`, 
      });

      if (error) throw error;
      setSuccessMsg(`A password reset link has been sent to ${email}. Please check your inbox.`);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  // ─── UPDATE NEW PASSWORD AFTER CLICKING LINK ───
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccessMsg('Password updated successfully! Redirecting...');
      setTimeout(async () => {
        setIsRecoveryMode(false);
        setIsLogin(true);
        setPassword('');
        // Route user automatically since they are logged in after updating password
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          routeUser(user.id);
        } else {
          navigate('/');
        }
      }, 2000);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-gray-50 overflow-hidden relative">
      
      {/* ── GLOBAL BACK TO HOME BUTTON (Top Left) ── */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/" 
          className="text-gray-500 lg:text-sky-100 hover:text-[#0c4a6e] lg:hover:text-white font-medium flex items-center gap-2 transition-colors bg-white/80 lg:bg-transparent p-2 lg:p-0 rounded-lg lg:rounded-none shadow-sm lg:shadow-none"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* ── LEFT PANEL (BRANDING INSPIRATION) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-[#0c4a6e] relative flex-col justify-center px-12 xl:px-20 text-white overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#0284c7] rounded-full mix-blend-multiply filter blur-[80px] opacity-60 transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-emerald-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 transform -translate-x-1/3 translate-y-1/3"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity w-fit mt-8">
            <div className="bg-white p-2.5 rounded-full shadow-lg">
              <Smile className="w-8 h-8 text-[#0c4a6e]" />
            </div>
            <span className="font-serif text-3xl font-bold tracking-tight">Samuela Dental</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-serif font-bold leading-tight mb-6 text-white">
            Your dental health, <br />in one secure portal.
          </h1>
          <p className="text-sky-100 text-lg max-w-md leading-relaxed mb-12">
            Patients can seamlessly book appointments, review clinical records, and stay connected with our experts—without leaving the platform.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-sky-50">
              <div className="bg-sky-500/20 p-3 rounded-xl"><CalendarCheck className="w-6 h-6 text-sky-300" /></div>
              <span className="font-medium text-lg">Instant Appointment Booking</span>
            </div>
            <div className="flex items-center gap-4 text-sky-50">
              <div className="bg-sky-500/20 p-3 rounded-xl"><ShieldCheck className="w-6 h-6 text-sky-300" /></div>
              <span className="font-medium text-lg">Secure Clinical Records</span>
            </div>
            <div className="flex items-center gap-4 text-sky-50">
              <div className="bg-sky-500/20 p-3 rounded-xl"><Clock className="w-6 h-6 text-sky-300" /></div>
              <span className="font-medium text-lg">Real-time Queue Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (LOGIN FORM) ── */}
      <div className="w-full lg:w-[55%] xl:w-[50%] flex items-center justify-center p-6 sm:p-12 relative min-h-screen lg:min-h-0 pt-20 lg:pt-0">

        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 sm:p-10 border border-gray-100 relative z-10 animate-fade-in-up">
          
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">
              {isRecoveryMode ? 'Set New Password' : isForgotPassword ? 'Reset Password' : (isLogin ? 'Sign in' : 'Create Account')}
            </h2>
            <p className="text-gray-500 text-sm">
              {isRecoveryMode
                ? 'Enter your new secure password below.'
                : isForgotPassword 
                  ? 'Enter your email to receive a reset link.' 
                  : (isLogin ? 'Use your registered email and credentials.' : 'Join us to manage your dental appointments.')}
            </p>
          </div>

          {/* Alerts */}
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-start gap-3 mb-6 text-sm font-medium animate-fade-in-up border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center gap-2.5 mb-6 text-sm font-medium animate-fade-in-up border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── SET NEW PASSWORD FORM (AFTER CLICKING EMAIL LINK) ── */}
          {isRecoveryMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-5 animate-fade-in-up">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} required 
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0c4a6e] outline-none transition bg-gray-50 focus:bg-white text-sm" 
                    placeholder="Enter new password" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-[#0c4a6e] text-white font-bold py-3.5 rounded-xl hover:bg-[#075985] transition shadow-lg shadow-[#0c4a6e]/20 mt-2 disabled:opacity-70">
                {loading ? 'Saving...' : 'Save New Password'}
              </button>
            </form>
          ) : isForgotPassword ? (
            /* ── SEND RESET LINK FORM ── */
            <form onSubmit={handleResetPassword} className="space-y-5 animate-fade-in-up">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type="email" required 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0c4a6e] outline-none transition bg-gray-50 focus:bg-white text-sm" 
                    placeholder="Enter your registered email" 
                  />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-[#0c4a6e] text-white font-bold py-3.5 rounded-xl hover:bg-[#075985] transition shadow-lg shadow-[#0c4a6e]/20 mt-2 disabled:opacity-70">
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>

              <button 
                type="button" 
                onClick={() => { setIsForgotPassword(false); setErrorMsg(''); setSuccessMsg(''); }}
                className="w-full text-center text-sm text-[#0284c7] font-semibold hover:underline mt-4"
              >
                Back to sign in
              </button>
            </form>

          ) : (
            /* ── STANDARD LOGIN/SIGNUP FORM ── */
            <>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <input 
                        type="text" required 
                        value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0c4a6e] outline-none transition bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Juan Dela Cruz" 
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      type="email" required 
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0c4a6e] outline-none transition bg-gray-50 focus:bg-white text-sm" 
                      placeholder="you@email.com" 
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} required 
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0c4a6e] outline-none transition bg-gray-50 focus:bg-white text-sm" 
                      placeholder={isLogin ? "••••••••" : "Create a strong password"} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between mt-2 mb-4">
                    <div className="flex items-center">
                      <input 
                        id="remember-me" type="checkbox" 
                        className="h-4 w-4 text-[#0c4a6e] focus:ring-[#0c4a6e] border-gray-300 rounded cursor-pointer" 
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                        Remember me
                      </label>
                    </div>
                    <button 
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-sm text-[#0284c7] font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button disabled={loading} type="submit" className="w-full bg-[#0c4a6e] text-white font-bold py-3.5 rounded-xl hover:bg-[#075985] transition shadow-lg shadow-[#0c4a6e]/20 mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="relative flex items-center my-7">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase tracking-widest">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setErrorMsg('Google sign-in was closed or failed.')}
                  theme="outline" size="large" text={isLogin ? 'signin_with' : 'signup_with'}
                  shape="rectangular" logo_alignment="center" width="100%"
                />
              </div>

              <div className="mt-8 text-center text-sm text-gray-600">
                {isLogin ? "Not yet registered? " : "Already applied? "}
                <button 
                  type="button" 
                  onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); setPassword(''); }} 
                  className="text-[#0284c7] font-bold hover:underline"
                >
                  {isLogin ? 'Register here' : 'Sign in here'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}