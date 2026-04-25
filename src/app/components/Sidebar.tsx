import { LayoutDashboard, Satellite, Brain, Settings, FileText, MapPin, LogOut } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
  userData: {username?: string, email?: string} | null;
}

export function Sidebar({ activeSection, setActiveSection, onLogout, userData }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', labelSi: 'උපකරණ පුවරුව' },
    { id: 'satellite', icon: Satellite, label: 'Satellite View', labelSi: 'චන්ද්‍රිකා දර්ශනය' },
    { id: 'diagnosis', icon: Brain, label: 'AI Diagnosis', labelSi: 'AI රෝග විනිශ්චය' },
    { id: 'data', icon: FileText, label: 'Data Management', labelSi: 'දත්ත කළමනාකරණය' },
    { id: 'settings', icon: Settings, label: 'Settings', labelSi: 'සැකසීම්' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo & Title */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2E7D32] flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[#2E7D32]">WatermelonAI</h1>
            <p className="text-xs text-gray-500">Disease Detection</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#2E7D32] text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className={isActive ? 'font-medium' : ''}>{item.label}</div>
                    <div className="text-xs opacity-75">{item.labelSi}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 group">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex flex-shrink-0 items-center justify-center overflow-hidden">
            <span className="text-sm font-semibold text-gray-700 uppercase">
              {userData?.username ? userData.username.substring(0, 2) : (userData?.email ? userData.email.substring(0, 2) : 'US')}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate" title={userData?.username || userData?.email}>
              {userData?.username || userData?.email || 'Loading...'}
            </p>
            <p className="text-xs text-gray-500 truncate">WatermelonAI</p>
          </div>
          <button 
            onClick={onLogout}
            title="Logout"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
