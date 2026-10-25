import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { supabase } from './lib/supabase'; // Adjust path if needed
import { 
  Clock, CalendarCheck, UserPlus, Activity, 
  ArrowRight, CalendarPlus, MonitorPlay, PlusCircle, Check
} from 'lucide-react';

Chart.register(...registerables);

// Define types for our fetched data
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // Clock State
  const [time, setTime] = useState(new Date());
  
  // Live Database State
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [newPatientsCount, setNewPatientsCount] = useState(0); // <-- NEW STATE FOR PATIENTS

  // Live Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Chart Refs
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartInstance = useRef<Chart | null>(null);
  const doughnutChartInstance = useRef<Chart | null>(null);

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Live Data
  useEffect(() => {
    fetchTodayData();
    fetchTasks();
    fetchNewPatients(); // <-- CALLING NEW FUNCTION
  }, []);

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

  // ─── NEW: FETCH PATIENTS LOGIC ───
  const fetchNewPatients = async () => {
    // Get the date for exactly 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const isoDate = oneWeekAgo.toISOString(); // Format Supabase understands

    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .gte('created_at', isoDate); // .gte means "Greater Than or Equal to"

    if (data && !error) {
      setNewPatientsCount(data.length);
    }
  };

  // ─── TASKS LOGIC ───
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: true }); 

    if (data && !error) {
      setTasks(data);
    }
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

    await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', id);
  };

  // Charts Effect (Zeroed out data)
  useEffect(() => {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';

    // 1. Line Chart
    if (lineChartRef.current) {
      const ctxLine = lineChartRef.current.getContext('2d');
      if (ctxLine) {
        const gradientLine = ctxLine.createLinearGradient(0, 0, 0, 250);
        gradientLine.addColorStop(0, 'rgba(2, 132, 199, 0.3)');
        gradientLine.addColorStop(1, 'rgba(2, 132, 199, 0)');

        if (lineChartInstance.current) lineChartInstance.current.destroy();

        lineChartInstance.current = new Chart(ctxLine, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
              label: 'Patient Visits',
              data: [0, 0, 0, 0, 0, 0],
              borderColor: '#e2e8f0', 
              borderWidth: 3, pointBackgroundColor: '#ffffff',
              pointBorderColor: '#e2e8f0', pointBorderWidth: 2, pointRadius: 4,
              pointHoverRadius: 6, tension: 0.4, fill: true, backgroundColor: gradientLine
            }]
          },
          options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0c4a6e', padding: 10, cornerRadius: 6 } },
            scales: {
              y: { beginAtZero: true, max: 40, grid: { color: '#f8fafc' }, border: { display: false } },
              x: { grid: { display: false }, border: { display: false } }
            }
          }
        });
      }
    }

    // 2. Doughnut Chart
    if (doughnutChartRef.current) {
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
      
      doughnutChartInstance.current = new Chart(doughnutChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['No Data'],
          datasets: [{
            data: [1], 
            backgroundColor: ['#f1f5f9'], 
            borderWidth: 0,
            hoverOffset: 0
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
            tooltip: { enabled: false } 
          }
        }
      });
    }

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="fade-in">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dental-900">Welcome back, Dr. Samuela</h1>
          <p className="text-gray-500 mt-1">Here is your clinic's command center overview.</p>
        </div>
        
        <div className="bg-white border border-gray-200 px-5 py-3 rounded-xl shadow-sm flex items-center gap-4">
          <Clock className="w-6 h-6 text-dental-600" />
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
              {time.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-xl font-bold text-gray-900 font-sans leading-none tracking-tight">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-dental-100 p-3 rounded-xl text-dental-600"><CalendarCheck className="w-6 h-6" /></div>
          </div>
          <p className="text-4xl font-bold text-dental-900 font-serif">{todayCount}</p>
          <p className="text-sm text-gray-500 mt-1 font-medium">Appointments Today</p>
        </div>
        
        {/* ── RESTORED: NEW PATIENTS CARD ── */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-accent-100 p-3 rounded-xl text-accent-600"><UserPlus className="w-6 h-6" /></div>
            {newPatientsCount > 0 && (
              <span className="text-xs font-bold text-accent-600 bg-accent-500/10 px-2 py-1 rounded-full">
                +{newPatientsCount}
              </span>
            )}
          </div>
          <p className="text-4xl font-bold text-dental-900 font-serif">{newPatientsCount}</p>
          <p className="text-sm text-gray-500 mt-1 font-medium">New Patients This Week</p>
        </div>

        <div className="bg-gradient-to-br from-gray-600 to-gray-800 p-6 rounded-2xl shadow-lg shadow-gray-600/30 card-hover text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-white/10"><Activity className="w-32 h-32" /></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl"><Activity className="w-6 h-6" /></div>
            </div>
            <p className="text-4xl font-bold font-serif text-gray-300">0%</p>
            <p className="text-sm text-gray-300 mt-1 font-medium">Patient Satisfaction</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        <div className="lg:col-span-8 space-y-8">
          {/* ── Charts Section ── */}
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-serif text-xl font-bold text-dental-900">Clinic Analytics</h3>
              <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-dental-500">
                <option>This Week</option>
                <option>Last Week</option>
                <option>This Month</option>
              </select>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-[250px] w-full">
                <p className="text-sm font-bold text-gray-500 mb-2 text-center">Patient Visits (No Data)</p>
                <canvas ref={lineChartRef}></canvas>
              </div>
              <div className="h-[250px] w-full relative">
                <p className="text-sm font-bold text-gray-500 mb-2 text-center">Services Breakdown (No Data)</p>
                <canvas ref={doughnutChartRef}></canvas>
              </div>
            </div>
          </div>

          {/* ── LIVE Priority Table ── */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-serif text-xl font-bold text-dental-900">Today's Patients</h3>
              <Link to="/admin/appointments" className="text-sm font-semibold text-dental-600 hover:text-dental-800 transition flex items-center gap-1">
                View Full Schedule <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Service</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
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
                      <tr key={app.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-gray-600 text-sm">{app.phone || 'N/A'}</td>
                        <td className="p-4 font-bold text-dental-700">{app.name}</td>
                        <td className="p-4 text-sm text-gray-600">{app.service}</td>
                        <td className="p-4">
                          <span className={`border text-xs px-2.5 py-1 rounded-full font-bold ${
                            app.status === 'pending' 
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                              : 'bg-dental-50 text-dental-700 border-dental-200'
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
        </div>

        <div className="lg:col-span-4 space-y-8">
          
          {/* ── Quick Actions ── */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => navigate('/admin/patients')} className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-dental-50 rounded-xl border border-gray-100 hover:border-dental-300 transition group">
                <UserPlus className="w-6 h-6 text-gray-500 group-hover:text-dental-600 mb-2" />
                <span className="text-[10px] sm:text-xs font-bold text-gray-700 group-hover:text-dental-700 text-center">New Patient</span>
              </button>
              <button onClick={() => navigate('/admin/appointments')} className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-dental-50 rounded-xl border border-gray-100 hover:border-dental-300 transition group">
                <CalendarPlus className="w-6 h-6 text-gray-500 group-hover:text-dental-600 mb-2" />
                <span className="text-[10px] sm:text-xs font-bold text-gray-700 group-hover:text-dental-700 text-center">Book Appt</span>
              </button>
              <button onClick={() => navigate('/admin/queue')} className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-red-50 rounded-xl border border-gray-100 hover:border-red-300 transition group">
                <MonitorPlay className="w-6 h-6 text-gray-500 group-hover:text-red-500 mb-2" />
                <span className="text-[10px] sm:text-xs font-bold text-gray-700 group-hover:text-red-600 text-center">Live Queue</span>
              </button>
            </div>
          </div>

          {/* ── LIVE Tasks ── */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h3 className="font-serif text-lg font-bold text-gray-900">Clinic Tasks</h3>
              <button 
                onClick={() => setIsAddingTask(!isAddingTask)} 
                className={`transition-colors ${isAddingTask ? 'text-red-500' : 'text-dental-500 hover:text-dental-700'}`}
              >
                <PlusCircle className={`w-5 h-5 transition-transform ${isAddingTask ? 'rotate-45' : ''}`} />
              </button>
            </div>
            
            {/* Add Task Input Form */}
            {isAddingTask && (
              <form onSubmit={handleAddTask} className="mb-4 flex gap-2 animate-fade-in-up">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Type a new task..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-dental-500"
                />
                <button type="submit" className="bg-dental-600 text-white p-2 rounded-lg hover:bg-dental-700 transition">
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
                      className="task-checkbox mt-1 w-4 h-4 text-dental-600 rounded border-gray-300 focus:ring-dental-500 cursor-pointer transition" 
                    />
                    <div className={`text-sm font-medium transition-all ${
                      task.is_completed 
                        ? 'text-gray-400 line-through' 
                        : 'text-gray-700 group-hover:text-gray-900'
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