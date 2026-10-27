import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabaseClient'; // Keep your existing path
import emailjs from '@emailjs/browser';
import {
  Smile, ArrowLeft, MapPin, Phone, Clock,
  AlertCircle, ChevronDown, CheckCircle2, Lock, LogIn, UserCheck
} from 'lucide-react';

export default function Appointment() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth Check State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    note: ''
  });

  // ─── 1. CHECK IF USER IS LOGGED IN ON LOAD ───
  useEffect(() => {
    const checkUserSession = async () => {
      setIsCheckingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setAuthenticatedUser(session.user);

        // Auto-fill registered email & name
        const userEmail = session.user.email || '';
        const fullMetaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
        const nameParts = fullMetaName.trim().split(' ');
        const autoFirst = nameParts[0] || '';
        const autoLast = nameParts.slice(1).join(' ') || '';

        setFormData(prev => ({
          ...prev,
          email: userEmail,
          firstName: prev.firstName || autoFirst,
          lastName: prev.lastName || autoLast
        }));
      } else {
        setAuthenticatedUser(null);
      }
      setIsCheckingAuth(false);
    };

    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticatedUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ─── 2. HANDLE APPOINTMENT SUBMISSION & GMAIL NOTIFICATION ───
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict Security Gate: Block submission if not logged in
    if (!authenticatedUser) {
      alert('You must be signed in with a registered account to book an appointment.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    
    // Combine names to match Admin schema
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    // Format date & time nicely for the email notification
    const formattedDate = formData.date
      ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      : formData.date;

    // 1. Insert into Supabase `appointments` table
    const { error } = await supabase
      .from('appointments')
      .insert([{
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        appointment_date: formData.date,
        appointment_time: formData.time,
        note: formData.note,
        status: 'pending'
      }]);

    if (error) {
      setIsSubmitting(false);
      alert('Failed to book appointment: ' + error.message);
      return;
    }

    // 2. Send Appointment Confirmation Email to User's Gmail via EmailJS
    try {
      await emailjs.send(
        'service_i3xusfo',
        'template_9b2dzwa',
        {
          email: formData.email,
          name: fullName,
          service: formData.service,
          date: formattedDate,
          time: formData.time,
          phone: formData.phone,
          notes: formData.note.trim() || 'None provided'
        },
        'zfhT9yUDdqKQyMJ8X'
      );
      console.log('✅ Appointment confirmation email sent to:', formData.email);
    } catch (emailErr) {
      console.error('⚠️ Failed to send appointment confirmation email:', emailErr);
    }

    setIsSubmitting(false);

    // Show Success Toast
    setShowToast(true);
    
    // Redirect after 3 seconds
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  return (
    <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <nav className="w-full z-50 glass-effect border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-dental-600 p-2 rounded-full transition transform group-hover:scale-105">
                <Smile className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-dental-900">Samuela Dental Clinic</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              {authenticatedUser && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  <UserCheck className="w-3.5 h-3.5" /> {authenticatedUser.email}
                </span>
              )}
              <Link to="/" className="text-gray-500 hover:text-dental-600 font-medium flex items-center gap-2 transition">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-grow pt-10 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-dental-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in-up">
            <h1 className="font-serif text-4xl font-bold text-gray-900 mb-4">Request an Appointment</h1>
            <p className="text-gray-600">Please fill out the form below. Our scheduling coordinator will contact you shortly to confirm your exact appointment time.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            
            {/* Sidebar Information */}
            <div className="lg:col-span-1 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-dental-100 p-3 rounded-xl"><MapPin className="w-5 h-5 text-dental-600" /></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Location</h4>
                      <p className="text-gray-600 text-sm mt-1">123 Centro Oriental<br />Polangui, Albay</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-dental-100 p-3 rounded-xl"><Phone className="w-5 h-5 text-dental-600" /></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Call Us Directly</h4>
                      <p className="text-gray-600 text-sm mt-1">+63 (2) 8123-4567<br />+63 912 345 6789</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-dental-100 p-3 rounded-xl"><Clock className="w-5 h-5 text-dental-600" /></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Clinic Hours</h4>
                      <p className="text-gray-600 text-sm mt-1">Mon - Fri: 9:00 AM - 6:00 PM<br />Saturday: 9:00 AM - 1:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-3xl p-8 shadow-sm border border-red-100">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <h3 className="font-serif text-lg font-bold text-gray-900">Emergency?</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">If you are experiencing severe pain, bleeding, or dental trauma, please do not use this form. Call us immediately.</p>
                <a href="tel:+639123456789" className="block w-full text-center bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700 transition">Call +63 912 345 6789</a>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
                
                {/* ── AUTHENTICATION GATEKEEPER OVERLAY FOR GUESTS ── */}
                {!isCheckingAuth && !authenticatedUser && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-dental-100 text-dental-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">
                      Account Required to Book
                    </h3>
                    <p className="text-gray-600 max-w-md text-sm leading-relaxed mb-6">
                      To protect patient records and send real-time confirmation alerts to your Gmail, please sign in to your registered Samuela Dental Clinic account before requesting an appointment.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                      <Link
                        to="/login"
                        className="flex-1 bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-dental-600/20 flex items-center justify-center gap-2 text-sm"
                      >
                        <LogIn className="w-4 h-4" /> Sign In / Sign Up
                      </Link>
                    </div>
                  </div>
                )}

                <form onSubmit={handleBooking} className="space-y-6">
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                      <input
                        type="text" required placeholder="Juan"
                        disabled={!authenticatedUser}
                        value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-gray-50 focus:bg-white disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                      <input
                        type="text" required placeholder="Dela Cruz"
                        disabled={!authenticatedUser}
                        value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-gray-50 focus:bg-white disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Registered Email Address</label>
                      <input
                        type="email" required placeholder="juan@example.com"
                        readOnly={Boolean(authenticatedUser?.email)}
                        disabled={!authenticatedUser}
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-gray-100 text-gray-600 cursor-not-allowed"
                        title="Email is linked to your signed-in account"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                      <input
                        type="tel" required placeholder="+63 9xx xxx xxxx"
                        disabled={!authenticatedUser}
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-gray-50 focus:bg-white disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Needed</label>
                      <div className="relative">
                        <select
                          required
                          disabled={!authenticatedUser}
                          value={formData.service}
                          onChange={e => setFormData({...formData, service: e.target.value})}
                          className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-gray-50 focus:bg-white text-gray-700 disabled:opacity-60"
                        >
                          <option value="" disabled>Select a primary service</option>
                          <option value="General Checkup">General Checkup & Cleaning</option>
                          <option value="Cosmetic Dentistry">Cosmetic Dentistry / Veneers</option>
                          <option value="Dental Implants">Dental Implants</option>
                          <option value="Orthodontics">Orthodontics / Braces</option>
                          <option value="Pediatric">Pediatric Dentistry</option>
                          <option value="Other">Other / Unsure</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Date</label>
                      <input
                        type="date" required
                        disabled={!authenticatedUser}
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-gray-50 focus:bg-white text-gray-700 disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Time</label>
                      <input
                        type="time" required
                        disabled={!authenticatedUser}
                        value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-gray-50 focus:bg-white text-gray-700 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes or Concerns</label>
                    <textarea
                      rows={4}
                      disabled={!authenticatedUser}
                      value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-gray-50 focus:bg-white resize-none disabled:opacity-60"
                      placeholder="Let us know if you are experiencing any pain or have specific questions before your visit..."
                    ></textarea>
                  </div>

                  <button
                    disabled={isSubmitting || !authenticatedUser}
                    type="submit"
                    className="w-full bg-dental-600 text-white font-bold py-4 rounded-xl hover:bg-dental-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? 'Submitting & Sending Email...' : 'Submit Request'}
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-4">By submitting this form, you agree to our <a href="#" className="text-dental-600 hover:underline">Privacy Policy</a>.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Toast Notification ── */}
      <div className={`fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 z-50 flex items-center gap-3 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
        <CheckCircle2 className="w-6 h-6" />
        <div>
          <h4 className="font-bold text-sm">Appointment Appointed Successfully!</h4>
          <p className="text-xs text-green-100">Confirmation sent to {formData.email}. Redirecting...</p>
        </div>
      </div>
    </div>
  );
}