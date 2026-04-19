import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { WeatherRiskWidget } from './components/WeatherRiskWidget';
import { SatelliteMonitoringView } from './components/SatelliteMonitoringView';
import { AIDiagnosisModule } from './components/AIDiagnosisModule';
import { TreatmentRecommendation } from './components/TreatmentRecommendation';
import { RecentScansTable } from './components/RecentScansTable';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { LandingPage } from './components/landing/LandingPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register'>('landing');
  const [activeSection, setActiveSection] = useState('dashboard');

  if (!isAuthenticated) {
    if (authMode === 'landing') {
      return <LandingPage onNavigate={(mode) => setAuthMode(mode)} />;
    }
    
    return authMode === 'login' ? (
      <Login 
        onLogin={() => setIsAuthenticated(true)} 
        onSwitchToRegister={() => setAuthMode('register')} 
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
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

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
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  <span className="text-sm font-semibold">System Status: </span>
                  <span className="text-sm">Online</span>
                </div>
                <div className="text-sm text-gray-600">
                  January 3, 2026 • 10:45 AM
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
