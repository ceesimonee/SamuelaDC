import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  ShieldPlus, Sparkles, MinusCircle, ShieldCheck, Activity, 
  Heart, Star, Shield, PlusCircle, Trash2, Plus, X 
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { name: 'ShieldPlus', icon: ShieldPlus },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'MinusCircle', icon: MinusCircle },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Activity', icon: Activity },
  { name: 'Heart', icon: Heart },
  { name: 'Star', icon: Star },
  { name: 'Shield', icon: Shield },
  { name: 'PlusCircle', icon: PlusCircle },
];

export default function AdminServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({ name: '', description: '', icon: 'ShieldPlus' });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clinic_services')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the service: ${name}?`)) return;

    const { error } = await supabase.from('clinic_services').delete().eq('id', id);
    if (!error) {
      setServices(services.filter(s => s.id !== id));
    } else {
      alert("Failed to delete service.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from('clinic_services').insert([
      { name: form.name, description: form.description, icon: form.icon }
    ]);

    if (!error) {
      setForm({ name: '', description: '', icon: 'ShieldPlus' });
      setIsModalOpen(false);
      fetchServices();
    } else {
      alert("Failed to add service. Ensure all fields are correct.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dental-900">Clinic Services</h1>
          <p className="text-gray-500 mt-1">Manage the services shown on your patient website.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-dental-600 hover:bg-dental-700 text-white px-6 py-3 rounded-full font-medium transition shadow-lg shadow-dental-600/30 flex items-center gap-2 justify-center"
        >
          <Plus className="w-5 h-5" /> Add New Service
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dental-600"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const IconObj = AVAILABLE_ICONS.find(i => i.name === service.icon)?.icon || ShieldPlus;
            return (
              <div key={service.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full hover:shadow-xl transition relative group">
                <div className="bg-sky-50 w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-dental-600">
                  <IconObj className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-grow">{service.description}</p>
                
                <button 
                  onClick={() => handleDelete(service.id, service.name)}
                  className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition"
                  title="Delete Service"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal for Adding Services ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
              <h3 className="font-serif text-xl font-bold text-gray-900">Add New Service</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-2 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/50 flex-grow">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Service Name</label>
                  <input 
                    type="text" required 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-white text-sm" 
                    placeholder="e.g. Teeth Whitening" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea 
                    required rows={3}
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none transition bg-white text-sm resize-none" 
                    placeholder="Describe the service clearly for patients..." 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select an Icon</label>
                  <div className="grid grid-cols-5 gap-3">
                    {AVAILABLE_ICONS.map(({ name, icon: IconComponent }) => (
                      <button
                        key={name} type="button"
                        onClick={() => setForm({ ...form, icon: name })}
                        className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                          form.icon === name 
                            ? 'bg-dental-600 text-white shadow-md scale-110' 
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-dental-600'
                        }`}
                      >
                        <IconComponent className="w-6 h-6" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-dental-600 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-dental-700 transition disabled:opacity-70 shadow-md"
                  >
                    {isSubmitting ? 'Saving...' : 'Publish Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}