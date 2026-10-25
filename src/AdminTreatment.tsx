import { useState } from 'react';
import { GitCommit, Scan, Smile } from 'lucide-react';

// Define the data structure for the treatment categories and their patients
type PatientTreatment = {
  id: string;
  name: string;
  badgeText: string;
  badgeClass: string;
  progress: number;
  actionLabel: string;
  actionText: string;
};

type TreatmentCategory = {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  barColor: string;
  patients: PatientTreatment[];
};

export default function AdminTreatment() {
  // Store all ongoing treatments in state, organized by category
  const [categories] = useState<TreatmentCategory[]>([
    {
      id: 'ortho',
      title: 'Orthodontics (Braces)',
      icon: GitCommit,
      iconColor: 'text-purple-500',
      barColor: 'bg-purple-500',
      patients: [
        {
          id: 'pt-1',
          name: 'Jhon Doe',
          badgeText: 'Month 8 / 24',
          badgeClass: 'bg-white border border-gray-200 text-gray-500',
          progress: 33,
          actionLabel: 'Next Action:',
          actionText: 'Adjust wires & replace bands.',
        }
      ]
    },
    {
      id: 'implants',
      title: 'Dental Implants',
      icon: Scan,
      iconColor: 'text-blue-500',
      barColor: 'bg-blue-500',
      patients: [
        {
          id: 'pt-2',
          name: 'Robert Lim',
          badgeText: 'Healing',
          badgeClass: 'bg-yellow-100 text-yellow-700',
          progress: 60,
          actionLabel: 'Status:',
          actionText: 'Waiting for osseointegration (Week 6/12).',
        }
      ]
    },
    {
      id: 'aligners',
      title: 'Clear Aligners',
      icon: Smile,
      iconColor: 'text-accent-500',
      barColor: 'bg-accent-500',
      patients: [
        {
          id: 'pt-3',
          name: 'Ana Cruz',
          badgeText: 'Tray 4 / 20',
          badgeClass: 'bg-white border border-gray-200 text-gray-500',
          progress: 20,
          actionLabel: 'Next Action:',
          actionText: 'Dispense Trays 5-8.',
        }
      ]
    }
  ]);

  return (
    <div className="fade-in">
      
      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-dental-900">Treatment Monitoring</h1>
        <p className="text-gray-500 mt-1">Track progress of ongoing long-term procedures.</p>
      </div>

      {/* ── Treatment Grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4">
            
            {/* Category Header */}
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <category.icon className={`w-5 h-5 ${category.iconColor}`} /> 
              {category.title}
            </h3>
            
            {/* Map over the patients in this specific category */}
            {category.patients.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                No active treatments.
              </p>
            ) : (
              category.patients.map((patient) => (
                <div key={patient.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-3 hover:border-dental-300 transition-colors cursor-pointer">
                  
                  {/* Patient Name & Badge */}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-gray-900">{patient.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${patient.badgeClass}`}>
                      {patient.badgeText}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div 
                      className={`${category.barColor} h-1.5 rounded-full transition-all duration-1000 ease-out`} 
                      style={{ width: `${patient.progress}%` }}
                    ></div>
                  </div>
                  
                  {/* Action / Status Text */}
                  <p className="text-xs text-gray-500">
                    <span className="font-bold text-gray-700">{patient.actionLabel}</span> {patient.actionText}
                  </p>
                </div>
              ))
            )}

          </div>
        ))}

      </div>
    </div>
  );
}