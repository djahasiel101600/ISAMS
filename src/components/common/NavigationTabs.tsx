/**
 * ISAMS Primary Navigation Tab Bar
 */

import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Boxes, 
  BookOpenCheck, 
  MoveRight, 
  QrCode, 
  History, 
  BarChart3,
  Camera,
  Database
} from 'lucide-react';

export type TabId = 
  | 'dashboard'
  | 'spatial'
  | 'ar_scanner'
  | 'inventory'
  | 'borrowing'
  | 'relocation'
  | 'qr_studio'
  | 'audit'
  | 'reports'
  | 'db_integration';

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  checkedOutCount: number;
  totalAssetsCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  checkedOutCount,
  totalAssetsCount
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabId,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'spatial' as TabId,
      label: 'Spatial Explorer',
      icon: MapPin,
      badge: 'Indoor Map'
    },
    {
      id: 'ar_scanner' as TabId,
      label: 'AR Room Scanner',
      icon: Camera,
      badge: '3D AR'
    },
    {
      id: 'inventory' as TabId,
      label: 'Asset Inventory',
      icon: Boxes,
      count: totalAssetsCount
    },
    {
      id: 'borrowing' as TabId,
      label: 'Check-In / Check-Out',
      icon: BookOpenCheck,
      count: checkedOutCount,
      alert: checkedOutCount > 0
    },
    {
      id: 'relocation' as TabId,
      label: 'Asset Relocation',
      icon: MoveRight
    },
    {
      id: 'qr_studio' as TabId,
      label: 'QR Studio',
      icon: QrCode
    },
    {
      id: 'audit' as TabId,
      label: 'Audit Trail',
      icon: History
    },
    {
      id: 'reports' as TabId,
      label: 'Reports & Analytics',
      icon: BarChart3
    },
    {
      id: 'db_integration' as TabId,
      label: 'PostgreSQL Integration',
      icon: Database,
      badge: 'Database'
    }
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer select-none
                  ${isActive
                    ? 'bg-blue-600/90 text-white shadow-sm ring-1 ring-blue-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`
                    ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold
                    ${tab.alert && !isActive 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-800 text-slate-400'}
                  `}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
