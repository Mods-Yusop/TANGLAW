import { useState, useEffect } from 'react'
import axios from 'axios'
import { RotateCcw, Download, Trash2, X, UserPlus, LogOut, Filter, Edit3, MoreHorizontal, Save, FolderOpen, ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, LayoutDashboard, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react'



import { io } from 'socket.io-client';

// Dynamic API URL for LAN support
// Dynamic API URL for LAN support (HTTPS)
const HOST = window.location.hostname;
const API_URL = `https://${HOST}:3000/api`;
const SOCKET_URL = `https://${HOST}:3000`;

// Enable credentials for cookies
axios.defaults.withCredentials = true;

// Types
interface Staff {
  id: number
  name: string
  position: string
  role: string
}

interface Student {
  id: string
  firstName: string
  middleInitial?: string
  lastName: string
  college: string
  program: string
  yearLevel: number
  section: string
  totalPaid: string
  balance: string
  paymentStatus: string
  packageType: string
}

interface Transaction {
  id: number
  student: Student
  packageTypeSnapshot: string
  amountPaid: string
  paymentMode: string
  orNumber: string
  createdAt: string
  staff: { name: string }
}

interface Analytics {
  totalCollections: number
  todayCollections: number
  totalStudents: number
  fullyPaid: number
  partialPaid: number
  packageBreakdown: { A: number; B: number; C: number }
  collegeBreakdown: Record<string, { amount: number; studentCount: number }>
  staffBreakdown: Record<string, { name: string; amount: number; transactionCount: number }>
  dailyTrend: { date: string; amount: number }[]
}

// College-Program mapping for dropdowns
const COLLEGE_PROGRAMS: Record<string, string[]> = {
  "CASS": [
    "Bachelor of Science in Criminology (BSCriminology)",
    "Bachelor of Arts in English Language (ABEnglish)",
    "Bachelor of Arts in Psychology (ABPsych)",
    "Bachelor of Arts in Political Science (ABPolSci)",
    "Bachelor of Science in Development Communication (BSDC)",
    "Bachelor of Arts in Philosophy (ABPhilos)"
  ],
  "CASS - Libungan Campus": [
    "Bachelor of Science in Criminology (BSCrim Libungan)"
  ],
  "CASS - Mlang Campus": [
    "Bachelor of Science in Criminology (BSCrim Mlang)"
  ],
  "CBDEM": [
    "Bachelor of Science in Accountancy (BSAccnty)",
    "Bachelor of Science in Agribusiness (BSAgriBus)",
    "Bachelor of Science in Agricultural Economics (BSAgEcon)",
    "Bachelor of Science in Business Administration",
    "Bachelor of Public Administration (BPAd)",
    "Bachelor of Science in Management Accounting (BSMA)"
  ],
  "CBDEM - Libungan Campus": [
    "Bachelor of Science in Business Administration (BSBA Libungan)"
  ],
  "CHEFS": [
    "Bachelor of Science in Food Technology (BSFT)",
    "Bachelor of Science in Hospitality Management (BSHM)",
    "Bachelor of Science in Nutrition and Dietetics (BSND)",
    "Bachelor of Science in Tourism Management (BSTM)"
  ],
  "CHEFS - Libungan": [
    "Bachelor of Science in Hospitality Management (BSHM-Libungan)"
  ],
  "CA": [
    "Certificate in Agricultural Science (2nd year BSA)",
    "Bachelor of Science in Agriculture (BSA)",
    "Bachelor of Science in Agricultural Technology",
    "Bachelor of Science in Fisheries (BSF)"
  ],
  "CA - Libungan Campus": [
    "Bachelor of Science in Agriculture (BSA - Libungan)"
  ],
  "CHS": [
    "BS Pharmacy (BS Pharmacy)",
    "Diploma of Midwifery",
    "Bachelor of Science in Nursing (BSN)"
  ],
  "IMEAS": [
    "Bachelor of Arts in Islamic Studies (BAIS)",
    "Bachelor of Science in International Relations (BSIR)"
  ],
  "CHK": [
    "Bachelor of Physical Education (BPE)",
    "Bachelor of Science in Exercise and Sports Sciences"
  ],
  "CED": [
    "Bachelor of Elementary Education (BEED)",
    "Bachelor of Secondary Education (BSE)"
  ],
  "CED - Libungan Campus": [
    "Bachelor of Secondary Education (BSE - Libungan)"
  ],
  "CED - Aleosan Campus": [
    "Bachelor of Elementary Education (BEED - Aleosan)"
  ],
  "CVM": [
    "Doctor of Veterinary Medicine (DVM)",
    "BS Veterinary Technology (BS Vet Tech)"
  ],
  "CVM - Aleosan Campus": [
    "BS Veterinary Technology (BS Vet Tech Aleosan)"
  ],
  "CTI": [
    "Bachelor of Science in Industrial Technology (BSIT)",
    "Bachelor of Technical-Vocational Teacher Education (BTVTEd)"
  ],
  "MED": [
    "Doctor of Medicine"
  ],
  "COL": [
    "Juris Doctor"
  ],
  "Graduate School": [
    "PhD in Agricultural Sciences major in Crop Production and Management",
    "PhD in Agricultural Sciences major in Animal Science",
    "PhD in Education Major in Mathematics",
    "PhD in Education Major in Biology",
    "PhD in Education Major in Applied Linguistics",
    "PhD in Education Major in Filipino",
    "PhD in Extension Education",
    "PhD in Rural Development",
    "EdD Major in Educational Management",
    "MS in Biology",
    "MS in Plant Breeding",
    "MS in Horticulture",
    "MS in Animal Science",
    "MS in Agronomy",
    "MS in Crop Protection",
    "MS in Agriculture and Biosystems Engineering",
    "MS in Rural Economic Development",
    "MST Biology",
    "MST Chemistry",
    "MST Mathematics",
    "MST Physics",
    "MAED Major in Educational Management",
    "MAED Major in Elementary Education",
    "MAED Major in Social Sciences",
    "MALT Filipino",
    "MALT English",
    "MS in Extension Education",
    "Master in Public Administration",
    "MA in Home Economics",
    "MA in Teaching Industrial Arts",
    "Master in Information Systems",
    "Master of Eng'g. in Rural Infrastructure Engineering",
    "MS Agricultural Economics"
  ],
  "CSM": [
    "Bachelor of Science in Environmental Science (BSEnS)",
    "Bachelor of Science in Chemistry (BSChem)",
    "Bachelor of Science in Microbiology",
    "Bachelor of Science in Biology (BSBio)",
    "Bachelor of Science in Applied Mathematics (BSAM)",
    "Bachelor of Science in Applied Physics (BSAP)"
  ],
  "CEIT": [
    "Bachelor of Science in Agricultural and Biosystems Engineering (BSABE)",
    "Bachelor of Science in Civil Engineering (BSCE)",
    "Bachelor of Science in Computer Engineering (BSCpE)",
    "Bachelor of Science in Computer Science (BSCS)",
    "Bachelor of Science in Electronics Engineering (BSEcE)",
    "Bachelor of Science in Information Systems (BS InfoSys)",
    "Bachelor of Library and Information Science (BLIS)"
  ]
}

const COLLEGE_LIST = Object.keys(COLLEGE_PROGRAMS)
const COLLEGES = ['All Colleges', ...COLLEGE_LIST]

function App() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Data State
  const [ledger, setLedger] = useState<Transaction[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('All Colleges')
  const [paymentModeFilter, setPaymentModeFilter] = useState('All Modes')

  // Student Input
  const [studentId, setStudentId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleInitial, setMiddleInitial] = useState('')
  const [college, setCollege] = useState('')
  const [program, setProgram] = useState('')
  const [section, setSection] = useState('')
  const [yearLevel, setYearLevel] = useState<number | string>(1)
  const [isNewStudent, setIsNewStudent] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [idNotFound, setIdNotFound] = useState(false)

  // Transaction Form
  const [packageType, setPackageType] = useState('A')
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [orNumber, setOrNumber] = useState('')
  const [amountPaid, setAmountPaid] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<{ type: 'VOID' | 'EDIT' | 'ADD_PAYMENT', txId: number } | null>(null)

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editingTxId, setEditingTxId] = useState<number | null>(null)

  // Explicit Student Balance (for display)
  const [studentBalance, setStudentBalance] = useState<string | null>(null)
  const [studentTotalPaid, setStudentTotalPaid] = useState<string | null>(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Panel collapse state
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)

  // Sidebar and navigation
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics'>('dashboard')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  const PACKAGES: Record<string, number> = { 'A': 265, 'B': 1105, 'C': 1255 }
  const currentPrice = PACKAGES[packageType] || 0

  // Check for existing token on mount
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        if (res.data.staff) {
          setCurrentStaff(res.data.staff);
          setIsLoggedIn(true);
        }
      } catch {
        // Not logged in or expired
        setIsLoggedIn(false);
        setCurrentStaff(null);
      }
    };
    checkSession();
  }, [])

  // Connection check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await axios.get(`${API_URL}/students/search?q=test`)
        setIsConnected(true)
      } catch {
        setIsConnected(false)
      }
    }
    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch ledger when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchLedger();

      // Real-time updates
      const socket = io(SOCKET_URL);

      socket.on('ledger_update', (data) => {
        console.log('Real-time update received:', data);
        fetchLedger();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isLoggedIn])

  // --- Auth ---
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        username: loginUsername,
        password: loginPassword
      })

      // Token is now in HttpOnly Cookie
      setCurrentStaff(res.data.staff)
      setIsLoggedIn(true)
      setLoginError('')
    } catch (err: any) {
      setLoginError(err.response?.data?.error || 'Login failed')
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (e) {
      console.error('Logout error', e);
    }
    setCurrentStaff(null)
    setIsLoggedIn(false)
  }

  // --- Data ---
  const fetchLedger = async () => {
    try {
      const res = await axios.get(`${API_URL}/transactions`)
      setLedger(res.data)
    } catch (err) {
      console.error('Fetch Ledger Error:', err)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/analytics`)
      setAnalytics(res.data)
    } catch (err) {
      console.error('Fetch Analytics Error:', err)
    }
  }

  // Fetch analytics when switching to analytics view
  useEffect(() => {
    if (currentView === 'analytics' && isLoggedIn) {
      fetchAnalytics()
    }
  }, [currentView, isLoggedIn])

  const searchStudentById = async () => {
    if (!studentId) return
    setIsSearching(true)
    try {
      const res = await axios.get(`${API_URL}/students/search?q=${studentId}`)
      const exactMatch = res.data.find((s: Student) => s.id === studentId)
      if (exactMatch) {
        setFirstName(exactMatch.firstName)
        setLastName(exactMatch.lastName)
        setMiddleInitial(exactMatch.middleInitial || '')
        setCollege(exactMatch.college)
        setProgram(exactMatch.program)
        setSection(exactMatch.section)
        setYearLevel(exactMatch.yearLevel || 1)
        // Store balance for display
        setStudentBalance(exactMatch.balance)
        setStudentTotalPaid(exactMatch.totalPaid)
        setPackageType(exactMatch.packageType || 'A')

        setIsNewStudent(false)
        setIdNotFound(false)
      } else {
        // No match - enable manual entry
        setFirstName('')
        setLastName('')
        setMiddleInitial('')
        setCollege('')
        setProgram('')
        setSection('')
        setYearLevel(1)
        setStudentBalance(null)
        setStudentTotalPaid(null)
        setIsNewStudent(true)
        setIdNotFound(true)
      }
    } catch {
      setIsNewStudent(true)
      setIdNotFound(true)
      setStudentBalance(null)
      setStudentTotalPaid(null)
    }
    setIsSearching(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchStudentById()
    }
  }

  const handleResetForm = () => {
    setStudentId('')
    setFirstName('')
    setLastName('')
    setMiddleInitial('')
    setCollege('')
    setProgram('')
    setSection('')
    setYearLevel(1)
    setAmountPaid('')
    setOrNumber('')
    setIsNewStudent(false)
    setIdNotFound(false)
    setStudentBalance(null)
    setStudentTotalPaid(null)
    setIsEditing(false)
    setEditingTxId(null)
    setPackageType('A')
    setAdminPin(null);
  }

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // 1. Validation and Open Confirmation
  const handleSubmitTransaction = () => {
    if (!studentId || !firstName || !lastName) return alert('Please complete student details.')
    if (!amountPaid) return alert('Enter amount.')
    if (!studentId || !firstName || !lastName) return alert('Please complete student details.')
    if (!amountPaid) return alert('Enter amount.')
    if (!orNumber) return alert('Enter OR Number.')
    if (orNumber.length !== 7) return alert('OR Number must be exactly 7 digits.')

    // Open Confirmation Modal
    setIsConfirmModalOpen(true);
  }

  // 2. Actual API Call
  const handleConfirmTransaction = async () => {
    try {
      const payload: any = {
        studentId,
        staffId: currentStaff?.id || 1,
        packageType,
        amountPaid: parseFloat(amountPaid),
        paymentMode,
        orNumber
      }

      if (isEditing && editingTxId) {
        // UPDATE EXISTING (Requires adminPin)
        payload.adminPin = adminPin;
        payload.updatedStudentDetails = {
          firstName,
          lastName,
          middleInitial,
          college: college || 'N/A',
          program: program || 'N/A',
          yearLevel: yearLevel || 1,
          section: section || 'N/A'
        };
        await axios.put(`${API_URL}/transactions/${editingTxId}`, payload)

        setAdminPin(null); // Clear PIN after use
      } else {
        // CREATE NEW
        // CREATE NEW - Always send current form details to update/create student
        payload.newStudentDetails = {
          firstName,
          lastName,
          middleInitial,
          college: college || 'N/A',
          program: program || 'N/A',
          yearLevel: yearLevel || 1,
          section: section || 'N/A'
        }
        await axios.post(`${API_URL}/transactions`, payload)

      }

      handleResetForm()
      fetchLedger()
      setIsConfirmModalOpen(false); // Close Modal
    } catch (err: any) {
      alert(err.response?.data?.error || 'Transaction Failed')
      setIsConfirmModalOpen(false); // Close on error too
    }
  }

  const handleExport = () => {
    window.open(`${API_URL}/export/csv?staffId=${currentStaff?.id || 1}`, '_blank')
  }

  // --- Session Management ---
  const handleSaveSession = async () => {
    try {
      const response = await axios.post(`${API_URL}/session/save`, {}, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tanglaw_session_${new Date().toISOString().split('T')[0]}.mysession`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Session saved successfully!');
    } catch (error) {
      console.error('Save session error:', error);
      alert('Failed to save session');
    }
  };

  const handleImportSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mysession';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const response = await axios.post(`${API_URL}/session/import`, arrayBuffer, {
          headers: { 'Content-Type': 'application/octet-stream' }
        });

        if (response.data.success) {
          alert(`Session restored! ${response.data.stats.students} students, ${response.data.stats.transactions} transactions.`);
          fetchLedger();
        }
      } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to import session';
        alert(`Import Error: ${message}`);
      }
    };
    input.click();
  };

  // --- Void / Edit ---
  const initiateAction = (type: 'VOID' | 'EDIT' | 'ADD_PAYMENT', txId: number) => {
    setPendingAction({ type, txId })
    setOpenMenuId(null)
    setIsModalOpen(true)
    setPin('')
  }

  // State for storing verified Admin PIN for sensitive actions (like Edit -> Save)
  const [adminPin, setAdminPin] = useState<string | null>(null);

  const handleVerifyPin = async () => {
    if (!pin) return;

    // Optimistic verify or just send the action? 
    // Better UX: Verify first to give feedback, then execute action with PIN.
    try {
      const res = await axios.post(`${API_URL}/auth/verify-pin`, { pin });
      if (res.data.success) {

        // 1. VOID: Execute immediately with PIN
        if (pendingAction?.type === 'VOID') {
          await axios.delete(`${API_URL}/transactions/${pendingAction.txId}`, {
            data: { adminPin: pin } // Send PIN in body
          });
          alert('Transaction Voided!');
          fetchLedger();
        }

        // 2. EDIT: Store PIN and load data
        else if (pendingAction?.type === 'EDIT') {
          // Store validated PIN for the subsequent PUT request
          setAdminPin(pin);

          const tx = ledger.find(t => t.id === pendingAction.txId);
          if (tx) {
            setIsEditing(true);
            setEditingTxId(tx.id);
            setStudentId(tx.student.id);
            setFirstName(tx.student.firstName);
            setLastName(tx.student.lastName);
            setCollege(tx.student.college);
            setProgram(tx.student.program);
            setYearLevel(tx.student.yearLevel);
            setPackageType(tx.student.packageType || 'A');
            setPaymentMode(tx.paymentMode);
            setOrNumber(tx.orNumber);
            setAmountPaid(tx.amountPaid);
            setStudentBalance(tx.student.balance);
            setIsNewStudent(false);
          }
        }

        // 3. ADD PAYMENT: Just load data (PIN used for access control only, not strict backend check yet if not requested)
        // User requested strict checks for "Delete Transaction", implies Edit too.
        // For Add Payment, usually standard logic. We'll leave as is or add strictness if needed.
        else if (pendingAction?.type === 'ADD_PAYMENT') {
          const tx = ledger.find(t => t.id === pendingAction.txId);
          if (tx) prepareAddPayment(tx);
        }

        setIsModalOpen(false);
        setPendingAction(null);
        setPin(''); // Clear input
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Invalid Admin PIN!');
    }
  };

  // --- Add Payment (No PIN required) ---
  // PIN is now required, but this function executes AFTER PIN verification
  const prepareAddPayment = (tx: Transaction) => {
    setStudentId(tx.student.id)
    setFirstName(tx.student.firstName)
    setLastName(tx.student.lastName)
    setMiddleInitial(tx.student.middleInitial || '')
    setCollege(tx.student.college)
    setProgram(tx.student.program)
    setYearLevel(tx.student.yearLevel)
    setStudentBalance(tx.student.balance)
    setStudentTotalPaid(tx.student.totalPaid)
    setPackageType(tx.student.packageType || 'A')

    // Reset transaction specific fields
    setAmountPaid('')
    setOrNumber('')
    setPaymentMode('CASH')

    // Ensure we are NOT in edit mode
    setIsEditing(false)
    setEditingTxId(null)
    setIsNewStudent(false)

    // Optional: Copy package from previous tx or keep default
    // setPackageType(tx.packageTypeSnapshot) 
  }

  // --- Filtered Ledger ---
  const filteredLedger = ledger.filter(tx => {
    const matchesSearch = searchQuery === '' ||
      tx.student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${tx.student.firstName} ${tx.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.orNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCollege = collegeFilter === 'All Colleges' || tx.student.college === collegeFilter
    const matchesPaymentMode = paymentModeFilter === 'All Modes' || tx.paymentMode === paymentModeFilter
    return matchesSearch && matchesCollege && matchesPaymentMode
  })

  // Pagination computation
  const totalPages = Math.ceil(filteredLedger.length / ITEMS_PER_PAGE)
  const paginatedLedger = filteredLedger.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, collegeFilter, paymentModeFilter])

  // ========== LOGIN SCREEN ==========
  if (!isLoggedIn) {
    // ... (Login screen code is unchanged, relying on the fact that replace_file_content matches context)
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom right, #586447, #283329)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/TANGLAW LOGO2.png" alt="TANGLAW" className="h-24 mx-auto mb-2" />
            <p className="text-gray-500">Yearbook 2026 Payment System</p>
          </div>

          {!isConnected && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
              ⚠️ Server Offline - Please start the backend
            </div>
          )}

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#283329] outline-none"
                placeholder="Enter username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
              <input
                type="password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#283329] outline-none"
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={!isConnected}
              className="w-full py-3 bg-[#c98630] hover:bg-[#b57628] disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
            >
              LOGIN
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== MAIN DASHBOARD ==========
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">

      {/* --- SIDEBAR --- */}
      <div className="w-16 bg-[#283329] flex flex-col items-center py-4">
        <nav className="flex flex-col gap-2 flex-1 mt-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`p-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-[#c98630] text-white' : 'text-gray-300 hover:text-white hover:bg-[#c98630]'}`}
            title="Dashboard"
          >
            <LayoutDashboard size={20} />
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`p-3 rounded-lg transition-colors ${currentView === 'analytics' ? 'bg-[#c98630] text-white' : 'text-gray-300 hover:text-white hover:bg-[#c98630]'}`}
            title="Analytics"
          >
            <BarChart3 size={20} />
          </button>
        </nav>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      {currentView === 'dashboard' ? (
        <>
          {/* --- LEFT: LEDGER --- */}
          <div className={`${isPanelCollapsed ? 'flex-1' : 'w-2/3'} flex flex-col border-r border-gray-200 h-full p-6 transition-all duration-300`}>
            <header className="mb-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#c98630' }}>
                  TANGLAW Yearbook 2026
                  {isConnected ?
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Online</span> :
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">Offline</span>
                  }
                </h1>
                <p className="text-gray-500 text-sm">Logged in as: <strong>{currentStaff?.name}</strong> ({currentStaff?.position})</p>
              </div>
              <div className="flex gap-2">
                <button onClick={fetchLedger} className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="Refresh">
                  <RotateCcw size={20} />
                </button>
                <button onClick={handleSaveSession} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium" title="Save encrypted session">
                  <Save size={16} /> Save
                </button>
                <button onClick={handleImportSession} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium" title="Import session file">
                  <FolderOpen size={16} /> Open
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">
                  <Download size={16} /> DOWNLOAD
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium">
                  <LogOut size={16} /> Logout
                </button>
                <button
                  onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  title={isPanelCollapsed ? 'Show Payment Form' : 'Hide Payment Form'}
                >
                  {isPanelCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
                </button>
              </div>
            </header>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search by ID or Name..."
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                >
                  {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value)}
                >
                  <option value="All Modes">All Modes</option>
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                </select>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-300">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 font-bold text-xs uppercase sticky top-0 z-10">
                  <tr>
                    <th className="p-3 border border-gray-300">Date</th>
                    <th className="p-3 border border-gray-300">Student</th>
                    <th className="p-3 border border-gray-300">YR/COURSE/SECTION</th>
                    <th className="p-3 border border-gray-300">College</th>
                    <th className="p-3 border border-gray-300">PACKAGE</th>
                    <th className="p-3 border border-gray-300 text-right">Paid</th>
                    <th className="p-3 border border-gray-300 text-right">Balance</th>
                    <th className="p-3 border border-gray-300">Mode</th>
                    <th className="p-3 border border-gray-300">OR#</th>
                    <th className="p-3 border border-gray-300 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {paginatedLedger.length === 0 ? (
                    <tr><td colSpan={10} className="p-8 text-center text-gray-400 border border-gray-300">No transactions found.</td></tr>
                  ) : (
                    paginatedLedger.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="p-3 border border-gray-300 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 border border-gray-300">
                          <div className="font-bold text-gray-900">{tx.student.firstName} {tx.student.middleInitial ? `${tx.student.middleInitial} ` : ''}{tx.student.lastName}</div>
                          <div className="text-xs text-gray-500">{tx.student.id}</div>
                        </td>
                        <td className="p-3 border border-gray-300 text-xs font-medium">
                          {tx.student.college === 'Graduate School'
                            ? tx.student.program
                            : <>{tx.student.yearLevel === 0 ? 'N/A' : tx.student.yearLevel} {tx.student.program} {tx.student.section}</>
                          }
                        </td>
                        <td className="p-3 border border-gray-300 text-xs">{tx.student.college}</td>
                        <td className="p-3 border border-gray-300">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${tx.packageTypeSnapshot === 'A' ? 'bg-blue-100 text-blue-700' : tx.packageTypeSnapshot === 'B' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {tx.packageTypeSnapshot}
                          </span>
                        </td>
                        <td className="p-3 border border-gray-300 text-right font-mono">₱{parseFloat(tx.amountPaid).toFixed(2)}</td>
                        <td className="p-3 border border-gray-300 text-right font-mono">
                          {tx.student.paymentStatus === 'FULLY_PAID' ? (
                            <span className="text-green-600 font-bold">PAID</span>
                          ) : (
                            <span className="text-orange-600">₱{parseFloat(tx.student.balance).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-3 border border-gray-300 text-xs">{tx.paymentMode}</td>
                        <td className="p-3 border border-gray-300 text-xs font-mono">{tx.orNumber}</td>
                        <td className="p-3 border border-gray-300 text-center relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === tx.id ? null : tx.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {openMenuId === tx.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
                              <div className="absolute right-8 top-[-50px] z-20 bg-white rounded-lg shadow-xl border border-gray-100 w-48 py-1 overflow-visible transform origin-top-right">
                                <button
                                  onClick={() => initiateAction('ADD_PAYMENT', tx.id)}
                                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50"
                                >
                                  <UserPlus size={14} className="text-green-600" /> Add Payment
                                </button>
                                <button
                                  onClick={() => initiateAction('EDIT', tx.id)}
                                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit3 size={14} className="text-blue-600" /> Edit Details
                                </button>
                                <div className="my-1 border-t border-gray-100"></div>
                                <button
                                  onClick={() => initiateAction('VOID', tx.id)}
                                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 size={14} /> Void Transaction
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredLedger.length)} of {filteredLedger.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 text-sm font-medium rounded-lg ${currentPage === pageNum
                              ? 'bg-[#283329] text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT: INPUT TERMINAL --- */}
          {!isPanelCollapsed && (
            <div className="w-1/3 bg-white h-full shadow-xl z-20 flex flex-col border-l border-gray-200">
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800 border-l-4 border-[#283329] pl-3">
                    {isEditing ? 'Edit Transaction' : 'Process Payment'}
                  </h2>
                  <button onClick={handleResetForm} className="text-xs text-gray-400 hover:text-[#283329] uppercase font-bold">Clear / Cancel</button>
                </div>

                {isEditing && (
                  <div className="bg-orange-100 border border-orange-300 text-orange-700 p-3 rounded-lg mb-4 text-xs font-bold">
                    ✏️ You are currently editing Transaction #{editingTxId}
                  </div>
                )}

                {studentBalance && !isEditing && Number(studentTotalPaid) > 0 && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg mb-4 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase">Current Balance</span>
                    <span className="text-lg font-bold">₱{parseFloat(studentBalance).toFixed(2)}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Student ID */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student ID / Search</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-gray-300 rounded-lg font-mono font-bold text-lg focus:border-red-500 outline-none"
                      placeholder="20-XXXXX"
                      value={studentId}
                      onChange={(e) => {
                        let value = e.target.value;

                        // Check if it starts with a number (ID format logic)
                        if (/^\d/.test(value)) {
                          // Remove non-numeric characters except hyphen
                          value = value.replace(/[^0-9-]/g, '');

                          const oldDigits = studentId.replace(/-/g, '').length;
                          const newDigits = value.replace(/-/g, '').length;

                          if (newDigits > oldDigits && newDigits === 2 && !value.includes('-')) {
                            // Just typed the 2nd digit, auto-add hyphen
                            value = value + '-';
                          }

                          const digits = value.replace(/-/g, '');
                          if (digits.length > 2 && !value.includes('-')) {
                            // Enforce hyphen for long number strings if missing
                            value = digits.slice(0, 2) + '-' + digits.slice(2);
                          }
                        }
                        // If it doesn't start with a number, allow free text (no regex replacement)

                        setStudentId(value);
                      }}
                      onKeyDown={handleKeyDown}
                      maxLength={20}
                    />
                    {isSearching && <div className="absolute right-3 top-8 text-gray-400 animate-spin"><RotateCcw size={16} /></div>}
                    <p className="text-xs text-gray-400 mt-1">Press Enter to search</p>
                    {idNotFound && (
                      <p className="text-xs text-red-500 mt-1 font-medium">⚠️ ID not found</p>
                    )}
                  </div>

                  {isNewStudent && (
                    <div className="flex items-center gap-2 text-blue-600 text-xs font-bold bg-blue-50 p-2 rounded">
                      <UserPlus size={14} /> New Student - Fill details below
                    </div>
                  )}

                  {/* Name Fields */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded focus:border-[#283329] outline-none"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded focus:border-[#283329] outline-none"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">College/Department</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:border-[#283329] outline-none"
                        value={college}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCollege(val);
                          setProgram('');
                          if (val === 'Graduate School') {
                            setYearLevel(0);
                            setSection('N/A');
                          }
                        }}
                      >
                        <option value="">Select College</option>
                        {COLLEGE_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Program</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:border-[#283329] outline-none"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                      >
                        <option value="">Select Program</option>
                        {(COLLEGE_PROGRAMS[college] || []).map(p => {
                          // Extract abbreviation from parentheses if available
                          const match = p.match(/\(([^)]+)\)/);
                          const value = match ? match[1] : p;
                          return <option key={value} value={value}>{p}</option>;
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Year Level</label>
                        <select
                          disabled={college === 'Graduate School'}
                          className={`w-full p-2 border border-gray-300 rounded focus:border-[#283329] outline-none ${college === 'Graduate School' ? 'bg-gray-100 text-gray-400' : ''}`}
                          value={yearLevel}
                          onChange={(e) => setYearLevel(Number(e.target.value))}
                        >
                          <option value="0">N/A</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                          <option value="5">5th Year</option>
                          <option value="6">6th Year</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section</label>
                        <select
                          disabled={college === 'Graduate School'}
                          className={`w-full p-2 border border-gray-300 rounded focus:border-[#283329] outline-none ${college === 'Graduate School' ? 'bg-gray-100 text-gray-400' : ''}`}
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="N/A">N/A</option>
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Package & Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Package Selection</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {['A', 'B', 'C'].map((pkg) => (
                        <button
                          key={pkg}
                          onClick={() => setPackageType(pkg)}
                          className={`py-3 px-2 rounded-lg font-bold text-sm transition-all border-2 ${packageType === pkg
                            ? 'border-[#283329] text-[#283329] bg-white shadow-md transform scale-105'
                            : 'border-transparent bg-gray-50 text-gray-500 opacity-50 hover:opacity-100 hover:border-gray-200'}`}
                        >
                          Package {pkg}
                        </button>
                      ))}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 font-bold uppercase mr-2">Price:</span>
                      <span className="text-2xl font-bold text-[#283329]">₱{currentPrice.toLocaleString()}</span>
                    </div>

                    {/* Upgrade / Balance Projection */}
                    {!isNewStudent && studentTotalPaid && Number(studentTotalPaid) > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-right">
                        <div className="text-gray-500 text-xs">Total Paid So Far</div>
                        <div className="font-bold text-gray-800">₱{parseFloat(studentTotalPaid).toLocaleString()}</div>

                        <div className="border-t border-yellow-200 my-2"></div>

                        <div className="text-gray-500 text-xs">Remaining Balance for Package {packageType}</div>
                        <div className="font-bold text-[#283329] text-lg">
                          ₱{Math.max(0, currentPrice - parseFloat(studentTotalPaid)).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mode & OR */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Mode</label>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {['CASH', 'BANK_TRANSFER'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setPaymentMode(mode)}
                          className={`py-2 px-4 rounded-lg border font-bold text-sm transition-all flex items-center justify-center gap-2 ${paymentMode === mode
                            ? 'bg-white text-[#283329] border-[#283329] shadow-md border-2'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                          {mode === 'BANK_TRANSFER' ? 'BANK TRANSFER' : mode}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">OR / Ref No.</label>
                        <input
                          type="text"
                          placeholder="Enter Ref #"
                          maxLength={7}
                          value={orNumber}
                          onChange={(e) => {
                            // Strickland digits only and max 7 chars
                            const val = e.target.value.replace(/\D/g, '').slice(0, 7);
                            setOrNumber(val);
                          }}
                          className={`w-full p-2.5 border rounded-lg text-sm ${orNumber && orNumber.length !== 7 ? 'border-red-500 focus:border-red-500' : 'border-gray-300'}`}
                        />
                      </div>
                      {/* Amount */}
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount Paid</label>
                        <input
                          type="number"
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-lg font-bold text-gray-900 focus:border-[#283329] outline-none"
                          placeholder="0.00"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        />
                      </div>
                    </div>

                    {/* Change Calculation */}
                    {amountPaid && (() => {
                      const paidSoFar = parseFloat(studentTotalPaid || '0')
                      const currentPayment = parseFloat(amountPaid) || 0
                      const totalAfterPayment = paidSoFar + currentPayment
                      const change = totalAfterPayment - currentPrice

                      if (change > 0) {
                        return (
                          <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-green-700 uppercase">Change:</span>
                              <span className="text-2xl font-bold text-green-600">₱{change.toLocaleString()}</span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleSubmitTransaction}
                  disabled={!!(orNumber && orNumber.length !== 7)}
                  style={isEditing ? {} : { background: (orNumber && orNumber.length !== 7) ? '#ccc' : 'linear-gradient(to right, #586447, #283329)', border: (orNumber && orNumber.length !== 7) ? 'none' : '2px solid #757f66' }}
                  className={`w-full py-3.5 ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : ''} text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wide flex items-center justify-center gap-2 ${(orNumber && orNumber.length !== 7) ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {isEditing ? 'Update Changes' : (isNewStudent ? 'Confirm & Save Student' : 'Confirm Transaction')}
                </button>
              </div>
            </div>
          )}

          {/* --- ADMIN PIN MODAL --- */}
          {
            isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                  {/* ... (Admin PIN Modal Content - Unchanged) ... */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Admin PIN Required</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    {pendingAction?.type === 'VOID'
                      ? 'Enter Admin PIN to void this transaction.'
                      : pendingAction?.type === 'EDIT'
                        ? 'Enter Admin PIN to edit this transaction.'
                        : 'Enter Admin PIN to add a payment.'}
                  </p>
                  <input
                    type="password"
                    className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl font-bold tracking-widest mb-4 focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="••••••"
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
                  />
                  <button
                    onClick={handleVerifyPin}
                    className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-lg"
                  >
                    VERIFY & PROCEED
                  </button>
                </div>
              </div>
            )
          }

          {/* --- TRANSACTION CONFIRMATION MODAL --- */}
          {
            isConfirmModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-end items-center mb-6">
                    <button onClick={() => setIsConfirmModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-6 mb-8 text-center">
                    <div>

                      <div className="text-3xl font-bold text-[#283329] mb-1">{firstName} {middleInitial} {lastName}</div>
                      <div className="text-sm text-gray-500">{studentId}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>

                        <div className="text-lg font-bold text-gray-900">Package {packageType}</div>
                        <div className="text-sm text-gray-500">Price: ₱{currentPrice.toLocaleString()}</div>
                      </div>
                      <div>

                        <div className="text-lg font-bold text-gray-900">₱{parseFloat(amountPaid).toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{paymentMode === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsConfirmModalOpen(false)}
                      className="flex-1 py-3 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      autoFocus
                      onClick={handleConfirmTransaction}
                      className="flex-1 py-3 bg-[#c98630] hover:bg-[#b57628] text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all ring-4 ring-orange-200 outline-none focus:ring-[#c98630]"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </div>
              </div>
            )
          }
        </>
      ) : (
        /* ========== ANALYTICS VIEW ========== */
        <div className="flex-1 p-6 overflow-y-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-500 text-sm">Sales and collection reports</p>
          </header>

          {analytics ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Total Collections</p>
                      <p className="text-xl font-bold text-gray-900">₱{analytics.totalCollections.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Today's Collections</p>
                      <p className="text-xl font-bold text-gray-900">₱{analytics.todayCollections.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Total Students</p>
                      <p className="text-xl font-bold text-gray-900">{analytics.totalStudents}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-xs text-green-600 uppercase font-bold">Fully Paid</p>
                  <p className="text-3xl font-bold text-green-700">{analytics.fullyPaid}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <p className="text-xs text-orange-600 uppercase font-bold">Partial Payment</p>
                  <p className="text-3xl font-bold text-orange-700">{analytics.partialPaid}</p>
                </div>
              </div>

              {/* Package Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4">Package Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Package A (₱265)</span>
                      <span className="font-bold text-blue-600">{analytics.packageBreakdown.A} sales</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Package B (₱1,105)</span>
                      <span className="font-bold text-purple-600">{analytics.packageBreakdown.B} sales</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Package C (₱1,255)</span>
                      <span className="font-bold text-green-600">{analytics.packageBreakdown.C} sales</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4">Daily Trend (Last 7 Days)</h3>
                  <div className="space-y-2">
                    {analytics.dailyTrend.map((day, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{day.date}</span>
                        <span className="font-mono font-bold">₱{day.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* College Breakdown */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
                <h3 className="font-bold text-gray-800 mb-4">Collections by College</h3>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(analytics.collegeBreakdown).map(([college, data]) => (
                    <div key={college} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-bold text-gray-700">{college}</p>
                      <p className="text-lg font-bold text-gray-900">₱{data.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{data.studentCount} student{data.studentCount !== 1 ? 's' : ''} paid</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Performance */}
              {analytics.staffBreakdown && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
                  <h3 className="font-bold text-gray-800 mb-4">Staff Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-600 font-bold text-xs uppercase">
                        <tr>
                          <th className="p-3 border-b border-gray-200">Staff Name</th>
                          <th className="p-3 border-b border-gray-200 text-center">Students Handled</th>
                          <th className="p-3 border-b border-gray-200 text-right">Total Collected</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-gray-700">
                        {Object.values(analytics.staffBreakdown).map((staff: any) => (
                          <tr key={staff.name} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                            <td className="p-3 font-medium">{staff.name}</td>
                            <td className="p-3 text-center">{staff.transactionCount}</td>
                            <td className="p-3 text-right font-mono font-bold">₱{staff.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Loading analytics...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
