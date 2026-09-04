import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { BarChart2, ShieldAlert } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { WeatherRiskWidget } from './components/WeatherRiskWidget';
import { SatelliteMonitoringView } from './components/SatelliteMonitoringView';
import { AIDiagnosisModule } from './components/AIDiagnosisModule';
import { TreatmentRecommendation } from './components/TreatmentRecommendation';
import { RecentScansTable } from './components/RecentScansTable';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { PasswordResetRequest } from './components/auth/PasswordResetRequest';
import { PasswordResetConfirm } from './components/auth/PasswordResetConfirm';
import { EmailVerification } from './components/auth/EmailVerification';
import { LandingPage } from './components/landing/LandingPage';
import { DataExportModule } from './components/DataExportModule';
import { SettingsModule } from './components/SettingsModule';
import { EscalationModule } from './components/EscalationModule';
import { CommunicationModule } from './components/CommunicationModule';
import { OfficerEscalationTable } from './components/OfficerEscalationTable';
import { AITrainingCenter } from './components/AITrainingCenter';
import { SatelliteInsightsPanel } from './components/SatelliteInsightsPanel';
import { UserManagementModule } from './components/UserManagementModule';
import { AdminSupportModule } from './components/AdminSupportModule';
import { toast } from 'sonner';
import { useTranslation } from './utils/translations';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {time.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      {' • '}
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
    </>
  );
};

export default function App() {
  const { t } = useTranslation();
  // Initialize authentication from localStorage so it persists across refreshes
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('access_token');
  });


  const [userData, setUserData] = useState<{
    username?: string;
    email?: string;
    role?: string;
    is_restricted?: boolean;
    restriction_reason?: string;
    scan_count?: number;
    remaining_scans?: number;
    scan_limit?: number;
    is_superuser?: boolean;
    theme_preference?: string;
    [key: string]: any;
  } | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchProfile = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.status === 401) {
            handleLogout(true);
            setIsProfileLoading(false);
            return;
          }
          if (response.ok) {
            const data = await response.json();
            setUserData(data);

            // Alert user if account is restricted
            if (data.is_restricted) {
              const roleLower = (data.role || '').toLowerCase();
              let title = 'Account Restricted';
              let desc = '';

              if (roleLower === 'farmer') {
                const remaining = data.daily_remaining_scans !== undefined ? data.daily_remaining_scans : 3;
                title = 'Farmer Restricted: 3 Scans Per Day';
                desc = `You are permitted a maximum of 3 disease scans today (${remaining} remaining). Reason: ${data.restriction_reason || 'Field policy review'}.`;
              } else if (roleLower.includes('officer')) {
                const remaining = data.daily_remaining_reviews !== undefined ? data.daily_remaining_reviews : 3;
                title = 'Officer Restricted: 3 Farmer Reviews Per Day';
                desc = `You are permitted to review up to 3 farmer cases today (${remaining} remaining). Reason: ${data.restriction_reason || 'Departmental review'}.`;
              } else if (roleLower === 'researcher') {
                const remaining = data.daily_remaining_downloads !== undefined ? data.daily_remaining_downloads : 3;
                title = 'Researcher Restricted: 3 Downloads Per Day';
                desc = `You are permitted up to 3 dataset downloads today (${remaining} remaining). Reason: ${data.restriction_reason || 'Dataset audit'}.`;
              } else {
                const remaining = data.remaining_scans !== undefined ? data.remaining_scans : 3;
                title = 'Account Restricted: Daily Limit 3';
                desc = `Daily actions are capped at 3 per day (${remaining} remaining). Reason: ${data.restriction_reason || 'Policy restriction'}.`;
              }

              toast.warning(title, {
                description: desc,
                duration: 9000,
              });
            }

            // Apply theme preference from profile and save to localStorage
            if (data.theme_preference) {
              localStorage.setItem('theme_preference', data.theme_preference);
              if (data.theme_preference === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            }

            // Apply role-based section validation
            const roleLower = data.role?.toLowerCase() || '';
            const isAdminUser = roleLower === 'admin' || roleLower === 'superadmin' || data.is_superuser === true;
            const isOfficerUser = roleLower.includes('officer');
            const isResearcherUser = roleLower === 'researcher';

            let allowedSections: string[] = [];
            if (isAdminUser) {
              allowedSections = ['dashboard', 'ai-training', 'user-management', 'support-tickets', 'settings'];
            } else if (isOfficerUser) {
              allowedSections = ['dashboard', 'communications', 'expert-review', 'data', 'settings'];
            } else if (isResearcherUser) {
              allowedSections = ['dashboard', 'ai-training', 'data', 'settings', 'satellite-insights'];
            } else { // Farmer
              allowedSections = ['dashboard', 'satellite', 'diagnosis', 'communications', 'escalate', 'data', 'settings'];
            }

            if (!allowedSections.includes(activeSection)) {
               setActiveSection(allowedSections[0] || 'dashboard');
            }
          }
        } catch (error) {
          console.error("Failed to fetch profile", error);
        } finally {
          setIsProfileLoading(false);
        }
      };
      fetchProfile();
    } else {
      setUserData(null);
      setIsProfileLoading(false);
    }
  }, [isAuthenticated]);

  // Global listener for session expiration (401 errors from anywhere in the app)
  useEffect(() => {
    const handleAuthError = () => {
      handleLogout(true);
    };
    window.addEventListener('watermelon-auth-error', handleAuthError);
    return () => window.removeEventListener('watermelon-auth-error', handleAuthError);
  }, []);

  const getInitialAuthMode = (): 'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email' => {
    const path = window.location.pathname;
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/reset-password') return 'reset-password';
    if (path === '/verify-email') return 'verify-email';
    return 'landing';
  };

  const getInitialSection = () => {
    const path = window.location.pathname;
    const validSections = ['dashboard', 'satellite', 'diagnosis', 'data', 'communications', 'expert-review', 'ai-training', 'user-management', 'support-tickets', 'escalate', 'settings', 'satellite-insights'];
    const section = path.substring(1);
    if (validSections.includes(section)) return section;
    const saved = localStorage.getItem('watermelon_active_section');
    if (saved && validSections.includes(saved)) return saved;
    return 'dashboard';
  };

  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email'>(getInitialAuthMode());
  const [activeSection, setActiveSection] = useState(getInitialSection());
  const [globalUnreadBroadcasts, setGlobalUnreadBroadcasts] = useState(0);
  const broadcastsLenRef = useRef(0);

  // Persist activeSection to localStorage
  useEffect(() => {
    if (activeSection) {
      localStorage.setItem('watermelon_active_section', activeSection);
    }
  }, [activeSection]);

  // Clear unread badge when entering communications
  useEffect(() => {
    if (activeSection === 'communications') {
      setGlobalUnreadBroadcasts(0);
    }
  }, [activeSection]);

  // Global polling for broadcasts
  useEffect(() => {
    if (!isAuthenticated || !userData) return;
    const role = userData.role?.toLowerCase() || '';
    if (role.includes('officer') || role.includes('researcher')) return;

    const playReceiveSound = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch(e) {}
    };

    const fetchGlobalBroadcasts = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const response = await fetch('http://127.0.0.1:8000/api/escalation/broadcast/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (broadcastsLenRef.current > 0 && data.length > broadcastsLenRef.current) {
            const alertsEnabled = localStorage.getItem('broadcast_alerts') !== 'false';
            if (alertsEnabled) {
              const latest = data[0];
              const toastMsg = latest 
                ? `${latest.officer_name ? latest.officer_name + ': ' : ''}${latest.message}` 
                : (t('newBroadcastReceived') || "New Regional Broadcast Received!");
              toast.info(`📢 ${toastMsg}`, { duration: 6000 });
              playReceiveSound();
            }
            setGlobalUnreadBroadcasts(prev => prev + (data.length - broadcastsLenRef.current));
          }
          broadcastsLenRef.current = data.length;
        }
      } catch (err) {}
    };

    fetchGlobalBroadcasts();
    const interval = setInterval(fetchGlobalBroadcasts, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, userData, t]);

  // Global listener for theme changes across modules
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      const newTheme = e.detail || localStorage.getItem('theme_preference') || 'light';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    window.addEventListener('watermelon-theme-change', handleThemeChange);
    return () => window.removeEventListener('watermelon-theme-change', handleThemeChange);
  }, []);

  // Apply theme immediately from localStorage even before profile loads
  // But keep Login/Register/Landing always in light mode as requested
  useLayoutEffect(() => {
    const isAuthPage = !isAuthenticated;

    if (isAuthPage) {
      document.documentElement.classList.remove('dark');
      return;
    }

    const savedTheme = localStorage.getItem('theme_preference') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isAuthenticated, authMode, activeSection]);

  // Handle URL syncing when state changes
  useEffect(() => {
    if (!isAuthenticated) {
      const targetPath = authMode === 'landing' ? '/' : `/${authMode}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } else {
      const targetPath = `/${activeSection}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  }, [authMode, activeSection, isAuthenticated]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (!isAuthenticated) {
        if (path === '/login') setAuthMode('login');
        else if (path === '/register') setAuthMode('register');
        else if (path === '/forgot-password') setAuthMode('forgot-password');
        else if (path === '/reset-password') setAuthMode('reset-password');
        else if (path === '/verify-email') setAuthMode('verify-email');
        else setAuthMode('landing');
      } else {
        const section = path.substring(1);
        if (['dashboard', 'satellite', 'diagnosis', 'data', 'communications', 'expert-review', 'ai-training', 'user-management', 'support-tickets', 'escalate', 'settings', 'satellite-insights'].includes(section)) {
          setActiveSection(section);
        } else {
          setActiveSection('dashboard');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  const handleLogout = (sessionExpired = false) => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setAuthMode('login');
    setActiveSection('dashboard');
    if (sessionExpired) {
      toast.error("Session expired. Please login again.", {
        description: "Your secure session has timed out.",
        duration: 5000,
      });
    }
  };

  if (!isAuthenticated) {
    if (authMode === 'landing') {
      return <LandingPage onNavigate={(mode) => setAuthMode(mode as any)} />;
    }

    if (authMode === 'forgot-password') {
      return (
        <PasswordResetRequest
          onSwitchToLogin={() => setAuthMode('login')}
          onSuccess={() => setAuthMode('reset-password')}
        />
      );
    }

    if (authMode === 'reset-password') {
      return (
        <PasswordResetConfirm
          onSuccess={() => setAuthMode('login')}
        />
      );
    }

    if (authMode === 'verify-email') {
      return (
        <EmailVerification
          onSuccess={() => setAuthMode('login')}
        />
      );
    }

    return authMode === 'login' ? (
      <Login
        onLogin={() => setIsAuthenticated(true)}
        onSwitchToRegister={() => setAuthMode('register')}
        onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
        onBackToLanding={() => setAuthMode('landing')}
      />
    ) : (
      <Register
        onRegister={() => setIsAuthenticated(true)}
        onSwitchToLogin={() => setAuthMode('login')}
        onSwitchToVerifyEmail={() => setAuthMode('verify-email')}
        onBackToLanding={() => setAuthMode('landing')}
      />
    );
  }

  const role = userData?.role?.toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin' || userData?.is_superuser === true;

  if (isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin mb-4 shadow-lg"></div>
          <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest text-xs uppercase animate-pulse">Loading Profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
        userData={userData}
        unreadBroadcastCount={globalUnreadBroadcasts}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeSection === 'dashboard' && (userData?.role?.toLowerCase()?.includes('officer') ? 'Officer Dashboard' : isAdmin ? 'Admin Dashboard' : userData?.role?.toLowerCase() === 'researcher' ? 'Researcher Dashboard' : t('dashboard'))}
                  {activeSection === 'satellite' && t('satellite')}
                  {activeSection === 'diagnosis' && t('diagnosis')}
                  {activeSection === 'data' && t('data')}
                  {activeSection === 'communications' && t('communications')}
                  {activeSection === 'expert-review' && t('expertReview')}
                  {activeSection === 'ai-training' && !userData?.role?.toLowerCase()?.includes('officer') && t('aiTraining')}
                  {activeSection === 'user-management' && isAdmin && (t('userManagement') || 'User Account Management')}
                  {activeSection === 'support-tickets' && isAdmin && (t('supportTickets') || 'Problem Reports & Support Inquiries')}
                  {activeSection === 'satellite-insights' && 'Satellite Data Insights'}
                  {activeSection === 'settings' && t('systemSettings')}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeSection === 'dashboard' && (userData?.role?.toLowerCase()?.includes('officer') ? 'නිලධාරි උපකරණ පුවරුව' : isAdmin ? 'පරිපාලක උපකරණ පුවරුව' : userData?.role?.toLowerCase() === 'researcher' ? 'Research analytics & pathogen tracking overview' : t('dashboardSubtitle'))}
                  {activeSection === 'satellite' && t('satelliteSubtitle')}
                  {activeSection === 'diagnosis' && t('diagnosisSubtitle')}
                  {activeSection === 'data' && t('dataSubtitle')}
                  {activeSection === 'communications' && t('communicationsSubtitle')}
                  {activeSection === 'expert-review' && t('expertReviewSubtitle')}
                  {activeSection === 'ai-training' && !userData?.role?.toLowerCase()?.includes('officer') && t('aiTrainingSubtitle')}
                  {activeSection === 'user-management' && isAdmin && (t('userManagementSubtitle') || 'Overview of platform accounts, access permissions, and account restrictions')}
                  {activeSection === 'support-tickets' && isAdmin && (t('supportTicketsSubtitle') || 'Review user-submitted problems from the landing page, triage issues, and respond with resolutions')}
                  {activeSection === 'satellite-insights' && 'NDVI farm health overview & AI training data export'}
                  {activeSection === 'settings' && t('settingsSubtitle')}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">
                    {userData ? (userData.username || userData.email) : 'Loading...'}
                  </p>
                  <p className="text-xs text-[#2E7D32] font-semibold uppercase tracking-wider">
                    {isAdmin ? 'System Administrator' : (
                      userData?.role === 'agri_officer' || userData?.role === 'officer' ? 'Agri Officer Account' :
                        userData?.role === 'researcher' ? 'Researcher Account' :
                          userData?.role === 'farmer' ? 'Farmer Account' :
                            'WatermelonAI User'
                    )}
                  </p>
                </div>

                <div className="h-10 w-px bg-gray-200 dark:bg-gray-700"></div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold">System Online</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium w-[180px] text-right">
                    <LiveClock />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Global Account Restriction Warning Banner */}
        {userData?.is_restricted && (() => {
          const roleLower = (userData.role || '').toLowerCase();
          
          let badge = 'Account Restricted';
          let bannerMsg = 'Your account has restricted daily allowances.';
          let capBadge = 'Limit: 3 / Day';
          let advice = userData.restriction_reason ? `Reason: ${userData.restriction_reason}` : '';

          if (roleLower === 'farmer') {
            const remaining = userData.daily_remaining_scans !== undefined ? userData.daily_remaining_scans : 3;
            badge = 'Farmer Account Restricted';
            bannerMsg = `Your field crop diagnosis is limited to 3 scans per day (${remaining} remaining today). Please consult your local Agricultural Extension Officer for farm assistance.`;
            capBadge = '3 Scans / Day';
          } else if (roleLower.includes('officer')) {
            const remaining = userData.daily_remaining_reviews !== undefined ? userData.daily_remaining_reviews : 3;
            badge = 'Officer Account Restricted';
            bannerMsg = `Official farmer case reviews are limited to 3 reviews per day (${remaining} remaining today) under departmental review. Contact your Provincial Agricultural Department.`;
            capBadge = '3 Reviews / Day';
          } else if (roleLower === 'researcher') {
            const remaining = userData.daily_remaining_downloads !== undefined ? userData.daily_remaining_downloads : 3;
            badge = 'Researcher Account Restricted';
            bannerMsg = `Data exports and dataset downloads are limited to 3 downloads per day (${remaining} remaining today) under research audit. Please contact the Research Division Director.`;
            capBadge = '3 Downloads / Day';
          }

          return (
            <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-300 dark:border-amber-700/60 px-8 py-3 flex items-center justify-between text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-bold uppercase tracking-wider text-xs mr-2 px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    {badge}
                  </span>
                  <span>{bannerMsg}</span>
                  {advice && <span className="ml-2 opacity-90 font-medium text-xs">({advice})</span>}
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 whitespace-nowrap ml-4">
                {capBadge}
              </span>
            </div>
          );
        })()}

        {/* Content Sections */}
        <div className="p-8">
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              <AnalyticsDashboard userData={userData} />

              {!userData?.role?.toLowerCase()?.includes('officer') && !userData?.role?.toLowerCase()?.includes('researcher') && !isAdmin && (
                <>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3">
                      <WeatherRiskWidget />
                    </div>
                  </div>
                  {/* <RecentScansTable /> */}
                </>
              )}
            </div>
          )}

          {activeSection === 'satellite' && (
            <div className="space-y-6">
              <SatelliteMonitoringView />

              <div className="grid grid-cols-2 gap-6">

                <TreatmentRecommendation />
              </div>
            </div>
          )}

          {activeSection === 'diagnosis' && (
            <div className="space-y-6">
              <AIDiagnosisModule userData={userData} />

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-3">
                  <RecentScansTable />
                </div>
                <div>
                  <TreatmentRecommendation />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
              <DataExportModule userData={userData} />
            </div>
          )}

          {activeSection === 'escalate' && (
            <EscalationModule />
          )}

          {activeSection === 'communications' && !isAdmin && (
            <CommunicationModule userData={userData} />
          )}

          {activeSection === 'expert-review' && (
            <OfficerEscalationTable userData={userData} setActiveSection={setActiveSection} />
          )}

          {activeSection === 'ai-training' && !userData?.role?.toLowerCase()?.includes('officer') && (
            <AITrainingCenter />
          )}

          {activeSection === 'user-management' && isAdmin && (
            <UserManagementModule />
          )}

          {activeSection === 'support-tickets' && isAdmin && (
            <AdminSupportModule userData={userData} />
          )}

          {activeSection === 'satellite-insights' && (
            <SatelliteInsightsPanel />
          )}

          {activeSection === 'settings' && (
            <SettingsModule />
          )}
        </div>
      </main>
    </div>
  );
}
