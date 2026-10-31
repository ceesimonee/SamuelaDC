import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ArrowLeft, PlayCircle, ShieldPlus, Sparkles, MinusCircle, ShieldCheck, Activity, Heart, Star, Shield, PlusCircle } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  ShieldPlus, Sparkles, MinusCircle, ShieldCheck, Activity,
  Heart, Star, Shield, PlusCircle
};

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      // Decode the URL slug back into a standard string to search the database
      const decodedName = decodeURIComponent(serviceId || '').replace(/-/g, ' ');
      
      const { data, error } = await supabase
        .from('clinic_services')
        .select('*')
        .ilike('name', decodedName)
        .single();

      if (data && !error) {
        setService(data);
      } else {
        // Fallback: If no service is found, kick them back to the home page
        navigate('/');
      }
      setLoading(false);
    };

    fetchService();
  }, [serviceId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c4a6e]"></div>
      </div>
    );
  }

  if (!service) return null;

  const Icon = ICON_MAP[service.icon] || ShieldPlus;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 fade-in">
        
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0c4a6e] font-semibold transition mb-8 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-[#0c4a6e] p-12 text-center text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-2xl mb-6 backdrop-blur-sm">
                <Icon className="w-12 h-12 text-white" />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{service.name}</h1>
              <p className="text-sky-100 text-lg uppercase tracking-widest font-semibold">Premium Dental Care</p>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-[#0c4a6e]" /> About this Service
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-10">
              {service.description}
            </p>

            <div className="bg-sky-50 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-sky-100">
              <div>
                <h3 className="text-xl font-bold text-[#0c4a6e] mb-2">Ready to transform your smile?</h3>
                <p className="text-sky-700">Book your consultation today and take the first step towards perfect dental health.</p>
              </div>
              <Link to="/appointment" className="w-full sm:w-auto bg-[#0c4a6e] text-white px-8 py-4 rounded-full font-bold hover:bg-[#075985] transition shadow-md whitespace-nowrap text-center">
                Book Appointment
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}