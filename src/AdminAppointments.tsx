import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase'; // Adjust path if needed
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Check, X, User, Activity, Clock, Mail, Phone
} from 'lucide-react';

// 1. Updated Types to include the time data fetching from Supabase
type Appointment = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  service: string;
  date: Date;
  time?: string;
  note?: string | null;
};

type Request = {
  id: number;
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

  // ─── NEW STATE FOR DAY DETAILS MODAL ───
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [isDayDetailsModalOpen, setIsDayDetailsModalOpen] = useState(false);
  const [selectedDateTitle, setSelectedDateTitle] = useState("");

  // ─── FETCH DATA FROM SUPABASE ───
  useEffect(() => {
    fetchAppointments();
  }, []);

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

      if (row.status === 'confirmed') {
        confirmedList.push({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          service: row.service,
          date: parsedDate,
          time: row.appointment_time, // Retrieve time
          note: row.note
        });
      } else if (row.status === 'pending') {
        pendingList.push({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          service: row.service,
          dateStr: parsedDate.toLocaleDateString(),
          time: row.appointment_time, // Retrieve time
          note: row.note,
          targetDate: parsedDate
        });
      }
    });

    setAppointments(confirmedList);
    setRequests(pendingList);
    setIsLoading(false);
  };

  // ─── CALENDAR LOGIC ───
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

  // ─── CLICK HANDLER FOR CALENDAR DAYS ───
  const handleDayClick = (day: number) => {
    const dayAppointments = getAppointmentsForDay(day);
    
    // Only open the modal if there are actually appointments that day
    if (dayAppointments.length > 0) {
      setSelectedDateAppointments(dayAppointments);
      setSelectedDateTitle(`${currentDate.toLocaleString('default', { month: 'long' })} ${day}, ${year}`);
      setIsDayDetailsModalOpen(true);
    }
  };

  // ─── DATABASE ACTIONS ───
  const handleConfirm = async (req: Request) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', req.id);

    if (!error) {
      setAppointments([...appointments, {
        id: req.id,
        name: req.name,
        email: req.email,
        phone: req.phone,
        service: req.service,
        date: req.targetDate,
        time: req.time,
        note: req.note
      }]);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } else {
      alert("Error confirming: " + error.message);
    }
  };

  const handleDecline = async (id: number) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (!error) {
      setRequests(prev => prev.filter(req => req.id !== id));
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
        appointment_time: newEntryForm.time, // Save new manual time
        status: 'confirmed'
      }])
      .select()
      .single();

    if (!error && data) {
      const [y, m, d] = newEntryForm.date.split('-');
      
      setAppointments([...appointments, {
        id: data.id,
        name: data.name,
        service: data.service,
        date: new Date(parseInt(y), parseInt(m) - 1, parseInt(d)),
        time: newEntryForm.time
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
      
      {/* ── Page Header ── */}
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
        
        {/* ── Dynamic Calendar Section ── */}
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

        {/* ── Pending Requests List ── */}
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
                        onClick={() => handleConfirm(req)}
                        className="flex-1 bg-accent-50 text-accent-700 hover:bg-accent-100 py-2 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Confirm
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
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

      {/* ── Day Details Modal (NEW) ── */}
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
                <div key={app.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-dental-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-dental-500"/> {app.name}
                    </h4>
                    <span className="bg-accent-100 text-accent-700 text-xs px-2.5 py-1 rounded-md font-bold">
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

      {/* ── New Entry Modal (Existing) ── */}
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