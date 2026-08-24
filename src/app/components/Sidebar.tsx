import { LayoutDashboard, Satellite, Brain, Settings, FileText, MapPin, LogOut, ShieldAlert, MessageSquare, Database, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../utils/translations';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
  userData: { username?: string, email?: string, role?: string } | null;
  unreadBroadcastCount?: number;
}

export function Sidebar({ activeSection, setActiveSection, onLogout, userData, unreadBroadcastCount = 0 }: SidebarProps) {
  const { t } = useTranslation();
  const role = userData?.role?.toLowerCase();
  const isOfficer = role?.includes('officer');
  const isAdmin = role === 'admin' || role === 'superadmin' || (userData as any)?.is_superuser === true;
  const isResearcher = role === 'researcher';
  const effectiveRole = isAdmin ? 'admin' : (isOfficer ? 'officer' : (isResearcher ? 'researcher' : 'farmer'));

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, roles: ['farmer', 'officer', 'admin', 'researcher'] },
    { id: 'satellite', icon: Satellite, roles: ['farmer'] },
    { id: 'diagnosis', icon: Brain, roles: ['farmer'] },
    { id: 'communications', icon: MessageSquare, roles: ['farmer', 'officer'] },
    { id: 'expert-review', icon: ShieldAlert, roles: ['officer'] },
    { id: 'ai-training', icon: Database, roles: ['researcher', 'admin'] },
    { id: 'satellite-insights', icon: Satellite, roles: ['researcher'], label: 'Satellite Insights', subtitle: 'NDVI & export data' },
    { id: 'escalate', icon: ShieldAlert, roles: ['farmer'] },
    { id: 'data', icon: FileText, roles: ['farmer', 'officer', 'researcher'] },
    { id: 'settings', icon: Settings, roles: ['farmer', 'officer', 'researcher', 'admin'] },
  ];

  const filteredItems = menuItems.filter(item => !item.roles || item.roles.includes(effectiveRole));

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col">
      {/* Logo & Title */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2E7D32] flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[#2E7D32]">WatermelonAI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Disease Detection</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            // Map item.id to translations.ts key format (camelCase)
            let translationKey = item.id;
            if (item.id === 'expert-review') translationKey = 'expertReview';
            if (item.id === 'ai-training') translationKey = 'aiTraining';

            // Items with a hardcoded label (no translation key) use their label directly
            const translatedLabel    = (item as any).label    ?? t(translationKey as any);
            const translatedSubtitle = (item as any).subtitle ?? t(`${translationKey}Subtitle` as any);

            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full h-12 flex items-center gap-3 px-4 rounded-lg transition-all ${isActive
                      ? 'bg-[#2E7D32] text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-grow min-w-0 text-left flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`truncate text-sm leading-snug ${isActive ? 'font-semibold' : 'font-medium text-gray-800 dark:text-gray-200'}`}>{translatedLabel}</div>
                      <div className="text-[10px] opacity-75 truncate leading-none">{translatedSubtitle}</div>
                    </div>
                    {item.id === 'communications' && unreadBroadcastCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-bounce shadow-md">
                        {unreadBroadcastCount}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3 group">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex flex-shrink-0 items-center justify-center overflow-hidden">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
              {userData?.username ? userData.username.substring(0, 2) : (userData?.email ? userData.email.substring(0, 2) : 'US')}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={userData?.username || userData?.email}>
              {userData?.username || userData?.email || 'Loading...'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">WatermelonAI</p>
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
