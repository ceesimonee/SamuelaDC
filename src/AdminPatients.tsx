import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Search, Phone, Calendar, ArrowRight, X, Upload, Image as ImageIcon, 
  UserPlus, Users, Mail, FileText, Edit2, Save, Filter, MapPin, Heart, Activity, Trash2
} from 'lucide-react';

// Define the patient data structure
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

export default function AdminPatients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // PDA-Style Add Patient Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ 
    firstName: '', lastName: '', middleName: '', 
    birthdate: '', age: '', sex: '', religion: '', nationality: '', nickname: '',
    address: '', phone: '', email: '', occupation: '', reason: '',
    previousDentist: '', lastVisit: '',
    physician: '', bloodType: '', bloodPressure: '', allergies: '', conditions: ''
  });

  // Profile Modal State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Notes Edit State 
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // 1. Fetch Patients on Load
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*');

    if (data && !error) {
      setPatients(data);
    }
    setIsLoading(false);
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientForm.lastName.trim() || !newPatientForm.firstName.trim()) {
      alert("First and Last name are required.");
      return;
    }

    // Format Name: Last, First Middle
    const fullName = `${newPatientForm.lastName}, ${newPatientForm.firstName} ${newPatientForm.middleName}`.trim();

    // Auto-compile Medical & Dental History into the Notes field
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
Medical Conditions: ${newPatientForm.conditions || 'None reported'}
    `;

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
      // Reset form
      setNewPatientForm({ 
        firstName: '', lastName: '', middleName: '', birthdate: '', age: '', sex: '', religion: '', nationality: '', nickname: '',
        address: '', phone: '', email: '', occupation: '', reason: '',
        previousDentist: '', lastVisit: '', physician: '', bloodType: '', bloodPressure: '', allergies: '', conditions: ''
      }); 
    } else {
      alert("Error adding patient: " + (error?.message || "Unknown error"));
    }
  };

  // ─── NEW: Delete Patient Logic ───
  const handleDeletePatient = async (id: number, name: string) => {
    // 1. Ask for confirmation to prevent accidental deletes
    if (!window.confirm(`Are you sure you want to delete the record for ${name}? This action cannot be undone.`)) {
      return;
    }

    // 2. Delete from Supabase Database
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (!error) {
      // 3. Update the UI instantly by filtering out the deleted patient
      setPatients(patients.filter(p => p.id !== id));
      
      // Safety check: close modal if they somehow deleted the patient they are viewing
      if (selectedPatient?.id === id) {
        setSelectedPatient(null);
      }
    } else {
      alert("Error deleting patient: " + error.message);
    }
  };

  // Save Notes Logic
  const handleSaveNotes = async () => {
    if (!selectedPatient) return;
    setIsSavingNotes(true);

    const { error } = await supabase
      .from('patients')
      .update({ notes: editedNotes })
      .eq('id', selectedPatient.id);

    if (!error) {
      setPatients(patients.map(p => p.id === selectedPatient.id ? { ...p, notes: editedNotes } : p));
      setSelectedPatient({ ...selectedPatient, notes: editedNotes });
      setIsEditingNotes(false);
    } else {
      alert("Error saving notes: " + error.message);
    }
    
    setIsSavingNotes(false);
  };

  // Fetch Images
  const fetchPatientImages = async (patientId: number) => {
    const { data, error } = await supabase
      .from('patient-images')
      .select('*')
      .eq('patient_id', patientId)
      .order('id', { ascending: false });

    if (data && !error) {
      setPatientImages(data);
    }
  };

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient) return;

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedPatient.id}-${Date.now()}.${fileExt}`;
      const filePath = `records/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-records')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('medical-records')
        .getPublicUrl(filePath);

      const { data: dbData, error: dbError } = await supabase
        .from('patient-images') 
        .insert([{ patient_id: selectedPatient.id, image_url: publicUrl }])
        .select()
        .single();

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
    setEditedNotes(patient.notes || ''); 
    setIsEditingNotes(false);
    setPatientImages([]); 
    fetchPatientImages(patient.id);
  };

  // Helper functions
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

  // Sorting & Filtering Logic
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

  return (
    <>
      <div className="fade-in">
        
        {/* ── Page Header & Controls ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-dental-900">Patient Directory</h1>
            <p className="text-gray-500 mt-1">Master list of all registered clinic profiles.</p>
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

            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-dental-600 hover:bg-dental-700 text-white px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" /> Add Patient
            </button>
          </div>
        </div>

        {/* ── Patient Table ── */}
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
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500 font-medium">Loading patients...</td>
                  </tr>
                ) : filteredAndSortedPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500 font-medium">
                      {searchTerm ? `No patients found matching "${searchTerm}"` : "No patients registered yet."}
                    </td>
                  </tr>
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
                          {patient.phone ? (
                            <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400"/> {patient.phone}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No phone</p>
                          )}
                          {patient.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400"/> {patient.email}</p>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(patient.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-bold">
                          Active
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        {/* Action Buttons: View Profile & Delete */}
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openProfile(patient)}
                            className="text-sm font-semibold text-dental-600 hover:text-dental-800 bg-dental-50 hover:bg-dental-100 px-4 py-2 rounded-lg transition"
                          >
                            View Profile
                          </button>
                          <button 
                            onClick={() => handleDeletePatient(patient.id, patient.name)}
                            className="text-sm font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition"
                            title="Delete Patient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ── PDA-STYLE ADD PATIENT MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="font-serif text-xl font-bold text-dental-900">Philippine Dental Association Chart</h3>
                <p className="text-sm text-gray-500 font-medium">New Patient Information Record</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 border border-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddPatient} className="p-6 overflow-y-auto flex-1 space-y-8">
              
              {/* SECTION 1: Patient Information */}
              <section>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Users className="w-5 h-5 text-dental-500" /> Patient Information Record
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                    <input type="text" required value={newPatientForm.lastName} onChange={e => setNewPatientForm({...newPatientForm, lastName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                    <input type="text" required value={newPatientForm.firstName} onChange={e => setNewPatientForm({...newPatientForm, firstName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Middle Name</label>
                    <input type="text" value={newPatientForm.middleName} onChange={e => setNewPatientForm({...newPatientForm, middleName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Birthdate</label>
                    <input type="date" value={newPatientForm.birthdate} onChange={e => setNewPatientForm({...newPatientForm, birthdate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none text-gray-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Age</label>
                      <input type="number" value={newPatientForm.age} onChange={e => setNewPatientForm({...newPatientForm, age: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Sex</label>
                      <select value={newPatientForm.sex} onChange={e => setNewPatientForm({...newPatientForm, sex: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none bg-white">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nickname</label>
                    <input type="text" value={newPatientForm.nickname} onChange={e => setNewPatientForm({...newPatientForm, nickname: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Home Address</label>
                    <input type="text" value={newPatientForm.address} onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Occupation</label>
                    <input type="text" value={newPatientForm.occupation} onChange={e => setNewPatientForm({...newPatientForm, occupation: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mobile No.</label>
                    <input type="tel" value={newPatientForm.phone} onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">E-mail Address</label>
                    <input type="email" value={newPatientForm.email} onChange={e => setNewPatientForm({...newPatientForm, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Consultation</label>
                    <input type="text" value={newPatientForm.reason} onChange={e => setNewPatientForm({...newPatientForm, reason: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                </div>
              </section>

              {/* SECTION 2: Dental History */}
              <section>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ImageIcon className="w-5 h-5 text-purple-500" /> Dental History
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Previous Dentist</label>
                    <input type="text" placeholder="Dr. Name" value={newPatientForm.previousDentist} onChange={e => setNewPatientForm({...newPatientForm, previousDentist: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Last Dental Visit</label>
                    <input type="date" value={newPatientForm.lastVisit} onChange={e => setNewPatientForm({...newPatientForm, lastVisit: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none text-gray-700" />
                  </div>
                </div>
              </section>

              {/* SECTION 3: Medical History Overview */}
              <section>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Activity className="w-5 h-5 text-red-500" /> Medical History Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Name of Physician</label>
                    <input type="text" value={newPatientForm.physician} onChange={e => setNewPatientForm({...newPatientForm, physician: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Blood Type</label>
                    <input type="text" placeholder="e.g. O+" value={newPatientForm.bloodType} onChange={e => setNewPatientForm({...newPatientForm, bloodType: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Blood Pressure</label>
                    <input type="text" placeholder="e.g. 120/80" value={newPatientForm.bloodPressure} onChange={e => setNewPatientForm({...newPatientForm, bloodPressure: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Allergies (Anesthetic, Penicillin, Latex, etc.)</label>
                    <input type="text" placeholder="List any known allergies..." value={newPatientForm.allergies} onChange={e => setNewPatientForm({...newPatientForm, allergies: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Existing Medical Conditions / Current Medications</label>
                    <textarea rows={3} placeholder="Heart disease, Diabetes, Asthma, Pregnancy, Bleeding problems, etc." value={newPatientForm.conditions} onChange={e => setNewPatientForm({...newPatientForm, conditions: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none resize-none"></textarea>
                    <p className="text-[10px] text-gray-400 mt-1 italic">This data will be compiled securely into the patient's Clinical Notes for quick reference.</p>
                  </div>
                </div>
              </section>

              <div className="pt-4 border-t border-gray-100 shrink-0">
                <button type="submit" className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3.5 rounded-xl transition shadow-md">
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Patient Profile & Medical Records Modal ── */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border ${getAvatarColors(selectedPatient.id)}`}>
                  {getInitials(selectedPatient.name)}
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-dental-900">{selectedPatient.name}</h3>
                  <p className="text-gray-500 font-medium text-sm flex items-center gap-4">
                    <span>{formatId(selectedPatient.id, selectedPatient.created_at)}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {selectedPatient.phone || 'N/A'}</span>
                    {selectedPatient.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {selectedPatient.address}</span>}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 border border-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* ── LEFT COLUMN: CLINICAL NOTES ── */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-dental-500" /> Clinical Notes
                  </h4>
                  {!isEditingNotes ? (
                    <button 
                      onClick={() => setIsEditingNotes(true)}
                      className="text-sm font-semibold text-dental-600 hover:text-dental-800 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Notes
                    </button>
                  ) : (
                    <button 
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="text-sm font-semibold text-green-600 hover:text-green-800 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-md"
                    >
                      <Save className="w-3 h-3" /> {isSavingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[300px]">
                  {isEditingNotes ? (
                    <textarea 
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Enter last service date, treatments performed, allergies, or any relevant medical history..."
                      className="w-full h-full flex-1 p-4 outline-none resize-none text-sm text-gray-700 bg-yellow-50/30 focus:bg-white transition-colors font-mono"
                    />
                  ) : (
                    <div className="w-full h-full flex-1 p-4 text-sm text-gray-700 whitespace-pre-wrap overflow-y-auto font-mono">
                      {selectedPatient.notes ? (
                        selectedPatient.notes
                      ) : (
                        <span className="text-gray-400 italic font-sans">No clinical notes recorded yet. Click 'Edit Notes' to add history.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT COLUMN: MEDICAL IMAGES ── */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-dental-500" /> Records & Images
                  </h4>
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
                          <img 
                            src={img.image_url} 
                            alt="Medical record" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/10 transition-colors"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}