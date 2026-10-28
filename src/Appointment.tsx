import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabaseClient'; 
import {
  Smile, ArrowLeft, MapPin, Phone, Clock,
  AlertCircle, ChevronDown, CheckCircle2, Lock, LogIn, UserCheck, CalendarX2
} from 'lucide-react';

// ── NEW: Bulletproof time parser for PostgreSQL 'time' type ──
const normalizeTime = (timeStr: string) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5); // Forces "15:00:00" or "15:00:00+00" to exactly "15:00"
};

const format12Hour = (time24: string) => {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minStr} ${ampm}`;
};

export default function Appointment() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth Check State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);

  // Concurrency / Double-Booking State
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

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

  // ─── 2. FETCH BOOKED & PENDING SLOTS WHEN DATE CHANGES ───
  useEffect(() => {
    const fetchBookingsForDate = async () => {
      if (!formData.date) {
        setBookedSlots([]);
        setAvailableSlots([]);
        return;
      }

      const [year, month, day] = formData.date.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const dayOfWeek = dateObj.getDay(); 

      if (dayOfWeek === 0) {
        setAvailableSlots([]);
        setBookedSlots([]);
        return;
      }

      const startHour = 9; 
      const endHour = dayOfWeek === 6 ? 13 : 18; 
      
      const generatedSlots = [];
      for (let i = startHour; i < endHour; i++) {
        generatedSlots.push(`${i.toString().padStart(2, '0')}:00`); 
      }
      setAvailableSlots(generatedSlots);

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time, status')
        .eq('appointment_date', formData.date);

      if (data && !error) {
        const taken = data
          .filter(app => {
            const stat = (app.status || '').toLowerCase();
            // Completely block ANY slot that is not explicitly cancelled, declined, or rejected
            return !['cancelled', 'declined', 'rejected', 'completed'].includes(stat);
          })
          .map(app => normalizeTime(app.appointment_time));
          
        setBookedSlots(taken);
      }
    };

    fetchBookingsForDate();
  }, [formData.date]);

  const handleDateSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const [year, month, day] = selectedDate.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    
    if (dateObj.getDay() === 0) {
      alert("Samuela Dental Clinic is closed on Sundays. Please select a different day.");
      setFormData({ ...formData, date: '', time: '' });
      return;
    }

    setFormData({ ...formData, date: selectedDate, time: '' }); 
  };

  // ─── 3. HANDLE APPOINTMENT SUBMISSION (STRICT LOCK) ───
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticatedUser) {
      alert('You must be signed in to book an appointment.');
      navigate('/login');
      return;
    }
    
    if (!formData.time) {
      alert('Please select an available time slot.');
      return;
    }

    setIsSubmitting(true);

    // 🔴 FINAL CONCURRENCY CHECK
    const { data: conflictCheck, error: fetchErr } = await supabase
      .from('appointments')
      .select('appointment_time, status')
      .eq('appointment_date', formData.date);

    if (fetchErr) {
      alert("Could not verify slot availability. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const hasConflict = conflictCheck?.some(app => {
      const stat = (app.status || '').toLowerCase();
      const isActive = !['cancelled', 'declined', 'rejected', 'completed'].includes(stat);
      const isSameTime = normalizeTime(app.appointment_time) === formData.time;
      return isActive && isSameTime;
    });

    if (hasConflict) {
      alert("Race condition prevented! Another patient just booked this exact time slot. Please choose another time.");
      setIsSubmitting(false);
      setFormData({ ...formData, time: '' }); 
      setBookedSlots(prev => [...prev, formData.time]); 
      return;
    }
    
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const formattedDate = new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });

    const { error } = await supabase
      .from('appointments')
      .insert([{
        user_id: authenticatedUser.id,
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

    await supabase.from('notifications').insert([{
      user_id: authenticatedUser.id,
      message: `Your appointment request for ${formData.service} on ${formattedDate} at ${format12Hour(formData.time)} is pending admin approval.`,
      type: 'info'
    }]);

    setIsSubmitting(false);
    setShowToast(true);
    
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
            <p className="text-gray-600">Please fill out the form below. Our scheduling coordinator will review your request and notify you once approved.</p>
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
                      <p className="text-gray-600 text-sm mt-1">2nd floor, Samson Bldg., San Juan Street, Centro Oriental, Polangui, Albay</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-dental-100 p-3 rounded-xl"><Phone className="w-5 h-5 text-dental-600" /></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Call Us Directly</h4>
                      <p className="text-gray-600 text-sm mt-1">+63 938 297 8144</p>
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
                <a href="tel:+639382978144" className="block w-full text-center bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700 transition">Call +63 938 297 8144</a>
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
                      To protect patient records and receive status notifications in your account, please sign in to your registered Samuela Dental Clinic account before requesting an appointment.
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
                          <option value="Tooth Filling Restoration">Tooth Filling Restoration</option>
                          <option value="Cleaning & Prophylaxis">Cleaning & Prophylaxis</option>
                          <option value="Tooth Extraction">Tooth Extraction</option>
                          <option value="Pit & Fissure Sealants">Pit & Fissure Sealants</option>
                          <option value="Fluoride Application">Fluoride Application</option>
                          <option value="Other">Other / Unsure</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Date</label>
                      <input
                        type="date" required
                        disabled={!authenticatedUser}
                        min={new Date().toISOString().split('T')[0]} 
                        value={formData.date} 
                        onChange={handleDateSelection}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-gray-50 focus:bg-white text-gray-700 disabled:opacity-60"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
                      
                      {!formData.date ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 border-dashed rounded-xl text-gray-400">
                          <CalendarX2 className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-sm">Please select a date first</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {availableSlots.map(slot => {
                            const isBooked = bookedSlots.includes(slot);
                            const isSelected = formData.time === slot;
                            
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isBooked || !authenticatedUser}
                                onClick={() => setFormData({ ...formData, time: slot })}
                                className={`py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                                  isBooked 
                                    ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed border border-transparent' 
                                    : isSelected 
                                      ? 'bg-dental-600 text-white shadow-md shadow-dental-600/30 border border-dental-600 scale-105' 
                                      : 'bg-white border border-gray-200 text-gray-700 hover:border-dental-500 hover:text-dental-600 hover:shadow-sm'
                                }`}
                              >
                                {format12Hour(slot)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      <input type="hidden" required value={formData.time} />
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
                    {isSubmitting ? 'Sending Request...' : 'Submit Request'}
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
          <h4 className="font-bold text-sm">Request Submitted!</h4>
          <p className="text-xs text-green-100">Check your notification bell for updates. Redirecting...</p>
        </div>
      </div>
    </div>
  );
}