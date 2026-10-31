import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase' 
import Login from './Login'
import Appointment from './Appointment'
import About from './About' 

// You can safely delete these 5 files later if you want, as the new dynamic system replaces them!
import ToothFilling from './services/ToothFilling'
import Cleaning from './services/Cleaning';
import Extraction from './services/Extraction';
import Sealants from './services/Sealants';
import Fluoride from './services/Fluoride';

// 👉 IMPORTING NEW DYNAMIC SERVICE PAGE
import ServiceDetail from './ServiceDetail';

import AdminLayout from './AdminLayout'
import AdminDashboard from './AdminDashboard'
import AdminAppointments from './AdminAppointments'
import AdminQueue from './AdminQueue'
import AdminPatients from './AdminPatients'
import AdminTreatment from './AdminTreatment'
import AdminTracking from './AdminTracking'
import PatientChat from './PatientChat';
import AdminMessages from './AdminMessages';
import AdminServices from './AdminServices';

import heroImg from './imports/SDC1.jfif';
import aboutImg from './imports/SDC2.jfif';

import {
  Smile, ChevronDown, ArrowRight, PlayCircle, Clock,
  ShieldPlus, Sparkles, MinusCircle, ShieldCheck, Activity,
  MapPin, Phone, Mail, CheckCircle2,
  UserCircle2, Menu, X, LogOut, Bell, ShieldAlert,
  Heart, Star, Shield, PlusCircle
} from 'lucide-react'

// 👉 DYNAMIC ICON MAPPER FOR DATABASE SERVICES
const ICON_MAP: Record<string, any> = {
  ShieldPlus, Sparkles, MinusCircle, ShieldCheck, Activity,
  Heart, Star, Shield, PlusCircle
};

const getIcon = (iconName: string) => ICON_MAP[iconName] || ShieldPlus;

// Helper to convert a service name to a URL slug (e.g. "General Checkup" -> "general-checkup")
const generateSlug = (name: string) => {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
};

function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileDropOpen, setMobileDropOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  const [user, setUser] = useState<any>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const [dynamicServices, setDynamicServices] = useState<any[]>([]);

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    supabase.from('clinic_services').select('*').order('id').then(({ data }) => {
      if (data) setDynamicServices(data);
    });

    return () => {
      window.removeEventListener('scroll', onScroll)
      authListener.subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    let channel: any;

    const fetchNotifications = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    if (user) {
      fetchNotifications();

      channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfileOpen(false)
    setBellOpen(false)
    setMobileOpen(false)
    setNotifications([])
    setUnreadCount(0)
    navigate('/login')
  }

  const handleBellClick = async () => {
    setBellOpen(!bellOpen);
    if (!bellOpen && unreadCount > 0 && user) {
      setUnreadCount(0);
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  }

  const handleNavClick = (sectionId: string) => {
    setMobileOpen(false)
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="font-sans text-gray-800 antialiased min-h-screen flex flex-col">
      <nav className={`fixed w-full z-50 glass-effect border-b border-gray-100 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('home')}>
              <div className="bg-[#0c4a6e] p-2 rounded-full">
                <Smile className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-[#0c4a6e]">Samuela Dental Clinic</span>
                <p className="text-xs text-[#0c4a6e] tracking-wider font-bold">DENTAL EXCELLENCE</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => handleNavClick('home')} className="nav-link-underline text-gray-700 hover:text-[#0c4a6e] font-medium transition">Home</button>

              <div className="relative group">
                <button
                  onClick={() => handleNavClick('services')}
                  className="nav-link-underline text-gray-700 hover:text-[#0c4a6e] font-medium transition flex items-center gap-1 py-2"
                >
                  Services
                  <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                </button>
                <div className="absolute left-0 top-full mt-4 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 origin-top -translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-3 max-h-[60vh] overflow-y-auto">
                    {dynamicServices.map((service) => {
                      const Icon = getIcon(service.icon);
                      const slug = generateSlug(service.name);
                      return (
                        <Link 
                          key={service.id} 
                          to={`/services/${slug}`} 
                          onClick={() => setMobileOpen(false)} 
                          className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-[#0c4a6e] transition text-left"
                        >
                          <Icon className="w-4 h-4" /> {service.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Link to="/about" className="nav-link-underline text-gray-700 hover:text-[#0c4a6e] font-medium transition">About</Link>

              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                
                {user ? (
                  <div className="relative" ref={profileRef}>
                    <button 
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="p-1 rounded-full border-2 border-transparent hover:border-gray-200 transition-colors focus:outline-none"
                    >
                      <UserCircle2 className="w-8 h-8 text-slate-500" strokeWidth={2} />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in-up">
                        <div className="px-4 py-2 mb-1 border-b border-gray-50">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {user.user_metadata?.full_name || 'Patient'}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                        <button 
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/login" className="text-gray-500 hover:text-[#0c4a6e] transition hover:scale-110" title="Login / Register">
                    <UserCircle2 className="w-7 h-7" />
                  </Link>
                )}

                <Link to="/appointment" className="bg-[#0c4a6e] text-white px-6 py-2.5 rounded-full font-medium hover:bg-[#075985] transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform">
                  Book Appointment
                </Link>

                <div className="relative" ref={bellRef}>
                  <button 
                    onClick={handleBellClick}
                    className="p-2 rounded-full border-2 border-transparent hover:bg-gray-100 transition-colors focus:outline-none relative"
                  >
                    <Bell className="w-6 h-6 text-slate-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {bellOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-up">
                      <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {!user ? (
                          <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            Please log in to view your notifications.
                            <Link to="/login" onClick={() => setBellOpen(false)} className="block mt-2 text-[#0c4a6e] hover:underline font-bold">
                              Go to Login
                            </Link>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            No notifications right now.
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 text-sm ${notif.is_read ? 'bg-white' : 'bg-sky-50'}`}>
                              <div className="flex gap-3 items-start">
                                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                                  notif.type === 'success' ? 'bg-green-500' :
                                  notif.type === 'error' ? 'bg-red-500' : 'bg-sky-500'
                                }`} />
                                <div>
                                  <p className="text-gray-800 leading-snug">{notif.message}</p>
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="md:hidden flex items-center gap-3">
              <button onClick={handleBellClick} className="relative p-2">
                <Bell className="w-6 h-6 text-[#0c4a6e]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button className="p-2" onClick={() => setMobileOpen(o => !o)}>
                {mobileOpen ? <X className="w-6 h-6 text-[#0c4a6e]" /> : <Menu className="w-6 h-6 text-[#0c4a6e]" />}
              </button>
            </div>

          </div>
        </div>

        {bellOpen && (
          <div className="md:hidden absolute w-full bg-white border-t border-gray-100 shadow-lg max-h-80 overflow-y-auto z-50">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 font-bold text-gray-900">
              Notifications
            </div>
            {!user ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                Please log in to view your notifications.
                <Link to="/login" onClick={() => setBellOpen(false)} className="block mt-2 text-[#0c4a6e] hover:underline font-bold">
                  Go to Login
                </Link>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                No notifications right now.
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 text-sm ${notif.is_read ? 'bg-white' : 'bg-sky-50'}`}>
                  <div className="flex gap-3 items-start">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      notif.type === 'success' ? 'bg-green-500' :
                      notif.type === 'error' ? 'bg-red-500' : 'bg-sky-500'
                    }`} />
                    <div>
                      <p className="text-gray-800 leading-snug">{notif.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {mobileOpen && !bellOpen && (
          <div className="md:hidden bg-white border-t z-40 relative">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <button onClick={() => handleNavClick('home')} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-sky-50 rounded-md">Home</button>
              <div>
                <div className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-sky-50 rounded-md">
                  <button onClick={() => handleNavClick('services')} className="flex-1 text-left">Services</button>
                  <button onClick={() => setMobileDropOpen(o => !o)} className="p-1">
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${mobileDropOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {mobileDropOpen && (
                  <div className="pl-6 pr-3 py-2 space-y-2 bg-gray-50/50 rounded-lg mt-1 border-l-2 border-sky-200 ml-3">
                    {dynamicServices.map((service) => {
                      const slug = generateSlug(service.name);
                      return (
                        <Link 
                          key={service.id} 
                          to={`/services/${slug}`} 
                          onClick={() => setMobileOpen(false)} 
                          className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-[#0c4a6e] rounded-md"
                        >
                          {service.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              <Link to="/about" onClick={() => setMobileOpen(false)} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-sky-50 rounded-md">About</Link>
              
              <div className="border-t border-gray-100 my-2 pt-2">
                {user ? (
                  <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-red-600 font-medium hover:bg-red-50 rounded-md flex items-center gap-2">
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full text-left px-3 py-2 text-[#0c4a6e] font-medium hover:bg-sky-50 rounded-md flex items-center gap-2">
                    <UserCircle2 className="w-5 h-5" /> Login / Register
                  </Link>
                )}
              </div>
              
              <Link to="/appointment" onClick={() => setMobileOpen(false)} className="block text-center w-full mt-2 bg-[#0c4a6e] text-white px-6 py-3 rounded-full font-medium">
                Book Now
              </Link>
            </div>
          </div>
        )}
      </nav>

      <PatientChat user={user} />

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-[#0c4a6e] text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Smile className="w-8 h-8 text-sky-400" />
                <span className="font-serif text-2xl font-bold">Samuela Dental Clinic</span>
              </div>
              <p className="text-sky-200 text-sm leading-relaxed max-w-sm">
                Providing world-class dental care with a gentle touch. Your comfort and health are our top priorities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sky-200 text-sm">
                {['Home', 'Services', 'About', 'Contact'].map(l => (
                  <li key={l}>
                    <button onClick={() => handleNavClick(l.toLowerCase())} className="hover:text-white transition">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Services</h4>
              <ul className="space-y-2 text-sky-200 text-sm">
                {dynamicServices.slice(0, 5).map(s => {
                  const slug = generateSlug(s.name);
                  return (
                    <li key={s.id}>
                      <Link to={`/services/${slug}`} className="hover:text-white transition text-left">{s.name}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="border-t border-[#075985] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sky-300 text-sm">© 2026 Samuela Dental Clinic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function LandingPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 👉 ADDED STATE FOR "SEE MORE" TOGGLE
  const [dynamicServices, setDynamicServices] = useState<any[]>([]);
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    supabase.from('clinic_services').select('*').order('id').then(({ data }) => {
      if (data) setDynamicServices(data);
    });
  }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.from('contact_messages').insert([
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message
        }
      ]);

      if (error) throw error;

      setForm({ name: '', email: '', phone: '', message: '' })
      showToast('success', 'Message sent! We will review your inquiry shortly.')
    } catch (err: any) {
      showToast('error', 'Something went wrong: ' + (err.message || 'Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // 👉 LOGIC TO LIMIT SERVICES TO 6
  const displayedServices = showAllServices ? dynamicServices : dynamicServices.slice(0, 6);

  return (
    <>
      <section id="home" className="hero-gradient min-h-screen flex items-center pt-20 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-[#0c4a6e] leading-tight">
                Creating <span className="text-[#0c4a6e]">Beautiful</span> Smiles That Last
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                Experience world-class dental care with cutting-edge technology and compassionate expertise. Your smile is our masterpiece.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/appointment" className="bg-[#0c4a6e] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#075985] transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group w-fit">
                  Schedule Consultation
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </Link>
                <button onClick={() => scrollTo('services')} className="bg-white text-[#0c4a6e] border-2 border-[#0c4a6e] px-8 py-4 rounded-full font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Our Services
                </button>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-3xl transform rotate-3 opacity-20" />
              <img src={heroImg} alt="Modern Dental Office" className="relative rounded-3xl shadow-2xl w-full object-cover h-[500px] animate-float" />
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-[#0c4a6e]" />
                  <div>
                    <p className="font-bold text-sm">Open Today</p>
                    <p className="text-xs text-gray-500">9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <button onClick={() => scrollTo('services')} className="text-[#0c4a6e] hover:text-[#075985]">
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>
      </section>

      <section className="bg-[#0c4a6e] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-[60px]"></div>
        </div>
      </section>

      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#0c4a6e] font-semibold tracking-wider uppercase text-sm">Our Services</span>
            <h2 className="font-serif text-4xl font-bold text-gray-900 mt-2 mb-4">Comprehensive Dental Solutions</h2>
            <p className="text-gray-600">From preventive care to complete restorations, we offer a full spectrum of dental services using the latest technology and techniques.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 👉 USES THE SLICED ARRAY NOW */}
            {displayedServices.map((service) => {
              const Icon = getIcon(service.icon);
              const slug = generateSlug(service.name);
              return (
                <Link 
                  key={service.id} 
                  to={`/services/${slug}`} 
                  className="service-card block bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer"
                >
                  <div className={`service-icon bg-sky-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-[#0c4a6e]" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-gray-900 mb-3">{service.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{service.description}</p>
                  <span className={`text-[#0c4a6e] font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all`}>
                    Learn more <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* 👉 SEE MORE BUTTON */}
          {dynamicServices.length > 6 && (
            <div className="mt-12 text-center fade-in">
              <button
                onClick={() => setShowAllServices(!showAllServices)}
                className="bg-white border-2 border-[#0c4a6e] text-[#0c4a6e] px-8 py-3 rounded-full font-semibold hover:bg-sky-50 transition inline-flex items-center gap-2 shadow-sm"
              >
                {showAllServices ? 'Show Less' : 'See All Services'}
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAllServices ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

        </div>
      </section>

      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img src={aboutImg} alt="Our Clinic" className="rounded-3xl shadow-xl w-full object-cover" />
            </div>
            <div className="space-y-6">
              <span className="text-[#0c4a6e] font-semibold tracking-wider uppercase text-sm">About Our Clinic</span>
              <h2 className="font-serif text-4xl font-bold text-gray-900">Crafting Perfect Smiles with Precision & Care</h2>
              <p className="text-gray-600 leading-relaxed">
                At Samuela Dental Clinic, we believe everyone deserves a healthy, beautiful smile. Our state-of-the-art facility combines cutting-edge technology with a warm, welcoming environment to provide dental care that exceeds expectations.
              </p>
              <div className="pt-4">
                <Link to="/about" className="bg-sky-100 text-[#0c4a6e] px-6 py-3 rounded-full font-semibold hover:bg-sky-200 transition flex items-center gap-2 group w-fit">
                  Read Our Full Story
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <span className="text-[#0c4a6e] font-semibold tracking-wider uppercase text-sm">Contact Us</span>
              <h2 className="font-serif text-4xl font-bold text-gray-900 mt-2 mb-6">Visit Our Clinic</h2>
              <p className="text-gray-600 mb-8">Ready to transform your smile? Visit us at our state-of-the-art facility or book an appointment online.</p>

              <div className="space-y-6">
                {[
                  { icon: MapPin, title: 'Address', lines: ['2nd floor, Samson Bldg., San Juan Street, Centro Oriental, Polangui, Albay'] },
                  { icon: Phone, title: 'Phone', lines: ['+63 938 297 8144'] },
                  { icon: Mail, title: 'Email', lines: ['shamanesamuela143@gmail.com'] },
                  { icon: Clock, title: 'Office Hours', lines: ['Mon - Fri: 9:00 AM - 6:00 PM', 'Saturday: 9:00 AM - 1:00 PM'] },
                ].map(({ icon: Icon, title, lines }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="bg-sky-100 p-3 rounded-lg shrink-0">
                      <Icon className="w-6 h-6 text-[#0c4a6e]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{title}</h4>
                      {lines.map(l => <p key={l} className="text-gray-600">{l}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text" required placeholder="Juan Dela Cruz"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email" required placeholder="juan@email.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input
                    type="tel" required placeholder="+63 9xx xxx xxxx"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4} placeholder="How can we help you?"
                    value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0c4a6e] text-white font-semibold py-4 rounded-lg hover:bg-[#075985] transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 transition-all duration-300 ${toast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'} ${toast?.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
        <CheckCircle2 className="w-6 h-6 shrink-0" />
        <p className="text-sm font-medium">{toast?.msg}</p>
      </div>
    </>
  )
}

function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const ADMIN_EMAIL = 'admin@samueladental.com'; 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c4a6e] mb-4"></div>
        <p className="text-[#0c4a6e] font-semibold tracking-widest uppercase text-sm">Verifying Access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 text-center max-w-md mb-6">
          You do not have administrator privileges to view this page. If you are a patient, please return to the homepage to access your profile.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-[#0c4a6e] text-white px-6 py-3 rounded-full font-medium hover:bg-[#075985] transition shadow-md"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} /> 
          
          {/* 👉 THE NEW SMART DYNAMIC ROUTE CATCHER */}
          <Route path="/services/:serviceId" element={<ServiceDetail />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/appointment" element={<Appointment />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="queue" element={<AdminQueue />} /> 
            <Route path="patients" element={<AdminPatients />} />
            <Route path="treatment" element={<AdminTreatment />} />
            <Route path="tracking" element={<AdminTracking />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="services" element={<AdminServices />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}