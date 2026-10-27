import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Smile, Menu, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase'; // Import your Supabase client

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State for live pending requests count
  const [pendingCount, setPendingCount] = useState(0);

  // Helper to check if a link is active
  const isActive = (path: string) => location.pathname === path ? "active-nav text-dental-600" : "text-gray-700";

  // Fetch pending count and set up real-time listener
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
        
      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchPendingCount();

    // Listen for any changes to the appointments table so the badge updates instantly
    const channel = supabase
      .channel('public:appointments_layout')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Securely log out of Supabase and redirect to landing page
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/'); // Redirect to the landing page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="text-gray-800 antialiased selection:bg-dental-100 selection:text-dental-900 bg-slate-50 min-h-screen">
      
      {/* ── Fixed Navbar ── */}
      <nav className="fixed w-full z-50 glass-effect border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="bg-dental-600 p-2 rounded-full shadow-md shadow-dental-600/20">
                <Smile className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-dental-900 leading-none">Samuela Dental Clinic</span>
                <p className="text-[10px] text-dental-600 tracking-[0.2em] font-bold mt-0.5">ADMIN PORTAL</p>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center space-x-6">
              <Link to="/admin" className={`nav-link hover:text-dental-600 font-medium transition ${isActive('/admin')}`}>Dashboard</Link>
              <Link to="/admin/appointments" className={`nav-link hover:text-dental-600 font-medium transition flex items-center gap-1.5 ${isActive('/admin/appointments')}`}>
                Schedule 
                {pendingCount > 0 && (
                  <span className="bg-dental-100 text-dental-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {pendingCount} NEW
                  </span>
                )}
              </Link>
              <Link to="/admin/queue" className={`nav-link hover:text-dental-600 font-medium transition flex items-center gap-1.5 ${isActive('/admin/queue')}`}>
                Queue <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
              </Link>
              <Link to="/admin/patients" className={`nav-link hover:text-dental-600 font-medium transition ${isActive('/admin/patients')}`}>Records</Link>
              
              <div className="w-px h-6 bg-gray-200 mx-2"></div>

              {/* Profile Chip */}
              <div className="flex items-center gap-3 bg-white border border-gray-200 pl-2 pr-4 py-1.5 rounded-full shadow-sm">
                <div className="w-8 h-8 rounded-full bg-dental-100 text-dental-700 flex items-center justify-center font-bold text-sm">SS</div>
                <div className="text-left hidden xl:block">
                  <p className="text-xs font-bold text-gray-900 leading-tight">Dr. Samuela</p>
                  <p className="text-[10px] text-gray-500">Administrator</p>
                </div>
              </div>

              {/* Desktop Logout Button */}
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <button className="lg:hidden p-2 text-dental-900 hover:bg-dental-50 rounded-lg" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <Link 
                to="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-3 rounded-md font-medium transition ${isActive('/admin') === 'text-gray-700' ? 'text-gray-700 hover:bg-dental-50 hover:text-dental-600' : 'bg-dental-50 text-dental-600'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/admin/appointments" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between w-full text-left px-3 py-3 rounded-md font-medium transition ${isActive('/admin/appointments') === 'text-gray-700' ? 'text-gray-700 hover:bg-dental-50 hover:text-dental-600' : 'bg-dental-50 text-dental-600'}`}
              >
                <span>Schedule</span>
                {pendingCount > 0 && (
                  <span className="bg-dental-100 text-dental-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {pendingCount} NEW
                  </span>
                )}
              </Link>
              <Link 
                to="/admin/queue" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 w-full text-left px-3 py-3 rounded-md font-medium transition ${isActive('/admin/queue') === 'text-gray-700' ? 'text-gray-700 hover:bg-dental-50 hover:text-dental-600' : 'bg-dental-50 text-dental-600'}`}
              >
                Queue <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
              </Link>
              <Link 
                to="/admin/patients" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-3 rounded-md font-medium transition ${isActive('/admin/patients') === 'text-gray-700' ? 'text-gray-700 hover:bg-dental-50 hover:text-dental-600' : 'bg-dental-50 text-dental-600'}`}
              >
                Records
              </Link>
              <div className="border-t border-gray-100 pt-4 mt-2">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-md font-medium">
                  <LogOut className="w-5 h-5" /> Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Main Content Area ── */}
      {/* pt-28 pushes all nested pages down so they aren't hidden behind the fixed navbar */}
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

    </div>
  );
}