import React from 'react';
import { User } from 'firebase/auth';
import { ActiveTab, SpreadsheetMetadata } from '../types/maintenance';
import { Wrench, Plus, ExternalLink, LogOut, Sheet, RefreshCw, AlertCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: User | null;
  spreadsheet: SpreadsheetMetadata | null;
  isSyncing: boolean;
  onOpenNewLog: () => void;
  onOpenSheetConnect: () => void;
  onManualSync: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  user,
  spreadsheet,
  isSyncing,
  onOpenNewLog,
  onOpenSheetConnect,
  onManualSync,
  onLogin,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark with icon */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wrench className="w-5 h-5" />
            </div>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onTabChange('dashboard'); }}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-emerald-400 transition-colors"
            >
              ServicePulse
            </a>
          </div>

          {/* Zone 2: 3 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
                activeTab === 'dashboard'
                  ? 'text-white border-emerald-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onTabChange('logs')}
              className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
                activeTab === 'logs'
                  ? 'text-white border-emerald-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Maintenance Logs
            </button>
            <button
              onClick={() => onTabChange('reports')}
              className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
                activeTab === 'reports'
                  ? 'text-white border-emerald-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              Status Reports
            </button>
          </nav>

          {/* Zone 3: Connection & Primary Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {spreadsheet ? (
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs">
                <Sheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 max-w-[130px] truncate" title={spreadsheet.name}>
                  {spreadsheet.name}
                </span>
                <a
                  href={spreadsheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-emerald-400 transition-colors ml-0.5"
                  title="Open Google Sheet in Drive"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className={`text-slate-400 hover:text-slate-200 ml-1 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`}
                  title="Sync with Google Sheet"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : user ? (
              <button
                onClick={onOpenSheetConnect}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded-md hover:bg-emerald-900/60 transition-colors"
              >
                <Sheet className="w-3.5 h-3.5" />
                Link Google Sheet
              </button>
            ) : null}

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenNewLog}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Service</span>
                </button>
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full border border-slate-600 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-200">
                      {user.displayName ? user.displayName[0] : 'U'}
                    </div>
                  )}
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenNewLog}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Service</span>
                </button>
                <button
                  onClick={onLogin}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Connect Sheets</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 py-2 px-4 bg-slate-900/90 text-xs">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`py-1 px-2 ${activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onTabChange('logs')}
          className={`py-1 px-2 ${activeTab === 'logs' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Maintenance Logs
        </button>
        <button
          onClick={() => onTabChange('reports')}
          className={`py-1 px-2 ${activeTab === 'reports' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Status Reports
        </button>
      </div>
    </header>
  );
};
