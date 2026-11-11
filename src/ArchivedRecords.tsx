import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './lib/supabase'; // Adjust path if needed
import { 
  Archive, ArrowLeft, Calendar, List, Clock, Search
} from 'lucide-react';

type ArchivedAppointment = {
  id: number;
  name: string;
  phone: string;
  service: string;
  appointment_date: string;
  status: string;
};

type ArchivedQueue = {
  id: number;
  ticket: string;
  name: string;
  service: string;
  created_at: string;
  status: string;
};

export default function ArchivedRecords() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'queue'>('appointments');
  const [appointments, setAppointments] = useState<ArchivedAppointment[]>([]);
  const [queue, setQueue] = useState<ArchivedQueue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchivedData();
  }, []);

  const fetchArchivedData = async () => {
    setLoading(true);
    
    // Fetch archived appointments
    const { data: apptData } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'archived')
      .order('appointment_date', { ascending: false });

    if (apptData) setAppointments(apptData);

    // Fetch archived queue tickets
    const { data: queueData } = await supabase
      .from('queue')
      .select('*')
      .eq('status', 'archived')
      .order('created_at', { ascending: false });

    if (queueData) setQueue(queueData);

    setLoading(false);
  };

  return (
    <div className="fade-in max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <Link to="/admin" className="text-gray-500 hover:text-[#0c4a6e] transition flex items-center gap-2 mb-2 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#0c4a6e] flex items-center gap-3">
            <Archive className="w-8 h-8 text-sky-600" />
            Archived Records
          </h1>
          <p className="text-gray-500 mt-1">View securely stored historical data for RA 10173 compliance.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
              activeTab === 'appointments' 
                ? 'bg-white text-[#0c4a6e] border-b-2 border-[#0c4a6e]' 
                : 'text-gray-500 hover:text-[#0c4a6e] hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Appointments Archive ({appointments.length})
          </button>
          <button 
            onClick={() => setActiveTab('queue')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
              activeTab === 'queue' 
                ? 'bg-white text-[#0c4a6e] border-b-2 border-[#0c4a6e]' 
                : 'text-gray-500 hover:text-[#0c4a6e] hover:bg-gray-100'
            }`}
          >
            <List className="w-5 h-5" />
            Queue History ({queue.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-sky-200 border-t-[#0c4a6e] rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">Loading archives...</p>
            </div>
          ) : activeTab === 'appointments' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Name</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 text-sm font-medium">
                        <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        No archived appointments found.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((app) => (
                      <tr key={app.id} className="hover:bg-sky-50 transition">
                        <td className="p-4 text-sm text-gray-600 font-medium">
                          {new Date(app.appointment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-4 font-bold text-[#0c4a6e]">{app.name}</td>
                        <td className="p-4 text-sm text-gray-600">{app.phone || 'N/A'}</td>
                        <td className="p-4 text-sm text-gray-600">{app.service}</td>
                        <td className="p-4">
                          <span className="bg-gray-100 text-gray-600 border border-gray-200 text-xs px-2.5 py-1 rounded-full font-bold">
                            Archived
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket #</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Name</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 text-sm font-medium">
                        <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        No archived queue records found.
                      </td>
                    </tr>
                  ) : (
                    queue.map((q) => (
                      <tr key={q.id} className="hover:bg-sky-50 transition">
                        <td className="p-4 text-sm text-gray-600 font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {new Date(q.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-4">
                          <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-md">
                            {q.ticket}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[#0c4a6e]">{q.name}</td>
                        <td className="p-4 text-sm text-gray-600">{q.service}</td>
                        <td className="p-4">
                          <span className="bg-gray-100 text-gray-600 border border-gray-200 text-xs px-2.5 py-1 rounded-full font-bold">
                            Archived
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}