/**
 * ServicePulse - Equipment Maintenance & Service Log System
 * Powered by Google Sheets for seamless data management and automated status reporting.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  MaintenanceLog, 
  SpreadsheetMetadata, 
  ActiveTab, 
  ServiceStatus 
} from './types/maintenance';
import { INITIAL_SAMPLE_LOGS } from './services/sampleData';
import { 
  initAuth, 
  googleSignIn, 
  getAccessToken, 
  logout 
} from './services/firebaseAuth';
import { 
  createMaintenanceSpreadsheet, 
  getSpreadsheetDetails, 
  fetchSheetLogs, 
  appendSheetLog, 
  updateSheetLog, 
  deleteSheetLogRow 
} from './services/sheetsService';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { LogsTableView } from './components/LogsTableView';
import { ReportsView } from './components/ReportsView';
import { NewLogModal } from './components/NewLogModal';
import { LogDetailDrawer } from './components/LogDetailDrawer';
import { SheetConnectModal } from './components/SheetConnectModal';
import { ConfirmModal } from './components/ConfirmModal';

import { Sheet, AlertCircle, CheckCircle2, RefreshCw, X, ShieldCheck } from 'lucide-react';

const LOCAL_STORAGE_KEY_LOGS = 'servicepulse_maintenance_logs';
const LOCAL_STORAGE_KEY_SHEET = 'servicepulse_active_sheet';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
      if (saved) {
        const parsed: MaintenanceLog[] = JSON.parse(saved);
        return parsed.map((item) => {
          // If existing sample log, pull sample itemNo/quantity if missing
          const sample = INITIAL_SAMPLE_LOGS.find(s => s.id === item.id);
          return {
            ...item,
            area: item.area !== undefined ? item.area : (sample?.area || 'General Plant'),
            itemNo: item.itemNo !== undefined ? item.itemNo : (sample?.itemNo || ''),
            quantity: item.quantity !== undefined ? item.quantity : (sample?.quantity || ''),
          };
        });
      }
    } catch (e) {
      console.warn('Could not load cached logs:', e);
    }
    return INITIAL_SAMPLE_LOGS;
  });

  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetMetadata | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SHEET);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load cached sheet:', e);
    }
    return null;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [isNewLogOpen, setIsNewLogOpen] = useState(false);
  const [isSheetConnectOpen, setIsSheetConnectOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Confirmation modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Sync logs state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not cache logs to localStorage:', e);
    }
  }, [logs]);

  // Sync spreadsheet state with localStorage
  useEffect(() => {
    try {
      if (spreadsheet) {
        localStorage.setItem(LOCAL_STORAGE_KEY_SHEET, JSON.stringify(spreadsheet));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_SHEET);
      }
    } catch (e) {
      console.warn('Could not cache spreadsheet to localStorage:', e);
    }
  }, [spreadsheet]);

  // Fetch logs from Google Sheet
  const loadSheetData = useCallback(async (token: string, sheetMeta: SpreadsheetMetadata) => {
    setIsSyncing(true);
    try {
      const fetchedLogs = await fetchSheetLogs(token, sheetMeta.id, sheetMeta.sheetName);
      if (fetchedLogs.length > 0) {
        setLogs(fetchedLogs);
        setSpreadsheet(prev => prev ? { ...prev, lastSyncedAt: new Date().toISOString() } : prev);
        showToast(`Synced ${fetchedLogs.length} maintenance records from Google Sheets`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to sync with Google Sheet:', err);
      showToast(err.message || 'Error syncing with Google Sheet', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authUser, token) => {
        setUser(authUser);
        if (spreadsheet) {
          await loadSheetData(token, spreadsheet);
        }
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, [spreadsheet, loadSheetData]);

  // Sign In Handler
  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showToast(`Signed in as ${result.user.displayName || result.user.email}`);
        if (!spreadsheet) {
          setIsSheetConnectOpen(true);
        } else {
          await loadSheetData(result.accessToken, spreadsheet);
        }
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      showToast(err?.message || 'Google Sign-in failed', 'error');
    }
  };

  // Sign Out Handler
  const handleLogout = async () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Sign Out of Google Workspace',
      message: 'Are you sure you want to sign out? Your local records will remain safely saved.',
      confirmLabel: 'Sign Out',
      onConfirm: async () => {
        await logout();
        setUser(null);
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        showToast('Signed out of Google account', 'info');
      }
    });
  };

  // Create new template Google Sheet
  const handleCreateNewSheet = async (title?: string) => {
    const token = await getAccessToken();
    if (!token) {
      showToast('Please sign in with Google first to create a spreadsheet in Drive', 'error');
      await handleLogin();
      return;
    }

    const created = await createMaintenanceSpreadsheet(token, title);
    setSpreadsheet(created);
    showToast(`Created & formatted "${created.name}" in your Google Drive!`, 'success');
    // Fetch logs from the newly created sheet
    await loadSheetData(token, created);
  };

  // Link existing spreadsheet
  const handleLinkExistingSheet = async (idOrUrl: string) => {
    const token = await getAccessToken();
    if (!token) {
      showToast('Please sign in with Google first to access your spreadsheets', 'error');
      await handleLogin();
      return;
    }

    const linked = await getSpreadsheetDetails(token, idOrUrl);
    setSpreadsheet(linked);
    showToast(`Connected to spreadsheet: ${linked.name}`, 'success');
    await loadSheetData(token, linked);
  };

  // Disconnect sheet
  const handleDisconnectSheet = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Disconnect Google Sheet',
      message: `Disconnect "${spreadsheet?.name}"? Your Google Sheet in Drive will not be deleted, but this app will switch to local cache mode.`,
      confirmLabel: 'Disconnect',
      isDestructive: false,
      onConfirm: () => {
        setSpreadsheet(null);
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        setIsSheetConnectOpen(false);
        showToast('Disconnected from Google Sheet', 'info');
      }
    });
  };

  // Manual Refresh / Sync
  const handleManualSync = async () => {
    if (!spreadsheet) {
      setIsSheetConnectOpen(true);
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      showToast('Google session expired. Please sign in again.', 'info');
      await handleLogin();
      return;
    }
    await loadSheetData(token, spreadsheet);
  };

  // Add new service log
  const handleAddNewLog = async (logData: Omit<MaintenanceLog, 'id' | 'timestamp'>) => {
    setIsSubmitting(true);
    const newId = `LOG-${new Date().getFullYear()}-${1000 + logs.length + 1}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newLog: MaintenanceLog = {
      ...logData,
      id: newId,
      timestamp,
      rowIndex: logs.length + 2,
    };

    // Optimistic UI update
    setLogs(prev => [newLog, ...prev]);

    // If connected to Google Sheet, append row
    const token = await getAccessToken();
    if (token && spreadsheet) {
      try {
        await appendSheetLog(token, spreadsheet.id, newLog, spreadsheet.sheetName);
        showToast(`Log ${newId} synchronized to Google Sheet!`, 'success');
      } catch (err: any) {
        console.error('Failed to append to Google Sheet:', err);
        showToast(`Saved locally. Google Sheet sync pending: ${err.message}`, 'error');
      }
    } else {
      showToast(`Log ${newId} saved locally (Connect Google Sheet for cloud sync)`, 'info');
    }

    setIsSubmitting(false);
  };

  // Update existing service log
  const handleUpdateLog = async (updatedLog: MaintenanceLog) => {
    // Optimistic UI update
    setLogs(prev => prev.map(l => (l.id === updatedLog.id ? updatedLog : l)));
    if (selectedLog?.id === updatedLog.id) {
      setSelectedLog(updatedLog);
    }

    const token = await getAccessToken();
    if (token && spreadsheet) {
      try {
        await updateSheetLog(token, spreadsheet.id, updatedLog, spreadsheet.sheetName);
        showToast(`Updated log ${updatedLog.id} in Google Sheet`, 'success');
      } catch (err: any) {
        console.error('Failed to update Google Sheet:', err);
        showToast(`Saved locally. Sheet update failed: ${err.message}`, 'error');
      }
    } else {
      showToast(`Updated ${updatedLog.id} locally`, 'info');
    }
  };

  // Quick advance status helper
  const handleQuickUpdateStatus = async (log: MaintenanceLog, newStatus: ServiceStatus) => {
    const updated = { ...log, status: newStatus };
    await handleUpdateLog(updated);
  };

  // Delete log with mandatory user confirmation
  const handleDeleteLog = async (logToDelete: MaintenanceLog) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Maintenance Log',
      message: `Are you sure you want to permanently delete record ${logToDelete.id} for "${logToDelete.equipmentName}"? This action cannot be undone.`,
      confirmLabel: 'Delete Record',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        setIsDetailDrawerOpen(false);

        // Optimistic remove
        setLogs(prev => prev.filter(l => l.id !== logToDelete.id));

        const token = await getAccessToken();
        if (token && spreadsheet && logToDelete.rowIndex) {
          try {
            await deleteSheetLogRow(token, spreadsheet.id, logToDelete.rowIndex, spreadsheet.sheetName);
            showToast(`Deleted ${logToDelete.id} from Google Sheet`, 'success');
          } catch (err: any) {
            console.error('Failed to delete row in sheet:', err);
            showToast(`Removed from local view. Sheet sync note: ${err.message}`, 'info');
          }
        } else {
          showToast(`Deleted ${logToDelete.id} from local ledger`, 'info');
        }
      }
    });
  };

  const handleOpenLogDetail = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setIsDetailDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium border bg-slate-900 text-white border-slate-800">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {toastMessage.type === 'info' && <Sheet className="w-4 h-4 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        spreadsheet={spreadsheet}
        isSyncing={isSyncing}
        onOpenNewLog={() => setIsNewLogOpen(true)}
        onOpenSheetConnect={() => setIsSheetConnectOpen(true)}
        onManualSync={handleManualSync}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Connection Notice Sub-bar if not connected to Google Sheets */}
      {!spreadsheet && (
        <div className="bg-slate-100 border-b border-slate-200 py-2 px-4 no-print">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>
                <strong>Working in Local Mode:</strong> Changes are stored in browser memory. Connect your Google Sheet for automated cloud synchronization and team collaboration.
              </span>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  handleLogin();
                } else {
                  setIsSheetConnectOpen(true);
                }
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 underline"
            >
              <Sheet className="w-3.5 h-3.5" />
              <span>{user ? 'Link or Create Google Sheet' : 'Sign in & Connect Google Sheet'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            logs={logs}
            onOpenLogDetail={handleOpenLogDetail}
            onOpenNewLog={() => setIsNewLogOpen(true)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onQuickUpdateStatus={handleQuickUpdateStatus}
          />
        )}

        {activeTab === 'logs' && (
          <LogsTableView
            logs={logs}
            onOpenLogDetail={handleOpenLogDetail}
            onOpenNewLog={() => setIsNewLogOpen(true)}
            onQuickUpdateStatus={handleQuickUpdateStatus}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            logs={logs}
            spreadsheet={spreadsheet}
          />
        )}
      </main>

      {/* Modals & Slide-over Drawers */}
      <NewLogModal
        isOpen={isNewLogOpen}
        onClose={() => setIsNewLogOpen(false)}
        onSubmit={handleAddNewLog}
        isSubmitting={isSubmitting}
      />

      <LogDetailDrawer
        log={selectedLog}
        isOpen={isDetailDrawerOpen}
        spreadsheet={spreadsheet}
        onClose={() => setIsDetailDrawerOpen(false)}
        onUpdate={handleUpdateLog}
        onDelete={handleDeleteLog}
        isUpdating={isSubmitting}
      />

      <SheetConnectModal
        isOpen={isSheetConnectOpen}
        onClose={() => setIsSheetConnectOpen(false)}
        spreadsheet={spreadsheet}
        onCreateNewSheet={handleCreateNewSheet}
        onLinkExistingSheet={handleLinkExistingSheet}
        onDisconnectSheet={handleDisconnectSheet}
      />

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmLabel={confirmModalConfig.confirmLabel}
        isDestructive={confirmModalConfig.isDestructive}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Subtle Operational Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">ServicePulse</span>
            <span aria-hidden="true">·</span>
            <span>Equipment & Machinery Maintenance System</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Google Sheets API v4</span>
            <span aria-hidden="true">·</span>
            <span>Real-time Two-Way Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
