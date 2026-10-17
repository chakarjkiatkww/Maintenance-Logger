import React, { useState } from 'react';
import { MaintenanceLog, MaintenanceCategory, PriorityLevel, ServiceStatus } from '../types/maintenance';
import { X, Wrench, Calendar, DollarSign, Clock, AlertTriangle, Check } from 'lucide-react';

interface NewLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (log: Omit<MaintenanceLog, 'id' | 'timestamp'>) => Promise<void>;
  isSubmitting: boolean;
}

const EQUIPMENT_SUGGESTIONS = [
  { name: 'Haas VF-4SS 5-Axis CNC Milling Center', id: 'EQ-CNC-04', area: 'Production Cell 3' },
  { name: 'Atlas Copco GA-75 Rotary Screw Air Compressor', id: 'EQ-CMP-02', area: 'Utility Compressor Bay' },
  { name: 'Cincinnati Milacron 250T Injection Molder', id: 'EQ-INJ-01', area: 'Molding Department Bay A' },
  { name: 'Crown C-5 Series LPG Counterbalance Forklift', id: 'EQ-FLT-08', area: 'Logistics & Warehouse' },
  { name: 'Trane Series R 120-Ton Water-Cooled Chiller', id: 'EQ-HVAC-03', area: 'Central Plant Rooftop West' },
  { name: 'Lincoln Electric Robotic MIG Welding Cell', id: 'EQ-WLD-06', area: 'Fabrication Cell 6' },
  { name: 'Dorner 2200 Series Modular Belt Conveyor', id: 'EQ-CNV-12', area: 'Assembly Line 2' },
  { name: 'Trumpf TruLaser 3030 Fiber Laser Cutter', id: 'EQ-LSR-01', area: 'Sheet Metal Bay 1' },
];

export const NewLogModal: React.FC<NewLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [equipmentName, setEquipmentName] = useState('');
  const [assetId, setAssetId] = useState('');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('Preventive');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [status, setStatus] = useState<ServiceStatus>('Open');
  const [technician, setTechnician] = useState('');
  const [operatingMetric, setOperatingMetric] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [itemNo, setItemNo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [acknowledgeDate, setAcknowledgeDate] = useState(() => {
    return new Date().toISOString().replace('T', ' ').substring(0, 16);
  });
  const [nextServiceDue, setNextServiceDue] = useState(() => {
    // Default to +90 days for standard preventive
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [serviceCost, setServiceCost] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPresetEquipment = (item: { name: string; id: string; area?: string }) => {
    setEquipmentName(item.name);
    setAssetId(item.id);
    if (item.area) setArea(item.area);
  };

  const setOffsetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setNextServiceDue(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentName.trim()) {
      setValidationError('Equipment Name is required.');
      return;
    }
    if (!technician.trim()) {
      setValidationError('Technician name is required.');
      return;
    }
    if (!issueDescription.trim()) {
      setValidationError('Issue description or service scope is required.');
      return;
    }

    setValidationError(null);

    await onSubmit({
      equipmentName: equipmentName.trim(),
      assetId: assetId.trim() || 'N/A',
      area: area.trim() || 'General Plant',
      acknowledgeDate: acknowledgeDate.trim(),
      category,
      priority,
      status,
      technician: technician.trim(),
      operatingMetric: operatingMetric.trim() || '-',
      issueDescription: issueDescription.trim(),
      actionTaken: actionTaken.trim(),
      partsReplaced: partsReplaced.trim(),
      itemNo: itemNo.trim(),
      quantity: quantity.trim(),
      nextServiceDue: nextServiceDue || '',
      serviceCost: typeof serviceCost === 'number' ? serviceCost : 0,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Create Maintenance Service Log</h2>
              <p className="text-xs text-slate-500">Record equipment work order & sync to Google Sheet</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {validationError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Equipment selection / quick pick */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Equipment / Machine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={equipmentName}
              onChange={(e) => setEquipmentName(e.target.value)}
              placeholder="e.g. Haas VF-4SS 5-Axis CNC Milling Center"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900"
            />
            {/* Quick Suggestions */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">Quick suggestions:</span>
              {EQUIPMENT_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectPresetEquipment(s)}
                  className="text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                >
                  {s.id}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Asset ID, Area & Operating Metric */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Asset Tag / Serial ID
              </label>
              <input
                type="text"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                placeholder="e.g. EQ-CNC-04"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Area / Plant Location
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Production Cell 3"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Operating Metric (Hours / Cycles)
              </label>
              <input
                type="text"
                value={operatingMetric}
                onChange={(e) => setOperatingMetric(e.target.value)}
                placeholder="e.g. 4,820 hrs"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 font-mono-numbers"
              />
            </div>
          </div>

          {/* Row 3: Category, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 bg-white"
              >
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Calibration">Calibration</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 bg-white"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Parts">Waiting for Parts</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Row 4: Technician, Acknowledge Date & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician / Assigned Engineer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="e.g. Marcus Vance"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Acknowledge Date
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
                    setAcknowledgeDate(now);
                  }}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium underline"
                >
                  Now
                </button>
              </div>
              <input
                type="text"
                value={acknowledgeDate}
                onChange={(e) => setAcknowledgeDate(e.target.value)}
                placeholder="YYYY-MM-DD HH:mm"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Estimated / Incurred Cost ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={serviceCost}
                  onChange={(e) => setServiceCost(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 font-mono-numbers"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Issue Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Issue Description / Service Scope <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe malfunction, abnormal vibration/noise, inspection checklist, or reason for service..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900"
            />
          </div>

          {/* Row 6: Action Taken */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Action Taken / Resolution Work
            </label>
            <textarea
              rows={2}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Diagnostic steps performed, repairs executed, adjustments made..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900"
            />
          </div>

          {/* Row 7: Parts Replaced, Item No. and Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Parts Replaced & Consumables
              </label>
              <input
                type="text"
                value={partsReplaced}
                onChange={(e) => setPartsReplaced(e.target.value)}
                placeholder="e.g. Spindle belt, Hydraulic filter, O-ring kit"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Item No. / Part #
              </label>
              <input
                type="text"
                value={itemNo}
                onChange={(e) => setItemNo(e.target.value)}
                placeholder="e.g. HF-882-VL"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 font-mono-numbers"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Quantity
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1, 5L"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 font-mono-numbers"
              />
            </div>
          </div>

          {/* Row 8: Next Service Due Date with Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                Next Service Due (SLA Inspection)
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setOffsetDays(30)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  +30d
                </button>
                <button
                  type="button"
                  onClick={() => setOffsetDays(90)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  +90d
                </button>
                <button
                  type="button"
                  onClick={() => setOffsetDays(180)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  +180d
                </button>
                <button
                  type="button"
                  onClick={() => setOffsetDays(365)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  +1yr
                </button>
              </div>
            </div>
            <input
              type="date"
              value={nextServiceDue}
              onChange={(e) => setNextServiceDue(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900 font-mono-numbers"
            />
          </div>

          {/* Row 9: Supervisor Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Supervisor / Shift Handover Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared for production cell 3. Follow up on Tuesday."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 text-slate-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Syncing to Google Sheet...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Append to Sheet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
