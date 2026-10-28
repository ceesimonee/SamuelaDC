import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { supabase } from './lib/supabase'; 
import { 
  Clock, CalendarCheck, UserPlus, 
  ArrowRight, CalendarPlus, MonitorPlay, PlusCircle, Check,
  ShieldCheck, Archive, Mail, Trash2
} from 'lucide-react';

Chart.register(...registerables);

type TodayAppointment = {
  id: number;
  name: string;
  phone: string;
  service: string;
  status: string;
};

type Task = {
  id: number;
  title: string;
  is_completed: boolean;
};

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  phone: string; // 👉 UPDATED to match phone field
  message: string;
  created_at: string;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // Clock State
  const [time, setTime] = useState(new Date());
  
  // Live Database State
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [newPatientsCount, setNewPatientsCount] = useState(0); 

  // Analytics State
  const [timeRange, setTimeRange] = useState('This Week');
  const [weeklyVisits, setWeeklyVisits] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [servicesData, setServicesData] = useState<{ labels: string[]; counts: number[] }>({ labels: [], counts: [] });

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Compliance State
  const [archivableCount, setArchivableCount] = useState(0);
  const [isArchiving, setIsArchiving] = useState(false);

  // Contact Messages State
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // Chart Refs
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartInstance = useRef<Chart | null>(null);
  const doughnutChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayData();
    fetchTasks();
    fetchNewPatients();
    fetchArchivableCount();
    fetchContactMessages();
    fetchAnalyticsData(timeRange);
  }, [timeRange]);

  const fetchTodayData = async () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateString = `${y}-${m}-${d}`;

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', dateString);

    if (data && !error) {
      setTodayAppointments(data);
      setTodayCount(data.length);
    }
  };

  const fetchNewPatients = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const isoDate = oneWeekAgo.toISOString(); 

    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .gte('created_at', isoDate); 

    if (data && !error) {
      setNewPatientsCount(data.length);
    }
  };

  const fetchAnalyticsData = async (range: string) => {
    const now = new Date();
    let startDate = new Date();

    if (range === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
    } else if (range === 'Last Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      startDate = new Date(now.setDate(diff));
      now.setDate(now.getDate() + 7);
    } else if (range === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_date, service, status')
      .gte('appointment_date', startDateStr);

    if (error || !data) return;

    const daysCount = [0, 0, 0, 0, 0, 0];
    const serviceCounts: { [key: string]: number } = {};

    data.forEach(app => {
      if (app.appointment_date) {
        const appDate = new Date(app.appointment_date);
        const dayOfWeek = appDate.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 6) {
          daysCount[dayOfWeek - 1] += 1;
        }
      }

      if (app.service) {
        serviceCounts[app.service] = (serviceCounts[app.service] || 0) + 1;
      }
    });

    setWeeklyVisits(daysCount);

    const sLabels = Object.keys(serviceCounts);
    const sCounts = Object.values(serviceCounts);
    setServicesData({ labels: sLabels.length > 0 ? sLabels : ['No Data'], counts: sCounts.length > 0 ? sCounts : [1] });
  };

  useEffect(() => {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';

    if (lineChartRef.current) {
      const ctxLine = lineChartRef.current.getContext('2d');
      if (ctxLine) {
        const gradientLine = ctxLine.createLinearGradient(0, 0, 0, 250);
        gradientLine.addColorStop(0, 'rgba(12, 74, 110, 0.3)');
        gradientLine.addColorStop(1, 'rgba(12, 74, 110, 0)');

        if (lineChartInstance.current) lineChartInstance.current.destroy();

        lineChartInstance.current = new Chart(ctxLine, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
              label: 'Patient Visits',
              data: weeklyVisits,
              borderColor: '#0c4a6e', 
              borderWidth: 3, pointBackgroundColor: '#ffffff',
              pointBorderColor: '#0c4a6e', pointBorderWidth: 2, pointRadius: 4,
              pointHoverRadius: 6, tension: 0.4, fill: true, backgroundColor: gradientLine
            }]
          },
          options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0c4a6e', padding: 10, cornerRadius: 6 } },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f8fafc' }, border: { display: false } },
              x: { grid: { display: false }, border: { display: false } }
            }
          }
        });
      }
    }

    if (doughnutChartRef.current) {
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
      
      const hasRealData = servicesData.labels.length > 0 && servicesData.labels[0] !== 'No Data';

      doughnutChartInstance.current = new Chart(doughnutChartRef.current, {
        type: 'doughnut',
        data: {
          labels: servicesData.labels,
          datasets: [{
            data: servicesData.counts,
            backgroundColor: hasRealData ? ['#0284c7', '#0369a1', '#075985', '#38bdf8', '#7dd3fc', '#bae6fd'] : ['#f1f5f9'], 
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
            tooltip: { enabled: hasRealData } 
          }
        }
      });
    }

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
    };
  }, [weeklyVisits, servicesData]);

  const fetchContactMessages = async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && !error) {
      setMessages(data);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (!error) {
      setMessages(messages.filter(m => m.id !== id));
    } else {
      alert("Failed to delete message: " + error.message);
    }
  };

  const fetchArchivableCount = async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoffDate = sixMonthsAgo.toISOString().split('T')[0];
    const cutoffIso = sixMonthsAgo.toISOString();

    const { count: apptCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'cancelled', 'no_show'])
      .lt('appointment_date', cutoffDate);

    const { count: queueCount } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'no_show'])
      .lt('created_at', cutoffIso);

    setArchivableCount((apptCount || 0) + (queueCount || 0));
  };

  const handleArchiveData = async () => {
    if (archivableCount === 0) return;
    
    if (!window.confirm(`RA 10173 Compliance: Are you sure you want to securely move ${archivableCount} old records to cold storage?`)) return;

    setIsArchiving(true);
    const { error } = await supabase.rpc('archive_old_records');

    if (!error) {
      alert("Data Privacy Compliance Sweep Successful! Records moved to secure archive.");
      setArchivableCount(0); 
    } else {
      alert("Failed to archive records: " + error.message);
    }
    setIsArchiving(false);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: true }); 

    if (data && !error) setTasks(data);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: newTaskTitle, is_completed: false }])
      .select()
      .single();

    if (data && !error) {
      setTasks([...tasks, data]); 
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (id: number, currentStatus: boolean) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id);
  };

  return (
    <div className="fade-in">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#0c4a6e]">Welcome back, Dr. Samuela</h1>
          <p className="text-gray-500 mt-1">Here is your clinic's command center overview.</p>
        </div>
        
        <div className="bg-white border border-gray-200 px-5 py-3 rounded-xl shadow-sm flex items-center gap-4">
          <div className="bg-sky-50 p-2 rounded-lg">
            <Clock className="w-6 h-6 text-[#0c4a6e]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
              {time.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-xl font-bold text-[#0c4a6e] font-sans leading-none tracking-tight">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        
        <div className="bg-[#0c4a6e] p-6 rounded-2xl shadow-lg border border-[#0c4a6e] card-hover relative overflow-hidden text-white">
          <div className="absolute -right-4 -top-4 text-white/10"><CalendarCheck className="w-32 h-32" /></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl text-white"><CalendarCheck className="w-6 h-6" /></div>
            </div>
            <p className="text-4xl font-bold font-serif">{todayCount}</p>
            <p className="text-sm text-sky-100 mt-1 font-medium">Appointments Today</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 card-hover relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-sky-50"><UserPlus className="w-32 h-32" /></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-sky-50 p-3 rounded-xl text-[#0c4a6e]"><UserPlus className="w-6 h-6" /></div>
              {newPatientsCount > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shadow-sm">
                  +{newPatientsCount} New
                </span>
              )}
            </div>
            <p className="text-4xl font-bold text-[#0c4a6e] font-serif">{newPatientsCount}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">New Patients This Week</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-serif text-xl font-bold text-[#0c4a6e]">Clinic Analytics</h3>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#0c4a6e] text-[#0c4a6e] font-semibold cursor-pointer"
              >
                <option value="This Week">This Week</option>
                <option value="Last Week">Last Week</option>
                <option value="This Month">This Month</option>
              </select>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-[250px] w-full">
                <p className="text-sm font-bold text-gray-500 mb-2 text-center">Patient Visits Trend</p>
                <canvas ref={lineChartRef}></canvas>
              </div>
              <div className="h-[250px] w-full relative">
                <p className="text-sm font-bold text-gray-500 mb-2 text-center">Services Breakdown</p>
                <canvas ref={doughnutChartRef}></canvas>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-[#0c4a6e] flex items-center justify-between bg-[#0c4a6e] text-white">
              <h3 className="font-serif text-xl font-bold">Today's Patients</h3>
              <Link to="/admin/appointments" className="text-sm font-semibold text-sky-100 hover:text-white transition flex items-center gap-1">
                View Full Schedule <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {todayAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500 text-sm font-medium">
                        No appointments scheduled for today.
                      </td>
                    </tr>
                  ) : (
                    todayAppointments.map((app) => (
                      <tr key={app.id} className="hover:bg-sky-50 transition">
                        <td className="p-4 font-medium text-gray-600 text-sm">{app.phone || 'N/A'}</td>
                        <td className="p-4 font-bold text-[#0c4a6e]">{app.name}</td>
                        <td className="p-4 text-sm text-gray-600">{app.service}</td>
                        <td className="p-4">
                          <span className={`border text-xs px-2.5 py-1 rounded-full font-bold ${
                            app.status === 'pending' 
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {app.status === 'pending' ? 'Pending' : 'Confirmed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Patient Inquiries */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-sky-900 flex items-center justify-between bg-sky-900 text-white">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-sky-300" />
                <h3 className="font-serif text-xl font-bold">Patient Contact Inquiries</h3>
              </div>
              <span className="bg-sky-800 text-sky-200 text-xs px-3 py-1 rounded-full font-bold">
                {messages.length} Messages
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sender</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Number</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500 text-sm font-medium">
                        No messages received from the contact form yet.
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg) => (
                      <tr key={msg.id} className="hover:bg-sky-50 transition">
                        <td className="p-4">
                          <p className="font-bold text-[#0c4a6e]">{msg.name}</p>
                          <p className="text-xs text-gray-400">{msg.email}</p>
                        </td>
                        <td className="p-4">
                          <span className="bg-sky-50 text-[#0c4a6e] border border-sky-100 text-xs px-2.5 py-1 rounded-full font-semibold">
                            {msg.phone || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={msg.message}>
                          {msg.message || <span className="italic text-gray-300">No message body provided.</span>}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete Message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="lg:col-span-4 space-y-8">
          
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <h3 className="font-serif text-lg font-bold text-[#0c4a6e] mb-4 border-b border-gray-100 pb-2">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => navigate('/admin/patients')} className="flex flex-col items-center justify-center p-3 bg-sky-50 hover:bg-[#0c4a6e] hover:text-white rounded-xl border border-sky-100 transition group text-[#0c4a6e]">
                <UserPlus className="w-6 h-6 mb-2 transition-colors" />
                <span className="text-[10px] sm:text-xs font-bold text-center">New Patient</span>
              </button>
              <button onClick={() => navigate('/admin/appointments')} className="flex flex-col items-center justify-center p-3 bg-sky-50 hover:bg-[#0c4a6e] hover:text-white rounded-xl border border-sky-100 transition group text-[#0c4a6e]">
                <CalendarPlus className="w-6 h-6 mb-2 transition-colors" />
                <span className="text-[10px] sm:text-xs font-bold text-center">Book Appt</span>
              </button>
              <button onClick={() => navigate('/admin/queue')} className="flex flex-col items-center justify-center p-3 bg-sky-50 hover:bg-[#0c4a6e] hover:text-white rounded-xl border border-sky-100 transition group text-[#0c4a6e]">
                <MonitorPlay className="w-6 h-6 mb-2 transition-colors" />
                <span className="text-[10px] sm:text-xs font-bold text-center">Live Queue</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="font-serif text-lg font-bold text-[#0c4a6e]">Data Privacy Act</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Under RA 10173, patient data must not be retained longer than necessary. 
              Archive completed records older than 6 months to secure cold storage.
            </p>
            
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
              <span className="text-sm font-bold text-gray-700">Archivable Records</span>
              <span className={`text-lg font-bold ${archivableCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {archivableCount}
              </span>
            </div>

            <button 
              onClick={handleArchiveData}
              disabled={isArchiving || archivableCount === 0}
              className={`w-full font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm text-sm
                ${archivableCount > 0 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Archive className="w-4 h-4" />
              {isArchiving ? 'Archiving...' : 'Run Archive Sweep'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h3 className="font-serif text-lg font-bold text-[#0c4a6e]">Clinic Tasks</h3>
              <button 
                onClick={() => setIsAddingTask(!isAddingTask)} 
                className={`transition-colors ${isAddingTask ? 'text-red-500' : 'text-[#0c4a6e] hover:text-[#075985]'}`}
              >
                <PlusCircle className={`w-5 h-5 transition-transform ${isAddingTask ? 'rotate-45' : ''}`} />
              </button>
            </div>
            
            {isAddingTask && (
              <form onSubmit={handleAddTask} className="mb-4 flex gap-2 animate-fade-in-up">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Type a new task..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#0c4a6e]"
                />
                <button type="submit" className="bg-[#0c4a6e] text-white p-2 rounded-lg hover:bg-[#075985] transition">
                  <Check className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">No tasks found. Click the + to add one.</p>
              ) : (
                tasks.map((task) => (
                  <label key={task.id} className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={task.is_completed}
                      onChange={() => handleToggleTask(task.id, task.is_completed)}
                      className="task-checkbox mt-1 w-4 h-4 text-[#0c4a6e] rounded border-gray-300 focus:ring-[#0c4a6e] cursor-pointer transition" 
                    />
                    <div className={`text-sm font-medium transition-all ${
                      task.is_completed 
                        ? 'text-gray-400 line-through' 
                        : 'text-gray-700 group-hover:text-[#0c4a6e]'
                    }`}>
                      {task.title}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}