import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Upload, 
  Lock, 
  Unlock, 
  Database, 
  Fingerprint, 
  FileText, 
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Download
} from 'lucide-react';

interface Record {
  id: string;
  name: string;
  cid: string;
  hash: string;
  txHash: string;
  timestamp: string;
  ownerId: string;
  patientName: string;
}

interface User {
  id: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
}

interface AccessLog {
  timestamp: string;
  adminId: string;
  patientName: string;
  recordId: string;
  reason: string;
  type: string;
}

const MOCK_USERS: User[] = [
  { id: 'p1', name: 'John Doe', role: 'patient' },
  { id: 'p2', name: 'Alice Chen', role: 'patient' },
  { id: 'p3', name: 'Bob Miller', role: 'patient' },
  { id: 'd1', name: 'Dr. Smith', role: 'doctor' },
  { id: 'd2', name: 'Dr. Wong', role: 'doctor' },
  { id: 'a1', name: 'Admin Root', role: 'admin' },
];

export default function App() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showDoctorManagement, setShowDoctorManagement] = useState(false);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorPin, setNewDoctorPin] = useState('');
  const [resettingPinId, setResettingPinId] = useState<string | null>(null);
  const [resetPinValue, setResetPinValue] = useState('');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [isEmergencyLoading, setIsEmergencyLoading] = useState(false);

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [irisFile, setIrisFile] = useState<File | null>(null);
  const [svgFiles, setSvgFiles] = useState<File[]>([]);
  
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [irisPreview, setIrisPreview] = useState<string | null>(null);
  const [svgPreviews, setSvgPreviews] = useState<string[]>([]);
  
  const [generatedSeeds, setGeneratedSeeds] = useState<number[] | null>(null);
  const [biometricKey, setBiometricKey] = useState<string | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [doctorPin, setDoctorPin] = useState('');
  const [isDoctorVerified, setIsDoctorVerified] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string | null>(null);
  const [viewingSvgContent, setViewingSvgContent] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showBlockchain, setShowBlockchain] = useState(false);
  const [blockchainData, setBlockchainData] = useState<{ chain: any[], isValid: boolean } | null>(null);

  useEffect(() => {
    if (faceFile) {
      const url = URL.createObjectURL(faceFile);
      setFacePreview(url);
      return () => URL.revokeObjectURL(url);
    } else setFacePreview(null);
  }, [faceFile]);

  useEffect(() => {
    if (irisFile) {
      const url = URL.createObjectURL(irisFile);
      setIrisPreview(url);
      return () => URL.revokeObjectURL(url);
    } else setIrisPreview(null);
  }, [irisFile]);

  useEffect(() => {
    if (svgFiles.length > 0) {
      const urls = svgFiles.map(file => URL.createObjectURL(file));
      setSvgPreviews(urls);
      return () => urls.forEach(url => URL.revokeObjectURL(url));
    } else setSvgPreviews([]);
  }, [svgFiles]);

  useEffect(() => {
    fetchRecords();
    if (currentUser.role === 'admin') {
      fetchLogs();
      fetchDoctors();
    }
  }, [currentUser]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`/api/doctors?role=${currentUser.role}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      
      const baseUsers = MOCK_USERS.filter(u => u.role !== 'doctor');
      const fetchedDoctors = data.map((d: any) => ({ id: d.id, name: d.name, role: 'doctor' }));
      setUsers([...baseUsers, ...fetchedDoctors]);
      setDoctorsList(data);
    } catch (error) {
      console.error('Failed to fetch doctors', error);
    }
  };

  const fetchBlockchain = async () => {
    try {
      const response = await fetch('/api/blockchain');
      if (response.ok) {
        const data = await response.json();
        setBlockchainData(data);
      }
    } catch (error) {
      console.error('Failed to fetch blockchain data', error);
    }
  };

  useEffect(() => {
    if (showBlockchain) {
      fetchBlockchain();
    }
  }, [showBlockchain, records]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName || !newDoctorPin) return;
    try {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentUser.role, name: newDoctorName, pin: newDoctorPin })
      });
      if (response.ok) {
        setNewDoctorName('');
        setNewDoctorPin('');
        fetchDoctors();
        setStatus({ type: 'success', message: 'Doctor added successfully' });
      } else {
        let data;
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (e) {
          data = { error: `Server returned an invalid response (${response.status}).` };
        }
        setStatus({ type: 'error', message: data.error || 'Failed to add doctor' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error' });
    }
  };

  const handleRemoveDoctor = async (id: string) => {
    try {
      const response = await fetch(`/api/doctors/${id}?role=${currentUser.role}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchDoctors();
        setStatus({ type: 'success', message: 'Doctor removed successfully' });
      } else {
        let data;
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (e) {
          data = { error: `Server returned an invalid response (${response.status}).` };
        }
        setStatus({ type: 'error', message: data.error || 'Failed to remove doctor' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error' });
    }
  };

  const handleResetPin = async (id: string, newPin: string) => {
    if (!newPin) return;
    
    try {
      const response = await fetch(`/api/doctors/${id}/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentUser.role, newPin })
      });
      
      if (response.ok) {
        fetchDoctors();
        setStatus({ type: 'success', message: 'Doctor PIN reset successfully' });
        setResettingPinId(null);
        setResetPinValue('');
      } else {
        let data;
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (e) {
          data = { error: `Server returned an invalid response (${response.status}).` };
        }
        setStatus({ type: 'error', message: data.error || 'Failed to reset PIN' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error' });
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await fetch(`/api/records?role=${currentUser.role}&userId=${currentUser.id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      setRecords(data);
    } catch (error) {
      console.error('Failed to fetch records', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/logs?role=${currentUser.role}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      setAccessLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };

  const handleUpload = async () => {
    if (!faceFile || !irisFile || svgFiles.length === 0) {
      setStatus({ type: 'error', message: 'Please select face, iris, and at least one SVG file.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'info', message: 'Extracting features & generating 4D chaotic keys...' });

    try {
      let lastSeeds: number[] | null = null;

      for (const file of svgFiles) {
        const formData = new FormData();
        formData.append('face', faceFile);
        formData.append('iris', irisFile);
        formData.append('document', file);
        formData.append('ownerId', currentUser.id);
        formData.append('patientName', currentUser.name);

        const response = await fetch('/api/encrypt', {
          method: 'POST',
          body: formData,
        });
        
        if (response.status === 413) {
          throw new Error('File too large. Maximum upload size is 1MB.');
        }

        let data;
        try {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Invalid JSON response:', text);
            if (text.includes('<html')) {
              throw new Error(`Server returned an HTML page (${response.status}). The file might be too large or the server is restarting. Please try again.`);
            }
            throw new Error(`Server returned an invalid response (${response.status}). The file might be too large or the server is restarting. Please try again.`);
          }
        } catch (e) {
          throw e;
        }

        if (data.success) {
          lastSeeds = data.record.seeds;
          setBiometricKey(data.biometricKey);
        } else {
          throw new Error(data.error || `Failed to encrypt ${file.name}`);
        }
      }

      if (lastSeeds) setGeneratedSeeds(lastSeeds);
      await fetchRecords();
      setSvgFiles([]); // Clear files after successful upload
      setStatus({ type: 'success', message: `${svgFiles.length} SVG(s) secured via Multimodal Biometrics` });
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Encryption failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDecrypt = async (record: Record) => {
    if (currentUser.role === 'doctor' && !isDoctorVerified) {
      setStatus({ type: 'error', message: 'Please verify your doctor identity first.' });
      return;
    }

    if (currentUser.role === 'patient' && (!faceFile || !irisFile)) {
      setStatus({ type: 'error', message: 'Please select your face and iris samples for re-verification.' });
      return;
    }

    setStatus({ type: 'info', message: 'Verifying integrity & regenerating chaotic keys...' });

    const formData = new FormData();
    formData.append('cid', record.cid);
    formData.append('hash', record.hash);
    
    if (currentUser.role === 'patient') {
      formData.append('face', faceFile!);
      formData.append('iris', irisFile!);
    }
    
    formData.append('userId', currentUser.id);
    formData.append('role', currentUser.role);
    if (currentUser.role === 'doctor') {
      formData.append('doctorPin', doctorPin);
    }

    try {
      const response = await fetch('/api/decrypt', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server returned an HTML page. The server might be restarting or the file is too large.');
        }
        const arrayBuffer = await response.arrayBuffer();
        const isSvg = record.name.toLowerCase().endsWith('.svg');
        
        if (isSvg) {
          const blob = new Blob([arrayBuffer], { type: 'image/svg+xml' });
          const reader = new FileReader();
          reader.onloadend = () => {
            setViewingImage(reader.result as string);
            setViewingFileName(record.name);
            setStatus({ type: 'success', message: 'Decryption successful' });
          };
          reader.readAsDataURL(blob);
          setViewingSvgContent(null);
        } else {
          const blob = new Blob([arrayBuffer], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          setViewingImage(url);
          setViewingFileName(record.name);
          setViewingSvgContent(null);
          setStatus({ type: 'success', message: 'Decryption successful' });
        }
      } else {
        if (response.status === 413) {
          setStatus({ type: 'error', message: 'File too large. Maximum upload size is 1MB.' });
          return;
        }
        let data;
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (e) {
          data = { error: `Server returned an invalid response (${response.status}). The file might be too large or the server is restarting.` };
        }
        setStatus({ type: 'error', message: data.error || 'Decryption failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error during decryption' });
    }
  };

  const handleEmergencyDecrypt = async (record: Record) => {
    if (!emergencyReason) {
      setStatus({ type: 'error', message: 'Please provide a reason for emergency access.' });
      return;
    }

    setIsEmergencyLoading(true);
    try {
      const response = await fetch('/api/emergency-decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cid: record.cid,
          adminId: currentUser.id,
          reason: emergencyReason
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server returned an HTML page. The server might be restarting or the file is too large.');
        }
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'image/svg+xml' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setViewingImage(reader.result as string);
          setViewingFileName(record.name);
          setStatus({ type: 'success', message: 'Emergency Override Successful' });
          fetchLogs();
        };
        reader.readAsDataURL(blob);
      } else {
        if (response.status === 413) {
          setStatus({ type: 'error', message: 'File too large. Maximum upload size is 1MB.' });
          return;
        }
        let data;
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (e) {
          data = { error: `Server returned an invalid response (${response.status}). The file might be too large or the server is restarting.` };
        }
        setStatus({ type: 'error', message: data.error || 'Emergency access failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error' });
    } finally {
      setIsEmergencyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">APBPIS</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 border border-[#141414] max-w-[400px] justify-end">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className={`px-3 py-1 text-[10px] font-mono uppercase transition-all ${
                  currentUser.id === user.id ? 'bg-[#141414] text-white' : 'hover:bg-gray-200'
                }`}
                title={`Role: ${user.role}`}
              >
                {user.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 border-l border-[#141414] pl-6">
            <div className="text-right">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest leading-none">
                {currentUser.name}
              </div>
              <div className="text-[8px] font-mono opacity-50 uppercase tracking-widest mt-1">
                Role: {currentUser.role}
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              currentUser.role === 'admin' ? 'bg-red-500' : 
              currentUser.role === 'doctor' ? 'bg-blue-500' : 'bg-emerald-500'
            } animate-pulse`} />
          </div>
          
          <button
            onClick={() => setShowBlockchain(true)}
            className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-xs font-mono uppercase hover:bg-gray-800 transition-colors"
          >
            <Database className="w-4 h-4" /> Explorer
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Biometric Enrollment & Upload */}
        <div className="lg:col-span-5 space-y-6">
          {currentUser.role === 'patient' ? (
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="text-xs font-mono uppercase opacity-50 mb-6 tracking-widest flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> Biometric Enrollment & Secure Upload
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase opacity-50">Face Scan</label>
                  <div 
                    className={`aspect-square border-2 border-dashed border-[#141414] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative ${facePreview ? 'border-emerald-500' : ''}`}
                    onClick={() => document.getElementById('face-input')?.click()}
                  >
                    {facePreview ? (
                      <img src={facePreview} className="w-full h-full object-cover" alt="Face Preview" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 opacity-30" />
                        <span className="text-[8px] font-mono mt-2 opacity-50">UPLOAD FACE</span>
                      </>
                    )}
                    <input id="face-input" type="file" className="hidden" onChange={e => setFaceFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase opacity-50">Iris Scan</label>
                  <div 
                    className={`aspect-square border-2 border-dashed border-[#141414] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative ${irisPreview ? 'border-emerald-500' : ''}`}
                    onClick={() => document.getElementById('iris-input')?.click()}
                  >
                    {irisPreview ? (
                      <img src={irisPreview} className="w-full h-full object-cover" alt="Iris Preview" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 opacity-30" />
                        <span className="text-[8px] font-mono mt-2 opacity-50">UPLOAD IRIS</span>
                      </>
                    )}
                    <input id="iris-input" type="file" className="hidden" onChange={e => setIrisFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-mono uppercase opacity-50">Target SVG Documents</label>
                <div 
                  className={`p-4 border-2 border-dashed border-[#141414] flex flex-col gap-3 cursor-pointer hover:bg-gray-50 transition-all ${svgFiles.length > 0 ? 'bg-emerald-50 border-emerald-500' : ''}`}
                  onClick={() => document.getElementById('svg-input')?.click()}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <FileText className={`w-6 h-6 ${svgFiles.length > 0 ? 'text-emerald-600' : 'opacity-30'}`} />
                      <span className="text-xs font-bold uppercase tracking-widest truncate max-w-[150px]">
                        {svgFiles.length > 0 ? `${svgFiles.length} File(s) Selected` : 'Select SVG Files'}
                      </span>
                    </div>
                    <Upload className="w-4 h-4 opacity-30" />
                  </div>
                  
                  {svgFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {svgPreviews.map((preview, idx) => (
                        <div key={idx} className="aspect-square border border-[#141414] bg-white overflow-hidden relative group">
                          <img src={preview} className="w-full h-full object-contain" alt={`Preview ${idx}`} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[8px] text-white font-mono uppercase">SVG</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <input 
                    id="svg-input" 
                    type="file" 
                    className="hidden" 
                    accept=".svg" 
                    multiple 
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setSvgFiles(files);
                    }} 
                  />
                </div>
              </div>

              <button 
                onClick={handleUpload}
                disabled={isUploading || !faceFile || !irisFile || svgFiles.length === 0}
                className="w-full py-4 bg-[#141414] text-[#E4E3E0] flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all disabled:opacity-30"
              >
                {isUploading ? <Activity className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                <span className="font-bold uppercase tracking-tight">Encrypt & Secure My Records</span>
              </button>
            </section>
          ) : currentUser.role === 'admin' ? (
            <div className="space-y-6">
              <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-mono uppercase opacity-50 tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Admin Access Logs
                  </h2>
                  <button 
                    onClick={() => setShowLogs(!showLogs)}
                    className="text-[10px] font-mono uppercase underline"
                  >
                    {showLogs ? 'Hide Logs' : 'Show Logs'}
                  </button>
                </div>

                {showLogs && (
                  <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                    {accessLogs.length === 0 ? (
                      <div className="text-center py-8 opacity-30 italic text-xs">No access logs found.</div>
                    ) : (
                      accessLogs.map((log, i) => (
                        <div key={i} className="p-3 bg-red-50 border border-red-100 text-[10px] font-mono">
                          <div className="flex justify-between mb-1">
                            <span className="font-bold text-red-800">{log.type}</span>
                            <span className="opacity-50">{log.timestamp}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div><span className="opacity-50">Admin:</span> {log.adminId}</div>
                            <div><span className="opacity-50">Patient:</span> {log.patientName}</div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-red-200">
                            <span className="opacity-50 italic">Reason: {log.reason}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 text-[10px] font-mono leading-relaxed">
                  <AlertCircle className="w-4 h-4 mb-2" />
                  WARNING: EMERGENCY OVERRIDE BYPASSES BIOMETRIC VERIFICATION. ALL ACTIONS ARE PERMANENTLY LOGGED ON THE AUDIT TRAIL.
                </div>
              </section>

              <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-mono uppercase opacity-50 tracking-widest flex items-center gap-2">
                    <Database className="w-4 h-4" /> Doctor Management
                  </h2>
                  <button 
                    onClick={() => setShowDoctorManagement(!showDoctorManagement)}
                    className="text-[10px] font-mono uppercase underline"
                  >
                    {showDoctorManagement ? 'Hide Management' : 'Manage Doctors'}
                  </button>
                </div>

                {showDoctorManagement && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddDoctor} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-mono uppercase opacity-50 mb-2">Doctor Name</label>
                        <input 
                          type="text" 
                          value={newDoctorName}
                          onChange={e => setNewDoctorName(e.target.value)}
                          className="w-full bg-transparent border-b border-[#141414] p-2 text-sm font-mono focus:outline-none focus:border-b-2"
                          placeholder="Dr. Jane Smith"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-mono uppercase opacity-50 mb-2">Authorization PIN</label>
                        <input 
                          type="password" 
                          value={newDoctorPin}
                          onChange={e => setNewDoctorPin(e.target.value)}
                          className="w-full bg-transparent border-b border-[#141414] p-2 text-sm font-mono focus:outline-none focus:border-b-2"
                          placeholder="6-digit PIN"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={!newDoctorName || !newDoctorPin}
                        className="px-6 py-2 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase hover:bg-opacity-90 disabled:opacity-30"
                      >
                        Add Doctor
                      </button>
                    </form>

                    <div className="border border-[#141414]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#141414] bg-gray-50 text-[10px] font-mono uppercase opacity-50">
                            <th className="p-3 font-normal">ID</th>
                            <th className="p-3 font-normal">Name</th>
                            <th className="p-3 font-normal">Added At</th>
                            <th className="p-3 font-normal text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doctorsList.map(doc => (
                            <tr key={doc.id} className="border-b border-[#141414] text-xs font-mono">
                              <td className="p-3">{doc.id}</td>
                              <td className="p-3">{doc.name}</td>
                              <td className="p-3 opacity-50">{doc.addedAt}</td>
                              <td className="p-3 text-right space-x-4">
                                {resettingPinId === doc.id ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <input
                                      type="password"
                                      value={resetPinValue}
                                      onChange={(e) => setResetPinValue(e.target.value)}
                                      placeholder="New PIN"
                                      className="w-24 p-1 border border-[#141414] text-xs font-mono"
                                    />
                                    <button
                                      onClick={() => handleResetPin(doc.id, resetPinValue)}
                                      className="text-emerald-600 hover:underline"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setResettingPinId(null);
                                        setResetPinValue('');
                                      }}
                                      className="text-gray-500 hover:underline"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setResettingPinId(doc.id);
                                        setResetPinValue('');
                                      }}
                                      className="text-blue-600 hover:underline"
                                    >
                                      Reset PIN
                                    </button>
                                    <button
                                      onClick={() => handleRemoveDoctor(doc.id)}
                                      className="text-red-600 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                          {doctorsList.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-6 text-center opacity-50 text-xs italic">No doctors found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="text-xs font-mono uppercase opacity-50 mb-6 tracking-widest flex items-center gap-2">
                <Eye className="w-4 h-4" /> Doctor Authorization
              </h2>
              {!isDoctorVerified ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 text-[10px] font-mono text-blue-800 leading-relaxed">
                    <Shield className="w-4 h-4 mb-2" />
                    Medical personnel must verify their license credentials before accessing patient biometric decryption tools.
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase opacity-50">Medical License PIN</label>
                    <input 
                      type="password"
                      value={doctorPin}
                      onChange={e => setDoctorPin(e.target.value)}
                      placeholder="Enter 6-digit PIN"
                      className="w-full p-3 border border-[#141414] font-mono text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-[#141414]"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        setStatus({ type: 'info', message: 'Verifying credentials...' });
                        const response = await fetch('/api/verify-doctor', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: currentUser.id, pin: doctorPin })
                        });
                        const data = await response.json();
                        if (response.ok && data.success) {
                          setIsDoctorVerified(true);
                          setStatus({ type: 'success', message: 'Doctor identity verified' });
                        } else {
                          setStatus({ type: 'error', message: data.error || 'Invalid License PIN' });
                        }
                      } catch (error) {
                        setStatus({ type: 'error', message: 'Verification failed' });
                      }
                    }}
                    className="w-full py-4 bg-[#141414] text-white font-bold uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  >
                    Verify Credentials
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-emerald-500 bg-emerald-50/50">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-600" />
                  <p className="text-xs font-mono text-emerald-800 uppercase font-bold tracking-widest">
                    Identity Verified
                  </p>
                  <p className="text-[9px] font-mono opacity-60 mt-2 uppercase leading-relaxed">
                    Session active. You may now use patient biometric samples to regenerate chaotic keys.
                  </p>
                  <button 
                    onClick={() => {
                      setIsDoctorVerified(false);
                      setDoctorPin('');
                    }}
                    className="mt-6 text-[9px] font-mono uppercase underline opacity-50 hover:opacity-100 transition-opacity"
                  >
                    Revoke Authorization
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Biometric Verification (For Patient Decryption) */}
          {(currentUser.role === 'patient') && (
            <section className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h2 className="text-xs font-mono uppercase opacity-50 mb-4 tracking-widest flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> Biometric Verification
              </h2>
              <p className="text-[10px] font-mono opacity-50 mb-4 uppercase">Required for standard decryption</p>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`aspect-video border border-[#141414] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative ${facePreview ? 'bg-emerald-50' : ''}`}
                  onClick={() => document.getElementById('face-verify')?.click()}
                >
                  {facePreview ? <img src={facePreview} className="w-full h-full object-cover opacity-50" alt="Face" /> : <Upload className="w-4 h-4 opacity-20" />}
                  <span className="text-[8px] font-mono mt-1 opacity-50">FACE</span>
                  <input id="face-verify" type="file" className="hidden" onChange={e => setFaceFile(e.target.files?.[0] || null)} />
                </div>
                <div 
                  className={`aspect-video border border-[#141414] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative ${irisPreview ? 'bg-emerald-50' : ''}`}
                  onClick={() => document.getElementById('iris-verify')?.click()}
                >
                  {irisPreview ? <img src={irisPreview} className="w-full h-full object-cover opacity-50" alt="Iris" /> : <Upload className="w-4 h-4 opacity-20" />}
                  <span className="text-[8px] font-mono mt-1 opacity-50">IRIS</span>
                  <input id="iris-verify" type="file" className="hidden" onChange={e => setIrisFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            </section>
          )}

          {generatedSeeds && (
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#141414] text-[#E4E3E0] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
            >
              <h2 className="text-[10px] font-mono uppercase opacity-50 mb-4 tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3" /> Biometric Key & 4D Chaotic Seeds
              </h2>
              {biometricKey && (
                <div className="mb-4 p-3 bg-white/5 border border-white/10">
                  <div className="text-[8px] font-mono opacity-50 mb-1">RAW BIOMETRIC KEY (SHA-256)</div>
                  <div className="text-xs font-mono text-emerald-400 break-all">{biometricKey}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {generatedSeeds.map((seed, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/10">
                    <div className="text-[8px] font-mono opacity-50 mb-1">SEED_{i}</div>
                    <div className="text-xs font-mono text-emerald-400">{seed.toFixed(12)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono leading-relaxed">
                Keys derived via HMAC-SHA512 from 2048-D fused biometric vector. Transient phase (2048 iters) discarded.
              </div>
            </motion.section>
          )}

          {status && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 border flex gap-3 ${
                status.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' :
                status.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                'bg-blue-50 border-blue-500 text-blue-800'
              }`}
            >
              {status.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{status.message}</span>
            </motion.div>
          )}
        </div>

        {/* Right Column: Records */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
            <div className="p-6 border-b border-[#141414] flex justify-between items-center bg-[#141414] text-[#E4E3E0]">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-widest text-sm">Secure Ledger Records</h2>
              </div>
              <span className="text-[10px] font-mono opacity-50">{records.length} Total Entries</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#141414]">
                    <th className="p-4 text-[10px] font-mono uppercase opacity-50 tracking-widest">Record</th>
                    <th className="p-4 text-[10px] font-mono uppercase opacity-50 tracking-widest">Metadata</th>
                    <th className="p-4 text-[10px] font-mono uppercase opacity-50 tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-12 text-center opacity-30 italic font-serif">
                          No secure records found in decentralized storage.
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <motion.tr 
                          key={record.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-[#141414] hover:bg-gray-50 transition-colors group"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 flex items-center justify-center border border-[#141414]">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-sm uppercase tracking-tight">{record.name}</div>
                                <div className="text-[10px] font-mono opacity-50">Patient: {record.patientName}</div>
                                <div className="text-[10px] font-mono opacity-50">{record.timestamp}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono px-1 bg-gray-100 border border-gray-200">IPFS</span>
                                <span className="text-[10px] font-mono truncate max-w-[120px]">{record.cid}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono px-1 bg-gray-100 border border-gray-200">OWNER</span>
                                <span className="text-[10px] font-mono truncate max-w-[120px]">{record.ownerId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              {currentUser.role === 'admin' ? (
                                <div className="flex flex-col gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Emergency Reason"
                                    className="text-[10px] font-mono p-1 border border-[#141414]"
                                    onChange={(e) => setEmergencyReason(e.target.value)}
                                  />
                                  <button 
                                    onClick={() => handleEmergencyDecrypt(record)}
                                    disabled={isEmergencyLoading}
                                    className="bg-red-600 text-white p-2 hover:bg-red-700 transition-all flex items-center gap-2 text-[10px] font-mono uppercase"
                                  >
                                    {isEmergencyLoading ? <Activity className="w-3 h-3 animate-spin" /> : <AlertCircle className="w-3 h-3" />}
                                    Override
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleDecrypt(record)}
                                  className="p-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all border border-transparent hover:border-[#141414]"
                                >
                                  <Unlock className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Image/SVG Viewer Modal */}
      <AnimatePresence>
        {showBlockchain && blockchainData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#141414]/90 backdrop-blur-sm z-50 flex items-center justify-center p-8"
            onClick={() => setShowBlockchain(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#E4E3E0] border-4 border-[#141414] p-6 max-w-5xl w-full max-h-[80vh] overflow-y-auto shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b-2 border-[#141414] pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6" />
                  <h2 className="text-xl font-bold uppercase tracking-widest font-serif italic">Local Blockchain Explorer</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-xs font-mono uppercase px-3 py-1 border border-[#141414] ${blockchainData.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {blockchainData.isValid ? 'Chain Valid' : 'Chain Invalid'}
                  </div>
                  <button 
                    onClick={() => setShowBlockchain(false)}
                    className="text-xs font-mono uppercase hover:underline"
                  >
                    Close [ESC]
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {blockchainData.chain.map((block: any, index: number) => (
                  <div key={index} className="bg-white border-2 border-[#141414] p-4 relative">
                    <div className="absolute -left-3 -top-3 bg-[#141414] text-white font-mono text-xs px-2 py-1">
                      Block #{block.index}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Hash</div>
                        <div className="text-xs font-mono break-all bg-gray-100 p-2 border border-gray-200">{block.hash}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Previous Hash</div>
                        <div className="text-xs font-mono break-all bg-gray-100 p-2 border border-gray-200">{block.previousHash}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 border-t border-dashed border-gray-300 pt-4">
                      <div>
                        <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Timestamp</div>
                        <div className="text-xs font-mono">{new Date(block.timestamp).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Nonce</div>
                        <div className="text-xs font-mono">{block.nonce}</div>
                      </div>
                    </div>

                    {block.transactions.length > 0 && (
                      <div className="mt-4 border-t border-[#141414] pt-4">
                        <div className="text-[10px] font-mono uppercase opacity-50 mb-2">Transactions ({block.transactions.length})</div>
                        {block.transactions.map((tx: any, txIndex: number) => (
                          <div key={txIndex} className="bg-gray-50 border border-gray-200 p-3 text-xs font-mono space-y-2">
                            <div className="flex justify-between">
                              <span className="opacity-50">Record ID:</span>
                              <span>{tx.recordId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-50">Patient:</span>
                              <span>{tx.patientName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-50">IPFS CID:</span>
                              <span className="break-all ml-4">{tx.cid}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-50">Doc Hash:</span>
                              <span className="break-all ml-4 text-[10px]">{tx.documentHash}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {block.transactions.length === 0 && (
                      <div className="mt-4 border-t border-dashed border-gray-300 pt-4 text-xs font-mono opacity-50 italic">
                        Genesis Block (No transactions)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(viewingImage || viewingSvgContent) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#141414]/90 backdrop-blur-sm z-50 flex items-center justify-center p-8"
            onClick={() => {
              setViewingImage(null);
              setViewingFileName(null);
              setViewingSvgContent(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-2 max-w-4xl w-full shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-[#141414] mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-widest text-sm truncate max-w-[300px]">
                    {viewingFileName || 'Decrypted Document'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {viewingImage && (
                    <a 
                      href={viewingImage} 
                      download={viewingFileName || 'decrypted_document'}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] text-white text-[10px] font-mono uppercase hover:bg-opacity-80 transition-all border border-[#141414]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  )}
                  <button 
                    onClick={() => {
                      setViewingImage(null);
                      setViewingFileName(null);
                      setViewingSvgContent(null);
                    }}
                    className="text-[10px] font-mono uppercase hover:underline px-2 py-1.5 border border-transparent hover:border-[#141414]"
                  >
                    Close [ESC]
                  </button>
                </div>
              </div>
              <div className="aspect-video bg-white flex items-center justify-center overflow-auto p-8">
                <img 
                  src={viewingImage || ''} 
                  alt="Decrypted Document" 
                  className="max-w-full max-h-full shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-mono mt-4 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                INTEGRITY VERIFIED VIA SHA-512 & BLOCKCHAIN LEDGER
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-[#141414] bg-[#E4E3E0] p-2 px-6 flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] opacity-50">
        <div className="flex gap-6">
          <span>Sys: 4D Hyperchaotic</span>
          <span>Enc: DNA Confusion/Diffusion</span>
          <span>Storage: IPFS-Go (Mock)</span>
          <span>Ledger: Local In-Memory Blockchain</span>
        </div>
        <div>
          v1.0.5-stable // {new Date().toISOString()}
        </div>
      </footer>
    </div>
  );
}
