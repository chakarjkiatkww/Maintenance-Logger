import React, { useState, useEffect } from 'react';
import { MaintenanceLog, ServiceStatus, PriorityLevel, MaintenanceCategory, SpreadsheetMetadata } from '../types/maintenance';
import { 
  X, 
  Wrench, 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  Trash2, 
  Save, 
  CheckCircle2, 
  ExternalLink, 
  AlertTriangle,
  Layers,
  ArrowRight,
  MapPin
} from 'lucide-react';

interface LogDetailDrawerProps {
  log: MaintenanceLog | null;
  isOpen: boolean;
  spreadsheet: SpreadsheetMetadata | null;
  onClose: () => void;
  onUpdate: (updatedLog: MaintenanceLog) => Promise<void>;
  onDelete: (log: MaintenanceLog) => Promise<void>;
  isUpdating: boolean;
}

export const LogDetailDrawer: React.FC<LogDetailDrawerProps> = ({
  log,
  isOpen,
  spreadsheet,
  onClose,
  onUpdate,
  onDelete,
  isUpdating,
}) => {
  const [formData, setFormData] = useState<MaintenanceLog | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (log) {
      setFormData({ ...log });
      setHasChanges(false);
    }
  }, [log]);

  if (!isOpen || !log || !formData) return null;

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = formData.status !== 'Completed' && formData.nextServiceDue && formData.nextServiceDue < today;

  const handleFieldChange = (field: keyof MaintenanceLog, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
    setHasChanges(true);
  };

  const handleQuickStatus = async (status: ServiceStatus) => {
    let ackDate = formData.acknowledgeDate;
    if (!ackDate && (status === 'In Progress' || status === 'Completed')) {
      ackDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }
    const updated = { ...formData, status, acknowledgeDate: ackDate };
    setFormData(updated);
    await onUpdate(updated);
  };

  const handleSave = async () => {
    await onUpdate(formData);
    setHasChanges(false);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 font-mono-numbers">{formData.id}</h2>
                  {formData.rowIndex && (
                    <span className="text-[11px] text-slate-500 font-mono-numbers bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Row #{formData.rowIndex} in Sheet
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-mono-numbers flex items-center gap-1.5 flex-wrap">
                  <span>Logged: {formData.timestamp}</span>
                  <span className="text-slate-300">·</span>
                  <span>
                    Ack: {formData.acknowledgeDate || <span className="text-amber-600 italic">Pending</span>}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {spreadsheet && (
                <a
                  href={spreadsheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                  title="View in Google Sheets"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Status Bar */}
          <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Lifecycle Status:</span>
              <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                formData.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                formData.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                formData.status === 'Waiting for Parts' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-200 text-slate-800'
              }`}>
                {formData.status}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {formData.status !== 'In Progress' && formData.status !== 'Completed' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatus('In Progress')}
                  className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                >
                  Start Work
                </button>
              )}
              {formData.status !== 'Waiting for Parts' && formData.status !== 'Completed' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatus('Waiting for Parts')}
                  className="px-2 py-1 text-[11px] font-medium text-amber-700 bg-white border border-amber-200 rounded hover:bg-amber-50 transition-colors"
                >
                  Wait Parts
                </button>
              )}
              {formData.status !== 'Completed' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatus('Completed')}
                  className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Mark Completed
                </button>
              )}
            </div>
          </div>

          {/* Overdue Warning */}
          {isOverdue && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Inspection is past the scheduled due date ({formData.nextServiceDue}). Immediate action required.</span>
            </div>
          )}

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Equipment Name & Asset ID */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Equipment / Machine
              </label>
              <input
                type="text"
                value={formData.equipmentName}
                onChange={(e) => handleFieldChange('equipmentName', e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
              <div className="flex items-center gap-3 pt-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-slate-500 font-medium">Area:</span>
                  <input
                    type="text"
                    value={formData.area || ''}
                    onChange={(e) => handleFieldChange('area', e.target.value)}
                    placeholder="e.g. Production Cell 3"
                    className="px-2 py-0.5 text-xs border border-slate-200 rounded text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Tag:</span>
                  <input
                    type="text"
                    value={formData.assetId}
                    onChange={(e) => handleFieldChange('assetId', e.target.value)}
                    className="px-2 py-0.5 text-xs border border-slate-200 rounded font-mono-numbers text-slate-700"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Metric:</span>
                  <input
                    type="text"
                    value={formData.operatingMetric}
                    onChange={(e) => handleFieldChange('operatingMetric', e.target.value)}
                    className="px-2 py-0.5 text-xs border border-slate-200 rounded font-mono-numbers text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Classification: Category & Priority */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none"
                >
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                  <option value="Calibration">Calibration</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Technician, Acknowledge Date & Next Due */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Technician
                </label>
                <input
                  type="text"
                  value={formData.technician}
                  onChange={(e) => handleFieldChange('technician', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Acknowledge Date
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
                      handleFieldChange('acknowledgeDate', now);
                    }}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium underline"
                  >
                    Set to Now
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.acknowledgeDate || ''}
                  onChange={(e) => handleFieldChange('acknowledgeDate', e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Next Due SLA
                </label>
                <input
                  type="date"
                  value={formData.nextServiceDue}
                  onChange={(e) => handleFieldChange('nextServiceDue', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono-numbers focus:outline-none"
                />
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Issue Description / Inspection Scope
              </label>
              <textarea
                rows={3}
                value={formData.issueDescription}
                onChange={(e) => handleFieldChange('issueDescription', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
              />
            </div>

            {/* Action Taken */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Action Taken / Repair Notes
              </label>
              <textarea
                rows={3}
                value={formData.actionTaken}
                onChange={(e) => handleFieldChange('actionTaken', e.target.value)}
                placeholder="Log actions executed, calibration offsets, fluid replacements..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
              />
            </div>

            {/* Parts Replaced, Item No. & Quantity */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Replaced Parts & Consumables
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                <div className="sm:col-span-3">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Part Description</label>
                  <input
                    type="text"
                    value={formData.partsReplaced || ''}
                    onChange={(e) => handleFieldChange('partsReplaced', e.target.value)}
                    placeholder="e.g. Spindle belt, Hydraulic filter"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Item No. / Part #</label>
                  <input
                    type="text"
                    value={formData.itemNo || ''}
                    onChange={(e) => handleFieldChange('itemNo', e.target.value)}
                    placeholder="e.g. HF-882-VL"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Quantity</label>
                  <input
                    type="text"
                    value={formData.quantity || ''}
                    onChange={(e) => handleFieldChange('quantity', e.target.value)}
                    placeholder="e.g. 1, 5L"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Service Cost */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Service Expense ($)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.serviceCost}
                  onChange={(e) => handleFieldChange('serviceCost', Number(e.target.value))}
                  className="w-full pl-6 pr-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Supervisor / Handover Notes */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Supervisor / Handover Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Shift notes, safety clearance, follow-up items..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onDelete(formData)}
              className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Log</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isUpdating || !hasChanges}
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Saving to Sheet...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
