import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Search, Phone, Calendar, X, Upload, Image as ImageIcon, 
  UserPlus, Users, Mail, FileText, Edit2, Save, Filter, MapPin, Activity, Trash2,
  Download, FileSpreadsheet, Printer, ChevronDown, Sparkles, CheckCircle2, Clock
} from 'lucide-react';

type Patient = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  birthdate: string | null;
  sex: string | null;
  created_at: string;
  notes: string | null; 
};

type PatientImage = {
  id: number;
  patient_id: number;
  image_url: string;
};

type DentalChartEntry = {
  id: string;
  toothNumber: string;
  toothName: string;
  condition: string;
  treatment: string;
  dentistNotes: string;
  date: string;
};

const FDI_TEETH: { [key: string]: string } = {
  '18': 'Upper right third molar',
  '17': 'Upper right second molar',
  '16': 'Upper right first molar',
  '15': 'Upper right second premolar',
  '14': 'Upper right first premolar',
  '13': 'Upper right canine',
  '12': 'Upper right lateral incisor',
  '11': 'Upper right central incisor',
  '21': 'Upper left central incisor',
  '22': 'Upper left lateral incisor',
  '23': 'Upper left canine',
  '24': 'Upper left first premolar',
  '25': 'Upper left second premolar',
  '26': 'Upper left first molar',
  '27': 'Upper left second molar',
  '28': 'Upper left third molar',
  '38': 'Lower left third molar',
  '37': 'Lower left second molar',
  '36': 'Lower left first molar',
  '35': 'Lower left second premolar',
  '34': 'Lower left first premolar',
  '33': 'Lower left canine',
  '32': 'Lower left lateral incisor',
  '31': 'Lower left central incisor',
  '48': 'Lower right third molar',
  '47': 'Lower right second molar',
  '46': 'Lower right first molar',
  '45': 'Lower right second premolar',
  '44': 'Lower right first premolar',
  '43': 'Lower right canine',
  '42': 'Lower right lateral incisor',
  '41': 'Lower right central incisor',
};

const UPPER_RIGHT_TEETH = ['18', '17', '16', '15', '14', '13', '12', '11'];
const UPPER_LEFT_TEETH  = ['21', '22', '23', '24', '25', '26', '27', '28'];
const LOWER_RIGHT_TEETH = ['48', '47', '46', '45', '44', '43', '42', '41'];
const LOWER_LEFT_TEETH  = ['31', '32', '33', '34', '35', '36', '37', '38'];

const TOOTH_CONDITIONS = [
  'Decayed',
  'Healthy',
  'Filled or restored',
  'Missing',
  'Extracted',
  'Crown or root canal treated'
];

const TOOTH_TREATMENTS = [
  'Dental filling',
  'Tooth extraction',
  'Cleaning & Prophylaxis',
  'Root canal treatment',
  'Crown / Bridge installation',
  'Pit & Fissure Sealant',
  'Fluoride Application',
  'Observation / Evaluation only'
];

export default function AdminPatients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ 
    firstName: '', lastName: '', middleName: '', 
    birthdate: '', age: '', sex: '', religion: '', nationality: '', nickname: '',
    address: '', phone: '', email: '', occupation: '', reason: '',
    previousDentist: '', lastVisit: '',
    physician: '', bloodType: '', bloodPressure: '', allergies: '', conditions: ''
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'odontogram' | 'records'>('odontogram');
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // ─── Dental Chart State (Defaulting to blank/unselected) ───
  const [dentalChartEntries, setDentalChartEntries] = useState<DentalChartEntry[]>([]);
  const [selectedTooth, setSelectedTooth] = useState('11');
  const [toothCondition, setToothCondition] = useState(''); // ── Blank default
  const [toothTreatment, setToothTreatment] = useState(''); // ── Blank default
  const [dentistNotes, setDentistNotes] = useState('');     // ── Blank default
  const [isSavingTooth, setIsSavingTooth] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('patients').select('*');
    if (data && !error) setPatients(data);
    setIsLoading(false);
  };

  const loadPatientDentalChart = (patientId: number) => {
    const saved = localStorage.getItem(`samuela_dental_chart_${patientId}`);
    if (saved) {
      try {
        setDentalChartEntries(JSON.parse(saved));
      } catch {
        setDentalChartEntries([]);
      }
    } else {
      setDentalChartEntries([]);
    }
  };

  const handleSelectTooth = (toothNum: string) => {
    setSelectedTooth(toothNum);
    const existing = dentalChartEntries.find(e => e.toothNumber === toothNum);
    if (existing) {
      setToothCondition(existing.condition);
      setToothTreatment(existing.treatment);
      setDentistNotes(existing.dentistNotes);
    } else {
      setToothCondition('');
      setToothTreatment('');
      setDentistNotes('');
    }
  };

  const handleSaveToothEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (!toothCondition || !toothTreatment) {
      alert("Please select both a tooth condition and treatment before saving.");
      return;
    }

    setIsSavingTooth(true);

    const todayFormatted = new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });

    const newEntry: DentalChartEntry = {
      id: Date.now().toString(),
      toothNumber: selectedTooth,
      toothName: FDI_TEETH[selectedTooth] || `Tooth ${selectedTooth}`,
      condition: toothCondition,
      treatment: toothTreatment,
      dentistNotes: dentistNotes.trim() || 'No additional notes.',
      date: todayFormatted
    };

    const updatedEntries = [
      newEntry,
      ...dentalChartEntries.filter(item => item.toothNumber !== selectedTooth)
    ];

    setDentalChartEntries(updatedEntries);
    localStorage.setItem(`samuela_dental_chart_${selectedPatient.id}`, JSON.stringify(updatedEntries));

    const chartLogLine = `\n[DENTAL CHART - ${todayFormatted}] Tooth #${selectedTooth} (${FDI_TEETH[selectedTooth]}): Condition: ${toothCondition} | Treatment: ${toothTreatment} | Notes: ${newEntry.dentistNotes}`;
    const updatedNotesText = (selectedPatient.notes ? selectedPatient.notes.trimEnd() + '\n' : '') + chartLogLine;

    const { error } = await supabase
      .from('patients')
      .update({ notes: updatedNotesText })
      .eq('id', selectedPatient.id);

    if (!error) {
      setPatients(patients.map(p => p.id === selectedPatient.id ? { ...p, notes: updatedNotesText } : p));
      setSelectedPatient({ ...selectedPatient, notes: updatedNotesText });
      setEditedNotes(updatedNotesText);
    }

    setIsSavingTooth(false);
  };

  const handleDeleteToothEntry = (toothNum: string) => {
    if (!selectedPatient) return;
    const filtered = dentalChartEntries.filter(item => item.toothNumber !== toothNum);
    setDentalChartEntries(filtered);
    localStorage.setItem(`samuela_dental_chart_${selectedPatient.id}`, JSON.stringify(filtered));
  };

  const getToothBadgeStyle = (condition?: string) => {
    switch (condition) {
      case 'Decayed': return 'bg-red-100 text-red-700 border-red-300';
      case 'Filled or restored': return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'Missing':
      case 'Extracted': return 'bg-gray-200 text-gray-500 border-gray-300 line-through';
      case 'Crown or root canal treated': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Healthy': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      default: return 'bg-white text-gray-700 border-gray-200 hover:border-dental-400';
    }
  };

  const getConditionPillStyle = (condition: string) => {
    switch (condition) {
      case 'Decayed': return 'bg-red-100 text-red-700';
      case 'Filled or restored': return 'bg-sky-100 text-sky-700';
      case 'Missing':
      case 'Extracted': return 'bg-gray-200 text-gray-700';
      case 'Crown or root canal treated': return 'bg-purple-100 text-purple-700';
      case 'Healthy': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientForm.lastName.trim() || !newPatientForm.firstName.trim()) {
      alert("First and Last name are required.");
      return;
    }

    const fullName = `${newPatientForm.lastName}, ${newPatientForm.firstName} ${newPatientForm.middleName}`.trim();

    const intakeNotes = `--- INITIAL INTAKE INFORMATION ---
Reason for Consultation: ${newPatientForm.reason || 'None provided'}
Occupation: ${newPatientForm.occupation || 'N/A'}
Religion: ${newPatientForm.religion || 'N/A'} | Nationality: ${newPatientForm.nationality || 'N/A'}
Nickname: ${newPatientForm.nickname || 'N/A'} | Age: ${newPatientForm.age || 'N/A'}

--- DENTAL HISTORY ---
Previous Dentist: ${newPatientForm.previousDentist || 'None'}
Last Dental Visit: ${newPatientForm.lastVisit || 'Unknown'}

--- MEDICAL HISTORY ---
Physician: ${newPatientForm.physician || 'None'}
Blood Type: ${newPatientForm.bloodType || 'Unknown'} | Blood Pressure: ${newPatientForm.bloodPressure || 'Unknown'}
Allergies: ${newPatientForm.allergies || 'None reported'}
Medical Conditions: ${newPatientForm.conditions || 'None reported'}`;

    const { data, error } = await supabase
      .from('patients')
      .insert([{ 
        name: fullName, 
        email: newPatientForm.email || null, 
        phone: newPatientForm.phone || null,
        address: newPatientForm.address || null,
        birthdate: newPatientForm.birthdate || null,
        sex: newPatientForm.sex || null,
        notes: intakeNotes 
      }])
      .select()
      .single();

    if (data && !error) {
      setPatients([data, ...patients]); 
      setIsAddModalOpen(false); 
      setNewPatientForm({ 
        firstName: '', lastName: '', middleName: '', birthdate: '', age: '', sex: '', religion: '', nationality: '', nickname: '',
        address: '', phone: '', email: '', occupation: '', reason: '',
        previousDentist: '', lastVisit: '', physician: '', bloodType: '', bloodPressure: '', allergies: '', conditions: ''
      }); 
    } else {
      alert("Error adding patient: " + (error?.message || "Unknown error"));
    }
  };

  const handleDeletePatient = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the record for ${name}? This action cannot be undone.`)) return;

    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (!error) {
      setPatients(patients.filter(p => p.id !== id));
      localStorage.removeItem(`samuela_dental_chart_${id}`);
      if (selectedPatient?.id === id) setSelectedPatient(null);
    } else {
      alert("Error deleting patient: " + error.message);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedPatient) return;
    setIsSavingNotes(true);

    const { error } = await supabase.from('patients').update({ notes: editedNotes }).eq('id', selectedPatient.id);
    if (!error) {
      setPatients(patients.map(p => p.id === selectedPatient.id ? { ...p, notes: editedNotes } : p));
      setSelectedPatient({ ...selectedPatient, notes: editedNotes });
      setIsEditingNotes(false);
    } else {
      alert("Error saving notes: " + error.message);
    }
    setIsSavingNotes(false);
  };

  const fetchPatientImages = async (patientId: number) => {
    const { data, error } = await supabase.from('patient-images').select('*').eq('patient_id', patientId).order('id', { ascending: false });
    if (data && !error) setPatientImages(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient) return;
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedPatient.id}-${Date.now()}.${fileExt}`;
      const filePath = `records/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('medical-records').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('medical-records').getPublicUrl(filePath);
      const { data: dbData, error: dbError } = await supabase.from('patient-images').insert([{ patient_id: selectedPatient.id, image_url: publicUrl }]).select().single();

      if (dbError) throw dbError;
      setPatientImages([dbData, ...patientImages]);
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const openProfile = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveProfileTab('odontogram');
    setEditedNotes(patient.notes || ''); 
    setIsEditingNotes(false);
    setPatientImages([]); 
    fetchPatientImages(patient.id);
    loadPatientDentalChart(patient.id);
    
    // ── FIXED: Completely blank states when opening patient profile
    setSelectedTooth('11');
    setToothCondition('');
    setToothTreatment('');
    setDentistNotes('');
  };

  const getInitials = (name: string) => {
    const parts = name.replace(',', '').split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  
  const formatId = (id: number, dateStr: string) => `PT-${new Date(dateStr).getFullYear()}-${String(id).padStart(3, '0')}`;
  
  const getAvatarColors = (id: number) => {
    const colors = [
      'bg-dental-100 text-dental-600 border-dental-200',
      'bg-purple-100 text-purple-600 border-purple-200',
      'bg-accent-100 text-accent-700 border-accent-200',
      'bg-green-100 text-green-700 border-green-200',
    ];
    return colors[id % colors.length];
  };

  const filteredAndSortedPatients = patients
    .filter(patient => 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      formatId(patient.id, patient.created_at).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      if (sortBy === 'za') return b.name.localeCompare(a.name);
      return 0;
    });

  const handleExportExcel = () => {
    if (filteredAndSortedPatients.length === 0) {
      alert("No patient records available to export.");
      return;
    }

    const headers = ['Patient ID', 'Full Name', 'Sex', 'Birthdate', 'Phone Number', 'Email Address', 'Home Address', 'Registered Date', 'Clinical Notes'];
    const escapeCSV = (val: string | null | undefined) => {
      if (!val) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = filteredAndSortedPatients.map(p => [
      escapeCSV(formatId(p.id, p.created_at)),
      escapeCSV(p.name),
      escapeCSV(p.sex || 'N/A'),
      escapeCSV(p.birthdate || 'N/A'),
      escapeCSV(p.phone ? `="${p.phone}"` : 'N/A'),
      escapeCSV(p.email || 'N/A'),
      escapeCSV(p.address || 'N/A'),
      escapeCSV(new Date(p.created_at).toLocaleDateString('en-US')),
      escapeCSV(p.notes ? p.notes.replace(/\r?\n/g, ' | ') : 'None')
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Samuela_Dental_Patients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredAndSortedPatients.length === 0) {
      alert("No patient records available to export.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups in your browser to generate the PDF report.");
      return;
    }

    const tableRows = filteredAndSortedPatients.map(p => `
      <tr>
        <td><strong>${formatId(p.id, p.created_at)}</strong></td>
        <td>${p.name}</td>
        <td>${p.sex || 'N/A'}</td>
        <td>${p.phone || 'N/A'}</td>
        <td>${p.email || 'N/A'}</td>
        <td>${p.address || 'N/A'}</td>
        <td>${new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Samuela Dental Clinic - Patient Directory</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1f2937; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 24px; font-weight: bold; color: #0c4a6e; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th { background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #cbd5e1; text-transform: uppercase; font-size: 11px; }
          td { padding: 9px 10px; border: 1px solid #cbd5e1; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Samuela Dental Clinic</h1>
            <p class="subtitle">Master Patient Directory Report</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <p style="margin: 0;"><strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p style="margin: 4px 0 0 0;"><strong>Total Records:</strong> ${filteredAndSortedPatients.length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Full Name</th>
              <th>Sex</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsExportMenuOpen(false);
  };

  const handlePrintSinglePatient = (patient: Patient) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups in your browser to save the patient chart as PDF.");
      return;
    }

    const dentalRowsHtml = dentalChartEntries.length > 0
      ? `<table>
          <thead>
            <tr>
              <th>Tooth No.</th>
              <th>Condition</th>
              <th>Treatment</th>
              <th>Dentist's Notes</th>
              <th>Date Recorded</th>
            </tr>
          </thead>
          <tbody>
            ${dentalChartEntries.map(e => `
              <tr>
                <td><strong>#${e.toothNumber}</strong> (${e.toothName})</td>
                <td>${e.condition}</td>
                <td>${e.treatment}</td>
                <td>${e.dentistNotes}</td>
                <td>${e.date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
      : `<p style="font-size: 13px; color: #64748b; font-style: italic;">No specific tooth chart entries recorded yet.</p>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Chart - ${patient.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 35px; color: #1f2937; line-height: 1.5; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }
          .clinic-name { font-size: 22px; font-weight: bold; color: #0c4a6e; margin: 0; }
          .doc-type { font-size: 13px; color: #64748b; margin-top: 2px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; font-size: 13px; }
          .notes-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; font-family: monospace; white-space: pre-wrap; font-size: 13px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px; }
          th { background-color: #f1f5f9; color: #334155; font-weight: bold; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; }
          td { padding: 8px 10px; border: 1px solid #cbd5e1; }
          h3 { color: #0c4a6e; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="clinic-name">Samuela Dental Clinic</h1>
            <p class="doc-type">Official Patient Dental Chart & Clinical Record</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <p style="margin: 0;"><strong>Patient ID:</strong> ${formatId(patient.id, patient.created_at)}</p>
            <p style="margin: 4px 0 0 0;"><strong>Chart Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        <div class="info-grid">
          <div><strong>Patient Name:</strong> ${patient.name}</div>
          <div><strong>Sex:</strong> ${patient.sex || 'N/A'}</div>
          <div><strong>Birthdate:</strong> ${patient.birthdate || 'N/A'}</div>
          <div><strong>Phone Number:</strong> ${patient.phone || 'N/A'}</div>
          <div><strong>Email Address:</strong> ${patient.email || 'N/A'}</div>
          <div><strong>Date Registered:</strong> ${new Date(patient.created_at).toLocaleDateString('en-US')}</div>
          <div style="grid-column: span 2;"><strong>Home Address:</strong> ${patient.address || 'N/A'}</div>
        </div>

        <h3>Dental Chart (Odontogram) Records</h3>
        ${dentalRowsHtml}

        <h3>Clinical Notes & Medical History</h3>
        <div class="notes-box">${patient.notes || 'No clinical notes recorded.'}</div>

        <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <>
      <div className="fade-in">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-dental-900">Patient Directory</h1>
            <p className="text-gray-500 mt-1">Master list of all registered clinic profiles and dental charts.</p>
          </div>
           
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-dental-500 focus:ring-2 shadow-sm transition-all"
              />
            </div>

            <div className="relative w-full sm:w-40">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-dental-500 focus:ring-2 shadow-sm transition-all appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A to Z</option>
                <option value="za">Z to A</option>
              </select>
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-dental-600" /> Export <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {isExportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsExportMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-40 animate-fade-in-up divide-y divide-gray-50">
                    <button onClick={handleExportExcel} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition">
                      <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-gray-900 leading-none">Save as Excel</p>
                        <p className="text-[11px] text-gray-400 font-normal mt-0.5">Download .CSV spreadsheet</p>
                      </div>
                    </button>
                    <button onClick={handleExportPDF} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition">
                      <Printer className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <p className="text-gray-900 leading-none">Save as PDF</p>
                        <p className="text-[11px] text-gray-400 font-normal mt-0.5">Formatted directory report</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button onClick={() => setIsAddModalOpen(true)} className="bg-dental-600 hover:bg-dental-700 text-white px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
              <UserPlus className="w-4 h-4" /> Add Patient
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-4 pl-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Details</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined Date</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 pr-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-medium">Loading patients...</td></tr>
                ) : filteredAndSortedPatients.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-medium">{searchTerm ? `No patients found matching "${searchTerm}"` : "No patients registered yet."}</td></tr>
                ) : (
                  filteredAndSortedPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border text-sm ${getAvatarColors(patient.id)}`}>
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{patient.name}</p>
                            <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
                              {formatId(patient.id, patient.created_at)} 
                              {patient.sex && <span className="uppercase border border-gray-200 px-1.5 rounded bg-white">{patient.sex.charAt(0)}</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {patient.phone ? <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400"/> {patient.phone}</p> : <p className="text-sm text-gray-400 italic">No phone</p>}
                          {patient.email && <p className="text-sm text-gray-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400"/> {patient.email}</p>}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(patient.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-bold">Active</span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openProfile(patient)} className="text-sm font-semibold text-dental-600 hover:text-dental-800 bg-dental-50 hover:bg-dental-100 px-4 py-2 rounded-lg transition">View Profile</button>
                          <button onClick={() => handleDeletePatient(patient.id, patient.name)} className="text-sm font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition" title="Delete Patient"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="font-serif text-xl font-bold text-dental-900">Philippine Dental Association Chart</h3>
                <p className="text-sm text-gray-500 font-medium">New Patient Information Record</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 border border-gray-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddPatient} className="p-6 overflow-y-auto flex-1 space-y-8">
              <section>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Users className="w-5 h-5 text-dental-500" /> Patient Information Record</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label><input type="text" required value={newPatientForm.lastName} onChange={e => setNewPatientForm({...newPatientForm, lastName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label><input type="text" required value={newPatientForm.firstName} onChange={e => setNewPatientForm({...newPatientForm, firstName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Middle Name</label><input type="text" value={newPatientForm.middleName} onChange={e => setNewPatientForm({...newPatientForm, middleName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Birthdate</label><input type="date" value={newPatientForm.birthdate} onChange={e => setNewPatientForm({...newPatientForm, birthdate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none text-gray-700" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Age</label><input type="number" value={newPatientForm.age} onChange={e => setNewPatientForm({...newPatientForm, age: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Sex</label>
                      <select value={newPatientForm.sex} onChange={e => setNewPatientForm({...newPatientForm, sex: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none bg-white">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Nickname</label><input type="text" value={newPatientForm.nickname} onChange={e => setNewPatientForm({...newPatientForm, nickname: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Home Address</label><input type="text" value={newPatientForm.address} onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Occupation</label><input type="text" value={newPatientForm.occupation} onChange={e => setNewPatientForm({...newPatientForm, occupation: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Mobile No.</label><input type="tel" value={newPatientForm.phone} onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">E-mail Address</label><input type="email" value={newPatientForm.email} onChange={e => setNewPatientForm({...newPatientForm, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Reason for Consultation</label><input type="text" value={newPatientForm.reason} onChange={e => setNewPatientForm({...newPatientForm, reason: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" /></div>
                </div>
              </section>

              <div className="pt-4 border-t border-gray-100 shrink-0">
                <button type="submit" className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3.5 rounded-xl transition shadow-md">Save Patient Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Profile Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/80 shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border ${getAvatarColors(selectedPatient.id)}`}>{getInitials(selectedPatient.name)}</div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-dental-900">{selectedPatient.name}</h3>
                  <p className="text-gray-500 font-medium text-sm flex flex-wrap items-center gap-4 mt-0.5">
                    <span className="font-bold text-dental-700">{formatId(selectedPatient.id, selectedPatient.created_at)}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> {selectedPatient.phone || 'N/A'}</span>
                    {selectedPatient.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {selectedPatient.address}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePrintSinglePatient(selectedPatient)} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"><Printer className="w-4 h-4 text-dental-600" /> Save as PDF</button>
                <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 border border-gray-200 transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="px-6 bg-white border-b border-gray-100 flex gap-6 shrink-0">
              <button onClick={() => setActiveProfileTab('odontogram')} className={`py-3.5 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeProfileTab === 'odontogram' ? 'border-dental-600 text-dental-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}><Sparkles className="w-4 h-4 text-dental-600" /> Dental Chart (Odontogram)</button>
              <button onClick={() => setActiveProfileTab('records')} className={`py-3.5 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeProfileTab === 'records' ? 'border-dental-600 text-dental-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}><FileText className="w-4 h-4 text-dental-600" /> Clinical Notes & X-Ray Images</button>
            </div>
            
            {activeProfileTab === 'odontogram' ? (
              <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                    <div>
                      <h4 className="font-serif text-xl font-bold text-dental-900">Patient Dental Chart</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Interactive FDI Two-Digit Odontogram — Click any tooth to record or review its condition.</p>
                    </div>
                    <div className="flex items-center gap-8 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                      <div><span className="block text-[11px] font-semibold text-gray-400 uppercase">Patient ID</span><span className="font-bold text-sm text-gray-900">{formatId(selectedPatient.id, selectedPatient.created_at)}</span></div>
                      <div><span className="block text-[11px] font-semibold text-gray-400 uppercase">Chart Date</span><span className="font-bold text-sm text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Interactive Tooth Map (FDI System)</span>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-gray-600">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Decayed</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Filled</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Crown / RCT</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Healthy</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Missing / Extracted</span>
                      </div>
                    </div>

                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4 space-y-4 overflow-x-auto">
                      <div>
                        <p className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest mb-2">Upper Arch (Maxillary)</p>
                        <div className="flex justify-center items-center gap-1.5 min-w-[640px]">
                          <div className="flex gap-1 pr-3 border-r-2 border-dashed border-gray-300">
                            {UPPER_RIGHT_TEETH.map(t => {
                              const recorded = dentalChartEntries.find(e => e.toothNumber === t);
                              const isSelected = selectedTooth === t;
                              return (
                                <button key={t} type="button" onClick={() => handleSelectTooth(t)} className={`w-9 h-11 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition-all ${getToothBadgeStyle(recorded?.condition)} ${isSelected ? 'ring-2 ring-dental-600 ring-offset-2 scale-105 shadow-sm' : ''}`}>
                                  <span>{t}</span><span className="w-1.5 h-1.5 rounded-full mt-1 bg-current opacity-60"></span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex gap-1 pl-3">
                            {UPPER_LEFT_TEETH.map(t => {
                              const recorded = dentalChartEntries.find(e => e.toothNumber === t);
                              const isSelected = selectedTooth === t;
                              return (
                                <button key={t} type="button" onClick={() => handleSelectTooth(t)} className={`w-9 h-11 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition-all ${getToothBadgeStyle(recorded?.condition)} ${isSelected ? 'ring-2 ring-dental-600 ring-offset-2 scale-105 shadow-sm' : ''}`}>
                                  <span>{t}</span><span className="w-1.5 h-1.5 rounded-full mt-1 bg-current opacity-60"></span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200/70">
                        <div className="flex justify-center items-center gap-1.5 min-w-[640px]">
                          <div className="flex gap-1 pr-3 border-r-2 border-dashed border-gray-300">
                            {LOWER_RIGHT_TEETH.map(t => {
                              const recorded = dentalChartEntries.find(e => e.toothNumber === t);
                              const isSelected = selectedTooth === t;
                              return (
                                <button key={t} type="button" onClick={() => handleSelectTooth(t)} className={`w-9 h-11 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition-all ${getToothBadgeStyle(recorded?.condition)} ${isSelected ? 'ring-2 ring-dental-600 ring-offset-2 scale-105 shadow-sm' : ''}`}>
                                  <span className="w-1.5 h-1.5 rounded-full mb-1 bg-current opacity-60"></span><span>{t}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex gap-1 pl-3">
                            {LOWER_LEFT_TEETH.map(t => {
                              const recorded = dentalChartEntries.find(e => e.toothNumber === t);
                              const isSelected = selectedTooth === t;
                              return (
                                <button key={t} type="button" onClick={() => handleSelectTooth(t)} className={`w-9 h-11 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition-all ${getToothBadgeStyle(recorded?.condition)} ${isSelected ? 'ring-2 ring-dental-600 ring-offset-2 scale-105 shadow-sm' : ''}`}>
                                  <span className="w-1.5 h-1.5 rounded-full mb-1 bg-current opacity-60"></span><span>{t}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest mt-2">Lower Arch (Mandibular)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Tooth Details Form */}
                  <form onSubmit={handleSaveToothEntry} className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h5 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-2.5">Tooth Details</h5>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Selected tooth number</label>
                      <select value={selectedTooth} onChange={(e) => handleSelectTooth(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:ring-2 focus:ring-dental-500 outline-none">
                        {Object.entries(FDI_TEETH).map(([num, label]) => (<option key={num} value={num}>{num} – {label}</option>))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tooth condition</label>
                      <select value={toothCondition} onChange={(e) => setToothCondition(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:ring-2 focus:ring-dental-500 outline-none">
                        <option value="" disabled>-- Select condition --</option>
                        {TOOTH_CONDITIONS.map(cond => (<option key={cond} value={cond}>{cond}</option>))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Treatment</label>
                      <select value={toothTreatment} onChange={(e) => setToothTreatment(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:ring-2 focus:ring-dental-500 outline-none">
                        <option value="" disabled>-- Select treatment --</option>
                        {TOOTH_TREATMENTS.map(treat => (<option key={treat} value={treat}>{treat}</option>))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dentist's notes</label>
                      <textarea rows={3} value={dentistNotes} onChange={(e) => setDentistNotes(e.target.value)} placeholder="e.g. Caries observed; for dentist evaluation." className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:ring-2 focus:ring-dental-500 outline-none resize-none" />
                    </div>

                    <button type="submit" disabled={isSavingTooth} className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                      <CheckCircle2 className="w-4 h-4" />
                      {isSavingTooth ? 'Saving to Patient Record...' : `Save Tooth #${selectedTooth} Record`}
                    </button>
                  </form>

                  {/* Preview & History */}
                  <div className="lg:col-span-6 flex flex-col gap-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <h5 className="font-serif text-base font-bold text-gray-900 mb-3">Preview of entry</h5>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 flex items-start justify-between gap-4">
                        <div className="space-y-1.5 text-sm">
                          <p className="font-bold text-gray-900 text-base">Tooth No. {selectedTooth} <span className="text-xs font-normal text-gray-500">({FDI_TEETH[selectedTooth]})</span></p>
                          <p className="text-gray-700"><span className="font-bold text-gray-900">Treatment:</span> {toothTreatment || <span className="italic text-gray-400">None selected</span>}</p>
                          <p className="text-gray-700"><span className="font-bold text-gray-900">Notes:</span> {dentistNotes || <span className="italic text-gray-400">None provided</span>}</p>
                        </div>
                        {toothCondition ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${getConditionPillStyle(toothCondition)}`}>{toothCondition}</span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold shrink-0 bg-gray-200 text-gray-500">No Condition</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-serif text-base font-bold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-dental-600" /> Recorded Tooth History</h5>
                        <span className="text-xs font-bold text-gray-400">{dentalChartEntries.length} Teeth Charted</span>
                      </div>

                      {dentalChartEntries.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-gray-400">
                          <p className="text-sm font-medium text-gray-500">No tooth conditions recorded yet.</p>
                          <p className="text-xs mt-1">Select a tooth above and click Save to log findings.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {dentalChartEntries.map(entry => (
                            <div key={entry.id} onClick={() => handleSelectTooth(entry.toothNumber)} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-dental-200 transition cursor-pointer flex items-start justify-between gap-3">
                              <div className="space-y-0.5 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-dental-900">Tooth #{entry.toothNumber}</span>
                                  <span className="text-gray-500 font-medium">({entry.toothName})</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getConditionPillStyle(entry.condition)}`}>{entry.condition}</span>
                                </div>
                                <p className="text-gray-700 font-medium">Treatment: {entry.treatment}</p>
                                <p className="text-gray-500">{entry.dentistNotes}</p>
                                <p className="text-[10px] text-gray-400 pt-0.5">{entry.date}</p>
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteToothEntry(entry.toothNumber); }} className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition" title="Remove tooth entry"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto bg-gray-50 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-dental-500" /> Clinical Notes</h4>
                    {!isEditingNotes ? (
                      <button onClick={() => setIsEditingNotes(true)} className="text-sm font-semibold text-dental-600 hover:text-dental-800 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit Notes</button>
                    ) : (
                      <button onClick={handleSaveNotes} disabled={isSavingNotes} className="text-sm font-semibold text-green-600 hover:text-green-800 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-md"><Save className="w-3 h-3" /> {isSavingNotes ? 'Saving...' : 'Save Notes'}</button>
                    )}
                  </div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[300px]">
                    {isEditingNotes ? (
                      <textarea value={editedNotes} onChange={(e) => setEditedNotes(e.target.value)} placeholder="Enter clinical notes..." className="w-full h-full flex-1 p-4 outline-none resize-none text-sm text-gray-700 bg-yellow-50/30 focus:bg-white transition-colors font-mono" />
                    ) : (
                      <div className="w-full h-full flex-1 p-4 text-sm text-gray-700 whitespace-pre-wrap overflow-y-auto font-mono">
                        {selectedPatient.notes ? selectedPatient.notes : <span className="text-gray-400 italic font-sans">No clinical notes recorded yet. Click 'Edit Notes' to add history.</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-dental-500" /> Records & Images</h4>
                    <label className={`cursor-pointer bg-dental-600 hover:bg-dental-700 text-white px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-2 text-xs shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className="w-3 h-3" /> {isUploading ? 'Uploading...' : 'Upload'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                    </label>
                  </div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm overflow-y-auto min-h-[300px]">
                    {patientImages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No images uploaded.</p>
                        <p className="text-gray-400 text-xs mt-1">Upload x-rays or procedure photos here.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {patientImages.map(img => (
                          <div key={img.id} className="group relative aspect-square bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <img src={img.image_url} alt="Medical record" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}