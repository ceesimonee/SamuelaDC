import { useState } from 'react';
import { Check, FileText, MessageSquare, Pill } from 'lucide-react';

// Define the data structure for a timeline event
type HistoryEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconWrapperClass: string;
  iconClass: string;
};

// Define the data structure for a patient's full tracking record
type PatientRecord = {
  id: string;
  name: string;
  initials: string;
  since: string;
  plan: string;
  history: HistoryEvent[];
};

export default function AdminTracking() {
  // Mock Database for Patient Histories
  const [patients] = useState<PatientRecord[]>([
    {
      id: 'PT-001',
      name: 'Maria Santos',
      initials: 'MS',
      since: 'Jan 2025',
      plan: 'Cosmetic Plan',
      history: [
        {
          id: 'ev-1',
          date: 'APRIL 10, 2026',
          title: 'Porcelain Veneers Installed',
          description: 'Upper front 6 teeth successfully prepped and bonded with porcelain veneers. Shade A1 selected. Patient highly satisfied.',
          icon: Check,
          iconWrapperClass: 'bg-accent-100',
          iconClass: 'text-accent-600'
        },
        {
          id: 'ev-2',
          date: 'MARCH 25, 2026',
          title: 'Teeth Whitening & Impressions',
          description: 'Performed in-office laser whitening. Took digital impressions for veneer lab fabrication.',
          icon: FileText,
          iconWrapperClass: 'bg-dental-100',
          iconClass: 'text-dental-600'
        },
        {
          id: 'ev-3',
          date: 'MARCH 15, 2026',
          title: 'Initial Consultation',
          description: 'Patient came in requesting a smile makeover. Evaluated oral health, took X-rays, and drafted cosmetic treatment plan.',
          icon: MessageSquare,
          iconWrapperClass: 'bg-gray-100',
          iconClass: 'text-gray-600'
        }
      ]
    },
    {
      id: 'PT-002',
      name: 'Robert Lim',
      initials: 'RL',
      since: 'Nov 2024',
      plan: 'Implant Surgery',
      history: [
        {
          id: 'ev-4',
          date: 'MAY 02, 2026',
          title: 'Post-Op Checkup',
          description: 'Healing progressing well. No signs of infection. Removed sutures.',
          icon: Check,
          iconWrapperClass: 'bg-accent-100',
          iconClass: 'text-accent-600'
        },
        {
          id: 'ev-5',
          date: 'APRIL 20, 2026',
          title: 'Implant Placement',
          description: 'Surgical placement of titanium post at tooth #19. Prescribed antibiotics and pain relievers.',
          icon: Pill,
          iconWrapperClass: 'bg-purple-100',
          iconClass: 'text-purple-600'
        }
      ]
    }
  ]);

  // State to track which patient is selected in the dropdown
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0].id);

  // Derive the currently selected patient's full data
  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  return (
    <div className="fade-in max-w-4xl mx-auto">
      
      {/* ── Page Header & Selector ── */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dental-900">Patient History Tracker</h1>
          <p className="text-gray-500 mt-1">View the chronological interaction log for a specific patient.</p>
        </div>
        <select 
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="bg-white border border-gray-300 text-sm rounded-lg px-4 py-2 font-medium shadow-sm outline-none focus:ring-2 focus:ring-dental-500 min-w-[200px] cursor-pointer"
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
        
        {/* ── Patient Profile Header ── */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 fade-in" key={`header-${currentPatient.id}`}>
          <div className="w-16 h-16 rounded-full bg-dental-100 flex items-center justify-center font-bold text-dental-600 text-xl border border-dental-200">
            {currentPatient.initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{currentPatient.name}</h2>
            <p className="text-sm text-gray-500">Since: {currentPatient.since} • {currentPatient.plan}</p>
          </div>
        </div>

        {/* ── Timeline ── */}
        <div className="space-y-6 fade-in" key={`timeline-${currentPatient.id}`}>
          {currentPatient.history.map((event) => (
            <div 
              key={event.id} 
              // The Tailwind classes starting with "before:" create the connecting vertical line automatically!
              className="relative pl-12 before:content-[''] before:absolute before:left-[15px] before:top-[30px] before:-bottom-[24px] before:w-[2px] before:bg-gray-200 before:z-0 last:before:hidden"
            >
              {/* Timeline Icon */}
              <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center z-10 shadow-sm ${event.iconWrapperClass}`}>
                <event.icon className={`w-4 h-4 ${event.iconClass}`} />
              </div>
              
              {/* Event Content Card */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-dental-300 transition-colors">
                <span className="text-xs font-bold text-gray-400">{event.date}</span>
                <h4 className="font-bold text-gray-900 mt-1">{event.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{event.description}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}