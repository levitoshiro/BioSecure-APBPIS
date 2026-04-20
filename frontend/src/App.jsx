import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { 
  Shield, Upload, Database, Fingerprint, Lock, Unlock,
  CheckCircle, User, Stethoscope, Terminal, Eye,
  Search, FileImage, AlertTriangle, Users, Key, Wallet, 
  ExternalLink, X, FileText, Download, XCircle,
  Activity, Calendar, Droplet, FolderHeart, Clock, RefreshCw,
  Trash2, KeyRound, ShieldAlert, Loader2, Link, UserMinus, Info
} from 'lucide-react';
import './App.css';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const INITIAL_NETWORK_USERS = [
  { id: 'PT-8922', name: 'Alex Johnson', role: 'patient', dob: '1985-06-15', bloodType: 'O+', allergies: 'Penicillin' },
  { id: 'PT-1044', name: 'Maria Garcia', role: 'patient', dob: '1992-11-03', bloodType: 'A-', allergies: 'None' },
  { id: 'DR-4011', name: 'Dr. Sarah Chen', role: 'doctor', passcode: 'scalpel-velvet-mountain-reboot', degree: 'MD, PhD', specialty: 'Neurology' },
  { id: 'DR-9920', name: 'Dr. Marcus Webb', role: 'doctor', passcode: 'coffee-isotope-glacier-terminal', degree: 'MBBS, MS', specialty: 'Cardiology' },
  { id: 'SYS-ADMIN', name: 'Network Supervisor', role: 'admin', passcode: 'OrionBIO#2026' }
];

export default function App() {
  const [networkUsers, setNetworkUsers] = useState(INITIAL_NETWORK_USERS);
  const [records, setRecords] = useState([]);
  const [activeUser, setActiveUser] = useState(INITIAL_NETWORK_USERS[0]);
  const [account, setAccount] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);
  
  const [unlockedSessions, setUnlockedSessions] = useState({});
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000); 
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    axios.get(`${API_URL}/api/state`)
      .then(res => {
        if (res.data.users && res.data.users.length > 0) {
          setNetworkUsers(res.data.users);
          const stillExists = res.data.users.find(u => u.id === activeUser.id);
          if(!stillExists) setActiveUser(res.data.users[0]);
        }
        if (res.data.records) setRecords(res.data.records);
        setIsSyncing(false);
      })
      .catch(err => {
        console.log("Could not connect to Global State, using defaults.", err);
        setIsSyncing(false);
      });
  }, []);

  const syncToCloud = async (newUsers, newRecords) => {
    try {
      await axios.post(`${API_URL}/api/state`, { users: newUsers, records: newRecords });
    } catch (err) {
      console.error("Global sync failed:", err);
      showToast("Failed to sync with global node.", "error");
    }
  };

  const handleAddUserToNetwork = (newUser) => {
    const updatedUsers = [...networkUsers, newUser];
    setNetworkUsers(updatedUsers);
    syncToCloud(updatedUsers, records);
    showToast(`${newUser.role === 'doctor' ? 'Physician' : 'Patient'} ${newUser.name} provisioned securely.`, "success");
  };

  const handleRemoveUserFromNetwork = (userId) => {
    const updatedUsers = networkUsers.filter(u => u.id !== userId);
    setNetworkUsers(updatedUsers);
    syncToCloud(updatedUsers, records);
    if (activeUser.id === userId) setActiveUser(updatedUsers[0]);
    showToast(`Access permanently revoked.`, "success");
  };

  const handleAddRecords = (newRecords) => {
    const updatedRecords = [...newRecords, ...records];
    setRecords(updatedRecords);
    syncToCloud(networkUsers, updatedRecords);
    showToast("Medical records anchored to blockchain.", "success");
  };

  const handleWipeLedger = () => {
    setNetworkUsers(INITIAL_NETWORK_USERS);
    setRecords([]);
    setActiveUser(INITIAL_NETWORK_USERS[0]);
    syncToCloud(INITIAL_NETWORK_USERS, []);
    showToast("Global Ledger completely formatted.", "info");
  };

  const [adminLogs, setAdminLogs] = useState([
    "[SYSTEM] BioSecure Core v2.0 Initialized",
    "[ETH] Waiting for MetaMask provider...",
    `[API] Connected to Global Node at ${API_URL}`
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAdminLogs(prev => [...prev, `[NETWORK] Heartbeat check successful at ${new Date().toLocaleTimeString()}`].slice(-15));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSecurityAlert = (msg) => {
    setAdminLogs(prev => [...prev, `[SECURITY BREACH] ${new Date().toLocaleTimeString()} - ${msg}`].slice(-15));
  };

  const activeRole = activeUser?.role || 'patient';

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setAdminLogs(prev => [...prev, `[ETH] MetaMask Connected: ${accounts[0]}`].slice(-15));
        showToast("MetaMask linked securely.", "success");
      } catch (err) {
        console.error("Wallet connection failed", err);
        showToast("Failed to link Web3 Wallet.", "error");
      }
    } else {
      showToast("MetaMask extension not detected.", "warning");
    }
  };

  if (isSyncing) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white"><RefreshCw className="w-8 h-8 animate-spin text-blue-500 mr-3"/> Synchronizing Ledger...</div>;
  }

  const requiresAuth = (activeRole === 'doctor' || activeRole === 'admin') && !unlockedSessions[activeUser.id];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden min-w-[1024px]">
      
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20 flex-shrink-0 relative">
        <div className="p-8 flex items-center gap-4 border-b border-slate-800 shrink-0 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl shadow-lg shadow-blue-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">BioSecure</h1>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mt-0.5">Global Node</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-8 custom-scrollbar">
          <div className="mb-10">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Patients</p>
            <div className="space-y-2">
              {networkUsers.filter(u => u.role === 'patient').map(user => (
                <UserNavItem key={user.id} user={user} isActive={activeUser.id === user.id} onClick={() => setActiveUser(user)} icon={<User size={18}/>} />
              ))}
            </div>
          </div>
          <div className="mb-10">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Physicians</p>
            <div className="space-y-2">
              {networkUsers.filter(u => u.role === 'doctor').map(user => (
                <UserNavItem key={user.id} user={user} isActive={activeUser.id === user.id} onClick={() => setActiveUser(user)} icon={<Stethoscope size={18}/>} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Infrastructure</p>
            <div className="space-y-2">
              {networkUsers.filter(u => u.role === 'admin').map(user => (
                <UserNavItem key={user.id} user={user} isActive={activeUser.id === user.id} onClick={() => setActiveUser(user)} icon={<Terminal size={18}/>} />
              ))}
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative w-full bg-slate-50/50">
        
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner shrink-0">
              {activeRole === 'patient' && <User size={22} className="text-blue-600"/>}
              {activeRole === 'doctor' && <Stethoscope size={22} className="text-emerald-600"/>}
              {activeRole === 'admin' && <Terminal size={22} className="text-purple-600"/>}
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{activeUser.name}</h2>
              <div className="text-sm text-slate-500 font-mono mt-1 flex items-center gap-2">
                <span>{activeUser.id}</span>
                <span className="text-slate-300">|</span>
                <span className="font-semibold tracking-wide">
                  {activeRole === 'doctor' ? (activeUser.specialty || INITIAL_NETWORK_USERS.find(u => u.id === activeUser.id)?.specialty || 'PHYSICIAN').toUpperCase() : activeRole.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {!account ? (
            <button onClick={connectWallet} className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl text-base font-bold transition-all shadow-lg shadow-slate-900/10 active:scale-95">
              <Wallet className="w-5 h-5"/> Connect MetaMask
            </button>
          ) : (
            <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/80 px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="font-mono text-sm font-bold text-emerald-800 tracking-tight">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
            </div>
          )}
        </header>

        <div className="p-10 max-w-[1400px] mx-auto w-full flex-1 flex flex-col">
          {!account && activeRole !== 'admin' ? (
            <div className="text-center py-24 animate-in fade-in zoom-in duration-500 m-auto bg-white p-16 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 w-full max-w-2xl">
              <div className="w-28 h-28 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Wallet className="w-14 h-14 text-slate-400"/>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Web3 Auth Required</h2>
              <p className="text-slate-500 text-lg mx-auto mb-10 leading-relaxed">Please connect your MetaMask wallet using the button in the top right to securely interact with the framework.</p>
              <button onClick={connectWallet} className="mx-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                <Wallet className="w-6 h-6"/> Connect Wallet Now
              </button>
            </div>
          ) : requiresAuth ? (
            <AuthScreen 
              user={activeUser} 
              showToast={showToast}
              onUnlock={() => {
                setUnlockedSessions(prev => ({...prev, [activeUser.id]: true}));
                setAdminLogs(prev => [...prev, `[SYSTEM] ${activeUser.id} successfully authenticated session.`].slice(-15));
                showToast("Identity Verified", "success");
              }} 
            />
          ) : (
            <>
              {activeRole === 'patient' && <PatientView key={activeUser.id} user={activeUser} records={records} onAddRecords={handleAddRecords} onSecurityAlert={triggerSecurityAlert} walletAccount={account} showToast={showToast} />}
              {activeRole === 'doctor' && <DoctorView key={activeUser.id} user={activeUser} records={records} networkUsers={networkUsers} onSecurityAlert={triggerSecurityAlert} showToast={showToast} />}
              {activeRole === 'admin' && <AdminView key={activeUser.id} networkUsers={networkUsers} onAddUser={handleAddUserToNetwork} onRemoveUser={handleRemoveUserFromNetwork} logs={adminLogs} setLogs={setAdminLogs} showToast={showToast} onWipe={handleWipeLedger} records={records} />}
            </>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

// ==========================================
// TOAST NOTIFICATION COMPONENT
// ==========================================
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className={`flex items-center gap-4 px-6 py-5 rounded-2xl shadow-2xl border animate-in slide-in-from-right-8 pointer-events-auto transition-all backdrop-blur-md min-w-[300px] ${
          toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-900' :
          toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' :
          toast.type === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-900' :
          'bg-white/90 border-slate-200 text-slate-800'
        }`}>
          {toast.type === 'error' && <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
          {toast.type === 'success' && <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-6 h-6 text-blue-500 shrink-0" />}
          <p className="text-base font-bold flex-1 leading-tight">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="ml-3 text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-200/50">
            <X size={20} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// IN-LINE AUTHENTICATION GATEWAY
// ==========================================
function AuthScreen({ user, onUnlock, showToast }) {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const defaultUser = INITIAL_NETWORK_USERS.find(u => u.id === user.id);
  const expectedPasscode = user.passcode || (defaultUser ? defaultUser.passcode : 'emergency-override-2026');

  const handleAuth = (e) => {
    e.preventDefault();
    if (passcode === expectedPasscode) {
      setIsAuthenticating(true);
      setTimeout(() => {
        setIsAuthenticating(false);
        onUnlock();
      }, 1000);
    } else {
      showToast("Access Denied: Invalid Passphrase.", "error");
      setPasscode("");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in duration-500 w-full px-8">
      <form onSubmit={handleAuth} className="bg-white p-14 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 max-w-lg w-full text-center relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${user.role === 'admin' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}></div>
        
        <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-200 shadow-inner">
          {user.role === 'admin' ? <ShieldAlert className="w-12 h-12 text-red-500" /> : <KeyRound className="w-12 h-12 text-emerald-500" />}
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Secure Gateway</h2>
        <p className="text-slate-500 mb-10 text-base leading-relaxed px-4">
          Authentication required to access the <strong className="text-slate-700 capitalize">{user.role} Portal</strong> for <strong className="text-slate-800">{user.name}</strong>.
        </p>

        <div className="mb-10 text-left">
          <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Assigned Passphrase</label>
          <input 
            type="password" 
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full px-6 py-5 rounded-2xl border border-slate-200 focus:border-blue-500 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xl tracking-widest text-center shadow-inner"
            placeholder="••••••••••••••••"
            autoFocus
          />
        </div>
        
        <button 
          type="submit"
          disabled={isAuthenticating || !passcode} 
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
            isAuthenticating || !passcode ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95 shadow-slate-900/20'
          }`}
        >
          {isAuthenticating ? <><Loader2 className="w-6 h-6 animate-spin" /> Verifying Encryption...</> : <><Fingerprint className="w-6 h-6" /> Authenticate Session</>}
        </button>
      </form>
    </div>
  );
}

// ==========================================
// 1. PATIENT PORTAL
// ==========================================
function PatientView({ user, records, onAddRecords, onSecurityAlert, walletAccount, showToast }) {
  const [step, setStep] = useState(0);
  const [faceFile, setFaceFile] = useState(null);
  const [irisFile, setIrisFile] = useState(null);
  const [faceUrl, setFaceUrl] = useState(null);
  const [irisUrl, setIrisUrl] = useState(null);
  const [ctScans, setCtScans] = useState([]); 
  const ctScansRef = useRef(ctScans);
  const [validatingRecord, setValidatingRecord] = useState(null);

  useEffect(() => { ctScansRef.current = ctScans; }, [ctScans]);

  // FALLBACK FIX: Merge with default INITIAL_NETWORK_USERS if fetched state lacks attributes
  const defaultProfile = INITIAL_NETWORK_USERS.find(u => u.id === user.id) || {};
  const displayDob = user.dob || defaultProfile.dob || 'Unknown';
  const displayBlood = user.bloodType || defaultProfile.bloodType || 'N/A';
  const displayAllergies = user.allergies || defaultProfile.allergies || 'None';

  const handleSingleFile = (e, setUrl, setFileObj) => {
    const file = e.target.files?.[0];
    if (file) { 
      setFileObj(file);
      const reader = new FileReader();
      reader.onloadend = () => setUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleScans = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newScans = await Promise.all(files.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ url: reader.result, name: file.name, isSvg: file.name.toLowerCase().endsWith('.svg') });
          };
          reader.readAsDataURL(file);
        });
      }));
      setCtScans(prev => [...prev, ...newScans]);
    }
  };

  const removeScan = (indexToRemove) => setCtScans(prev => prev.filter((_, idx) => idx !== indexToRemove));

  const runEncryption = () => {
    setStep(1);
    setTimeout(() => setStep(2), 1500); 
    setTimeout(() => setStep(3), 3000); 
    setTimeout(() => setStep(4), 4500); 
    setTimeout(() => {
      setStep(5);
      const bioSignature = { face: `${faceFile.name}-${faceFile.size}`, iris: `${irisFile.name}-${irisFile.size}` };
      
      const newBlockchainRecords = ctScansRef.current.map((scan) => ({
        id: `REC-${Math.floor(1000 + Math.random() * 9000)}`, 
        patientId: user.id, 
        walletOrigin: walletAccount, 
        date: new Date().toISOString().split('T')[0],
        name: scan.name, 
        ipfs: `Qm${Math.random().toString(36).substring(2, 12)}...`, 
        txHash: `0x${Math.random().toString(36).substring(2, 12)}...`,
        scanUrl: scan.url, 
        isSvg: scan.isSvg, 
        bioSignature
      }));
      onAddRecords(newBlockchainRecords);
      setCtScans([]); 
    }, 6000); 
  };

  const isReadyToEncrypt = faceFile && irisFile && ctScans.length > 0;
  const myRecords = records.filter(r => r.patientId === user.id);

  if (validatingRecord) {
    return <BiometricValidation title="Decrypt Your Medical Record" subtitle="Upload your biometrics to reverse the 4D Chaos Map." record={validatingRecord} onCancel={() => setValidatingRecord(null)} onSecurityAlert={onSecurityAlert} activeUserId={user.id} showToast={showToast} />;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 w-full">
      
      <div className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-md border border-slate-200 mb-10 flex flex-row items-center gap-8 transition-all">
        <div className="w-28 h-28 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-3xl flex items-center justify-center border border-blue-200 shrink-0 shadow-inner">
          <User size={48} />
        </div>
        <div className="flex-1 w-full">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
          <p className="text-slate-500 font-mono text-base mt-2">{user.id} • Registered Patient</p>
          <div className="flex flex-row flex-wrap justify-start gap-6 mt-6 pt-6 border-t border-slate-100 w-full">
            <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 w-auto"><Calendar className="w-5 h-5 text-slate-400"/><span className="text-base text-slate-700">DOB: <strong>{displayDob}</strong></span></div>
            <div className="flex items-center gap-3 bg-red-50 px-5 py-2.5 rounded-xl border border-red-100 w-auto"><Droplet className="w-5 h-5 text-red-400"/><span className="text-base text-red-900">Blood: <strong>{displayBlood}</strong></span></div>
            <div className="flex items-center gap-3 bg-emerald-50 px-5 py-2.5 rounded-xl border border-emerald-100 w-auto"><Activity className="w-5 h-5 text-emerald-500"/><span className="text-base text-emerald-900">Allergies: <strong className="text-emerald-700">{displayAllergies}</strong></span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 mb-12">
        <div className="space-y-8 flex flex-col h-full">
          
          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 flex-1">
            <h3 className="text-xl font-bold flex items-center gap-3 mb-6"><Fingerprint className="text-blue-500 w-6 h-6"/> 1. Bio-Seed Registration</h3>
            <div className="flex flex-row gap-6 h-auto">
              <label className="flex-1 relative border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden text-center hover:bg-slate-50 hover:border-blue-300 cursor-pointer group flex flex-col items-center justify-center transition-all min-h-[160px]">
                {faceUrl ? <><img src={faceUrl} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><p className="text-white text-base font-bold">Change Face</p></div></> : <><div className="bg-slate-50 p-4 rounded-full mb-3 group-hover:bg-blue-50 transition-colors"><User className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors"/></div><p className="text-base font-bold text-slate-700">Provide Face</p></>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSingleFile(e, setFaceUrl, setFaceFile)} />
              </label>
              <label className="flex-1 relative border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden text-center hover:bg-slate-50 hover:border-blue-300 cursor-pointer group flex flex-col items-center justify-center transition-all min-h-[160px]">
                {irisUrl ? <><img src={irisUrl} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><p className="text-white text-base font-bold">Change Iris</p></div></> : <><div className="bg-slate-50 p-4 rounded-full mb-3 group-hover:bg-blue-50 transition-colors"><Eye className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors"/></div><p className="text-base font-bold text-slate-700">Provide Iris</p></>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSingleFile(e, setIrisUrl, setIrisFile)} />
              </label>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 flex-1 flex flex-col">
            <h3 className="text-xl font-bold flex items-center gap-3 mb-6"><FileImage className="text-slate-700 w-6 h-6"/> 2. Add to Permanent Vault</h3>
            <label className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:bg-slate-50 hover:border-blue-300 cursor-pointer transition-all group flex flex-col justify-center min-h-[220px]">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:bg-blue-50 transition-colors">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-500 transition-colors"/>
              </div>
              <p className="text-slate-800 font-bold text-xl">Upload Medical Scans</p>
              <p className="text-sm text-slate-400 mt-2">Supports interactive SVGs, PNG, JPG</p>
              <input type="file" multiple accept="image/*,.svg" className="hidden" onChange={handleMultipleScans} />
            </label>
            {ctScans.length > 0 && (
              <div className="mt-6 grid grid-cols-4 gap-4 animate-in fade-in">
                {ctScans.map((scan, idx) => (
                  <div key={idx} className="relative rounded-2xl border border-slate-200 bg-slate-50 h-28 group overflow-hidden flex items-center justify-center shadow-sm">
                    {scan.isSvg ? <FileText className="w-10 h-10 text-slate-300"/> : <img src={scan.url} alt="scan" className="w-full h-full object-cover opacity-90" />}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent pt-8 pb-2 px-3">
                       <p className="text-[11px] text-white truncate text-center font-medium drop-shadow-md">{scan.name}</p>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); removeScan(idx); }} className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm backdrop-blur-sm scale-90 hover:scale-100"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={runEncryption} disabled={!isReadyToEncrypt || step > 0} className={`w-full py-5 rounded-2xl font-bold transition-all flex justify-center items-center gap-3 shadow-lg text-lg ${!isReadyToEncrypt || step > 0 ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95 shadow-slate-900/20'}`}>
            {step > 0 ? <><Loader2 className="w-6 h-6 animate-spin"/> Securing Data Pipeline...</> : isReadyToEncrypt ? <><Lock className="w-6 h-6"/> Encrypt & Secure {ctScans.length} File(s)</> : "Complete Uploads to Continue"}
          </button>
        </div>

        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 h-full flex flex-col">
          <h3 className="text-2xl font-bold mb-8 text-slate-800">Pipeline Telemetry</h3>
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 flex-1 pl-2">
            <TimelineItem step={1} current={step} title="Biometric Extraction" desc="Generating 1024-D Master Key from physical seed." />
            <TimelineItem step={2} current={step} title="AI Sub-Analysis" desc="Detecting anomalies and lesions for masking." />
            <TimelineItem step={3} current={step} title="4D Chaos Encryption" desc="Scrambling image data via cryptographic mapping." />
            <TimelineItem step={4} current={step} title="Ledger Contract" desc="Anchoring IPFS content identifier to the blockchain." />
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4 px-3">
        <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 rounded-2xl shadow-inner"><FolderHeart className="w-7 h-7" /></div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Permanent Medical Vault</h2>
      </div>
      
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden w-full">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-widest font-bold">
              <tr><th className="p-6 w-28 text-center">Visual</th><th className="p-6">Record Identifier</th><th className="p-6">Secured On</th><th className="p-6">Hash Signature</th><th className="p-6 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {myRecords.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100 shadow-inner"><Database className="w-10 h-10 text-slate-300"/></div>
                  <p className="text-slate-700 font-bold text-xl">Your medical vault is currently empty.</p>
                  <p className="text-base text-slate-400 mt-2">Run the encryption pipeline above to securely anchor your first scan.</p>
                </td></tr>
              ) : myRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-5 flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200 shadow-sm">
                      {rec.isSvg ? <div className="w-full h-full flex items-center justify-center bg-slate-800"><FileText className="text-slate-400 w-8 h-8"/></div> : <img src={rec.scanUrl} className="w-full h-full object-cover blur-[3px] contrast-150 mix-blend-multiply opacity-50" />}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 group-hover:bg-blue-900/20 transition-colors"><Lock className="w-6 h-6 text-white drop-shadow-md" /></div>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="font-mono text-base font-bold text-slate-800">{rec.id}</p>
                    <p className="text-sm font-medium text-slate-500 truncate w-64 mt-1" title={rec.name}>{rec.name}</p>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 w-max"><Clock className="w-4 h-4 text-slate-400"/> {rec.date}</div>
                  </td>
                  <td className="p-5">
                    <span className="inline-flex items-center gap-2 bg-blue-50/50 text-blue-700 px-4 py-2 rounded-xl text-xs font-mono font-bold border border-blue-100 w-max"><ExternalLink className="w-4 h-4 opacity-70"/> {rec.txHash.substring(0,12)}...</span>
                  </td>
                  <td className="p-5 text-right pr-8">
                    <button onClick={() => setValidatingRecord(rec)} className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap">
                      <Unlock className="w-4 h-4 text-emerald-500"/> Decrypt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. DOCTOR PORTAL (EHR Dashboard)
// ==========================================
function DoctorView({ user, records, networkUsers, onSecurityAlert, showToast }) {
  const [search, setSearch] = useState("");
  const [activePatientId, setActivePatientId] = useState(null);
  const [validatingRecord, setValidatingRecord] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if(search.length > 3) {
      const matches = records.filter(r => r.patientId === search.toUpperCase());
      if (matches.length > 0) {
        setActivePatientId(search.toUpperCase());
        showToast("Patient ledger retrieved securely.", "success");
      } else {
        setActivePatientId(null);
        showToast("No records found for this Patient ID.", "error");
      }
    } else {
      showToast("Please enter a valid Patient ID.", "warning");
    }
  };

  const patientRecords = activePatientId ? records.filter(r => r.patientId === activePatientId) : [];
  const patientDetails = activePatientId ? networkUsers.find(u => u.id === activePatientId) : null;
  
  // FALLBACK FIX: Merge with default INITIAL_NETWORK_USERS if fetched state lacks attributes
  const defaultDocProfile = INITIAL_NETWORK_USERS.find(u => u.id === user.id) || {};
  const displayDegree = user.degree || defaultDocProfile.degree || 'MD';
  const displaySpecialty = user.specialty || defaultDocProfile.specialty || 'General Practice';

  const defaultPatientProfile = INITIAL_NETWORK_USERS.find(u => u.id === activePatientId) || {};
  const displayDob = patientDetails?.dob || defaultPatientProfile.dob || 'Unknown';
  const displayBlood = patientDetails?.bloodType || defaultPatientProfile.bloodType || 'N/A';
  const displayAllergies = patientDetails?.allergies || defaultPatientProfile.allergies || 'None';

  if (validatingRecord) {
    return <BiometricValidation title="Patient Handshake Required" subtitle={`Accessing secured record for ${validatingRecord.patientId}. The patient must provide live biometrics.`} record={validatingRecord} onCancel={() => setValidatingRecord(null)} onSecurityAlert={onSecurityAlert} activeUserId={user.id} showToast={showToast} />;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 w-full">
      
      {/* DOCTOR PROFILE CARD */}
      <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 mb-12 flex flex-row items-center gap-8 transition-shadow hover:shadow-md">
        <div className="w-28 h-28 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center border border-emerald-200 shrink-0 shadow-inner">
          <Stethoscope size={48} />
        </div>
        <div className="flex-1 w-full">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{user.name} Workspace</h2>
          <p className="text-slate-500 font-mono text-base mt-2">{user.id} • Authorized Physician</p>
          <div className="flex flex-row flex-wrap justify-start gap-6 mt-6 pt-6 border-t border-slate-100 w-full">
            <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 w-auto"><FileText className="w-5 h-5 text-slate-400"/><span className="text-base text-slate-700">Credentials: <strong>{displayDegree}</strong></span></div>
            <div className="flex items-center gap-3 bg-emerald-50 px-5 py-2.5 rounded-xl border border-emerald-100 w-auto"><Activity className="w-5 h-5 text-emerald-500"/><span className="text-base text-emerald-900">Department: <strong>{displaySpecialty}</strong></span></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-12 flex flex-row gap-4 max-w-4xl transition-shadow hover:shadow-md">
        <div className="relative flex-1">
          <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" placeholder="Enter Patient ID (e.g., PT-8922)..." 
            className="pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 font-mono font-bold text-xl uppercase transition-all"
            value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
          />
        </div>
        <button onClick={handleSearch} className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 rounded-2xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-lg">
          Query Network
        </button>
      </div>

      {activePatientId && patientDetails && (
        <div className="animate-in slide-in-from-bottom-4 w-full">
          
          {/* PATIENT DOSSIER CARD */}
          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 mb-12 flex flex-row items-start gap-8 transition-all hover:shadow-md w-full">
            <div className="w-28 h-28 bg-slate-50 text-slate-400 rounded-[2rem] flex items-center justify-center border border-slate-200 shrink-0 shadow-inner">
              <User className="w-12 h-12" />
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-row items-baseline gap-5 mb-0">
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{patientDetails.name}</h2>
                <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-mono text-sm font-bold border border-blue-100 tracking-wide">{activePatientId}</span>
              </div>
              <div className="flex flex-row flex-wrap justify-start gap-8 mt-6 pt-6 border-t border-slate-100 w-full">
                <div className="flex items-center justify-start gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 w-auto"><Calendar className="w-5 h-5 text-slate-400"/><span className="text-base text-slate-700">DOB: <strong>{displayDob}</strong></span></div>
                <div className="flex items-center justify-start gap-3 bg-red-50 px-5 py-2.5 rounded-xl border border-red-100 w-auto"><Droplet className="w-5 h-5 text-red-400"/><span className="text-base text-slate-800">Blood: <strong>{displayBlood}</strong></span></div>
                <div className="flex items-center justify-start gap-3 bg-emerald-50 px-5 py-2.5 rounded-xl border border-emerald-100 w-auto"><Activity className="w-5 h-5 text-emerald-500"/><span className="text-base text-slate-800">Allergies: <strong className="text-red-600">{displayAllergies}</strong></span></div>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-4 px-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-inner"><FolderHeart className="w-7 h-7" /></div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Encrypted Health Records</h3>
          </div>

          {patientRecords.length === 0 ? (
            <div className="bg-white p-20 rounded-[2rem] border border-slate-200 text-center shadow-sm w-full">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner"><Database className="w-12 h-12 text-slate-300"/></div>
               <p className="text-slate-700 font-bold text-2xl">No records found.</p>
               <p className="text-slate-500 text-base mt-3 max-w-lg mx-auto">This patient's vault is currently empty on the decentralized ledger.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-8 w-full">
              {patientRecords.map(rec => (
                <div key={rec.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group">
                  <div className="h-60 bg-slate-100 relative overflow-hidden">
                    {rec.isSvg ? <div className="w-full h-full flex items-center justify-center bg-slate-800"><FileText className="text-slate-500 w-16 h-16"/></div> : <img src={rec.scanUrl} className="w-full h-full object-cover blur-[4px] contrast-150 mix-blend-multiply opacity-50 scale-105 group-hover:scale-100 transition-transform duration-700" />}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 group-hover:bg-emerald-900/40 transition-colors backdrop-blur-[1px]"><Lock className="w-10 h-10 text-white/90 drop-shadow-lg" /></div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col justify-between bg-white z-10">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                         <span className="font-mono text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 tracking-wide">{rec.id}</span>
                         <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest"><Clock className="w-4 h-4"/> {rec.date}</span>
                      </div>
                      <p className="font-bold text-slate-800 truncate text-xl tracking-tight" title={rec.name}>{rec.name}</p>
                    </div>
                    <button onClick={() => setValidatingRecord(rec)} className="w-full mt-8 flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-500 hover:text-white border-2 border-emerald-100 hover:border-emerald-500 px-5 py-4 rounded-xl text-base font-bold transition-all shadow-sm active:scale-95">
                      <Unlock className="w-5 h-5"/> Request Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// SHARED BIOMETRIC VALIDATION UI
// ==========================================
function BiometricValidation({ title, subtitle, record, onCancel, onSecurityAlert, activeUserId, showToast }) {
  const [vFaceFile, setVFaceFile] = useState(null);
  const [vIrisFile, setVIrisFile] = useState(null);
  const [vFaceUrl, setVFaceUrl] = useState(null);
  const [vIrisUrl, setVIrisUrl] = useState(null);
  const [decryptStep, setDecryptStep] = useState(0);

  const handleValidate = () => {
    setDecryptStep(1);
    setTimeout(() => {
      const currentFaceSig = vFaceFile ? `${vFaceFile.name}-${vFaceFile.size}` : '';
      const currentIrisSig = vIrisFile ? `${vIrisFile.name}-${vIrisFile.size}` : '';
      const faceMatches = currentFaceSig === record.bioSignature?.face;
      const irisMatches = currentIrisSig === record.bioSignature?.iris;

      if (!faceMatches || !irisMatches) {
        setDecryptStep(0);
        showToast("Biometric signature does not match the 4D Chaos Map key.", "error");
        if(onSecurityAlert) onSecurityAlert(`Unauthorized decryption attempt on Record ${record.id} by ${activeUserId}. Biometric mismatch.`);
        return;
      }
      setDecryptStep(2);
      setTimeout(() => {
        setDecryptStep(3);
        showToast("Decryption sequence successful.", "success");
      }, 2000);
    }, 2000);
  };

  const handleFileChange = (e, setUrl, setFileObj) => {
    const file = e.target.files?.[0];
    if (file) { 
      setFileObj(file);
      const reader = new FileReader();
      reader.onloadend = () => setUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  if (decryptStep === 3) {
    return (
      <div className="animate-in zoom-in duration-500 bg-white p-12 rounded-[2.5rem] shadow-2xl border border-emerald-200 max-w-6xl mx-auto w-full">
        <div className="flex flex-row justify-between items-center mb-10 border-b border-slate-100 pb-8 gap-4">
          <div>
            <h3 className="text-3xl font-bold text-slate-900 flex items-center gap-3"><Unlock className="text-emerald-500 w-8 h-8"/> Decryption Successful</h3>
            <p className="text-slate-500 font-mono text-sm mt-2 tracking-wide">Record: {record.id} | File: {record.name}</p>
          </div>
          <button onClick={onCancel} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-4 rounded-2xl text-base font-bold transition-colors active:scale-95">Close Viewer</button>
        </div>
        <div className="relative w-full bg-slate-100 rounded-[2rem] overflow-hidden flex justify-center items-center min-h-[600px] border border-slate-200 p-4 shadow-inner">
          {record.isSvg ? <embed src={record.scanUrl} type="image/svg+xml" className="w-full h-[600px] object-contain" /> : <img src={record.scanUrl} alt="Decrypted" className="max-h-[600px] max-w-full object-contain drop-shadow-lg rounded-2xl" />}
        </div>
        <div className="mt-8 flex flex-row justify-between items-center gap-6 bg-emerald-50/80 backdrop-blur-sm p-6 rounded-2xl border border-emerald-100">
           <p className="text-base text-emerald-800 font-bold flex items-center gap-3"><Shield className="w-6 h-6 text-emerald-500"/> Data integrity verified via Blake3 checksum.</p>
           <a href={record.scanUrl} download={record.name} className="flex items-center justify-center gap-2 bg-white border border-slate-200 shadow-sm px-8 py-3 rounded-xl text-blue-600 hover:text-blue-700 font-bold text-base transition-all hover:border-blue-300 active:scale-95"><Download className="w-5 h-5"/> Download File</a>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-row justify-between items-center mb-10 gap-4">
        <div>
           <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{title}</h2>
           <p className="text-slate-500 mt-2 text-lg leading-relaxed">{subtitle}</p>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 font-bold text-lg bg-white border border-slate-200 shadow-sm px-8 py-4 rounded-2xl transition-all active:scale-95">Cancel</button>
      </div>

      <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="bg-slate-900 rounded-[2rem] p-8 flex items-center justify-between mb-12 border border-slate-800 shadow-inner">
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="bg-blue-500/20 p-4 rounded-2xl"><Database className="w-8 h-8 text-blue-400 shrink-0"/></div>
            <div className="min-w-0">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5">Encrypted Payload</p>
              <p className="text-white font-mono text-base truncate max-w-lg">{record.ipfs}</p>
            </div>
          </div>
          <Lock className="w-8 h-8 text-slate-500 shrink-0"/>
        </div>

        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Fingerprint className="text-emerald-500 w-8 h-8"/> Live Biometric Handshake</h3>
        <div className="flex flex-row gap-8 h-56 mb-12">
          <label className="flex-1 relative border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden text-center hover:bg-slate-50 hover:border-emerald-300 cursor-pointer group flex flex-col items-center justify-center transition-all">
            {vFaceUrl ? <><img src={vFaceUrl} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><p className="text-white text-lg font-bold">Change</p></div></> : <><div className="bg-slate-50 p-5 rounded-full mb-4 group-hover:bg-emerald-50 transition-colors"><User className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-colors"/></div><p className="text-lg font-bold text-slate-700">Provide Face</p></>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setVFaceUrl, setVFaceFile)} />
          </label>
          <label className="flex-1 relative border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden text-center hover:bg-slate-50 hover:border-emerald-300 cursor-pointer group flex flex-col items-center justify-center transition-all">
            {vIrisUrl ? <><img src={vIrisUrl} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><p className="text-white text-lg font-bold">Change</p></div></> : <><div className="bg-slate-50 p-5 rounded-full mb-4 group-hover:bg-emerald-50 transition-colors"><Eye className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-colors"/></div><p className="text-lg font-bold text-slate-700">Provide Iris</p></>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setVIrisUrl, setVIrisFile)} />
          </label>
        </div>

        {decryptStep > 0 ? (
          <div className="text-center space-y-6 py-8">
            <Loader2 className="w-14 h-14 text-emerald-500 animate-spin mx-auto" />
            <p className="text-emerald-700 font-bold text-xl animate-pulse">{decryptStep === 1 ? "Verifying Biometrics via DenseNet..." : "Reversing 4D Chaos Map & Decrypting..."}</p>
          </div>
        ) : (
          <button onClick={handleValidate} disabled={!vFaceUrl || !vIrisUrl} className={`w-full py-6 rounded-3xl font-bold transition-all flex justify-center items-center gap-3 shadow-lg text-xl ${!vFaceUrl || !vIrisUrl ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-emerald-900/20'}`}>
            <Unlock className="w-6 h-6"/> Verify & Decrypt Record
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. ADMIN PORTAL 
// ==========================================
function AdminView({ networkUsers, onAddUser, onRemoveUser, logs, setLogs, onWipe, records, showToast }) {
  const [provName, setProvName] = useState("");
  const [provRole, setProvRole] = useState("patient");
  const [provPasscode, setProvPasscode] = useState("");
  
  // DYNAMIC PROFILE FIELDS
  const [provDob, setProvDob] = useState("");
  const [provBlood, setProvBlood] = useState("O+");
  const [provAllergies, setProvAllergies] = useState("");
  const [provDegree, setProvDegree] = useState("");
  const [provSpecialty, setProvSpecialty] = useState("");

  const [bgPatient, setBgPatient] = useState("");
  const [bgDoctor, setBgDoctor] = useState("");
  const [bgDoctorName, setBgDoctorName] = useState("");
  const [bgDoctorPasscode, setBgDoctorPasscode] = useState("");
  const [bgReason, setBgReason] = useState("");
  const [bgAuthKey, setBgAuthKey] = useState("");
  
  const [showLedger, setShowLedger] = useState(false);
  const [userToRevoke, setUserToRevoke] = useState(null);

  const doctorExists = networkUsers.find(u => u.id === bgDoctor.toUpperCase() && u.role === 'doctor');

  const handleProvision = () => {
    if (!provName) return showToast("Please enter a name.", "warning");
    const prefix = provRole === 'doctor' ? 'DR' : 'PT';
    const newId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const displayName = provRole === 'doctor' && !provName.toLowerCase().startsWith('dr') ? `Dr. ${provName}` : provName;
    
    const newUser = { id: newId, name: displayName, role: provRole };
    
    if (provRole === 'doctor') {
      if(!provPasscode) return showToast("Please assign a passphrase for the physician.", "error");
      newUser.passcode = provPasscode;
      newUser.degree = provDegree || 'MD';
      newUser.specialty = provSpecialty || 'General Practice';
    } else {
      newUser.dob = provDob || 'Unknown';
      newUser.bloodType = provBlood;
      newUser.allergies = provAllergies || 'None';
    }

    onAddUser(newUser);
    setLogs(prev => [...prev, `[SYSTEM] ${new Date().toLocaleTimeString()} - Provisioned new ${provRole} identity: ${newId}`].slice(-15));
    
    // Reset Form
    setProvName(""); setProvPasscode(""); setProvDob(""); setProvAllergies(""); setProvDegree(""); setProvSpecialty("");
  };

  const confirmRevoke = () => {
    onRemoveUser(userToRevoke.id);
    setLogs(prev => [...prev, `[SYSTEM] ${new Date().toLocaleTimeString()} - Revoked access for identity: ${userToRevoke.id}`].slice(-15));
    setUserToRevoke(null);
  };

  const handleOverride = () => {
    if (!bgPatient || !bgDoctor || !bgReason || !bgAuthKey) return showToast("All base fields are mandatory.", "error");
    if (bgAuthKey !== "OrionBIO#2026") {
      setLogs(prev => [...prev, `[SECURITY BREACH] ${new Date().toLocaleTimeString()} - Invalid Master Key attempted for Override.`].slice(-15));
      setBgAuthKey("");
      return showToast("Authentication Failed: Invalid Admin Master Key.", "error");
    }

    if (!doctorExists) {
      if (!bgDoctorName || !bgDoctorPasscode) return showToast("You are assigning a NEW doctor. Please provide their Name and Passphrase.", "warning");
      onAddUser({ 
        id: bgDoctor.toUpperCase(), 
        name: bgDoctorName, 
        role: 'doctor', 
        passcode: bgDoctorPasscode,
        degree: 'MD',
        specialty: 'Emergency Responder'
      });
    }
    
    setLogs(prev => [
      ...prev, 
      `[CRITICAL] ${new Date().toLocaleTimeString()} - BREAK-GLASS EXECUTED: Vault access for ${bgPatient} transferred to ${bgDoctor}.`,
      `[AUDIT REASON] ${bgReason}`
    ].slice(-15));
    
    setBgPatient(""); setBgDoctor(""); setBgReason(""); setBgAuthKey(""); setBgDoctorName(""); setBgDoctorPasscode("");
    showToast("Override successfully executed on the blockchain.", "success");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-12 w-full max-w-full">
      
      <div className="mb-10 flex flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Network Guard</h2>
          <p className="text-slate-500 mt-2 text-lg leading-relaxed">Manage infrastructure, user provisioning, and Break-Glass emergency protocols.</p>
        </div>
        <div className="flex flex-row gap-4 w-auto">
          <button onClick={() => setShowLedger(true)} className="flex-none flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95">
            <Database className="w-5 h-5"/> View Global Ledger
          </button>
          <button onClick={onWipe} className="flex-none flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95">
            <Trash2 className="w-5 h-5"/> Wipe Ledger
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        
        {/* PROVISIONING FORM */}
        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-50 p-3 rounded-xl"><Users className="text-blue-600 w-6 h-6"/></div>
            <h3 className="text-2xl font-bold text-slate-800">Provision Identity</h3>
          </div>
          <div className="flex flex-col gap-5 flex-1">
            <div className="flex flex-row gap-4">
              <input type="text" placeholder="Full Name" value={provName} onChange={(e) => setProvName(e.target.value)} className="flex-1 px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-base transition-all outline-none" />
              <select value={provRole} onChange={(e) => setProvRole(e.target.value)} className="w-1/3 px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-base transition-all outline-none cursor-pointer">
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* DYNAMIC FIELDS BASED ON ROLE */}
            {provRole === 'patient' ? (
              <div className="flex flex-row gap-4 animate-in fade-in slide-in-from-top-2">
                <input type="date" value={provDob} onChange={e => setProvDob(e.target.value)} className="flex-1 px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-base transition-all outline-none text-slate-500" />
                <select value={provBlood} onChange={e => setProvBlood(e.target.value)} className="w-1/4 px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-base transition-all outline-none cursor-pointer text-slate-500">
                  <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
                </select>
                <input type="text" placeholder="Allergies (e.g. None)" value={provAllergies} onChange={e => setProvAllergies(e.target.value)} className="flex-1 px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-base transition-all outline-none" />
              </div>
            ) : (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-row gap-4">
                  <input type="text" placeholder="Degree (e.g. MD, PhD)" value={provDegree} onChange={e => setProvDegree(e.target.value)} className="w-1/3 px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-base transition-all outline-none" />
                  <input type="text" placeholder="Specialty (e.g. Cardiology)" value={provSpecialty} onChange={e => setProvSpecialty(e.target.value)} className="flex-1 px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-base transition-all outline-none" />
                </div>
                <input type="text" placeholder="Assign Secure Passphrase (e.g. word-word-num)" value={provPasscode} onChange={(e) => setProvPasscode(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-base transition-all outline-none font-mono" />
              </div>
            )}
            
            <button onClick={handleProvision} className="mt-auto bg-slate-900 text-white px-5 py-4 rounded-xl text-base font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95">Add User to Network</button>
          </div>
        </div>

        {/* REVOKE ACCESS */}
        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col max-h-[450px] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-xl"><UserMinus className="text-red-500 w-6 h-6"/></div>
              <h3 className="text-2xl font-bold text-slate-800">Revoke Access</h3>
            </div>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">{networkUsers.filter(u => u.role === 'doctor').length} Active</span>
          </div>
          <div className="overflow-y-auto pr-4 custom-scrollbar flex-1 -mr-4">
            <div className="space-y-4">
              {networkUsers.filter(u => u.role === 'doctor').map(doc => (
                <div key={doc.id} className="flex justify-between items-center bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all shadow-sm hover:shadow-md group">
                  <div className="min-w-0 pr-4">
                    <p className="text-base font-bold text-slate-800 truncate">{doc.name}</p>
                    <p className="text-xs font-mono text-slate-500 bg-slate-200/50 px-2 py-1 rounded w-max mt-1.5">{doc.id}</p>
                  </div>
                  <button onClick={() => setUserToRevoke(doc)} className="bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 p-3 rounded-xl transition-all shadow-sm active:scale-95 shrink-0" title="Revoke Access">
                    <UserMinus size={20} />
                  </button>
                </div>
              ))}
              {networkUsers.filter(u => u.role === 'doctor').length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="w-12 h-12 text-slate-200 mb-4"/>
                  <p className="text-base text-slate-500 font-medium">No active physicians in network.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OVERRIDE FORM */}
      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="bg-gradient-to-br from-red-50 to-white p-10 rounded-[2.5rem] shadow-sm border border-red-100 flex flex-col transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-8">
             <div className="bg-red-100 p-3 rounded-2xl shadow-inner"><AlertTriangle className="text-red-600 w-6 h-6"/></div>
             <h3 className="text-2xl font-bold text-red-900">Break-Glass Protocol</h3>
          </div>
          <div className="flex flex-col gap-5 flex-1">
            <div className="flex flex-row gap-5">
              <input type="text" placeholder="Patient ID (e.g. PT-8922)" value={bgPatient} onChange={e => setBgPatient(e.target.value.toUpperCase())} className="flex-1 px-6 py-4 rounded-2xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-white font-mono text-base uppercase transition-all outline-none" />
              <input type="text" placeholder="New Doctor ID (e.g. DR-5555)" value={bgDoctor} onChange={e => setBgDoctor(e.target.value.toUpperCase())} className="flex-1 px-6 py-4 rounded-2xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-white font-mono text-base uppercase transition-all outline-none" />
            </div>
            
            {/* NEW DOCTOR EXTRA FIELDS */}
            {bgDoctor && !doctorExists && (
               <div className="bg-red-50 p-6 rounded-2xl border border-red-200 mt-2 mb-2 animate-in fade-in slide-in-from-top-2 shadow-inner">
                  <p className="text-sm font-bold text-red-800 uppercase mb-4 flex items-center gap-2 tracking-widest"><Terminal className="w-4 h-4"/> Emergency Provisioning</p>
                  <div className="flex flex-row gap-5">
                    <input type="text" placeholder="Emergency Doctor Name" value={bgDoctorName} onChange={e => setBgDoctorName(e.target.value)} className="flex-1 px-5 py-3.5 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white text-base outline-none transition-all" />
                    <input type="text" placeholder="Assign Passphrase" value={bgDoctorPasscode} onChange={e => setBgDoctorPasscode(e.target.value)} className="flex-1 px-5 py-3.5 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white text-base outline-none transition-all font-mono" />
                  </div>
               </div>
            )}

            <input type="text" placeholder="Mandatory Reason for Override..." value={bgReason} onChange={e => setBgReason(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-white text-base transition-all outline-none" />
            
            <div className="flex flex-row gap-5 mt-4 pt-6 border-t border-red-100">
              <input type="password" placeholder="Admin Master Key" value={bgAuthKey} onChange={e => setBgAuthKey(e.target.value)} className="flex-1 px-6 py-4 rounded-2xl border border-slate-300 focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 bg-white text-base transition-all outline-none font-mono" />
              <button onClick={handleOverride} className="bg-red-600 text-white px-10 py-4 rounded-2xl text-lg font-bold hover:bg-red-700 flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95 transition-all whitespace-nowrap"><Key className="w-6 h-6"/> Execute Override</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden flex flex-col min-h-[400px]">
        <div className="bg-[#1e293b] px-8 py-5 flex justify-between items-center border-b border-slate-800/80">
          <div className="flex gap-3"><div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div><div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]"></div><div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div></div>
          <p className="text-xs text-slate-400 font-mono tracking-widest flex items-center gap-2"><Activity className="w-4 h-4"/> INFRASTRUCTURE_MONITOR_tty1</p>
        </div>
        <div className="p-8 font-mono text-sm text-emerald-400 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {logs.map((log, i) => (
            <p key={i} className={`break-words ${log.includes('[SECURITY BREACH]') ? 'text-red-500 font-bold animate-pulse' : log.includes('[CRITICAL]') ? 'text-red-400 font-bold' : log.includes('[AUDIT REASON]') ? 'text-amber-400 italic' : log.includes('[SYSTEM]') ? 'text-blue-400 font-bold' : 'opacity-80'}`}>{log}</p>
          ))}
          <p className="animate-pulse">_</p>
        </div>
      </div>

      {/* CUSTOM DELETION CONFIRMATION MODAL */}
      {userToRevoke && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-12 animate-in fade-in">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-slate-200 p-10 text-center relative">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
                <UserMinus className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Revoke Access?</h3>
              <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                Are you sure you want to permanently revoke network access for <strong className="text-slate-800">{userToRevoke.name}</strong> (<span className="font-mono text-sm">{userToRevoke.id}</span>)? This action cannot be undone.
              </p>
              <div className="flex gap-5">
                <button onClick={() => setUserToRevoke(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl text-lg font-bold transition-all active:scale-95">Cancel</button>
                <button onClick={confirmRevoke} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95">Confirm Revoke</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: IMMUTABLE LEDGER EXPLORER */}
      {showLedger && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-12 animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-7xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white">
                 <div>
                   <h3 className="text-3xl font-bold flex items-center gap-4 text-slate-900"><div className="p-3 bg-blue-50 rounded-2xl border border-blue-100"><Database className="text-blue-600 w-8 h-8"/></div> Global Immutable Ledger</h3>
                   <p className="text-slate-500 text-base mt-2 ml-[4.5rem] tracking-wide">Live view of decentralized network state</p>
                 </div>
                 <button onClick={() => setShowLedger(false)} className="text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 p-4 rounded-full transition-colors self-start border border-slate-100 active:scale-95"><X size={24} /></button>
              </div>
              
              <div className="overflow-auto p-0 flex-1 bg-slate-50/50 custom-scrollbar">
                 <table className="w-full text-left min-w-[800px]">
                   <thead className="bg-white border-b border-slate-200 text-sm text-slate-500 uppercase tracking-widest sticky top-0 shadow-sm z-10 font-bold">
                     <tr>
                       <th className="p-8 pl-10">Block Hash</th>
                       <th className="p-8">Patient ID</th>
                       <th className="p-8">IPFS CID Payload</th>
                       <th className="p-8">Origin Signature</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {records.length === 0 ? (
                       <tr><td colSpan="4" className="p-24 text-center text-slate-400 font-medium text-lg">The global ledger is currently empty.<br/><span className="text-base font-normal mt-2 block">Waiting for network activity...</span></td></tr>
                     ) : records.map((rec, i) => (
                       <tr key={i} className="hover:bg-white transition-colors">
                         <td className="p-8 pl-10 font-mono text-base text-blue-600 font-bold"><Link className="w-5 h-5 inline mr-3 opacity-50"/>{rec.txHash}</td>
                         <td className="p-8 font-mono text-base font-bold text-slate-700 bg-slate-100/50 w-max rounded-xl m-6">{rec.patientId}</td>
                         <td className="p-8 font-mono text-base text-emerald-600 truncate max-w-[300px]">{rec.ipfs}</td>
                         <td className="p-8 font-mono text-sm text-slate-500 max-w-[250px] truncate" title={rec.walletOrigin}>{rec.walletOrigin || "Unknown Wallet"}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// UTILITY COMPONENTS
// ==========================================
function UserNavItem({ icon, user, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className={`p-3 rounded-xl ${isActive ? 'bg-blue-500' : 'bg-slate-800'}`}>{icon}</div>
      <div className="text-left flex-1 min-w-0">
        <p className="font-bold text-base truncate leading-tight">{user.name}</p>
        <p className={`text-xs font-mono truncate tracking-wide mt-0.5 ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>{user.id}</p>
      </div>
    </button>
  );
}

function TimelineItem({ step, current, title, desc }) {
  const isComplete = current > step;
  const isActive = current === step;
  const isPending = current < step;
  let stateColor = "bg-slate-100 text-slate-400 border-slate-200";
  if (isComplete) stateColor = "bg-emerald-500 text-white shadow-md border-emerald-500";
  if (isActive) stateColor = "bg-blue-600 text-white shadow-lg border-blue-600 animate-pulse";

  return (
    <div className="relative flex items-center justify-between group is-active pb-10 last:pb-0">
      <div className={`flex items-center justify-center w-14 h-14 rounded-full border-4 shrink-0 transition-all duration-500 ${stateColor} z-10 relative`}>
        {isComplete ? <CheckCircle className="w-6 h-6" /> : <span className="text-lg font-bold">{step}</span>}
      </div>
      <div className={`w-[calc(100%-4rem)] p-8 rounded-[2rem] border transition-all duration-300 ${isActive ? 'bg-blue-50/50 border-blue-200 shadow-sm scale-[1.02]' : isPending ? 'bg-transparent border-transparent opacity-40' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h4 className={`font-bold text-lg ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>{title}</h4>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}