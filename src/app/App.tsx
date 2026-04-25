import { useState, useEffect } from 'react';
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
import { LandingPage } from './components/landing/LandingPage';

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

  const [userData, setUserData] = useState<{username?: string, email?: string} | null>(null);

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
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
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

  const getInitialAuthMode = (): 'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' => {
    const path = window.location.pathname;
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/reset-password') return 'reset-password';
    return 'landing';
  };

  const getInitialSection = () => {
    const path = window.location.pathname;
    const validSections = ['dashboard', 'satellite', 'diagnosis', 'data', 'settings'];
    const section = path.substring(1);
    if (validSections.includes(section)) return section;
    return 'dashboard';
  };

  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password'>(getInitialAuthMode());
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
        else setAuthMode('landing');
      } else {
        const section = path.substring(1);
        if (['dashboard', 'satellite', 'diagnosis', 'data', 'settings'].includes(section)) {
          setActiveSection(section);
        } else {
          setActiveSection('dashboard');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setAuthMode('login');
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
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeSection === 'dashboard' && 'Analytics Dashboard'}
                  {activeSection === 'satellite' && 'Satellite Monitoring'}
                  {activeSection === 'diagnosis' && 'AI Disease Diagnosis'}
                  {activeSection === 'data' && 'Data Management'}
                  {activeSection === 'settings' && 'Settings'}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeSection === 'dashboard' && 'විශ්ලේෂණ උපකරණ පුවරුව'}
                  {activeSection === 'satellite' && 'චන්ද්‍රිකා අධීක්ෂණය'}
                  {activeSection === 'diagnosis' && 'AI රෝග විනිශ්චය'}
                  {activeSection === 'data' && 'දත්ත කළමනාකරණය'}
                  {activeSection === 'settings' && 'සැකසීම්'}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                    {userData ? (userData.username || userData.email) : 'Loading...'}
                  </p>
                  <p className="text-xs text-[#2E7D32] font-semibold uppercase tracking-wider">
                    {userData ? 'WatermelonAI User' : 'Fetching...'}
                  </p>
                </div>
                
                <div className="h-10 w-px bg-gray-200"></div>
                
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold">System Online</span>
                  </div>
                  <div className="text-sm text-gray-600 font-medium w-[180px] text-right">
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
            <div className="space-y-6">
              {/* Analytics Overview */}
              <AnalyticsDashboard />

              {/* Dashboard Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <SatelliteMonitoringView />
                </div>
                <div>
                  <WeatherRiskWidget />
                </div>
              </div>

              {/* Recent Scans */}
              <RecentScansTable />
            </div>
          )}

          {activeSection === 'satellite' && (
            <div className="space-y-6">
              <SatelliteMonitoringView />
              
              <div className="grid grid-cols-2 gap-6">
                <WeatherRiskWidget />
                <TreatmentRecommendation />
              </div>
            </div>
          )}

          {activeSection === 'diagnosis' && (
            <div className="space-y-6">
              <AIDiagnosisModule />
              
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <RecentScansTable />
                </div>
                <div>
                  <TreatmentRecommendation />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-6">
              <RecentScansTable />
              
              <div className="grid grid-cols-2 gap-6">
                <SatelliteMonitoringView />
                <div className="space-y-6">
                  <WeatherRiskWidget />
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Export Data</h3>
                    <div className="space-y-3">
                      <button className="w-full px-4 py-2 bg-[#2E7D32] text-white rounded-lg hover:bg-[#1B5E20] transition-colors">
                        Export to CSV
                      </button>
                      <button className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Export to PDF
                      </button>
                      <button className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="max-w-4xl">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">System Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language / භාෂාව
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                      <option>English</option>
                      <option>සිංහල (Sinhala)</option>
                      <option>தமிழ் (Tamil)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Preferences
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm text-gray-700">Disease detection alerts</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm text-gray-700">Weather risk warnings</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-gray-700">Weekly reports</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Location
                    </label>
                    <input 
                      type="text" 
                      placeholder="Enter GPS coordinates"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      defaultValue="7.8731° N, 80.7718° E"
                    />
                  </div>

                  <button className="w-full px-4 py-2 bg-[#2E7D32] text-white rounded-lg hover:bg-[#1B5E20] transition-colors mt-4">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
