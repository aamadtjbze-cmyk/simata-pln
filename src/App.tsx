/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  ShieldAlert,
  Moon,
  Sun,
  RotateCcw,
  BookOpen,
  Info,
  CheckCircle2,
  Trash2,
  Lock,
  UserCheck2,
  HelpCircle,
  FileSpreadsheet,
  Bell,
  BarChart2,
  Palette,
  Calendar,
  LogIn,
  LogOut,
  ShieldCheck,
  Database,
  Mail,
  X
} from 'lucide-react';
import PLNLogo from './components/PLNLogo';
import StatsDashboard from './components/StatsDashboard';
import VisitorTable from './components/VisitorTable';
import CheckInModal from './components/CheckInModal';
import BadgeModal from './components/BadgeModal';
import EmailPassSentModal from './components/EmailPassSentModal';
import GuestBookingPortal from './components/GuestBookingPortal';
import AdminLoginModal from './components/AdminLoginModal';
import ReportModule from './components/ReportModule';
import NotificationCenter from './components/NotificationCenter';
import ThemeStudioModal from './components/ThemeStudioModal';
import UserManagement from './components/UserManagement';
import EmailConfigModal from './components/EmailConfigModal';
import { createNotification } from './lib/notificationHelper';
import { Visitor, VisitorStatus, SystemNotification } from './types';
import { INITIAL_VISITORS } from './data/mockData';
import { decodePassToken } from './utils/security';
import {
  isSupabaseConfigured,
  getSupabaseClient,
  checkSupabaseHealth,
  fetchVisitorsFromSupabase,
  saveVisitorToSupabase,
  deleteVisitorFromSupabase,
  rowToVisitor,
  ensureSecondGateTimeColumn,
} from './lib/supabase';
import {
  isEmailConfigured,
  getEmailConfig,
  saveEmailConfig,
  prewarmGoogleScript,
  startPeriodicPrewarm,
} from './lib/email';

// Web Audio API chime (zero network, zero external assets)
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
};

// Browser Desktop Push Notification (0 Vercel compute)
const sendDesktopNotification = (title: string, body: string) => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    }
  } catch (e) {}
};

export default function App() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [currentTab, setCurrentTab] = useState<'buku-tamu' | 'janji-temu' | 'pengajuan-tamu' | 'notifikasi' | 'laporan' | 'kelola-user'>('buku-tamu');
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [visitorToEdit, setVisitorToEdit] = useState<Visitor | null>(null);
  const [visitorForBadge, setVisitorForBadge] = useState<Visitor | null>(null);
  const [visitorForEmailSentModal, setVisitorForEmailSentModal] = useState<Visitor | null>(null);
  const [isSopOpen, setIsSopOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isScannedPass, setIsScannedPass] = useState(false);
  
  // Privilege Role State ('GUEST' vs 'ADMIN')
  const [userRole, setUserRole] = useState<'GUEST' | 'ADMIN'>('GUEST');
  const [adminRoleName, setAdminRoleName] = useState<string>('Sekretariat PLN');
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isEmailConfigModalOpen, setIsEmailConfigModalOpen] = useState(false);
  
  // Theme state
  const [darkMode, setDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'klasik' | 'ebt' | 'cyber' | 'geothermal'>('klasik');
  const [bgStyle, setBgStyle] = useState<string>('slate-50');
  
  // UI Toast alert state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'danger' } | null>(null);

  // Derive the last/maximum Form ID to prevent duplicate key assignment (numeric extraction)
  const lastFormId = visitors.length > 0 
    ? [...visitors].sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.id.replace(/\D/g, '') || '0', 10);
        return numB - numA;
      })[0].id 
    : 'TJB-VST-005008';

  // Initialize data on component mount
  useEffect(() => {
    const saved = localStorage.getItem('simata_visitors');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Keep only the first occurrence of each unique ID
          const uniqueIds = new Set<string>();
          const deduplicated = parsed.filter((v) => {
            if (v && v.id) {
              if (uniqueIds.has(v.id)) return false;
              uniqueIds.add(v.id);
              return true;
            }
            return false;
          });
          setVisitors(deduplicated);
          if (deduplicated.length !== parsed.length) {
            localStorage.setItem('simata_visitors', JSON.stringify(deduplicated));
          }
        } else {
          setVisitors(INITIAL_VISITORS);
        }
      } catch (e) {
        setVisitors(INITIAL_VISITORS);
      }
    } else {
      setVisitors(INITIAL_VISITORS);
      localStorage.setItem('simata_visitors', JSON.stringify(INITIAL_VISITORS));
    }

    // Load notifications from local storage
    const savedNotifs = localStorage.getItem('simata_notifications');
    if (savedNotifs) {
      try {
        setNotifications(JSON.parse(savedNotifs));
      } catch (e) {
        setNotifications([]);
      }
    }

    // Load theme setting from local storage
    const savedTheme = localStorage.getItem('simata_theme') as 'klasik' | 'ebt' | 'cyber' | 'geothermal' | null;
    if (savedTheme) {
      try {
        setCurrentTheme(savedTheme);
      } catch (e) {
        setCurrentTheme('klasik');
      }
    }

    // Force default to Light Theme once to align with user preference, else load from localStorage
    const hasResetToLight = localStorage.getItem('simata_reset_to_light_v3');
    let initialDarkModeValue = false;
    if (!hasResetToLight) {
      setDarkMode(false);
      localStorage.setItem('simata_dark_mode', 'false');
      localStorage.setItem('simata_reset_to_light_v3', 'true');
    } else {
      const savedDarkMode = localStorage.getItem('simata_dark_mode');
      if (savedDarkMode) {
        try {
          const parsed = JSON.parse(savedDarkMode);
          setDarkMode(parsed);
          initialDarkModeValue = parsed;
        } catch (e) {
          setDarkMode(false);
        }
      }
    }

    const savedBgStyle = localStorage.getItem('simata_bg_style');
    if (savedBgStyle) {
      setBgStyle(savedBgStyle);
    } else {
      setBgStyle(initialDarkModeValue ? 'midnight-deep' : 'slate-50');
    }

    // Load saved privilege role from localStorage
    const savedRole = localStorage.getItem('simata_user_role') as 'GUEST' | 'ADMIN' | null;
    const savedAdminName = localStorage.getItem('simata_admin_name');
    if (savedRole) {
      setUserRole(savedRole);
    } else {
      setUserRole('GUEST');
    }
    if (savedAdminName) setAdminRoleName(savedAdminName);
    const savedAdminUsername = localStorage.getItem('simata_admin_username');
    if (savedAdminUsername) setAdminUsername(savedAdminUsername);

    // Direct link parameter routing (e.g. ?portal=tamu or ?tab=pengajuan)
    const urlParams = new URLSearchParams(window.location.search);
    const portalParam = urlParams.get('portal');
    const tabParam = urlParams.get('tab') || urlParams.get('menu') || urlParams.get('form');

    if (portalParam === 'tamu' || tabParam === 'pengajuan' || tabParam === 'tamu' || tabParam === 'form') {
      setCurrentTab('pengajuan-tamu');
      setUserRole('GUEST');
    } else if (savedRole === 'ADMIN') {
      if (tabParam === 'janji-temu') setCurrentTab('janji-temu');
      else if (tabParam === 'notifikasi') setCurrentTab('notifikasi');
      else if (tabParam === 'laporan') setCurrentTab('laporan');
      else setCurrentTab('buku-tamu');
    } else {
      setCurrentTab('pengajuan-tamu');
    }

    // Auto open email config modal if ?email=1 or ?modal=email or ?tab=email
    const emailParam = urlParams.get('email') || urlParams.get('modal') || urlParams.get('setup');
    if (emailParam === '1' || emailParam === 'email' || tabParam === 'email') {
      setIsEmailConfigModalOpen(true);
    }

    // Auto open badge modal if encrypted QR code token is opened (?token=... or ?passId=... or ?id=...)
    const rawToken = urlParams.get('token') || urlParams.get('passId') || urlParams.get('badge') || urlParams.get('id');
    const passIdParam = urlParams.get('passId') || urlParams.get('id');
    if (rawToken || passIdParam) {
      setIsScannedPass(true);
      const decoded = rawToken ? decodePassToken(rawToken) : null;
      const lookupTerm = passIdParam || decoded || rawToken || '';

      if (lookupTerm) {
        // 1. Cek dulu di cache lokal untuk render secepat kilat
        try {
          const savedVisitorsStr = localStorage.getItem('simata_visitors');
          const listToSearch: Visitor[] = savedVisitorsStr ? JSON.parse(savedVisitorsStr) : INITIAL_VISITORS;
          const match = listToSearch.find((v) => 
            v.id.toLowerCase() === lookupTerm.toLowerCase() ||
            (v.email && v.email.toLowerCase().includes(lookupTerm.toLowerCase())) ||
            (v.visitorName && v.visitorName.toLowerCase().includes(lookupTerm.toLowerCase()))
          );
          if (match) {
            setVisitorForBadge(match);
          }
        } catch (e) {
          // ignore
        }

        // 2. Selalu sinkronkan dengan database cloud Supabase
        if (isSupabaseConfigured()) {
          const supabase = getSupabaseClient();
          if (supabase) {
            supabase
              .from('visitors')
              .select('*')
              .or(`id.ilike.%${lookupTerm}%,email.ilike.%${lookupTerm}%,visitor_name.ilike.%${lookupTerm}%`)
              .limit(1)
              .then(({ data, error }) => {
                if (data && data.length > 0 && !error) {
                  const fetchedVisitor = rowToVisitor(data[0]);
                  setVisitorForBadge(fetchedVisitor);
                }
              })
              .catch((err) => console.warn('[Pass Token Sync] Gagal memuat data dari cloud:', err));
          }
        }
      }
    }

    // Realtime storage sync across browser tabs and devices
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'simata_visitors' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setVisitors(parsed);
        } catch (err) {}
      }
      if (e.key === 'simata_notifications' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setNotifications(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Supabase Cloud Initialization & Realtime Subscription
    let supabaseChannel: any = null;
    if (isSupabaseConfigured()) {
      // Saran Audit #1: pastikan kolom second_gate_time ada di DB
      ensureSecondGateTimeColumn();

      // ponytail: gabungkan health check + data fetch dalam satu operasi
      // untuk mengurangi concurrent connections ke Supabase free tier.
      fetchVisitorsFromSupabase().then((data) => {
        if (data && data.length > 0) {
          setVisitors(data);
          localStorage.setItem('simata_visitors', JSON.stringify(data));
          setIsSupabaseActive(true);
        } else if (data === null) {
          setIsSupabaseActive(false);
        } else {
          setIsSupabaseActive(true);
        }
      });

      const supabase = getSupabaseClient();
      if (supabase) {
        // ponytail: throttle realtime callback 500ms agar burst update DB
        // tidak menyebabkan serangkaian re-render di React.
        let realtimeThrottleTimer: ReturnType<typeof setTimeout> | null = null;
        const pendingUpdates: Map<string, any> = new Map();

        const flushRealtimeUpdates = () => {
          if (pendingUpdates.size === 0) return;
          const updates = new Map(pendingUpdates);
          pendingUpdates.clear();

          setVisitors((prev) => {
            let next = [...prev];
            updates.forEach(({ type, payload }) => {
              if (type === 'INSERT') {
                const newV = rowToVisitor(payload.new);
                next = [newV, ...next.filter((v) => v.id !== newV.id)];

                // Jika pengajuan baru (PENDING), bunyikan notifikasi audio & push notification
                if (newV.status === 'PENDING') {
                  playNotificationChime();
                  sendDesktopNotification(
                    `🔔 Pengajuan Janji Temu Masuk: ${newV.visitorName}`,
                    `Instansi: ${newV.company || '-'} | Bertemu: ${newV.visited} (${newV.schedule})`
                  );
                  triggerToast(`Pengajuan Janji Temu Masuk: ${newV.visitorName} (${newV.company})`, 'info');
                }
              } else if (type === 'UPDATE') {
                const updatedV = rowToVisitor(payload.new);
                next = next.map((v) => (v.id === updatedV.id ? updatedV : v));
              } else if (type === 'DELETE' && payload.old) {
                next = next.filter((v) => v.id !== payload.old.id);
              }
            });
            return next;
          });
        };

        supabaseChannel = supabase
          .channel('realtime_visitors')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'visitors' },
            (payload: any) => {
              // Kumpulkan update, flush setelah 500ms idle
              pendingUpdates.set(payload.new?.id || payload.old?.id || Date.now().toString(), {
                type: payload.eventType,
                payload,
              });
              if (realtimeThrottleTimer) clearTimeout(realtimeThrottleTimer);
              realtimeThrottleTimer = setTimeout(flushRealtimeUpdates, 500);
            }
          )
          .subscribe();
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (supabaseChannel) {
        const supabase = getSupabaseClient();
        if (supabase) supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  // Auto-prewarm Google Apps Script berkala dan inisialisasi notifikasi saat Admin aktif
  useEffect(() => {
    if (userRole === 'ADMIN') {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      const stopPrewarm = startPeriodicPrewarm(4 * 60 * 1000);
      return () => stopPrewarm();
    }
  }, [userRole]);

  const handleSelectTab = (tab: 'buku-tamu' | 'janji-temu' | 'pengajuan-tamu' | 'notifikasi' | 'laporan' | 'kelola-user') => {
    setCurrentTab(tab);
    if (tab === 'janji-temu') {
      prewarmGoogleScript();
    }
    if (tab === 'buku-tamu' || tab === 'janji-temu') {
      if (isSupabaseConfigured()) {
        fetchVisitorsFromSupabase().then((data) => {
          if (data && data.length > 0) {
            setVisitors(data);
            localStorage.setItem('simata_visitors', JSON.stringify(data));
          }
        });
      }
    }
    try {
      const url = new URL(window.location.href);
      if (tab === 'pengajuan-tamu') {
        url.searchParams.set('portal', 'tamu');
        url.searchParams.delete('tab');
      } else {
        url.searchParams.delete('portal');
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState(null, '', url.toString());
    } catch (e) {}
  };

  const handleAdminLoginSuccess = (roleName: string, username: string) => {
    setUserRole('ADMIN');
    setAdminRoleName(roleName);
    setAdminUsername(username);
    handleSelectTab('buku-tamu');
    localStorage.setItem('simata_user_role', 'ADMIN');
    localStorage.setItem('simata_admin_name', roleName);
    localStorage.setItem('simata_admin_username', username);
    if (isSupabaseConfigured()) {
      fetchVisitorsFromSupabase().then((data) => {
        if (data && data.length > 0) {
          setVisitors(data);
          localStorage.setItem('simata_visitors', JSON.stringify(data));
        }
      });
    }
  };

  const handleAdminLogout = () => {
    setUserRole('GUEST');
    setAdminRoleName('');
    handleSelectTab('pengajuan-tamu');
    localStorage.setItem('simata_user_role', 'GUEST');
    localStorage.removeItem('simata_admin_name');
    triggerToast('Anda telah Logout dari akun Admin. Kembali ke Mode Tamu.', 'info');
  };

  // Quick database connection health check on click (no popup menu)
  const handleCheckDatabaseConnection = async () => {
    setIsCheckingDb(true);
    triggerToast('Mengecek status koneksi database...', 'info');
    const res = await checkSupabaseHealth();
    setIsSupabaseActive(res.connected);
    setIsCheckingDb(false);
    if (res.connected) {
      triggerToast(`Koneksi Database: TERHUBUNG NORMAL (${res.latency || 100}ms)`, 'success');
      fetchVisitorsFromSupabase().then((data) => {
        if (data && data.length > 0) {
          setVisitors(data);
          localStorage.setItem('simata_visitors', JSON.stringify(data));
        }
      });
    } else {
      triggerToast(`Koneksi Database: ADA KENDALA / TIDAK TERHUBUNG (${res.message})`, 'danger');
    }
  };

  // Close badge modal handler - Redirects scanned pass to guest pre-booking form if scanned
  const handleCloseBadgeModal = () => {
    setVisitorForBadge(null);
    if (isScannedPass) {
      setIsScannedPass(false);
      setVisitorToEdit(null);
      setIsCheckInOpen(true);
      triggerToast('Silahkan isi form Janji Temu untuk pengajuan jadwal kunjungan tamu baru.', 'info');
    }
  };

  // ponytail: debounce – localStorage write di-delay 300ms untuk mencegah
  // penulisan berulang saat banyak update terjadi dalam waktu singkat (batch actions).
  // Ceiling: delay 300ms masih aman untuk UX realtime karena state React sudah diupdate.
  const lsWriteTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveAndSync = (newVisitors: Visitor[], singleUpdatedVisitor?: Visitor) => {
    setVisitors(newVisitors);

    // Debounce localStorage write: hanya tulis setelah 300ms idle
    if (lsWriteTimer.current) clearTimeout(lsWriteTimer.current);
    lsWriteTimer.current = setTimeout(() => {
      localStorage.setItem('simata_visitors', JSON.stringify(newVisitors));
    }, 300);

    if (isSupabaseConfigured()) {
      if (singleUpdatedVisitor) {
        // Optimal: hanya upsert 1 record yang berubah
        saveVisitorToSupabase(singleUpdatedVisitor);
      }
      // ponytail: tidak iterasi seluruh array tanpa singleUpdatedVisitor –
      // mencegah N request sekaligus yang akan melanggar batas koneksi Supabase free tier (50 concurrent).
    }
  };

  // Toast feedback — clear timer lama sebelum set baru agar tidak leak
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerToast = (message: string, type: 'success' | 'info' | 'danger' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  // Theme toggle helper
  const toggleTheme = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem('simata_dark_mode', JSON.stringify(nextVal));
    
    const nextBgStyle = nextVal ? 'midnight-deep' : 'slate-50';
    setBgStyle(nextBgStyle);
    localStorage.setItem('simata_bg_style', nextBgStyle);
    
    triggerToast(nextVal ? "Mode Gelap korporat diaktifkan" : "Mode Terang korporat diaktifkan", "info");
  };

  // Save notification list helper
  const saveAndSyncNotifications = (newNotifs: SystemNotification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem('simata_notifications', JSON.stringify(newNotifs));
  };

  // Add / Edit Visitor callback
  const handleSaveVisitor = (savedVisitor: Visitor) => {
    const exists = visitors.some((v) => v.id === savedVisitor.id);
    let updated: Visitor[];
    let newNotifs = [...notifications];
    
    if (exists) {
      const original = visitors.find((v) => v.id === savedVisitor.id);
      const statusChanged = original && original.status !== savedVisitor.status;
      
      // Update existing record
      updated = visitors.map((v) => (v.id === savedVisitor.id ? savedVisitor : v));
      triggerToast(`Data tamu ${savedVisitor.visitorName} berhasil diubah.`, 'info');
      
      if (statusChanged) {
        const notif = createNotification(savedVisitor, original.status);
        newNotifs = [notif, ...newNotifs];
        saveAndSyncNotifications(newNotifs);
      }
    } else {
      // Insert new record at the top of the log
      updated = [savedVisitor, ...visitors];
      triggerToast(`Registrasi ${savedVisitor.visitorName} berhasil! Kartu masuk diterbitkan.`, 'success');
      // Auto open badge after registration
      setVisitorForBadge(savedVisitor);

      const notif = createNotification(savedVisitor);
      newNotifs = [notif, ...newNotifs];
      saveAndSyncNotifications(newNotifs);
    }
    
    saveAndSync(updated, savedVisitor);
    setIsCheckInOpen(false);
    setVisitorToEdit(null);
  };

  // Approve Janji Temu (PENDING -> SCHEDULED)
  const handleApproveBooking = (visitorId: string) => {
    const original = visitors.find((v) => v.id === visitorId);
    if (!original) return;

    const updatedVisitor: Visitor = {
      ...original,
      status: 'SCHEDULED',
    };

    const updated = visitors.map((v) => (v.id === visitorId ? updatedVisitor : v));
    triggerToast(`Janji Pertemuan ${original.visitorName} telah DISETUJUI. Barcode QR dikirim ke email!`, 'success');

    const notif = createNotification(updatedVisitor, original.status);
    saveAndSyncNotifications([notif, ...notifications]);
    saveAndSync(updated, updatedVisitor);

    // Open email notification confirmation popup
    setVisitorForEmailSentModal(updatedVisitor);
  };

  // Reject / Decline Janji Temu (PENDING/SCHEDULED -> REJECTED)
  const handleRejectBooking = (visitorId: string, reason: string) => {
    const original = visitors.find((v) => v.id === visitorId);
    if (!original) return;

    const formattedReason = reason.trim() ? `Catatan Rejek: ${reason.trim()}` : 'Pengajuan ditolak oleh Admin Sekretariat.';
    const updatedVisitor: Visitor = {
      ...original,
      status: 'REJECTED',
      notes: original.notes ? `${original.notes} | ${formattedReason}` : formattedReason,
    };

    const updated = visitors.map((v) => (v.id === visitorId ? updatedVisitor : v));
    triggerToast(`Pengajuan Janji Temu ${original.visitorName} telah DITOLAK. Notifikasi penolakan dikirim ke tamu.`, 'danger');

    const notif = createNotification(updatedVisitor, original.status);
    saveAndSyncNotifications([notif, ...notifications]);
    saveAndSync(updated, updatedVisitor);
  };

  // Konfirmasi Kedatangan Janji Temu (SCHEDULED/PENDING -> IN-PROGRESS)
  const handleCheckInAppointment = (visitorId: string) => {
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const day = today.getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[today.getMonth()];
    const year = today.getFullYear();
    const hours = pad(today.getHours());
    const mins = pad(today.getMinutes());
    const formattedInTime = `${day} ${monthName} ${year} - ${hours}.${mins}`;

    const original = visitors.find((v) => v.id === visitorId);
    if (!original) return;

    // ponytail: guard – konfirmasi sebelum menimpa jam masuk yang sudah tercatat
    if (original.inTime) {
      const confirmed = window.confirm(
        `Jam Check-In 1 sudah tercatat:\n"${original.inTime}"\n\nTimpa dengan jam sekarang (${formattedInTime})?`
      );
      if (!confirmed) return;
    }

    const updatedVisitor: Visitor = {
      ...original,
      status: 'IN-PROGRESS',
      inTime: formattedInTime,
    };

    const updated = visitors.map((v) => (v.id === visitorId ? updatedVisitor : v));
    triggerToast(`Konfirmasi kedatangan ${original.visitorName} berhasil. Kartu masuk diaktifkan!`, 'success');
    setVisitorForBadge(updatedVisitor);

    const notif = createNotification(updatedVisitor, original.status);
    saveAndSyncNotifications([notif, ...notifications]);
    saveAndSync(updated, updatedVisitor);
  };

  // Konfirmasi Masuk Pos 2 / Second Gate
  const handleSecondGateCheckIn = (visitorId: string, customPass?: string) => {
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const formattedNow = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()} - ${pad(today.getHours())}.${pad(today.getMinutes())}`;

    const original = visitors.find((v) => v.id === visitorId);
    if (!original) return;

    const assignedPass = customPass || original.secondGatePass || `TJB-PASS-${Math.floor(10 + Math.random() * 89)}`;
    const noteMarker = `[Pos 2: ${formattedNow}]`;
    const updatedNotes = original.notes
      ? original.notes.includes('[Pos 2:')
        ? original.notes.replace(/\[Pos 2: .*?\]/, noteMarker)
        : `${original.notes} | ${noteMarker}`
      : noteMarker;

    const updatedVisitor: Visitor = {
      ...original,
      secondGatePass: assignedPass,
      secondGateTime: formattedNow,
      notes: updatedNotes,
      status: 'IN-PROGRESS',
    };

    const updated = visitors.map((v) => (v.id === visitorId ? updatedVisitor : v));
    triggerToast(`Akses Pos 2 (${assignedPass}) untuk ${original.visitorName} berhasil dikonfirmasi!`, 'info');
    if (visitorForBadge && visitorForBadge.id === visitorId) {
      setVisitorForBadge(updatedVisitor);
    }

    const notif = createNotification(updatedVisitor, original.status);
    saveAndSyncNotifications([notif, ...notifications]);
    saveAndSync(updated, updatedVisitor);
  };

  // Check-Out Single Visitor
  const handleCheckOut = (visitorId: string) => {
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const day = today.getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[today.getMonth()];
    const year = today.getFullYear();
    const hours = pad(today.getHours());
    const mins = pad(today.getMinutes());
    const formattedOutTime = `${day} ${monthName} ${year} - ${hours}.${mins}`;

    const original = visitors.find((v) => v.id === visitorId);
    let updatedVisitor: Visitor | undefined;
    const updated = visitors.map((v) => {
      if (v.id === visitorId) {
        updatedVisitor = {
          ...v,
          status: 'DONE' as VisitorStatus,
          outTime: formattedOutTime,
        };
        return updatedVisitor;
      }
      return v;
    });

    if (original && updatedVisitor) {
      triggerToast(`Tamu ${original.visitorName} telah berhasil Check-Out.`, 'success');
      if (visitorForBadge && visitorForBadge.id === visitorId) {
        setVisitorForBadge(updatedVisitor);
      }
      
      const notif = createNotification(updatedVisitor, original.status);
      const newNotifs = [notif, ...notifications];
      saveAndSyncNotifications(newNotifs);
    }
    saveAndSync(updated, updatedVisitor);
  };

  // Check-Out Batch selected visitors
  const handleCheckOutBatch = (visitorIds: string[]) => {
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const day = today.getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[today.getMonth()];
    const year = today.getFullYear();
    const hours = pad(today.getHours());
    const mins = pad(today.getMinutes());
    const formattedOutTime = `${day} ${monthName} ${year} - ${hours}.${mins}`;

    let newNotifs = [...notifications];
    const updated = visitors.map((v) => {
      if (visitorIds.includes(v.id) && v.status === 'IN-PROGRESS') {
        const updatedVisitor: Visitor = {
          ...v,
          status: 'DONE',
          outTime: formattedOutTime,
        };
        const notif = createNotification(updatedVisitor, 'IN-PROGRESS');
        newNotifs = [notif, ...newNotifs];
        if (isSupabaseConfigured()) {
          saveVisitorToSupabase(updatedVisitor);
        }
        return updatedVisitor;
      }
      return v;
    });

    triggerToast(`Berhasil Check-Out ${visitorIds.length} tamu sekaligus.`, 'success');
    saveAndSyncNotifications(newNotifs);
    saveAndSync(updated);
  };

  // Delete single Visitor log
  const handleDeleteVisitor = (visitorId: string) => {
    const target = visitors.find((v) => v.id === visitorId);
    const confirmMsg = target 
      ? `Apakah Anda yakin ingin menghapus catatan kunjungan tamu: "${target.visitorName}" (${target.company})?`
      : 'Apakah Anda yakin ingin menghapus catatan tamu ini?';

    if (confirm(confirmMsg)) {
      const updated = visitors.filter((v) => v.id !== visitorId);
      triggerToast(`Catatan tamu ${target?.visitorName || ''} berhasil dihapus.`, 'danger');
      if (isSupabaseConfigured()) {
        deleteVisitorFromSupabase(visitorId);
      }
      saveAndSync(updated);
    }
  };

  // Reset database back to rich defaults
  const handleResetDatabase = () => {
    if (confirm('Apakah Anda ingin mereset seluruh data kembali ke setelan bawaan SIMATA PLN? Semua penambahan tamu baru akan terhapus.')) {
      saveAndSync(INITIAL_VISITORS);
      setNotifications([]);
      localStorage.removeItem('simata_notifications');
      triggerToast('Sistem log tamu & notifikasi berhasil di-reset ke data bawaan.', 'info');
    }
  };

  // Generate random visitor entry for quickly testing simulation flow
  const handleAddSampleVisitor = () => {
    const sampleNames = ['BUDI SANTOSO', 'ANI WIJAYA', 'CECEP PRIADI', 'DEWI LESTARI', 'EKO PRASETYO', 'HERMAN GUNA'];
    const sampleCompanies = ['PT ADHI KARYA', 'PT INDOSAT TBK', 'KEMENTERIAN BUMN', 'PT REKAYASA INDUSTRI', 'CV SINAR UTAMA'];
    const samplePurposes = ['Konsultasi Gardu Distribusi', 'Pengiriman suku cadang tiang', 'Presentasi tender kabel PLN', 'Rapat koordinasi AMDAL'];
    const sampleVisited = ['IKRAM', 'PLN KKU', 'PLN LAKSDA', 'KEUANGAN PLN', 'DIVISI IT PLN'];

    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomComp = sampleCompanies[Math.floor(Math.random() * sampleCompanies.length)];
    const randomPurp = samplePurposes[Math.floor(Math.random() * samplePurposes.length)];
    const randomVis = sampleVisited[Math.floor(Math.random() * sampleVisited.length)];

    const match = lastFormId.match(/(\d+)$/);
    const nextNum = match ? parseInt(match[1]) + 1 : 5009;
    const newId = `TJB-VST-${String(nextNum).padStart(6, '0')}`;

    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const sampleMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const formattedInTime = `${today.getDate()} ${sampleMonthNames[today.getMonth()]} ${today.getFullYear()} - ${pad(today.getHours())}.${pad(today.getMinutes())}`;

    const sampleGuest: Visitor = {
      id: newId,
      schedule: formattedInTime,
      inTime: formattedInTime,
      outTime: null,
      visitorName: randomName,
      mainGatePass: `Vgp ${pad(Math.floor(Math.random() * 50) + 1)}`,
      secondGatePass: Math.random() > 0.5 ? `${pad(Math.floor(Math.random() * 20))} k` : '',
      company: randomComp,
      purpose: randomPurp,
      visited: randomVis,
      status: 'IN-PROGRESS',
      phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
      identifyNo: '3273' + Math.floor(100000000000 + Math.random() * 900000000000),
      gender: Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan',
      notes: ''
    };

    saveAndSync([sampleGuest, ...visitors], sampleGuest);
    triggerToast(`Pendaftaran tamu ${randomName} berhasil ditambahkan.`, 'success');

    // Automatically trigger check-in notification for sample visitor!
    const notif = createNotification(sampleGuest);
    const newNotifs = [notif, ...notifications];
    saveAndSyncNotifications(newNotifs);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('simata_notifications');
    triggerToast('Seluruh log notifikasi berhasil dihapus.', 'danger');
  };

  const handleResendNotification = (notifId: string) => {
    const target = notifications.find(n => n.id === notifId);
    if (target) {
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      const timeStr = `${now.getHours()}.${pad(now.getMinutes())}`;
      
      triggerToast(`Notifikasi ${target.id} berhasil dikirim ulang via ${target.channel} pada ${timeStr}.`, 'success');
      
      const resendMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const updatedNotifs = notifications.map(n => {
        if (n.id === notifId) {
          return {
            ...n,
            timestamp: `${now.getDate()} ${resendMonthNames[now.getMonth()]} ${now.getFullYear()} - ${timeStr} (Resent)`
          };
        }
        return n;
      });
      saveAndSyncNotifications(updatedNotifs);
    }
  };

  const getToastStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600 text-white';
      case 'danger':
        return 'bg-rose-600 text-white';
      case 'info':
      default:
        return 'bg-[#0067B1] text-white';
    }
  };

  const getBackgroundClass = () => {
    if (darkMode) {
      if (bgStyle === 'midnight-deep') return 'bg-[#0a1120]';
      if (bgStyle === 'carbon-obsidian') return 'bg-slate-950';
      if (bgStyle === 'circuit-black') return 'bg-[#0b0c15]';
      if (bgStyle === 'magma-dark') return 'bg-[#1a0a0d]';
      return 'bg-[#0e1726]';
    } else {
      if (bgStyle === 'white') return 'bg-white';
      if (bgStyle === 'slate-50') return 'bg-slate-50';
      if (bgStyle === 'cream') return 'bg-[#FAF6EE]';
      if (bgStyle === 'sky-blue') return 'bg-[#EDF5FA]';
      return 'bg-slate-50';
    }
  };

  return (
    <div className={`${darkMode ? 'dark text-slate-100' : 'text-[#1a2e40]'} ${getBackgroundClass()} min-h-screen flex flex-col theme-${currentTheme} transition-colors duration-250 font-sans`}>
      
      {/* Dynamic Style Overrides for Themes */}
      <style>{`
        /* PLN EBT Theme: Emerald Green & Golden Honey */
        .theme-ebt .bg-\\[\\#005DA6\\] { background-color: #0d9488 !important; }
        .theme-ebt .text-\\[\\#005DA6\\] { color: #0d9488 !important; }
        .theme-ebt .border-\\[\\#005DA6\\] { border-color: #0d9488 !important; }
        .theme-ebt .focus\\:ring-\\[\\#005DA6\\]:focus { --tw-ring-color: #0d9488 !important; }
        .theme-ebt .hover\\:bg-\\[\\#004070\\]:hover { background-color: #0f766e !important; }
        .theme-ebt .hover\\:text-\\[\\#005DA6\\]:hover { color: #0d9488 !important; }
        .theme-ebt .border-\\[\\#FFD500\\] { border-color: #f59e0b !important; }
        .theme-ebt .text-\\[\\#FFD500\\] { color: #f59e0b !important; }
        .theme-ebt .bg-sky-50\\/70 { background-color: rgba(240, 253, 250, 0.70) !important; }
        .theme-ebt .dark\\:bg-\\[\\#152033\\]\\/60 { background-color: rgba(13, 148, 136, 0.15) !important; }
        .theme-ebt .border-l-\\[\\#005DA6\\] { border-left-color: #0d9488 !important; }
        .theme-ebt .bg-\\[\\#005DA6\\]\\/10 { background-color: rgba(13, 148, 136, 0.1) !important; }
        .theme-ebt .stroke-\\[\\#005DA6\\] { stroke: #0d9488 !important; }
        .theme-ebt .fill-\\[\\#FFD500\\] { fill: #f59e0b !important; }
        .theme-ebt .border-b-\\[\\#005DA6\\] { border-bottom-color: #0d9488 !important; }
        .theme-ebt .border-t-\\[\\#005DA6\\] { border-top-color: #0d9488 !important; }
        .theme-ebt .border-r-\\[\\#005DA6\\] { border-right-color: #0d9488 !important; }
        .theme-ebt .border-b-4 { border-bottom-color: #0d9488 !important; }
        .theme-ebt .border-t-2 { border-color: #0d9488 !important; }
        .theme-ebt .text-\\[\\#005DA6\\] { color: #0d9488 !important; }
        .theme-ebt .text-\\[\\#FFD500\\] { color: #f59e0b !important; }
        .theme-ebt text { fill: #0d9488 !important; }

        /* PLN Cyber Volt Theme: Neon Indigo & Pure Cyan */
        .theme-cyber .bg-\\[\\#005DA6\\] { background-color: #6366f1 !important; }
        .theme-cyber .text-\\[\\#005DA6\\] { color: #6366f1 !important; }
        .theme-cyber .border-\\[\\#005DA6\\] { border-color: #6366f1 !important; }
        .theme-cyber .focus\\:ring-\\[\\#005DA6\\]:focus { --tw-ring-color: #6366f1 !important; }
        .theme-cyber .hover\\:bg-\\[\\#004070\\]:hover { background-color: #4f46e5 !important; }
        .theme-cyber .hover\\:text-\\[\\#005DA6\\]:hover { color: #6366f1 !important; }
        .theme-cyber .border-\\[\\#FFD500\\] { border-color: #06b6d4 !important; }
        .theme-cyber .text-\\[\\#FFD500\\] { color: #06b6d4 !important; }
        .theme-cyber .bg-sky-50\\/70 { background-color: rgba(238, 242, 255, 0.70) !important; }
        .theme-cyber .dark\\:bg-\\[\\#152033\\]\\/60 { background-color: rgba(99, 102, 241, 0.15) !important; }
        .theme-cyber .border-l-\\[\\#005DA6\\] { border-left-color: #6366f1 !important; }
        .theme-cyber .bg-\\[\\#005DA6\\]\\/10 { background-color: rgba(99, 102, 241, 0.1) !important; }
        .theme-cyber .stroke-\\[\\#005DA6\\] { stroke: #6366f1 !important; }
        .theme-cyber .fill-\\[\\#FFD500\\] { fill: #06b6d4 !important; }
        .theme-cyber .border-b-\\[\\#005DA6\\] { border-bottom-color: #6366f1 !important; }
        .theme-cyber .border-t-\\[\\#005DA6\\] { border-top-color: #6366f1 !important; }
        .theme-cyber .border-r-\\[\\#005DA6\\] { border-right-color: #6366f1 !important; }
        .theme-cyber .border-b-4 { border-bottom-color: #6366f1 !important; }
        .theme-cyber .border-t-2 { border-color: #6366f1 !important; }
        .theme-cyber .text-\\[\\#005DA6\\] { color: #6366f1 !important; }
        .theme-cyber .text-\\[\\#FFD500\\] { color: #06b6d4 !important; }
        .theme-cyber text { fill: #6366f1 !important; }

        /* PLN Geothermal Theme: Crimson Volt & Amber Core */
        .theme-geothermal .bg-\\[\\#005DA6\\] { background-color: #e11d48 !important; }
        .theme-geothermal .text-\\[\\#005DA6\\] { color: #e11d48 !important; }
        .theme-geothermal .border-\\[\\#005DA6\\] { border-color: #e11d48 !important; }
        .theme-geothermal .focus\\:ring-\\[\\#005DA6\\]:focus { --tw-ring-color: #e11d48 !important; }
        .theme-geothermal .hover\\:bg-\\[\\#004070\\]:hover { background-color: #be123c !important; }
        .theme-geothermal .hover\\:text-\\[\\#005DA6\\]:hover { color: #e11d48 !important; }
        .theme-geothermal .border-\\[\\#FFD500\\] { border-color: #f59e0b !important; }
        .theme-geothermal .text-\\[\\#FFD500\\] { color: #f59e0b !important; }
        .theme-geothermal .bg-sky-50\\/70 { background-color: rgba(254, 242, 242, 0.70) !important; }
        .theme-geothermal .dark\\:bg-\\[\\#152033\\]\\/60 { background-color: rgba(225, 29, 72, 0.15) !important; }
        .theme-geothermal .border-l-\\[\\#005DA6\\] { border-left-color: #e11d48 !important; }
        .theme-geothermal .bg-\\[\\#005DA6\\]\\/10 { background-color: rgba(225, 29, 72, 0.1) !important; }
        .theme-geothermal .stroke-\\[\\#005DA6\\] { stroke: #e11d48 !important; }
        .theme-geothermal .fill-\\[\\#FFD500\\] { fill: #f59e0b !important; }
        .theme-geothermal .border-b-\\[\\#005DA6\\] { border-bottom-color: #e11d48 !important; }
        .theme-geothermal .border-t-\\[\\#005DA6\\] { border-top-color: #e11d48 !important; }
        .theme-geothermal .border-r-\\[\\#005DA6\\] { border-right-color: #e11d48 !important; }
        .theme-geothermal .border-b-4 { border-bottom-color: #e11d48 !important; }
        .theme-geothermal .border-t-2 { border-color: #e11d48 !important; }
        .theme-geothermal .text-\\[\\#005DA6\\] { color: #e11d48 !important; }
        .theme-geothermal .text-\\[\\#FFD500\\] { color: #f59e0b !important; }
        .theme-geothermal text { fill: #e11d48 !important; }
      `}</style>
      
      {/* Toast Notification HUD */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className={`px-5 py-3 rounded-none shadow-[4px_4px_0px_rgba(0,0,0,0.15)] flex items-center gap-3.5 border-2 border-white/20 ${getToastStyle(toast.type)}`}>
            <CheckCircle2 size={16} className="text-[#FFD500]" />
            <span className="text-xs font-bold font-sans tracking-wide uppercase">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Banner & Header Navigation */}
      <header className="sticky top-0 bg-white/80 dark:bg-[#111c30]/85 backdrop-blur-md border-b border-[#005DA6]/15 dark:border-white/10 z-40 shadow-sm transition-all duration-200 flex-shrink-0">
        {/* Accent Glow Line at top */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#005DA6] via-[#FFD500] to-[#005DA6]"></div>
        <div className="max-w-[1536px] w-full mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand PLN */}
          <PLNLogo showText={true} size="md" />

          {/* Right Controls Area */}
          <div className="flex items-center gap-4">
            
            {/* Quick Demo Helper (Hanya muncul saat belum login / mode tamu) */}
            {userRole === 'GUEST' && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-none border border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleAddSampleVisitor}
                  className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 hover:text-sky-600 rounded-none text-[10px] font-black transition-all flex items-center gap-1 uppercase cursor-pointer"
                  title="Uji coba registrasi tamu otomatis"
                >
                  Contoh Tamu
                </button>
              </div>
            )}

            {/* Custom Theme Palette Gallery CTA */}
            <button
              onClick={() => setIsThemeStudioOpen(true)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 py-2 px-3.5 rounded-none text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 cursor-pointer transition-all shadow-xs"
              title="Sajikan Pilihan Tema & Studio Harmoni Kontras"
            >
              <Palette size={13} className="text-[#005DA6] dark:text-[#FFD500]" />
              <span className="hidden sm:inline">Pilihan Tema</span>
            </button>

            {/* Database Connection Status Box (Direct Visual Indicator - No Popups) */}
            <button
              onClick={handleCheckDatabaseConnection}
              disabled={isCheckingDb}
              className={`flex items-center gap-2 py-2 px-3 rounded-none text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-xs border ${
                isCheckingDb
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300'
                  : isSupabaseActive
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300'
              }`}
              title={
                isCheckingDb
                  ? 'Sedang mengecek koneksi...'
                  : isSupabaseActive
                  ? 'Koneksi Database: TERHUBUNG (Klik untuk refresh/sinkron)'
                  : 'Koneksi Database: ADA KENDALA / TIDAK TERHUBUNG (Klik untuk cek ulang)'
              }
            >
              <Database
                size={13}
                className={
                  isCheckingDb
                    ? 'animate-spin text-amber-600'
                    : isSupabaseActive
                    ? 'text-emerald-500 animate-pulse'
                    : 'text-rose-500'
                }
              />
              <span className="font-bold">
                {isCheckingDb
                  ? 'Mengecek...'
                  : isSupabaseActive
                  ? 'Terhubung'
                  : 'Ada Kendala'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCheckingDb
                    ? 'bg-amber-500'
                    : isSupabaseActive
                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                    : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                }`}
              ></span>
            </button>

            {/* Email Config Button (Prominent) */}
            <button
              onClick={() => setIsEmailConfigModalOpen(true)}
              className="flex items-center gap-1.5 py-2 px-3 bg-white hover:bg-blue-50 dark:bg-slate-850 dark:hover:bg-slate-800 border-2 border-[#005DA6] dark:border-[#FFD500] text-[#005DA6] dark:text-[#FFD500] font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm rounded-none transition-all"
              title="Buka Pengaturan Koneksi Email (Direct Gmail / EmailJS)"
            >
              <Mail size={14} className="text-[#005DA6] dark:text-[#FFD500]" />
              <span>{isEmailConfigured() ? 'Email Aktif ✅' : 'Koneksi Email ✉️'}</span>
            </button>

            {/* Light/Dark Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-none text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title="Ganti Tema Visual"
            >
              {darkMode ? <Sun size={15} className="text-[#FFD500]" /> : <Moon size={15} />}
            </button>

            {/* Privilege Role Authentication Button */}
            {userRole === 'GUEST' ? (
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="py-2.5 px-4 bg-[#005DA6] hover:bg-[#004b85] text-white rounded-none font-bold text-xs flex items-center gap-2 border-b-2 border-r-2 border-[#FFD500] transition-all uppercase tracking-wider cursor-pointer shadow-xs"
                title="Masuk sebagai Sekretariat atau Security PLN"
              >
                <LogIn size={15} />
                <span>Login Admin / Security</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col items-end text-right select-none">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse"></span>
                    {adminRoleName || 'Admin PLN'}
                  </span>
                  <span className="text-[8.5px] font-bold text-slate-400">AKSES FULL TERBUKA</span>
                </div>

                <button
                  onClick={() => {
                    setVisitorToEdit(null);
                    setIsCheckInOpen(true);
                  }}
                  className="py-2.5 px-3.5 bg-[#005DA6] hover:bg-[#004b85] text-white rounded-none font-bold text-xs flex items-center gap-1.5 border-b-2 border-r-2 border-[#FFD500] transition-all uppercase tracking-wider cursor-pointer"
                >
                  <PlusCircle size={15} />
                  <span className="hidden sm:inline">Tambah Tamu</span>
                </button>

                <button
                  onClick={handleAdminLogout}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-none font-bold text-xs flex items-center gap-1 transition-all uppercase tracking-wider cursor-pointer border-b-2 border-r-2 border-rose-900"
                  title="Logout dari akun Admin"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-[1536px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col min-w-0">

        {/* Safety SOP Notice Bar */}
        {isBannerVisible && (
          <div className="mb-4 bg-[#005DA6]/10 dark:bg-[#005DA6]/20 border-l-4 border-[#005DA6] dark:border-[#FFD500] p-3 flex items-center justify-between shadow-2xs flex-shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <ShieldAlert className="text-[#005DA6] dark:text-[#FFD500] shrink-0" size={16} />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {userRole === 'GUEST'
                  ? 'Portal Pengajuan Tamu Mandiri UIK Tanjung Jati B. Silahkan isi form permohonan kunjungan.'
                  : `Mode Admin Aktif (${adminRoleName || 'Sekretariat'}). Seluruh log buku tamu & approval janji siap dikelola.`}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={() => setIsSopOpen(true)}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold text-[10px] rounded-none border border-slate-200 dark:border-slate-705 flex items-center gap-1.5 transition-all text-center uppercase tracking-wider cursor-pointer"
              >
                <Info size={12} className="text-[#005DA6]" />
                Manual SOP Keamanan
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Statistics KPIs Row (Only visible for Admin Mode) */}
        {userRole === 'ADMIN' && (
          <div className="flex-shrink-0">
            <StatsDashboard visitors={visitors} />
          </div>
        )}

        {/* Navigation Tabs (SIMATA Workspace Deck) */}
        <div className="mb-3 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-start gap-1 select-none flex-shrink-0 overflow-x-auto pb-0.5">
          {/* Form Pengajuan Tamu - Always Accessible for Guests & Admin */}
          <button
            onClick={() => handleSelectTab('pengajuan-tamu')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-t-2 border-l-2 border-r-2 cursor-pointer relative shrink-0 ${
              currentTab === 'pengajuan-tamu'
                ? 'bg-white dark:bg-[#111c30] text-[#005DA6] dark:text-[#FFD500] border-t-2 border-r-2 border-l-2 border-[#005DA6] dark:border-[#005DA6] -mb-[2px] z-10 font-black'
                : 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <PlusCircle size={13} className="text-[#005DA6] dark:text-[#FFD500]" />
            Form Pengajuan Tamu
          </button>

          {/* Admin Protected Tabs */}
          <button
            onClick={() => {
              if (userRole !== 'ADMIN') {
                setIsAdminLoginModalOpen(true);
                triggerToast('Akses Buku Tamu Aktif memerlukan Login Admin / Security.', 'info');
              } else {
                handleSelectTab('buku-tamu');
              }
            }}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-t-2 border-l-2 border-r-2 cursor-pointer shrink-0 ${
              currentTab === 'buku-tamu'
                ? 'bg-white dark:bg-[#111c30] text-[#005DA6] dark:text-[#FFD500] border-t-2 border-r-2 border-l-2 border-[#005DA6] dark:border-[#005DA6] -mb-[2px] z-10 font-black'
                : 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <UserCheck2 size={13} />
            Buku Tamu Aktif {userRole !== 'ADMIN' && '🔒'}
          </button>

          <button
            onClick={() => {
              if (userRole !== 'ADMIN') {
                setIsAdminLoginModalOpen(true);
                triggerToast('Akses Kelola Janji Temu memerlukan Login Admin.', 'info');
              } else {
                handleSelectTab('janji-temu');
              }
            }}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-t-2 border-l-2 border-r-2 cursor-pointer relative shrink-0 ${
              currentTab === 'janji-temu'
                ? 'bg-white dark:bg-[#111c30] text-[#005DA6] dark:text-[#FFD500] border-t-2 border-r-2 border-l-2 border-[#005DA6] dark:border-[#005DA6] -mb-[2px] z-10 font-black'
                : 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar size={13} />
            Janji Temu Tamu {userRole !== 'ADMIN' && '🔒'}
            {userRole === 'ADMIN' && (
              <>
                {visitors.filter((v) => v.status === 'PENDING').length > 0 ? (
                  <span className="ml-1.5 px-1.5 py-0.5 flex items-center justify-center bg-rose-600 text-white rounded-none text-[8.5px] font-black border border-white dark:border-[#111c30] leading-none animate-pulse shadow-sm">
                    {visitors.filter((v) => v.status === 'PENDING').length} BARU
                  </span>
                ) : visitors.filter((v) => v.status === 'SCHEDULED').length > 0 ? (
                  <span className="ml-1.5 px-1.5 py-0.5 flex items-center justify-center bg-amber-500 text-slate-950 rounded-none text-[8.5px] font-black border border-white dark:border-[#111c30] leading-none">
                    {visitors.filter((v) => v.status === 'SCHEDULED').length}
                  </span>
                ) : null}
              </>
            )}
          </button>

          {userRole === 'ADMIN' && (
            <>
              <button
                onClick={() => handleSelectTab('notifikasi')}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-t-2 border-l-2 border-r-2 cursor-pointer relative shrink-0 ${
                  currentTab === 'notifikasi'
                    ? 'bg-white dark:bg-[#111c30] text-[#005DA6] dark:text-[#FFD500] border-t-2 border-r-2 border-l-2 border-[#005DA6] dark:border-[#005DA6] -mb-[2px] z-10 font-black'
                    : 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Bell size={13} />
                Notifikasi Cerdas
                {notifications.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 flex items-center justify-center bg-rose-500 text-white rounded-none text-[8.5px] font-black border border-white dark:border-[#111c30] leading-none">
                    {notifications.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('laporan')}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-t-2 border-l-2 border-r-2 cursor-pointer shrink-0 ${
                  currentTab === 'laporan'
                    ? 'bg-white dark:bg-[#111c30] text-[#005DA6] dark:text-[#FFD500] border-t-2 border-r-2 border-l-2 border-[#005DA6] dark:border-[#005DA6] -mb-[2px] z-10 font-black'
                    : 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <BarChart2 size={13} />
                Laporan & Metrik
              </button>

              <button
                onClick={() => handleSelectTab('kelola-user')}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-t-2 border-l-2 border-r-2 cursor-pointer shrink-0 ${
                  currentTab === 'kelola-user'
                    ? 'bg-white dark:bg-[#111c30] text-[#005DA6] dark:text-[#FFD500] border-t-2 border-r-2 border-l-2 border-[#005DA6] dark:border-[#005DA6] -mb-[2px] z-10 font-black'
                    : 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <UserCheck2 size={13} />
                Kelola User
              </button>

              <button
                onClick={() => setIsEmailConfigModalOpen(true)}
                className="px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-t-2 border-l-2 border-r-2 cursor-pointer shrink-0 bg-blue-50 dark:bg-blue-950/60 text-[#005DA6] dark:text-[#FFD500] border-[#005DA6]/40 dark:border-[#FFD500]/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-2xs"
                title="Buka Pengaturan Koneksi Email (Direct Gmail / EmailJS)"
              >
                <Mail size={13} className="text-[#005DA6] dark:text-[#FFD500]" />
                Koneksi Email
              </button>
            </>
          )}
        </div>

        {/* Dynamic Interactive Visitor logs Table */}
        <div className="w-full max-w-full min-w-0 flex flex-col">
          {currentTab === 'buku-tamu' && (
            <div className="w-full max-w-full min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-2.5 px-1 flex-shrink-0">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 font-display uppercase text-xs">
                    <span className="inline-block w-1 h-3.5 bg-[#005DA6] dark:bg-[#FFD500]"></span>
                    Daftar Buku Tamu Aktif & Terjadwal
                  </h3>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">
                    Urutkan log berdasarkan Form ID atau status tamu secara instan
                  </p>
                </div>
                {/* Realtime stats count badge */}
                <div className="flex gap-2 flex-shrink-0">
                  <span className="px-2.5 py-1 bg-[#005DA6] text-white border-b border-r border-[#FFD500] rounded-none text-[9px] font-black uppercase tracking-wide font-mono">
                    {visitors.length} Registrasi
                  </span>
                </div>
              </div>

              <VisitorTable
                visitors={visitors}
                onCheckOut={handleCheckOut}
                onCheckOutBatch={handleCheckOutBatch}
                onEdit={(visitor) => {
                  setVisitorToEdit(visitor);
                  setIsCheckInOpen(true);
                }}
                onDelete={handleDeleteVisitor}
                onViewBadge={(visitor) => {
                  setVisitorForBadge(visitor);
                }}
                onAddSampleData={handleAddSampleVisitor}
                onApproveBooking={handleApproveBooking}
                onRejectBooking={handleRejectBooking}
                onCheckInAppointment={handleCheckInAppointment}
                onSecondGateCheckIn={handleSecondGateCheckIn}
              />
            </div>
          )}

          {currentTab === 'janji-temu' && (
            <div className="w-full max-w-full min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-2.5 px-1 flex-shrink-0">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 font-display uppercase text-xs">
                    <span className="inline-block w-1 h-3.5 bg-amber-500"></span>
                    Daftar Pengajuan & Persetujuan Janji Temu Tamu (Pre-Booking)
                  </h3>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">
                    Kelola permohonan janji temu tamu dan persetujuan pengiriman barcode QR pass ke email
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setIsEmailConfigModalOpen(true)}
                    className="px-2.5 py-1 bg-[#005DA6] hover:bg-[#004070] text-white border-b border-r border-[#FFD500] rounded-none text-[9.5px] font-black uppercase tracking-wide flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Buka Pengaturan Koneksi Email / Gmail"
                  >
                    <Mail size={12} className="text-[#FFD500]" />
                    <span>Konfigurasi Email</span>
                  </button>
                  <span className="px-2.5 py-1 bg-amber-500 text-slate-950 border-b border-r border-slate-900 rounded-none text-[9px] font-black uppercase tracking-wide font-mono">
                    {visitors.filter((v) => v.status === 'PENDING' || v.status === 'SCHEDULED' || v.status === 'REJECTED').length} Permohonan Janji
                  </span>
                </div>
              </div>

              <VisitorTable
                visitors={visitors.filter((v) => v.status === 'PENDING' || v.status === 'SCHEDULED' || v.status === 'REJECTED')}
                onCheckOut={handleCheckOut}
                onCheckOutBatch={handleCheckOutBatch}
                onEdit={(visitor) => {
                  setVisitorToEdit(visitor);
                  setIsCheckInOpen(true);
                }}
                onDelete={handleDeleteVisitor}
                onViewBadge={(visitor) => {
                  setVisitorForBadge(visitor);
                }}
                onAddSampleData={handleAddSampleVisitor}
                onApproveBooking={handleApproveBooking}
                onRejectBooking={handleRejectBooking}
                onCheckInAppointment={handleCheckInAppointment}
                onSecondGateCheckIn={handleSecondGateCheckIn}
              />
            </div>
          )}

          {currentTab === 'pengajuan-tamu' && (
            <div className="w-full">
              <GuestBookingPortal
                onSaveVisitor={(newVisitor) => {
                  const updated = [newVisitor, ...visitors];
                  saveAndSync(updated, newVisitor);
                  const notif = createNotification(newVisitor, 'PENDING');
                  saveAndSyncNotifications([notif, ...notifications]);
                }}
                lastFormId={lastFormId}
                triggerToast={triggerToast}
              />
            </div>
          )}

          {currentTab === 'notifikasi' && (
            <div className="w-full">
              <NotificationCenter
                notifications={notifications}
                onClearAll={handleClearAllNotifications}
                onResend={handleResendNotification}
              />
            </div>
          )}

          {currentTab === 'laporan' && (
            <div className="w-full">
              <ReportModule
                visitors={visitors}
              />
            </div>
          )}

          {currentTab === 'kelola-user' && (
            <div className="w-full p-4 sm:p-6">
              <UserManagement
                currentUsername={adminUsername}
                triggerToast={triggerToast}
              />
            </div>
          )}
        </div>

      </main>

      {/* Slim Footer Row inside application wrapper */}
      <footer className="bg-white dark:bg-[#111c30]/80 border-t border-slate-250 dark:border-slate-850 py-2.5 text-center text-[10px] text-slate-400 font-sans flex-shrink-0 select-none transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="font-semibold text-slate-500 dark:text-slate-400">
            &copy; 2026 PT PLN (Persero). SIMATA — Sistem Informasi Manajemen Tamu. All rights reserved.
          </p>
          <div className="flex gap-4 font-mono text-[9px]">
            <span>Version 3.0.12 (Stable)</span>
            <span>&bull;</span>
            <span>Security Server: GI-PLN-ACTIVE</span>
          </div>
        </div>
      </footer>

      {/* Dynamic Popups Framework */}
      
      {/* Brand Theme Harmony Studio Modal */}
      {isThemeStudioOpen && (
        <ThemeStudioModal
          isOpen={isThemeStudioOpen}
          onClose={() => setIsThemeStudioOpen(false)}
          currentTheme={currentTheme}
          onChangeTheme={(theme) => setCurrentTheme(theme)}
          darkMode={darkMode}
          onChangeDarkMode={(isDark) => setDarkMode(isDark)}
          bgStyle={bgStyle}
          onChangeBgStyle={(style) => setBgStyle(style)}
          triggerToast={triggerToast}
        />
      )}

      {/* Check-In / Edit Registration Modal */}
      {isCheckInOpen && (
        <CheckInModal
          visitorToEdit={visitorToEdit}
          onSave={handleSaveVisitor}
          onClose={() => {
            setIsCheckInOpen(false);
            setVisitorToEdit(null);
          }}
          visitorsCount={visitors.length}
          lastFormId={lastFormId}
        />
      )}

      {/* Guest Card Pass / Printer Mockup Badge Modal */}
      {visitorForBadge && (
        <BadgeModal
          visitor={visitorForBadge}
          onClose={handleCloseBadgeModal}
          onCheckInAppointment={handleCheckInAppointment}
          onSecondGateCheckIn={handleSecondGateCheckIn}
          onCheckOut={handleCheckOut}
          onApproveBooking={userRole === 'ADMIN' ? handleApproveBooking : undefined}
          onBookAppointment={() => {
            setVisitorForBadge(null);
            setIsScannedPass(false);
            setVisitorToEdit(null);
            setIsCheckInOpen(true);
            triggerToast('Silahkan isi form Janji Temu untuk pengajuan jadwal kunjungan tamu baru.', 'info');
          }}
        />
      )}

      {/* Email & Pass Digital Confirmation Modal */}
      {visitorForEmailSentModal && (
        <EmailPassSentModal
          visitor={visitorForEmailSentModal}
          onClose={() => setVisitorForEmailSentModal(null)}
          onOpenPass={(v) => {
            setVisitorForBadge(v);
          }}
        />
      )}

      {/* Admin / Security Authentication Modal */}
      {isAdminLoginModalOpen && (
        <AdminLoginModal
          isOpen={isAdminLoginModalOpen}
          onClose={() => setIsAdminLoginModalOpen(false)}
          onLoginSuccess={handleAdminLoginSuccess}
          triggerToast={triggerToast}
        />
      )}


      {/* Safety & SOP Reference area Modal */}
      {isSopOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-start md:items-center z-50 p-4 overflow-y-auto animate-fade-in" id="sop-modal">
          <div className="premium-glass rounded-none p-6 shadow-2xl max-w-xl w-full relative my-8 border border-[#005DA6]/20 dark:border-[#FFD500]/25">
            <button 
              onClick={() => setIsSopOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldAlert className="text-[#005DA6] dark:text-[#FFD500]" size={20} />
              <h4 className="font-sans font-black text-xs tracking-wider uppercase">SOP Keamanan & Penerimaan Tamu PLN</h4>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-1.5">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-250 uppercase tracking-wider text-[11px] border-l-2 border-[#005DA6] pl-2 flex items-center gap-2">
                  <UserCheck2 size={12} className="text-[#005DA6] dark:text-sky-350" />
                  1. Verifikasi Identitas Utama
                </h5>
                <p className="leading-relaxed pl-2.5">
                  Tamu wajib menyerahkan kartu identitas resmi (KTP atau SIM) di pos penjagaan utama. Petugas berkewajiban mencocokkan wajah tamu dengan foto yang tertera pada kartu identitas sebelum mendaftarkan data ke sistem SIMATA.
                </p>
              </div>
              
              <div className="space-y-1.5">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-250 uppercase tracking-wider text-[11px] border-l-2 border-[#005DA6] pl-2 flex items-center gap-2">
                  <ShieldAlert size={12} className="text-[#005DA6] dark:text-sky-350" />
                  2. Akses & Pemberian Gate Pass
                </h5>
                <p className="leading-relaxed pl-2.5">
                  Petugas wajib memberikan kartu akses fisik (Gate Pass) yang nomornya dicatat dalam kolom <strong>Main Gate Pass</strong>. Tamu wajib mengalungkan kartu pass masuk tersebut demi kenyamanan identifikasi pengawasan di lingkungan PLN.
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-250 uppercase tracking-wider text-[11px] border-l-2 border-[#005DA6] pl-2 flex items-center gap-2">
                  <BookOpen size={12} className="text-[#005DA6] dark:text-sky-350" />
                  3. Proses Check-Out & Pengembalian
                </h5>
                <p className="leading-relaxed pl-2.5">
                  Ketika kunjungan selesai, tamu harus diarahkan untuk menyerahkan kembali Gate Pass kepada petugas resepsionis. Petugas wajib menekan tombol <strong>Check-Out</strong> di baris nama tamu dalam sistem SIMATA untuk mendokumentasikan jam kepulangan secara akurat.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setIsSopOpen(false)}
                className="px-4 py-2 bg-[#005DA6] hover:bg-[#004070] text-white font-bold text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer transition-colors"
              >
                Saya Mengerti & Siap Melaksanakan SOP
              </button>
            </div>
          </div>
        </div>
      )}
      {/* EmailJS Config Modal */}
      {isEmailConfigModalOpen && (() => {
        const cfg = getEmailConfig();
        return (
          <EmailConfigModal
            initialConfig={cfg}
            onSave={(newCfg) => {
              saveEmailConfig(newCfg);
              setIsEmailConfigModalOpen(false);
              triggerToast('Konfigurasi Email disimpan. Email akan aktif saat Janji Temu disetujui.', 'success');
            }}
            onClose={() => setIsEmailConfigModalOpen(false)}
          />
        );
      })()}

      {/* Persistent Floating Action Button: Hubungkan Email */}
      <div className="fixed bottom-4 right-4 z-40 no-print animate-bounce">
        <button
          onClick={() => setIsEmailConfigModalOpen(true)}
          className="px-4 py-2.5 bg-[#005DA6] hover:bg-[#004070] text-white border-2 border-[#FFD500] shadow-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all hover:scale-105 rounded-none"
          title="Buka Pengaturan Koneksi Gmail Google Apps Script"
        >
          <Mail size={16} className="text-[#FFD500]" />
          <span>Hubungkan Gmail ✉️</span>
        </button>
      </div>

    </div>
  );
}
