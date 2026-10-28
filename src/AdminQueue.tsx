import { useState, useEffect } from 'react';
import { UserPlus, BellRing, CheckCircle, UserX, Coffee, Check, MessageSquare, X, ChevronDown, ExternalLink } from 'lucide-react';
import { supabase } from './lib/supabase';

type Patient = {
  id: string | number;
  ticket: string;
  name: string;
  service: string;
  time: string;
  isWalkin?: boolean;
  status?: string;
  phone?: string; 
  email?: string; 
};

type Appointment = {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
};

const CLINIC_SERVICES = [
  'General Checkup', 'Tooth Filling Restoration', 
  'Cleaning & Prophylaxis', 'Tooth Extraction', 'Pit & Fissure Sealants', 
  'Fluoride Application', 'Other'
];

export default function AdminQueue() {
  const [queue, setQueue] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'appointments' | 'manual'>('appointments');
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  
  const [selectedAptId, setSelectedAptId] = useState<string>('');
  const [manualForm, setManualForm] = useState({ name: '', phone: '', service: 'General Checkup' });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const [smsQuota, setSmsQuota] = useState({ balance: 188, total: 202 });
  const [adminEmail, setAdminEmail] = useState<string>('Unknown Admin'); // ── AUDIT STATE ──

  useEffect(() => {
    fetchQueue();
    fetchSmsQuota();
    fetchAdminSession();
  }, []);

  // ── NEW: Fetch Admin Email for Audit Log ──
  const fetchAdminSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setAdminEmail(session.user.email);
    }
  };

  // ── NEW: Reusable Audit Log Helper ──
  const logAuditAction = async (action: string, patientName: string, details: string) => {
    await supabase.from('audit_logs').insert([{
      admin_email: adminEmail,
      action: action,
      patient_name: patientName,
      details: details
    }]);
  };

  const fetchSmsQuota = async () => {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('sms_balance, sms_total')
      .eq('id', 1)
      .single();

    if (!error && data) {
      setSmsQuota({ balance: data.sms_balance, total: data.sms_total });
    }
  };

  const fetchQueue = async () => {
    const { data: waitingData, error: waitingError } = await supabase
      .from('queue')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });

    if (!waitingError && waitingData) {
      setQueue(waitingData);
    }

    const { data: servingData } = await supabase
      .from('queue')
      .select('*')
      .eq('status', 'serving')
      .limit(1)
      .single();

    if (servingData) {
      setCurrentPatient(servingData);
    } else {
      setCurrentPatient(null);
    }
  };

  const fetchWeekAppointments = async () => {
    setLoadingAppointments(true);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('appointment_date', todayStr)
      .lte('appointment_date', nextWeekStr)
      .order('appointment_date', { ascending: true });

    if (!error && data) {
      setWeekAppointments(data);
    }
    setLoadingAppointments(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setModalTab('appointments');
    setSelectedAptId(''); 
    fetchWeekAppointments();
  };

  const addAppointmentToQueue = async (apt: Appointment) => {
    const newTicket = `#${Math.floor(Math.random() * 900) + 100}`;
    const { error } = await supabase.from('queue').insert([{
      ticket: newTicket,
      name: apt.name,
      service: apt.service,
      phone: apt.phone, 
      email: apt.email, 
      time: 'Just arrived',
      status: 'waiting',
      isWalkin: false
    }]);

    if (!error) {
      // 👉 AUDIT LOG
      await logAuditAction('Add to Queue', apt.name, `Added scheduled appointment (Ticket: ${newTicket}) to the live waiting queue.`);
      
      setIsModalOpen(false);
      fetchQueue();
    } else {
      alert("Failed to add to queue.");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    
    const newTicket = `#${Math.floor(Math.random() * 900) + 100}`;
    const { error } = await supabase.from('queue').insert([{
      ticket: newTicket,
      name: manualForm.name,
      service: manualForm.service,
      phone: manualForm.phone,
      time: 'Just arrived',
      status: 'waiting',
      isWalkin: true
    }]);

    if (!error) {
      // 👉 AUDIT LOG
      await logAuditAction('Add Manual Queue', manualForm.name, `Manually added walk-in (Ticket: ${newTicket}) to the live waiting queue for ${manualForm.service}.`);
      
      setIsModalOpen(false);
      setManualForm({ name: '', phone: '', service: 'General Checkup' }); 
      fetchQueue();
    } else {
      alert("Failed to add manual walk-in.");
    }
    setIsSubmittingManual(false);
  };

  const callNext = async () => {
    if (queue.length === 0) return;
    const nextPatient = queue[0];
    
    if (currentPatient) {
      await supabase.from('queue').update({ status: 'completed' }).eq('id', currentPatient.id);
    }
    await supabase.from('queue').update({ status: 'serving' }).eq('id', nextPatient.id);
    
    // 👉 AUDIT LOG
    await logAuditAction('Call Next Patient', nextPatient.name, `Called ticket ${nextPatient.ticket} to be served.`);
    
    fetchQueue();
  };

  const markComplete = async () => {
    if (currentPatient) {
      setIsSaved(true);
      await supabase.from('queue').update({ status: 'completed' }).eq('id', currentPatient.id);
      
      // 👉 AUDIT LOG
      await logAuditAction('Complete Treatment', currentPatient.name, `Marked treatment for ticket ${currentPatient.ticket} as completed.`);
      
      setTimeout(() => {
        setIsSaved(false);
        setCurrentPatient(null);
        fetchQueue();
      }, 1500);
    }
  };

  // ── NEW: FIXED NO SHOW LOGIC ──
  const handleNoShow = async () => {
    if (!currentPatient) return;
    
    if (window.confirm(`Are you sure you want to mark ${currentPatient.name} as a No Show? This will remove them from the active serving slot.`)) {
      await supabase.from('queue').update({ status: 'no_show' }).eq('id', currentPatient.id);
      
      // 👉 AUDIT LOG
      await logAuditAction('No Show', currentPatient.name, `Marked ticket ${currentPatient.ticket} as a No Show.`);
      
      setCurrentPatient(null);
      fetchQueue();
    }
  };

  // ── 🛡️ GRACEFUL DEGRADATION: MANUAL CALL FALLBACK ──
  const handleNotifySms = async () => {
    if (!currentPatient) return;

    if (!currentPatient.phone) {
      alert(`Cannot send SMS: No phone number on file for ${currentPatient.name}.`);
      setIsNotifyOpen(false);
      return;
    }

    setIsSendingSms(true);
    const messageBody = `Ticket ${currentPatient.ticket}: Your turn for ${currentPatient.service} in 10 mins. Please proceed to waiting area.`;

    try {
      if (smsQuota.balance <= 0) {
        throw new Error("Insufficient SMS credits limit reached.");
      }

      let cleanPhone = currentPatient.phone.replace(/\D/g, ''); 
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '63' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('9') && cleanPhone.length === 10) {
        cleanPhone = '63' + cleanPhone;
      }
      const formattedPhone = '+' + cleanPhone;

      const response = await fetch('https://samueladc.onrender.com/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formattedPhone,
          message: messageBody
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Backend IPROG request failed");
      }

      const newBalance = Math.max(0, smsQuota.balance - 1);
      setSmsQuota(prev => ({ ...prev, balance: newBalance }));
      await supabase.from('clinic_settings').update({ sms_balance: newBalance }).eq('id', 1);

      // 👉 AUDIT LOG
      await logAuditAction('Send SMS', currentPatient.name, `Successfully sent SMS alert to ${formattedPhone}.`);
      
      alert(`SMS Alert successfully sent to ${currentPatient.name}.`);

    } catch (error: any) {
      console.warn("SMS Alert Failed, initializing Manual Fallback...", error.message);
      
      // THE FALLBACK: Admin UI Alert
      alert(`⚠️ SMS ALERT FAILED (API Offline or 0 Credits).\n\nFALLBACK PROCEDURE:\nPlease manually call ${currentPatient.name} at ${currentPatient.phone} to notify them of their turn.`);
      
    } finally {
      setIsSendingSms(false);
      setIsNotifyOpen(false);
    }
  };

  const smsUsed = Math.max(0, smsQuota.total - smsQuota.balance);
  const smsPercentage = Math.round((smsUsed / smsQuota.total) * 100);

  const availableAppointments = weekAppointments.filter(
    apt => !queue.some(q => q.name === apt.name) && currentPatient?.name !== apt.name
  );

  return (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dental-900">Live Clinic Queue</h1>
          <p className="text-gray-500 mt-1">Manage walk-ins and waiting patients.</p>
        </div>
        <button 
          onClick={handleOpenModal} 
          className="bg-dental-600 hover:bg-dental-700 text-white px-6 py-3 rounded-full font-medium transition shadow-lg shadow-dental-600/30 flex items-center gap-2 justify-center"
        >
          <UserPlus className="w-5 h-5" /> Add Walk-in
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 sticky top-32 z-10">
            <div className="bg-dental-900 p-6 text-center text-white relative rounded-t-3xl">
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500"></span>
                </div>
                <span className="text-xs font-bold text-accent-400 uppercase tracking-widest">Live</span>
              </div>
              <p className="text-dental-200 text-sm font-bold uppercase tracking-widest mb-2">Now Serving</p>
              
              {currentPatient ? (
                <div key={currentPatient.ticket} className="fade-in">
                  <h2 className="text-6xl font-serif font-bold text-white mb-2">{currentPatient.ticket}</h2>
                  <h3 className="text-2xl font-bold text-dental-100">{currentPatient.name}</h3>
                  <p className="text-dental-300 mt-1">{currentPatient.service}</p>
                </div>
              ) : (
                <div className="fade-in py-4">
                  <h2 className="text-6xl font-serif font-bold text-white/50 mb-2">---</h2>
                  <h3 className="text-2xl font-bold text-dental-100/50">No Patients</h3>
                  <p className="text-dental-300/50 mt-1">Waiting room is empty</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 space-y-3 rounded-b-3xl">
              <button 
                onClick={callNext} 
                disabled={queue.length === 0}
                className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-md"
              >
                <BellRing className="w-5 h-5" /> Call Next Patient
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                  disabled={!currentPatient}
                  className="w-full bg-sky-100 text-sky-700 hover:bg-sky-200 disabled:opacity-50 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                  <BellRing className="w-4 h-4" /> Notify Patient (SMS) <ChevronDown className="w-4 h-4" />
                </button>

                {isNotifyOpen && currentPatient && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden z-50 animate-fade-in-up">
                    <div className="p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <button 
                          onClick={handleNotifySms} 
                          disabled={isSendingSms}
                          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-blue-600 transition disabled:opacity-50"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>{isSendingSms ? 'Sending...' : 'Send SMS / Alert'}</span>
                        </button>
                        <span className="text-[11px] font-bold text-blue-600">{smsQuota.balance} left</span>
                      </div>

                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full transition-all duration-500 ${smsPercentage > 85 ? 'bg-red-500' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.max(2, smsPercentage)}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">IPROG Quota ({smsUsed}/{smsQuota.total})</span>
                        <a 
                          href="https://www.iprogsms.com/" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-dental-600 font-bold hover:underline flex items-center gap-1"
                        >
                          Load Credits <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={markComplete} 
                  disabled={!currentPatient || isSaved}
                  className="bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaved ? (
                    <><Check className="w-4 h-4 text-accent-600" /> Saved!</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 text-accent-600" /> Done</>
                  )}
                </button>
                {/* ── UPDATED: Hooked up handleNoShow ── */}
                <button 
                  onClick={handleNoShow} 
                  disabled={!currentPatient}
                  className="bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserX className="w-4 h-4 text-red-500" /> No Show
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-serif text-xl font-bold text-gray-900">Up Next / Waiting</h3>
              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-bold">
                {queue.length} Waiting
              </span>
            </div>

            <div className="space-y-3">
              {queue.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>The waiting room is empty.</p>
                </div>
              ) : (
                queue.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-dental-300 transition shadow-sm fade-in">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-dental-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {p.ticket.replace('#', '')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{p.name}</h4>
                          {p.isWalkin && (
                            <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded font-bold">Walk-in</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{p.service}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            
            <div className="pt-5 px-5 border-b border-gray-100 bg-white shrink-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-serif text-lg font-bold text-gray-900">Add to Queue</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1.5 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-5 text-sm">
                <button 
                  onClick={() => setModalTab('appointments')} 
                  className={`pb-2.5 px-1 border-b-2 font-medium transition-colors ${modalTab === 'appointments' ? 'border-dental-600 text-dental-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  From Appointments
                </button>
                <button 
                  onClick={() => setModalTab('manual')} 
                  className={`pb-2.5 px-1 border-b-2 font-medium transition-colors ${modalTab === 'manual' ? 'border-dental-600 text-dental-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Manual Entry
                </button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto bg-gray-50/50 flex-grow">
              
              {modalTab === 'appointments' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Select Scheduled Patient</label>
                    {loadingAppointments ? (
                      <p className="text-sm text-gray-400">Loading appointments...</p>
                    ) : availableAppointments.length === 0 ? (
                      <p className="text-sm text-gray-400">No available appointments to queue.</p>
                    ) : (
                      <div className="relative">
                        <select
                          value={selectedAptId}
                          onChange={(e) => setSelectedAptId(e.target.value)}
                          className="w-full appearance-none px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-white text-sm text-gray-700"
                        >
                          <option value="" disabled>-- Select an appointment --</option>
                          {availableAppointments.map((apt) => (
                            <option key={apt.id} value={apt.id}>
                              {apt.name} - {apt.service} ({apt.appointment_time})
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      const apt = availableAppointments.find(a => a.id.toString() === selectedAptId.toString());
                      if (apt) {
                        if (window.confirm(`Are you sure you want to add ${apt.name} to the live queue?`)) {
                          addAppointmentToQueue(apt);
                          setSelectedAptId(''); 
                        }
                      }
                    }}
                    disabled={!selectedAptId || availableAppointments.length === 0}
                    className="w-full bg-dental-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-dental-700 transition disabled:opacity-50 shadow-sm"
                  >
                    Confirm & Add to Queue
                  </button>
                </div>
              )}

              {modalTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Patient Name</label>
                    <input 
                      type="text" 
                      required 
                      value={manualForm.name}
                      onChange={e => setManualForm({...manualForm, name: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-white text-sm" 
                      placeholder="e.g. Juan Dela Cruz" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Phone Number</label>
                    <input 
                      type="tel" 
                      value={manualForm.phone}
                      onChange={e => setManualForm({...manualForm, phone: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-white text-sm" 
                      placeholder="e.g. 0912 345 6789" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Requested Service</label>
                    <select 
                      value={manualForm.service}
                      onChange={e => setManualForm({...manualForm, service: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-white text-sm"
                    >
                      {CLINIC_SERVICES.map(service => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmittingManual}
                    className="w-full mt-4 bg-dental-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-dental-700 transition disabled:opacity-70 shadow-sm"
                  >
                    {isSubmittingManual ? 'Adding...' : 'Add to Queue'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}