import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Search, Phone, Calendar, X, Upload, Image as ImageIcon, 
  UserPlus, Users, Mail, FileText, Edit2, Filter, MapPin, Activity, Trash2,
  Download, FileSpreadsheet, Printer, ChevronDown, Sparkles, CheckCircle2, Clock,
  FolderOpen, PlusCircle, Eye
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

type PatientFileRecord = {
  id: string;
  fileName: string;
  updateType: 'Initial Record' | 'New PDA Chart' | 'Updated History' | 'Odontogram Update';
  summaryTitle: string;
  summarySubtitle: string;
  dateCreated: string;
  snapshotNotes: string;
  snapshotTeeth: DentalChartEntry[];
};

const FDI_TEETH: { [key: string]: string } = {
  '18': 'Upper right third molar', '17': 'Upper right second molar', '16': 'Upper right first molar', '15': 'Upper right second premolar',
  '14': 'Upper right first premolar', '13': 'Upper right canine', '12': 'Upper right lateral incisor', '11': 'Upper right central incisor',
  '21': 'Upper left central incisor', '22': 'Upper left lateral incisor', '23': 'Upper left canine', '24': 'Upper left first premolar',
  '25': 'Upper left second premolar', '26': 'Upper left first molar', '27': 'Upper left second molar', '28': 'Upper left third molar',
  '38': 'Lower left third molar', '37': 'Lower left second molar', '36': 'Lower left first molar', '35': 'Lower left second premolar',
  '34': 'Lower left first premolar', '33': 'Lower left canine', '32': 'Lower left lateral incisor', '31': 'Lower left central incisor',
  '48': 'Lower right third molar', '47': 'Lower right second molar', '46': 'Lower right first molar', '45': 'Lower right second premolar',
  '44': 'Lower right first premolar', '43': 'Lower right canine', '42': 'Lower right lateral incisor', '41': 'Lower right central incisor',
};

const UPPER_RIGHT_TEETH = ['18', '17', '16', '15', '14', '13', '12', '11'];
const UPPER_LEFT_TEETH  = ['21', '22', '23', '24', '25', '26', '27', '28'];
const LOWER_RIGHT_TEETH = ['48', '47', '46', '45', '44', '43', '42', '41'];
const LOWER_LEFT_TEETH  = ['31', '32', '33', '34', '35', '36', '37', '38'];

const TOOTH_CONDITIONS = ['Decayed', 'Healthy', 'Filled or restored', 'Missing', 'Extracted', 'Crown or root canal treated'];
const TOOTH_TREATMENTS = ['Dental filling', 'Tooth extraction', 'Cleaning & Prophylaxis', 'Root canal treatment', 'Crown / Bridge installation', 'Pit & Fissure Sealant', 'Fluoride Application', 'Observation / Evaluation only'];

const EMPTY_PDA_FORM = {
  firstName: '', lastName: '', middleName: '', birthdate: '', age: '', sex: '', religion: '', nationality: '', nickname: '',
  address: '', phone: '', email: '', occupation: '', reason: '', previousDentist: '', lastVisit: '',
  physician: '', bloodType: '', bloodPressure: '', allergies: '', conditions: ''
};

export default function AdminPatients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pdaModalMode, setPdaModalMode] = useState<'add' | 'edit_history' | 'new_chart'>('add');
  const [newPatientForm, setNewPatientForm] = useState(EMPTY_PDA_FORM);
  const [isSavingPda, setIsSavingPda] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'odontogram' | 'records'>('odontogram');
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [dentalChartEntries, setDentalChartEntries] = useState<DentalChartEntry[]>([]);
  const [selectedTooth, setSelectedTooth] = useState('11');
  const [toothCondition, setToothCondition] = useState('');
  const [toothTreatment, setToothTreatment] = useState('');
  const [dentistNotes, setDentistNotes] = useState('');
  const [isSavingTooth, setIsSavingTooth] = useState(false);

  const [patientFileRecords, setPatientFileRecords] = useState<PatientFileRecord[]>([]);
  
  // 👉 NEW: State for opening a specific file card to view its clean contents
  const [viewingFileRecord, setViewingFileRecord] = useState<PatientFileRecord | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('patients').select('*');
    if (data && !error) setPatients(data);
    setIsLoading(false);
  };

  const getPatientLastName = (fullName: string) => {
    if (!fullName) return 'Patient';
    if (fullName.includes(',')) return fullName.split(',')[0].trim().replace(/\s+/g, '_');
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1].replace(/\s+/g, '_');
  };

  const parseDentalEntriesFromNotes = (notes: string | null): DentalChartEntry[] => {
    if (!notes) return [];
    const lines = notes.split('\n');
    const parsed: DentalChartEntry[] = [];
    const regex = /^\[DENTAL CHART - (.*?)\] Tooth #(\d+) \((.*?)\): Condition: (.*?) \| Treatment: (.*?) \| Notes: (.*)$/;
    lines.forEach((line, idx) => {
      const match = line.trim().match(regex);
      if (match) {
        parsed.unshift({ id: `parsed-${idx}-${Date.now()}`, date: match[1], toothNumber: match[2], toothName: match[3], condition: match[4], treatment: match[5], dentistNotes: match[6] });
      }
    });
    return parsed;
  };

  const loadPatientDentalChart = (patient: Patient): DentalChartEntry[] => {
    const saved = localStorage.getItem(`samuela_dental_chart_${patient.id}`);
    const fromNotes = parseDentalEntriesFromNotes(patient.notes);
    if (saved) {
      try {
        const parsedSaved: DentalChartEntry[] = JSON.parse(saved);
        if (parsedSaved.length >= fromNotes.length) {
          setDentalChartEntries(parsedSaved);
          return parsedSaved;
        }
      } catch {}
    }
    setDentalChartEntries(fromNotes);
    if (fromNotes.length > 0) localStorage.setItem(`samuela_dental_chart_${patient.id}`, JSON.stringify(fromNotes));
    return fromNotes;
  };

  const loadPatientFileHistory = (patient: Patient, currentTeeth: DentalChartEntry[]) => {
    const storageKey = `samuela_patient_files_${patient.id}`;
    const savedFiles = localStorage.getItem(storageKey);
    if (savedFiles) {
      try {
        const parsed: PatientFileRecord[] = JSON.parse(savedFiles);
        if (parsed.length > 0) {
          setPatientFileRecords(parsed);
          return;
        }
      } catch {}
    }
    const lastName = getPatientLastName(patient.name);
    const createdDateFormatted = new Date(patient.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dateSlug = createdDateFormatted.replace(/[\s,]+/g, '_');
    const reasonMatch = patient.notes?.match(/Reason for Consultation:\s*([^\n]+)/);
    const initialReason = reasonMatch ? reasonMatch[1].trim() : 'Initial Intake';

    const initialCard: PatientFileRecord = {
      id: `init-${patient.id}`,
      fileName: `${lastName}_Initial_Record_${dateSlug}.pdf`,
      updateType: 'Initial Record',
      summaryTitle: `Consultation: ${initialReason}`,
      summarySubtitle: 'Initial PDA Medical & Dental History Chart',
      dateCreated: createdDateFormatted,
      snapshotNotes: patient.notes || '',
      snapshotTeeth: currentTeeth
    };

    const initialList = [initialCard];
    setPatientFileRecords(initialList);
    localStorage.setItem(storageKey, JSON.stringify(initialList));
  };

  const appendNewPatientFileCard = (patient: Patient, updateType: PatientFileRecord['updateType'], typeLabelForFile: string, summaryTitle: string, summarySubtitle: string, snapshotNotes: string, snapshotTeeth: DentalChartEntry[]) => {
    const storageKey = `samuela_patient_files_${patient.id}`;
    const lastName = getPatientLastName(patient.name);
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateSlug = dateFormatted.replace(/[\s,]+/g, '_');

    const newFileCard: PatientFileRecord = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fileName: `${lastName}_${typeLabelForFile}_${dateSlug}.pdf`,
      updateType,
      summaryTitle,
      summarySubtitle,
      dateCreated: `${dateFormatted} at ${timeFormatted}`,
      snapshotNotes,
      snapshotTeeth
    };

    const existingRaw = localStorage.getItem(storageKey);
    let existingList: PatientFileRecord[] = existingRaw ? JSON.parse(existingRaw) : [...patientFileRecords];
    const updatedList = [newFileCard, ...existingList];
    setPatientFileRecords(updatedList);
    localStorage.setItem(storageKey, JSON.stringify(updatedList));
  };

  const handleSelectTooth = (toothNum: string) => {
    setSelectedTooth(toothNum);
    setToothCondition('');
    setToothTreatment('');
    setDentistNotes('');
  };

  const handleSaveToothEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!toothCondition || !toothTreatment) { alert("Please select both a condition and treatment."); return; }
    setIsSavingTooth(true);

    const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const newEntry: DentalChartEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      toothNumber: selectedTooth,
      toothName: FDI_TEETH[selectedTooth] || `Tooth ${selectedTooth}`,
      condition: toothCondition,
      treatment: toothTreatment,
      dentistNotes: dentistNotes.trim() || 'No additional notes.',
      date: todayFormatted
    };

    const updatedEntries = [newEntry, ...dentalChartEntries];
    setDentalChartEntries(updatedEntries);
    localStorage.setItem(`samuela_dental_chart_${selectedPatient.id}`, JSON.stringify(updatedEntries));

    const chartLogLine = `\n[DENTAL CHART - ${todayFormatted}] Tooth #${selectedTooth} (${FDI_TEETH[selectedTooth]}): Condition: ${toothCondition} | Treatment: ${toothTreatment} | Notes: ${newEntry.dentistNotes}`;
    const updatedNotesText = (selectedPatient.notes ? selectedPatient.notes.trimEnd() + '\n' : '') + chartLogLine;

    const { error } = await supabase.from('patients').update({ notes: updatedNotesText }).eq('id', selectedPatient.id);
    if (!error) {
      const updatedPatient = { ...selectedPatient, notes: updatedNotesText };
      setPatients(patients.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      setSelectedPatient(updatedPatient);

      appendNewPatientFileCard(
        updatedPatient, 'Odontogram Update', `Tooth_${selectedTooth}_Chart`,
        `Tooth #${selectedTooth} (${toothCondition}) - ${toothTreatment}`,
        newEntry.dentistNotes, updatedNotesText, updatedEntries
      );

      setToothCondition(''); setToothTreatment(''); setDentistNotes('');
    } else {
      alert("Error saving tooth record: " + error.message);
    }
    setIsSavingTooth(false);
  };

  const handleDeleteToothEntry = async (entryId: string) => {
    if (!selectedPatient) return;
    const filtered = dentalChartEntries.filter(item => item.id !== entryId);
    setDentalChartEntries(filtered);
    localStorage.setItem(`samuela_dental_chart_${selectedPatient.id}`, JSON.stringify(filtered));
  };

  const parsePatientToPdaForm = (patient: Patient) => {
    let lastName = ''; let firstName = ''; let middleName = '';
    if (patient.name.includes(',')) {
      const [last, rest] = patient.name.split(',');
      lastName = last.trim();
      const restParts = rest.trim().split(' ');
      firstName = restParts[0] || '';
      middleName = restParts.slice(1).join(' ') || '';
    } else {
      const parts = patient.name.trim().split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    const notes = patient.notes || '';
    const extractLastField = (regex: RegExp) => {
      const matches = Array.from(notes.matchAll(regex));
      if (matches.length === 0) return '';
      const val = (matches[matches.length - 1][1] || '').trim();
      return ['None provided', 'N/A', 'None', 'Unknown', 'None reported'].includes(val) ? '' : val;
    };

    return {
      lastName, firstName, middleName, birthdate: patient.birthdate || '', sex: patient.sex || '', address: patient.address || '',
      phone: patient.phone || '', email: patient.email || '',
      age: extractLastField(/Age:\s*([^\n|]+)/g),
      nickname: extractLastField(/Nickname:\s*([^\n|]+)/g),
      religion: extractLastField(/Religion:\s*([^\n|]+)/g),
      nationality: extractLastField(/Nationality:\s*([^\n|]+)/g),
      occupation: extractLastField(/Occupation:\s*([^\n]+)/g),
      reason: '', // Leave blank for fresh chart entries
      previousDentist: extractLastField(/Previous Dentist:\s*([^\n]+)/g),
      lastVisit: extractLastField(/Last Dental Visit:\s*([^\n]+)/g),
      physician: extractLastField(/Physician:\s*([^\n]+)/g),
      bloodType: extractLastField(/Blood Type:\s*([^\n|]+)/g),
      bloodPressure: '', // Leave blank for fresh entries
      allergies: extractLastField(/Allergies:\s*([^\n]+)/g),
      conditions: '', // Leave blank for fresh entries
    };
  };

  const openAddNewPatientModal = () => {
    setPdaModalMode('add');
    setNewPatientForm(EMPTY_PDA_FORM);
    setIsAddModalOpen(true);
  };

  const openNewPdaChartForPatient = (patient: Patient) => {
    setPdaModalMode('new_chart');
    setNewPatientForm(parsePatientToPdaForm(patient));
    setIsAddModalOpen(true);
  };

  const openEditHistoryModal = (patient: Patient) => {
    setPdaModalMode('edit_history');
    setNewPatientForm(parsePatientToPdaForm(patient));
    setIsAddModalOpen(true);
  };

  const buildIntakeBlock = (headerTitle: string) => {
    return `--- ${headerTitle} ---
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
  };

  const handleSavePdaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientForm.lastName.trim() || !newPatientForm.firstName.trim()) { alert("First and Last name are required."); return; }
    setIsSavingPda(true);

    const fullName = `${newPatientForm.lastName.trim()}, ${newPatientForm.firstName.trim()} ${newPatientForm.middleName.trim()}`.trim();
    const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    if (pdaModalMode === 'add') {
      const intakeNotes = buildIntakeBlock('INITIAL INTAKE INFORMATION');
      const { data, error } = await supabase.from('patients').insert([{ name: fullName, email: newPatientForm.email || null, phone: newPatientForm.phone || null, address: newPatientForm.address || null, birthdate: newPatientForm.birthdate || null, sex: newPatientForm.sex || null, notes: intakeNotes }]).select().single();
      
      if (data && !error) {
        setPatients([data, ...patients]);
        const initCard: PatientFileRecord = {
          id: `init-${data.id}`,
          fileName: `${getPatientLastName(data.name)}_Initial_Record_${todayFormatted.replace(/[\s,]+/g, '_')}.pdf`,
          updateType: 'Initial Record',
          summaryTitle: `Consultation: ${newPatientForm.reason || 'Initial Intake'}`,
          summarySubtitle: `Conditions: ${newPatientForm.conditions || 'None reported'}`,
          dateCreated: todayFormatted,
          snapshotNotes: intakeNotes,
          snapshotTeeth: []
        };
        localStorage.setItem(`samuela_patient_files_${data.id}`, JSON.stringify([initCard]));
        setIsAddModalOpen(false); setNewPatientForm(EMPTY_PDA_FORM); 
      }
    } else if (selectedPatient && pdaModalMode === 'edit_history') {
      const updatedNotes = buildIntakeBlock(`UPDATED INTAKE INFORMATION (${todayFormatted})`);
      const { data, error } = await supabase.from('patients').update({ name: fullName, email: newPatientForm.email || null, phone: newPatientForm.phone || null, address: newPatientForm.address || null, birthdate: newPatientForm.birthdate || null, sex: newPatientForm.sex || null, notes: updatedNotes }).eq('id', selectedPatient.id).select().single();
      
      if (data && !error) {
        setPatients(patients.map(p => p.id === selectedPatient.id ? data : p));
        setSelectedPatient(data);
        appendNewPatientFileCard(data, 'Updated History', 'Updated_History', `Updated History: ${newPatientForm.reason || 'General Update'}`, `Medical: ${newPatientForm.conditions || 'None'}`, updatedNotes, dentalChartEntries);
        setIsAddModalOpen(false);
      }
    } else if (selectedPatient && pdaModalMode === 'new_chart') {
      const newChartBlock = buildIntakeBlock(`PDA CHART ENTRY - ${todayFormatted}`);
      const { data, error } = await supabase.from('patients').update({ name: fullName, email: newPatientForm.email || null, phone: newPatientForm.phone || null, address: newPatientForm.address || null, birthdate: newPatientForm.birthdate || null, sex: newPatientForm.sex || null, notes: newChartBlock }).eq('id', selectedPatient.id).select().single();
      
      if (data && !error) {
        setPatients(patients.map(p => p.id === selectedPatient.id ? data : p));
        setSelectedPatient(data);
        appendNewPatientFileCard(data, 'New PDA Chart', 'New_PDA_Chart', `New PDA Chart: ${newPatientForm.reason || 'Follow-Up'}`, `BP: ${newPatientForm.bloodPressure || 'N/A'} | Conditions: ${newPatientForm.conditions || 'None'}`, newChartBlock, dentalChartEntries);
        setIsAddModalOpen(false);
      }
    }
    setIsSavingPda(false);
  };

  const handleDeleteFileCard = (fileId: string) => {
    if (!selectedPatient) return;
    if (patientFileRecords.length <= 1) { alert("At least one record file must remain."); return; }
    const updated = patientFileRecords.filter(f => f.id !== fileId);
    setPatientFileRecords(updated);
    localStorage.setItem(`samuela_patient_files_${selectedPatient.id}`, JSON.stringify(updated));
  };

  // 👉 NEW: Delete Image File
  const handleDeleteImage = async (imageId: number, imagePath: string) => {
    if (!window.confirm("Delete this attached file? This cannot be undone.")) return;
    try {
      // If it's a Supabase URL, extract filename and delete from storage
      if (imagePath.includes('supabase.co')) {
        const urlParts = imagePath.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from('medical-records').remove([`records/${fileName}`]);
        await supabase.from('patient-images').delete().eq('id', imageId);
      }
      
      // Update state
      const updated = patientImages.filter(img => img.id !== imageId);
      setPatientImages(updated);
      
      // Update local storage if it was a local fallback
      if (selectedPatient) {
        localStorage.setItem(`samuela_local_images_${selectedPatient.id}`, JSON.stringify(updated.filter(img => !img.image_url.includes('supabase.co'))));
      }
    } catch (err: any) {
      alert("Error deleting file: " + err.message);
    }
  };

  const fetchPatientImages = async (patientId: number) => {
    const localRaw = localStorage.getItem(`samuela_local_images_${patientId}`);
    const localImgs: PatientImage[] = localRaw ? JSON.parse(localRaw) : [];

    const { data, error } = await supabase.from('patient-images').select('*').eq('patient_id', patientId).order('id', { ascending: false });
    if (data && !error) {
      const combined = [...data, ...localImgs.filter(l => !data.some(d => d.image_url === l.image_url))];
      setPatientImages(combined);
    } else {
      setPatientImages(localImgs);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient) return;
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedPatient.id}-${Date.now()}.${fileExt}`;
      const filePath = `records/${fileName}`;
      let finalImageUrl = '';

      const { error: uploadError } = await supabase.storage.from('medical-records').upload(filePath, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('medical-records').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      } else {
        finalImageUrl = await fileToDataUrl(file);
      }

      const { data: dbData, error: dbError } = await supabase.from('patient-images').insert([{ patient_id: selectedPatient.id, image_url: finalImageUrl }]).select().single();
      if (!dbError && dbData) {
        setPatientImages(prev => [dbData, ...prev]);
      } else {
        const fallbackImg: PatientImage = { id: Date.now(), patient_id: selectedPatient.id, image_url: finalImageUrl };
        const updatedImgs = [fallbackImg, ...patientImages];
        setPatientImages(updatedImgs);
        localStorage.setItem(`samuela_local_images_${selectedPatient.id}`, JSON.stringify(updatedImgs));
      }
    } catch (error: any) {
      alert('Error attaching file: ' + error.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const getToothBadgeStyle = (condition?: string) => {
    switch (condition) {
      case 'Decayed': return 'bg-red-100 text-red-700 border-red-300';
      case 'Filled or restored': return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'Missing': case 'Extracted': return 'bg-gray-200 text-gray-500 border-gray-300 line-through';
      case 'Crown or root canal treated': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Healthy': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      default: return 'bg-white text-gray-700 border-gray-200 hover:border-dental-400';
    }
  };

  const getConditionPillStyle = (condition: string) => {
    switch (condition) {
      case 'Decayed': return 'bg-red-100 text-red-700';
      case 'Filled or restored': return 'bg-sky-100 text-sky-700';
      case 'Missing': case 'Extracted': return 'bg-gray-200 text-gray-700';
      case 'Crown or root canal treated': return 'bg-purple-100 text-purple-700';
      case 'Healthy': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const openProfile = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveProfileTab('odontogram');
    setPatientImages([]); 
    fetchPatientImages(patient.id);
    const loadedTeeth = loadPatientDentalChart(patient);
    loadPatientFileHistory(patient, loadedTeeth);
    setSelectedTooth('11'); setToothCondition(''); setToothTreatment(''); setDentistNotes('');
  };

  const handleDeletePatient = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (!error) {
      setPatients(patients.filter(p => p.id !== id));
      localStorage.removeItem(`samuela_dental_chart_${id}`);
      localStorage.removeItem(`samuela_patient_files_${id}`);
      localStorage.removeItem(`samuela_local_images_${id}`);
      if (selectedPatient?.id === id) setSelectedPatient(null);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.replace(',', '').split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  const formatId = (id: number, dateStr: string) => `PT-${new Date(dateStr).getFullYear()}-${String(id).padStart(3, '0')}`;
  const getAvatarColors = (id: number) => {
    const colors = ['bg-dental-100 text-dental-600 border-dental-200', 'bg-purple-100 text-purple-600 border-purple-200', 'bg-accent-100 text-accent-700 border-accent-200', 'bg-green-100 text-green-700 border-green-200'];
    return colors[id % colors.length];
  };

  const filteredAndSortedPatients = patients
    .filter(patient => patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || formatId(patient.id, patient.created_at).toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      if (sortBy === 'za') return b.name.localeCompare(a.name);
      return 0;
    });

  const handleExportExcel = () => {
    if (filteredAndSortedPatients.length === 0) return alert("No patient records.");
    const headers = ['Patient ID', 'Full Name', 'Sex', 'Birthdate', 'Phone Number', 'Email Address', 'Home Address', 'Registered Date'];
    const escapeCSV = (val: string | null | undefined) => val ? `"${String(val).replace(/"/g, '""')}"` : '""';
    const rows = filteredAndSortedPatients.map(p => [
      escapeCSV(formatId(p.id, p.created_at)), escapeCSV(p.name), escapeCSV(p.sex || 'N/A'), escapeCSV(p.birthdate || 'N/A'), escapeCSV(p.phone ? `="${p.phone}"` : 'N/A'), escapeCSV(p.email || 'N/A'), escapeCSV(p.address || 'N/A'), escapeCSV(new Date(p.created_at).toLocaleDateString('en-US'))
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', `Samuela_Patients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link); setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredAndSortedPatients.length === 0) return alert("No records.");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Allow pop-ups to generate PDF.");
    const tableRows = filteredAndSortedPatients.map(p => `<tr><td><strong>${formatId(p.id, p.created_at)}</strong></td><td>${p.name}</td><td>${p.sex || 'N/A'}</td><td>${p.phone || 'N/A'}</td><td>${p.email || 'N/A'}</td><td>${p.address || 'N/A'}</td><td>${new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>`).join('');
    printWindow.document.write(`<html><head><title>Samuela Dental Clinic - Patient Directory</title><style>body { font-family: sans-serif; padding: 30px; color: #1f2937; } table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; } th { background-color: #f1f5f9; text-align: left; padding: 10px; border: 1px solid #cbd5e1; } td { padding: 9px 10px; border: 1px solid #cbd5e1; }</style></head><body><h2>Samuela Dental Clinic</h2><p>Master Patient Directory Report</p><table><thead><tr><th>Patient ID</th><th>Full Name</th><th>Sex</th><th>Phone</th><th>Email</th><th>Address</th><th>Joined Date</th></tr></thead><tbody>${tableRows}</tbody></table><script>window.onload=function(){setTimeout(function(){window.print();},250);};</script></body></html>`);
    printWindow.document.close(); setIsExportMenuOpen(false);
  };

  const handlePrintSinglePatient = (patient: Patient, fileSnapshot?: PatientFileRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Allow pop-ups to print.");

    const teethToPrint = fileSnapshot ? fileSnapshot.snapshotTeeth : dentalChartEntries;
    const notesToPrint = fileSnapshot ? fileSnapshot.snapshotNotes : patient.notes;
    const docSubtitle = fileSnapshot ? `Patient File Record: ${fileSnapshot.fileName} (${fileSnapshot.updateType})` : 'Official Patient Dental Chart & Clinical Record';

    const dentalRowsHtml = teethToPrint.length > 0
      ? `<table><thead><tr><th>Tooth No.</th><th>Condition</th><th>Treatment</th><th>Dentist's Notes</th><th>Date Recorded</th></tr></thead><tbody>${teethToPrint.map(e => `<tr><td><strong>#${e.toothNumber}</strong> (${e.toothName})</td><td>${e.condition}</td><td>${e.treatment}</td><td>${e.dentistNotes}</td><td>${e.date}</td></tr>`).join('')}</tbody></table>`
      : `<p style="font-size: 13px; color: #64748b; font-style: italic;">No specific tooth chart entries recorded in this snapshot.</p>`;

    printWindow.document.write(`<html><head><title>${fileSnapshot ? fileSnapshot.fileName : `Patient Chart - ${patient.name}`}</title><style>body { font-family: sans-serif; padding: 35px; color: #1f2937; line-height: 1.5; } .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; font-size: 13px; } .notes-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; font-family: monospace; white-space: pre-wrap; font-size: 13px; line-height: 1.6; } table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px; } th { background-color: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; } td { padding: 8px 10px; border: 1px solid #cbd5e1; }</style></head><body><h2>Samuela Dental Clinic</h2><p>${docSubtitle}</p><div class="info-grid"><div><strong>Patient Name:</strong> ${patient.name}</div><div><strong>Sex:</strong> ${patient.sex || 'N/A'}</div><div><strong>Birthdate:</strong> ${patient.birthdate || 'N/A'}</div><div><strong>Phone Number:</strong> ${patient.phone || 'N/A'}</div><div><strong>Email Address:</strong> ${patient.email || 'N/A'}</div><div><strong>Date Registered:</strong> ${new Date(patient.created_at).toLocaleDateString('en-US')}</div><div style="grid-column: span 2;"><strong>Home Address:</strong> ${patient.address || 'N/A'}</div></div><h3>Dental Chart (Odontogram) History</h3>${dentalRowsHtml}<h3>Clinical Notes & Medical History</h3><div class="notes-box">${notesToPrint || 'No clinical notes recorded.'}</div><script>window.onload=function(){setTimeout(function(){window.print();},250);};</script></body></html>`);
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
              <input type="text" placeholder="Search name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-dental-500 focus:ring-2 shadow-sm transition-all" />
            </div>

            <div className="relative w-full sm:w-40">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-dental-500 focus:ring-2 shadow-sm transition-all appearance-none cursor-pointer">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A to Z</option>
                <option value="za">Z to A</option>
              </select>
            </div>

            <div className="relative">
              <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
                <Download className="w-4 h-4 text-dental-600" /> Export <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {isExportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsExportMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-40 animate-fade-in-up divide-y divide-gray-50">
                    <button onClick={handleExportExcel} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition">
                      <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
                      <div><p className="text-gray-900 leading-none">Save as Excel</p><p className="text-[11px] text-gray-400 font-normal mt-0.5">Download .CSV spreadsheet</p></div>
                    </button>
                    <button onClick={handleExportPDF} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition">
                      <Printer className="w-4 h-4 text-red-500 shrink-0" />
                      <div><p className="text-gray-900 leading-none">Save as PDF</p><p className="text-[11px] text-gray-400 font-normal mt-0.5">Formatted directory report</p></div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button onClick={openAddNewPatientModal} className="bg-dental-600 hover:bg-dental-700 text-white px-6 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
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
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border text-sm ${getAvatarColors(patient.id)}`}>{getInitials(patient.name)}</div>
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
                        <p className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-gray-400" />{new Date(patient.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </td>
                      <td className="p-4"><span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-bold">Active</span></td>
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

      {/* ── Patient Profile Modal ── */}
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
                <button onClick={() => handlePrintSinglePatient(selectedPatient)} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"><Printer className="w-4 h-4 text-dental-600" /> Save Full PDF</button>
                <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 border border-gray-200 transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="px-6 bg-white border-b border-gray-100 flex gap-6 shrink-0">
              <button onClick={() => setActiveProfileTab('odontogram')} className={`py-3.5 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeProfileTab === 'odontogram' ? 'border-dental-600 text-dental-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}><Sparkles className="w-4 h-4 text-dental-600" /> Dental Chart (Odontogram)</button>
              <button onClick={() => setActiveProfileTab('records')} className={`py-3.5 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeProfileTab === 'records' ? 'border-dental-600 text-dental-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}><FileText className="w-4 h-4 text-dental-600" /> Clinical Files & Images</button>
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
                      {isSavingTooth ? 'Saving to Tooth History...' : `Save Tooth #${selectedTooth} Record`}
                    </button>
                  </form>

                  {/* Preview & Full History Log */}
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
                        <span className="text-xs font-bold text-dental-700 bg-dental-50 px-2.5 py-1 rounded-full">{dentalChartEntries.length} Records Saved</span>
                      </div>

                      {dentalChartEntries.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-gray-400">
                          <p className="text-sm font-medium text-gray-500">No tooth conditions recorded yet.</p>
                          <p className="text-xs mt-1">Select a tooth above and click Save to log findings.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                          {dentalChartEntries.map(entry => (
                            <div key={entry.id} onClick={() => {
                              setSelectedTooth(entry.toothNumber);
                              setToothCondition(entry.condition);
                              setToothTreatment(entry.treatment);
                              setDentistNotes(entry.dentistNotes);
                            }} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-dental-200 transition cursor-pointer flex items-start justify-between gap-3">
                              <div className="space-y-0.5 text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-dental-900">Tooth #{entry.toothNumber}</span>
                                  <span className="text-gray-500 font-medium">({entry.toothName})</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getConditionPillStyle(entry.condition)}`}>{entry.condition}</span>
                                </div>
                                <p className="text-gray-700 font-medium">Treatment: {entry.treatment}</p>
                                <p className="text-gray-500">{entry.dentistNotes}</p>
                                <p className="text-[10px] text-gray-400 pt-0.5">{entry.date}</p>
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteToothEntry(entry.id); }} className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition" title="Remove history entry"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── TAB 2: CLINICAL NOTES FILE PREVIEW + CHRONOLOGICAL PATIENT RECORD FILES ── */
              <div className="flex-1 overflow-y-auto bg-gray-50 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* ── LEFT COLUMN: DOCUMENT VIEWER MODAL FOR FILE CARDS ── */}
                <div className="flex flex-col h-full">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h4 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-dental-500" /> Document Viewer
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openNewPdaChartForPatient(selectedPatient)} 
                        className="text-xs font-bold text-dental-700 bg-dental-50 hover:bg-dental-100 border border-dental-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> + New PDA Chart
                      </button>
                      <button 
                        onClick={() => openEditHistoryModal(selectedPatient)} 
                        className="text-xs font-bold text-white bg-dental-600 hover:bg-dental-700 px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit History
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[340px]">
                    {/* View Specific Document or Fallback to Latest/Welcome Message */}
                    {viewingFileRecord ? (
                      <div className="flex flex-col h-full">
                        <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 shrink-0 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-sm text-gray-900">{viewingFileRecord.fileName}</p>
                            <p className="text-xs text-gray-500">{viewingFileRecord.dateCreated}</p>
                          </div>
                          <button onClick={() => setViewingFileRecord(null)} className="text-gray-400 hover:text-gray-700 p-1 bg-white border border-gray-200 rounded-md">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="w-full h-full flex-1 p-5 text-sm text-gray-700 whitespace-pre-wrap overflow-y-auto font-mono leading-relaxed">
                          {viewingFileRecord.snapshotNotes}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex-1 p-5 flex flex-col items-center justify-center text-center">
                        <FolderOpen className="w-12 h-12 text-gray-200 mb-3" />
                        <span className="text-gray-500 font-medium text-sm">Select a file from the right to view its contents, <br />or click '+ New PDA Chart' to log an update.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT COLUMN: PATIENT RECORD FILES (NEW FILE CARD CREATED FOR EVERY UPDATE) ── */}
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-dental-500" />
                      <h4 className="font-serif text-lg font-bold text-gray-900">Patient Record Files</h4>
                      <span className="bg-dental-50 text-dental-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-dental-100">
                        {patientFileRecords.length} {patientFileRecords.length === 1 ? 'File' : 'Files'}
                      </span>
                    </div>
                    <label className={`cursor-pointer bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className="w-3.5 h-3.5 text-dental-600" /> {isUploading ? 'Uploading...' : 'Attach X-Ray / File'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                    </label>
                  </div>

                  <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm overflow-y-auto min-h-[340px] space-y-3.5">
                    {/* Render Every Historical File Card (Newest First) */}
                    {patientFileRecords.map((fileRec, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <div
                          key={fileRec.id}
                          onClick={() => setViewingFileRecord(fileRec)}
                          className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 shadow-sm cursor-pointer ${
                            viewingFileRecord?.id === fileRec.id 
                              ? 'border-dental-400 bg-dental-50/70 ring-1 ring-dental-400' 
                              : isLatest
                                ? 'border-dental-200 bg-dental-50/30 hover:bg-dental-50/80'
                                : 'border-gray-200 bg-gray-50/60 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${
                              isLatest ? 'bg-dental-600 text-white' : 'bg-white text-dental-700 border border-gray-200'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 text-sm">
                                  {fileRec.fileName}
                                </p>
                                {isLatest ? (
                                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                    Latest File
                                  </span>
                                ) : (
                                  <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                    {fileRec.updateType}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-dental-800">
                                Saved Info: {fileRec.summaryTitle}
                              </p>
                              <p className="text-[11px] text-gray-400 flex items-center gap-1 pt-0.5">
                                <Clock className="w-3 h-3" /> {fileRec.dateCreated}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0 items-end">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handlePrintSinglePatient(selectedPatient, fileRec); }}
                              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-dental-700 border border-dental-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print
                            </button>
                            {patientFileRecords.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteFileCard(fileRec.id); }}
                                className="text-[11px] text-gray-400 hover:text-red-600 px-2 py-1 transition flex items-center gap-1"
                                title="Delete this file version"
                              >
                                <Trash2 className="w-3 h-3" /> Remove
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* 👉 FIXED: Added Red Trash Bin button for Image Attachments */}
                    {patientImages.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                          Attached X-Ray & Diagnostic Images ({patientImages.length})
                        </p>
                        <div className="space-y-2.5">
                          {patientImages.map((img, index) => {
                            const lastName = getPatientLastName(selectedPatient.name);
                            const dateMatch = img.image_url.match(/-(\d{13})\./);
                            const timestamp = dateMatch ? parseInt(dateMatch[1]) : Date.now();
                            const todaySlug = new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(/[\s,]+/g, '_');
                            return (
                              <div
                                key={img.id}
                                className="p-3 rounded-xl border border-gray-200 bg-white hover:border-dental-300 transition flex items-center justify-between gap-3 group shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={img.image_url}
                                    alt="Diagnostic file"
                                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-gray-900 group-hover:text-dental-700">
                                      {lastName}_XRay_Attachment_{patientImages.length - index}_{todaySlug}.jpg
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                      Attached diagnostic image • Patient: {selectedPatient.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <a
                                    href={img.image_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 bg-dental-50 hover:bg-dental-100 text-dental-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Open Image
                                  </a>
                                  <button
                                    onClick={() => handleDeleteImage(img.id, img.image_url)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Delete Image"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PDA-STYLE PATIENT MODAL (Handles Add Patient, Edit History, & + New PDA Chart) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="font-serif text-xl font-bold text-dental-900">Philippine Dental Association Chart</h3>
                <p className="text-sm text-gray-500 font-medium">
                  {pdaModalMode === 'add' && 'New Patient Information Record'}
                  {pdaModalMode === 'edit_history' && `Edit Personal Details & Clinical History — ${selectedPatient?.name}`}
                  {pdaModalMode === 'new_chart' && `New Follow-Up PDA Chart Entry — ${selectedPatient?.name}`}
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 border border-gray-200"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSavePdaModal} className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* SECTION 1: Patient Information */}
              <section>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Users className="w-5 h-5 text-dental-500" /> Patient Information Record
                </h4>
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
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Reason for Consultation</label><input type="text" value={newPatientForm.reason} onChange={e => setNewPatientForm({...newPatientForm, reason: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none" placeholder="e.g. Toothache, Cleaning, Follow-up" /></div>
                </div>
              </section>

              {/* SECTION 2: Dental History */}
              <section>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Sparkles className="w-5 h-5 text-purple-500" /> Dental History
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
                  <Activity className="w-5 h-5 text-red-500" /> Medical History & Current Condition
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
                    <textarea rows={3} placeholder="Heart disease, Diabetes, Asthma, Pregnancy, Bleeding problems, etc." value={newPatientForm.conditions} onChange={e => setNewPatientForm({...newPatientForm, conditions: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-dental-500 outline-none resize-none" />
                  </div>
                </div>
              </section>

              <div className="pt-4 border-t border-gray-100 shrink-0">
                <button type="submit" disabled={isSavingPda} className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50">
                  {isSavingPda
                    ? 'Saving...'
                    : pdaModalMode === 'add'
                      ? 'Save Patient Record'
                      : pdaModalMode === 'edit_history'
                        ? 'Save Updated History (Create New File Card)'
                        : 'Save New PDA Chart (Create New File Card)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}