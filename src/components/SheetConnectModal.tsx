import React, { useState } from 'react';
import { SpreadsheetMetadata } from '../types/maintenance';
import { Sheet, Plus, Link2, ExternalLink, Check, AlertCircle, X, Sparkles } from 'lucide-react';

interface SheetConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheet: SpreadsheetMetadata | null;
  onCreateNewSheet: (title?: string) => Promise<void>;
  onLinkExistingSheet: (idOrUrl: string) => Promise<void>;
  onDisconnectSheet: () => void;
}

export const SheetConnectModal: React.FC<SheetConnectModalProps> = ({
  isOpen,
  onClose,
  spreadsheet,
  onCreateNewSheet,
  onLinkExistingSheet,
  onDisconnectSheet,
}) => {
  const [activeMode, setActiveMode] = useState<'create' | 'link'>('create');
  const [customTitle, setCustomTitle] = useState('Equipment Maintenance Logs (ServicePulse)');
  const [existingInput, setExistingInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onCreateNewSheet(customTitle);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create Google Sheet. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async () => {
    if (!existingInput.trim()) {
      setError('Please provide a Google Sheet URL or ID');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await onLinkExistingSheet(existingInput.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to connect spreadsheet. Verify sheet is accessible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Google Sheet Database Connection</h2>
              <p className="text-xs text-slate-500">Live two-way spreadsheet sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Connection Status */}
        {spreadsheet && (
          <div className="m-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-emerald-700 font-semibold flex items-center gap-1 mb-1">
                  <Check className="w-3.5 h-3.5" /> Currently Connected
                </span>
                <p className="font-medium text-slate-900 text-sm">{spreadsheet.name}</p>
                <p className="text-slate-500 font-mono-numbers mt-0.5">Sheet Tab: {spreadsheet.sheetName}</p>
              </div>
              <a
                href={spreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-300 rounded hover:bg-emerald-50 transition-colors"
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">
                Last synced: {spreadsheet.lastSyncedAt ? new Date(spreadsheet.lastSyncedAt).toLocaleTimeString() : 'Just now'}
              </span>
              <button
                type="button"
                onClick={onDisconnectSheet}
                className="text-red-600 hover:text-red-700 font-medium underline"
              >
                Disconnect Sheet
              </button>
            </div>
          </div>
        )}

        {/* Tabs for Create vs Link */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => { setActiveMode('create'); setError(null); }}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'create'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Template Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('link'); setError(null); }}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'link'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Link Existing Sheet</span>
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeMode === 'create' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Spreadsheet Title in Google Drive
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900"
                  placeholder="Equipment Maintenance Logs"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  What will be created automatically:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                  <li>Formatted "Maintenance Logs" tab with bold header styling</li>
                  <li>15 standardized columns (Equipment, Asset ID, Category, Priority, SLA dates, etc.)</li>
                  <li>Pre-seeded with 7 realistic machine maintenance logs to get started</li>
                  <li>Instant two-way live editing with full Google Drive ownership</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Creating & Formatting Sheet...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create & Connect Google Sheet</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Google Sheet URL or Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={existingInput}
                  onChange={(e) => setExistingInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 font-mono-numbers"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X..."
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Paste the entire address bar URL or the alphanumeric ID from your sheet.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLink}
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Connecting to Spreadsheet...</span>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Connect Existing Spreadsheet</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
