import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import emailjs from '@emailjs/browser';
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Check, X, User, Activity, Clock, Mail, Phone, ShieldAlert
} from 'lucide-react';

type Appointment = {
  id: number;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  service: string;
  date: Date;
  time?: string;
  note?: string | null;
  status: string;
};

type Request = {
  id: number;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  service: string;
  dateStr: string;
  time?: string;
  note: string | null;
  targetDate: Date;
};

export default function AdminAppointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntryForm, setNewEntryForm] = useState({ name: '', service: '', date: '', time: '' });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string>('Unknown Admin');

  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [isDayDetailsModalOpen, setIsDayDetailsModalOpen] = useState(false);
  const [selectedDateTitle, setSelectedDateTitle] = useState("");

  const [approvalModal, setApprovalModal] = useState<{isOpen: boolean, req: Request | null, duration: number}>({isOpen: false, req: null, duration: 1});
  const [isSendingApproval, setIsSendingApproval] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchAdminSession();

    // 👉 NEW: Auto-refresh calendar if a patient confirms while the admin is viewing this page
    const channel = supabase
      .channel(`admin_appts_page_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAdminSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setAdminEmail(session.user.email);
    }
  };

  const logAuditAction = async (action: string, patientName: string, details: string) => {
    await supabase.from('audit_logs').insert([{
      admin_email: adminEmail,
      action: action,
      patient_name: patientName,
      details: details
    }]);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase.from('appointments').select('*');
    
    if (error) {
      console.error("Error fetching appointments:", error);
      setIsLoading(false);
      return;
    }

    const confirmedList: Appointment[] = [];
    const pendingList: Request[] = [];

    data.forEach(row => {
      const [y, m, d] = row.appointment_date.split('-');
      const parsedDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));

      if (['confirmed', 'awaiting_confirmation'].includes(row.status)) {
        confirmedList.push({
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          service: row.service,
          date: parsedDate,
          time: row.appointment_time,
          note: row.note,
          status: row.status
        });
      } else if (row.status === 'pending') {
        pendingList.push({
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          service: row.service,
          dateStr: parsedDate.toLocaleDateString(),
          time: row.appointment_time,
          note: row.note,
          targetDate: parsedDate
        });
      }
    });

    setAppointments(confirmedList);
    setRequests(pendingList);
    setIsLoading(false);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getAppointmentsForDay = (day: number) => {
    return appointments.filter(app =>
      app.date.getFullYear() === year &&
      app.date.getMonth() === month &&
      app.date.getDate() === day
    );
  };

  const handleDayClick = (day: number) => {
    const dayAppointments = getAppointmentsForDay(day);
    if (dayAppointments.length > 0) {
      setSelectedDateAppointments(dayAppointments);
      setSelectedDateTitle(`${currentDate.toLocaleString('default', { month: 'long' })} ${day}, ${year}`);
      setIsDayDetailsModalOpen(true);
    }
  };

  const openApprovalModal = (req: Request) => {
    setApprovalModal({ isOpen: true, req, duration: 1 });
  };

  const generateBlockedSlots = (startTime: string, durationHrs: number) => {
    if (durationHrs <= 1 || !startTime) return [];
    const slots = [];
    const [hourStr, minuteStr] = startTime.split(':');
    let hour = parseInt(hourStr, 10);
    
    for (let i = 1; i < durationHrs; i++) {
      const nextHour = hour + i;
      slots.push(`${nextHour.toString().padStart(2, '0')}:${minuteStr}`);
    }
    return slots;
  };

  const submitApproval = async () => {
    if (!approvalModal.req) return;
    setIsSendingApproval(true);
    
    const req = approvalModal.req;
    const blockedSlots = generateBlockedSlots(req.time || '', approvalModal.duration);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'awaiting_confirmation',
        blocked_slots: blockedSlots,
        expires_at: expiresAt.toISOString()
      })
      .eq('id', req.id);

    if (!error) {
      await logAuditAction('Sent Confirmation Request', req.name, `Sent confirmation request for ${req.service} (Duration: ${approvalModal.duration}hr). Slots blocked: ${blockedSlots.join(', ')}`);

      setAppointments([...appointments, {
        id: req.id,
        user_id: req.user_id,
        name: req.name,
        email: req.email,
        phone: req.phone,
        service: req.service,
        date: req.targetDate,
        time: req.time,
        note: req.note,
        status: 'awaiting_confirmation'
      }]);
      setRequests(prev => prev.filter(r => r.id !== req.id));

      const formattedDate = req.targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      if (req.user_id) {
        await supabase.from('notifications').insert([{
          user_id: req.user_id,
          message: `ACTION REQUIRED: Your appointment for ${req.service} on ${formattedDate} at ${req.time} is approved! Please confirm within 2 hours to secure your slot.`,
          type: 'action_required'
        }]);
      }

      setApprovalModal({ isOpen: false, req: null, duration: 1 });
    } else {
      alert("Error confirming: " + error.message);
    }
    setIsSendingApproval(false);
  };

  const handleDecline = async (req: Request) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', req.id);

    if (!error) {
      await logAuditAction('Decline Appointment', req.name, `Declined requested appointment for ${req.service} on ${req.dateStr} at ${req.time}`);

      setRequests(prev => prev.filter(r => r.id !== req.id));
      
      const formattedDate = req.targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      if (req.user_id) {
        await supabase.from('notifications').insert([{
          user_id: req.user_id,
          message: `Sorry, your appointment request for ${req.service} on ${formattedDate} at ${req.time} was declined. Please book another slot.`,
          type: 'error'
        }]);
      }
    } else {
      alert("Error declining: " + error.message);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryForm.name || !newEntryForm.date) return;

    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        name: newEntryForm.name,
        service: newEntryForm.service || 'General Consultation',
        appointment_date: newEntryForm.date,
        appointment_time: newEntryForm.time,
        status: 'confirmed'
      }])
      .select()
      .single();

    if (!error && data) {
      await logAuditAction('Manual Appointment', newEntryForm.name, `Manually encoded appointment for ${newEntryForm.service} on ${newEntryForm.date}`);

      const [y, m, d] = newEntryForm.date.split('-');
      
      setAppointments([...appointments, {
        id: data.id,
        name: data.name,
        service: data.service,
        date: new Date(parseInt(y), parseInt(m) - 1, parseInt(d)),
        time: newEntryForm.time,
        status: 'confirmed'
      }]);
      
      setIsModalOpen(false);
      setNewEntryForm({ name: '', service: '', date: '', time: '' });
    } else if (error) {
      alert("Error adding entry: " + error.message);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">Loading appointments...</div>;
  }

  return (
    <div className="fade-in">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dental-900">Appointment Schedule</h1>
          <p className="text-gray-500 mt-1">Manage and approve patient booking requests.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition"
          >
            <CalendarIcon className="w-4 h-4" /> Today
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-dental-600 hover:bg-dental-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Entry
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-white text-center text-[10px] sm:text-xs font-bold uppercase text-gray-400 pb-2 pt-4">
                {day}
              </div>
            ))}
            
            {blanks.map(b => (
              <div key={`blank-${b}`} className="bg-gray-50 min-h-[60px] sm:min-h-[100px] border border-gray-100 p-1 sm:p-2 text-gray-300" />
            ))}
            
            {days.map(day => {
              const dayAppointments = getAppointmentsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const hasAppointments = dayAppointments.length > 0;
              
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[60px] sm:min-h-[100px] border border-gray-100 p-1 sm:p-2 transition-colors relative
                    ${isToday ? 'bg-dental-50/30' : 'bg-white'}
                    ${hasAppointments ? 'cursor-pointer hover:bg-gray-50' : ''}`
                  }
                >
                  <span className={`font-medium text-xs sm:text-sm w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-dental-600 text-white shadow-sm' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  
                  <div className="mt-1 space-y-1">
                    {hasAppointments && (
                      <div className="hidden sm:block mt-1 bg-accent-100 text-accent-700 text-[10px] p-1 rounded font-bold truncate">
                        {dayAppointments.length} Appt{dayAppointments.length > 1 ? 's' : ''}
                      </div>
                    )}
                    {hasAppointments && (
                      <div className="sm:hidden flex gap-1 mt-1 pl-1">
                        {dayAppointments.map((_, i) => (
                           <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-500"></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center justify-between">
            Pending Requests
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2.5 py-0.5 rounded-full">{requests.length}</span>
          </h3>
          
          {requests.length === 0 ? (
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center py-10">
               <p className="text-gray-500 text-sm font-medium">No pending requests right now.</p>
             </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:border-dental-300">
                  <div className="flex justify-between items-start mb-3">
                      <div>
                          <h4 className="font-bold text-gray-900 text-sm">{req.name}</h4>
                          <p className="text-xs text-gray-500">{req.service}</p>
                      </div>
                      <span className="text-xs font-medium text-gray-500 flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {req.dateStr}</span>
                        {req.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {req.time}</span>}
                      </span>
                  </div>
                  
                  {req.note && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-4 italic">"{req.note}"</p>
                  )}

                  <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openApprovalModal(req)}
                        className="flex-1 bg-accent-50 text-accent-700 hover:bg-accent-100 py-2 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Approve & Review
                      </button>
                      <button
                        onClick={() => handleDecline(req)}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                  </div>
              </div>
            ))
          )}
        </div>
      </div>

      {approvalModal.isOpen && approvalModal.req && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-serif text-xl font-bold text-dental-900 mb-1">Confirm Procedure Duration</h3>
              <p className="text-sm text-gray-600">Review time blocks for {approvalModal.req.name}'s {approvalModal.req.service}.</p>
            </div>
            
            <div className="p-6 space-y-5">
              
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-sm">
                <h4 className="font-bold text-[#0c4a6e] flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" /> Contact Patient First
                </h4>
                <div className="space-y-1 text-gray-700">
                  <p><span className="font-semibold text-gray-900">Phone:</span> {approvalModal.req.phone || 'Not provided'}</p>
                  <p><span className="font-semibold text-gray-900">Email:</span> {approvalModal.req.email || 'Not provided'}</p>
                </div>
                <p className="text-xs text-sky-700 italic mt-3 leading-relaxed">
                  * Please call the patient to discuss the procedure and determine how many hours to block before sending the approval request.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Procedure Duration</label>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(hrs => (
                    <button
                      key={hrs}
                      onClick={() => setApprovalModal(prev => ({...prev, duration: hrs}))}
                      className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        approvalModal.duration === hrs 
                          ? 'bg-dental-600 text-white border-dental-600 shadow-md scale-105' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-dental-400 hover:bg-gray-50'
                      }`}
                    >
                      {hrs} Hour{hrs > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                {approvalModal.duration > 1 && (
                  <p className="text-xs text-amber-600 font-medium mt-3 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    The next {approvalModal.duration - 1} hour(s) will be automatically blocked off the calendar.
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-xs leading-relaxed">
                <ShieldAlert className="w-5 h-5 shrink-0 text-blue-600" />
                <p>After clicking approve, the patient will receive a notification and has <strong>2 hours</strong> to confirm their appointment, or the slot will be released back to the public.</p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setApprovalModal({isOpen: false, req: null, duration: 1})}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitApproval}
                  disabled={isSendingApproval}
                  className="flex-1 px-4 py-3 bg-accent-600 hover:bg-accent-700 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {isSendingApproval ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDayDetailsModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-serif text-xl font-bold text-dental-900">Appointments</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">{selectedDateTitle}</p>
              </div>
              <button onClick={() => setIsDayDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 border border-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedDateAppointments.map(app => (
                <div key={app.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-dental-300 transition-colors relative overflow-hidden">
                  {app.status === 'awaiting_confirmation' && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                      Awaiting Patient
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2 mt-1">
                      <User className="w-5 h-5 text-dental-500"/> {app.name}
                    </h4>
                    <span className="bg-accent-100 text-accent-700 text-xs px-2.5 py-1 rounded-md font-bold mt-1">
                      {app.service}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mt-4 text-sm text-gray-600">
                    {app.time && (
                      <p className="flex items-center gap-2 text-dental-700 font-bold"><Clock className="w-4 h-4" /> {app.time}</p>
                    )}
                    {app.email && (
                      <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {app.email}</p>
                    )}
                    {app.phone && (
                      <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {app.phone}</p>
                    )}
                    {app.note && (
                      <div className="mt-3 bg-gray-50 p-3 rounded-xl text-sm italic text-gray-600 border border-gray-100">
                        <span className="font-bold not-italic block mb-1 text-gray-800 text-xs uppercase tracking-wider">Patient Note</span>
                        "{app.note}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-serif text-xl font-bold text-dental-900">Add Appointment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 border border-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddEntry} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><User className="w-4 h-4 text-dental-500"/> Patient Name</label>
                <input
                  type="text" required placeholder="e.g. John Doe"
                  value={newEntryForm.name} onChange={e => setNewEntryForm({...newEntryForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Activity className="w-4 h-4 text-accent-500"/> Service</label>
                <input
                  type="text" placeholder="e.g. Extraction"
                  value={newEntryForm.service} onChange={e => setNewEntryForm({...newEntryForm, service: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-purple-500"/> Date</label>
                  <input
                    type="date" required
                    value={newEntryForm.date} onChange={e => setNewEntryForm({...newEntryForm, date: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-purple-500"/> Time</label>
                  <input
                    type="time" required
                    value={newEntryForm.time} onChange={e => setNewEntryForm({...newEntryForm, time: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 rounded-xl transition shadow-md mt-4">
                Save Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}