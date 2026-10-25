import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, Mail } from 'lucide-react';
import { supabase } from './lib/supabase'; // Make sure this path is correct for your project

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch the current user on load
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 py-3 px-6 flex justify-between items-center w-full">
      <div className="font-serif font-bold text-xl text-dental-600">Samuela Dental</div>
      
      {/* Profile Icon Dropdown - Only shows if a user is logged in */}
      {user && (
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full border-2 border-transparent hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <UserIcon className="w-7 h-7 text-slate-500" strokeWidth={2} />
          </button>

          {/* Profile Dropdown Card */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-4 px-4 z-50 animate-fade-in-up">
              <div className="text-center mb-4">
                <div className="bg-dental-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 text-dental-600">
                  <UserIcon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg truncate">
                  {user.user_metadata?.full_name || 'Patient'}
                </h3>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-3">
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-medium py-2 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}