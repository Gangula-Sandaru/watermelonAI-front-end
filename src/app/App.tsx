import { useState, useEffect } from 'react';
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
  // Initialize authentication from localStorage so it persists across refreshes
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('access_token');
  });

  const [userData, setUserData] = useState<{ username?: string, email?: string, role?: string } | null>(null);

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
            return;
          }
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
            
            // Apply theme preference from profile
            if (data.theme_preference === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }

            // Auto-redirect if admin to AI Training
            const isAdminUser = data.role === 'admin' || data.role === 'superadmin' || data.is_superuser === true;
            if (isAdminUser && activeSection === 'dashboard') {
              setActiveSection('ai-training');
            }
          }
        } catch (error) {
          console.error("Failed to fetch profile", error);
        }
      };
      fetchProfile();
    } else {
      setUserData(null);
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
        userData={userData}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeSection === 'dashboard' && (userData?.role?.toLowerCase()?.includes('officer') ? 'Officer Dashboard' : isAdmin ? 'Admin Dashboard' : 'Analytics Dashboard')}
                  {activeSection === 'satellite' && 'Satellite Monitoring'}
                  {activeSection === 'diagnosis' && 'AI Disease Diagnosis'}
                  {activeSection === 'data' && 'Data Management'}
                  {activeSection === 'communications' && 'Communications Hub'}
                  {activeSection === 'expert-review' && 'Expert Review Queue'}
                  {activeSection === 'ai-training' && !userData?.role?.toLowerCase()?.includes('officer') && 'AI Training Center'}
                  {activeSection === 'settings' && 'Settings'}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeSection === 'dashboard' && (userData?.role?.toLowerCase()?.includes('officer') ? 'නිලධාරි උපකරණ පුවරුව' : isAdmin ? 'පරිපාලක උපකරණ පුවරුව' : 'විශ්ලේෂණ උපකරණ පුවරුව')}
                  {activeSection === 'satellite' && 'චන්ද්‍රිකා අධීක්ෂණය'}
                  {activeSection === 'diagnosis' && 'AI රෝග විනිශ්චය'}
                  {activeSection === 'data' && 'දත්ත කළමනාකරණය'}
                  {activeSection === 'communications' && 'සන්නිවේදන කේන්ද්‍රය'}
                  {activeSection === 'expert-review' && 'විශේෂඥ සමාලෝචන පෝලිම'}
                  {activeSection === 'ai-training' && !userData?.role?.toLowerCase()?.includes('officer') && 'AI පුහුණු මධ්‍යස්ථානය'}
                  {activeSection === 'settings' && 'සැකසීම්'}
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
                    <div className="col-span-2">
                      <SatelliteMonitoringView />
                    </div>
                    <div>
                      <WeatherRiskWidget />
                    </div>
                  </div>
                  <RecentScansTable />
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

          {activeSection === 'communications' && (
            <CommunicationModule />
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
