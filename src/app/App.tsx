import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { BarChart2 } from 'lucide-react';
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


  const [userData, setUserData] = useState<{ username?: string, email?: string, role?: string } | null>(null);
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
              allowedSections = ['dashboard', 'ai-training', 'settings'];
            } else if (isOfficerUser) {
              allowedSections = ['dashboard', 'communications', 'expert-review', 'data', 'settings'];
            } else if (isResearcherUser) {
              allowedSections = ['satellite', 'ai-training', 'data', 'settings'];
            } else { // Farmer
              allowedSections = ['dashboard', 'satellite', 'diagnosis', 'communications', 'escalate', 'data', 'settings'];
            }

            if (!allowedSections.includes(activeSection)) {
               setActiveSection(isAdminUser ? 'ai-training' : (isResearcherUser ? 'satellite' : 'dashboard'));
            } else if (isAdminUser && activeSection === 'dashboard') {
               setActiveSection('ai-training');
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
    const validSections = ['dashboard', 'satellite', 'diagnosis', 'data', 'communications', 'expert-review', 'ai-training', 'escalate', 'settings'];
    const section = path.substring(1);
    if (validSections.includes(section)) return section;
    return 'dashboard';
  };

  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email'>(getInitialAuthMode());
  const [activeSection, setActiveSection] = useState(getInitialSection());
  const [globalUnreadBroadcasts, setGlobalUnreadBroadcasts] = useState(0);
  const broadcastsLenRef = useRef(0);

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
             toast.success(t('newBroadcastReceived') || "New Regional Broadcast Received!");
             playReceiveSound();
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
  }, [isAuthenticated, authMode]);

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
        if (['dashboard', 'satellite', 'diagnosis', 'data', 'communications', 'expert-review', 'ai-training', 'escalate', 'settings'].includes(section)) {
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
      />
    ) : (
      <Register
        onRegister={() => setIsAuthenticated(true)}
        onSwitchToLogin={() => setAuthMode('login')}
        onSwitchToVerifyEmail={() => setAuthMode('verify-email')}
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
                  {activeSection === 'dashboard' && (userData?.role?.toLowerCase()?.includes('officer') ? 'Officer Dashboard' : isAdmin ? 'Admin Dashboard' : t('dashboard'))}
                  {activeSection === 'satellite' && t('satellite')}
                  {activeSection === 'diagnosis' && t('diagnosis')}
                  {activeSection === 'data' && t('data')}
                  {activeSection === 'communications' && t('communications')}
                  {activeSection === 'expert-review' && t('expertReview')}
                  {activeSection === 'ai-training' && !userData?.role?.toLowerCase()?.includes('officer') && t('aiTraining')}
                  {activeSection === 'settings' && t('systemSettings')}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeSection === 'dashboard' && (userData?.role?.toLowerCase()?.includes('officer') ? 'නිලධාරි උපකරණ පුවරුව' : isAdmin ? 'පරිපාලක උපකරණ පුවරුව' : t('dashboardSubtitle'))}
                  {activeSection === 'satellite' && t('satelliteSubtitle')}
                  {activeSection === 'diagnosis' && t('diagnosisSubtitle')}
                  {activeSection === 'data' && t('dataSubtitle')}
                  {activeSection === 'communications' && t('communicationsSubtitle')}
                  {activeSection === 'expert-review' && t('expertReviewSubtitle')}
                  {activeSection === 'ai-training' && !userData?.role?.toLowerCase()?.includes('officer') && t('aiTrainingSubtitle')}
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

        {/* Content Sections */}
        <div className="p-8">
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              <AnalyticsDashboard userData={userData} />

              {!userData?.role?.toLowerCase()?.includes('officer') && !userData?.role?.toLowerCase()?.includes('researcher') && (
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
              <AIDiagnosisModule />

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
            <OfficerEscalationTable setActiveSection={setActiveSection} />
          )}

          {activeSection === 'ai-training' && !userData?.role?.toLowerCase()?.includes('officer') && (
            <AITrainingCenter />
          )}

          {activeSection === 'settings' && (
            <SettingsModule />
          )}
        </div>
      </main>
    </div>
  );
}
