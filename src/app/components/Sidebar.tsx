import { LayoutDashboard, Satellite, Brain, Settings, FileText, MapPin } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
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
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-700">FO</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Field Officer</p>
            <p className="text-xs text-gray-500">ක්ෂේත්‍ර නිලධාරී</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
