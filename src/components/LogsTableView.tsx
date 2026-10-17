import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MaintenanceLog, ServiceStatus, PriorityLevel, MaintenanceCategory } from '../types/maintenance';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowUpDown, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  SlidersHorizontal,
  X,
  Tag,
  Hourglass,
  CircleDot,
  MapPin
} from 'lucide-react';

interface LogsTableViewProps {
  logs: MaintenanceLog[];
  onOpenLogDetail: (log: MaintenanceLog) => void;
  onOpenNewLog: () => void;
  onQuickUpdateStatus: (log: MaintenanceLog, newStatus: ServiceStatus) => void;
}

const QUICK_SEARCH_PRESETS = [
  'CNC',
  'Compressor',
  'Hydraulic',
  'Chiller',
  'Forklift',
  'Welding',
];

export const LogsTableView: React.FC<LogsTableViewProps> = ({
  logs,
  onOpenLogDetail,
  onOpenNewLog,
  onQuickUpdateStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<MaintenanceCategory | 'All'>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [sortField, setSortField] = useState<'timestamp' | 'priority' | 'nextServiceDue'>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split('T')[0];

  // Distinct plant areas for quick filtering
  const availableAreas = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.area).filter(Boolean)));
  }, [logs]);

  // Keyboard shortcut: Press '/' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        if ((e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate counts for each status tab based on current other filters
  const statusCounts = useMemo(() => {
    const baseList = logs.filter((log) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = 
          log.equipmentName.toLowerCase().includes(q) ||
          log.assetId.toLowerCase().includes(q) ||
          (log.area && log.area.toLowerCase().includes(q)) ||
          log.id.toLowerCase().includes(q) ||
          log.technician.toLowerCase().includes(q) ||
          log.issueDescription.toLowerCase().includes(q) ||
          (log.partsReplaced && log.partsReplaced.toLowerCase().includes(q)) ||
          (log.itemNo && log.itemNo.toLowerCase().includes(q)) ||
          (log.quantity && log.quantity.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (priorityFilter !== 'All' && log.priority !== priorityFilter) return false;
      if (categoryFilter !== 'All' && log.category !== categoryFilter) return false;
      if (areaFilter !== 'All' && log.area !== areaFilter) return false;
      if (onlyOverdue) {
        if (log.status === 'Completed') return false;
        if (!log.nextServiceDue || log.nextServiceDue >= today) return false;
      }
      return true;
    });

    return {
      All: baseList.length,
      Open: baseList.filter(l => l.status === 'Open').length,
      'In Progress': baseList.filter(l => l.status === 'In Progress').length,
      'Waiting for Parts': baseList.filter(l => l.status === 'Waiting for Parts').length,
      Completed: baseList.filter(l => l.status === 'Completed').length,
    };
  }, [logs, search, priorityFilter, categoryFilter, areaFilter, onlyOverdue, today]);

  // Filtered & sorted logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const match = 
            log.equipmentName.toLowerCase().includes(q) ||
            log.assetId.toLowerCase().includes(q) ||
            (log.area && log.area.toLowerCase().includes(q)) ||
            log.id.toLowerCase().includes(q) ||
            (log.acknowledgeDate && log.acknowledgeDate.toLowerCase().includes(q)) ||
            log.technician.toLowerCase().includes(q) ||
            log.issueDescription.toLowerCase().includes(q) ||
            (log.partsReplaced && log.partsReplaced.toLowerCase().includes(q)) ||
            (log.itemNo && log.itemNo.toLowerCase().includes(q)) ||
            (log.quantity && log.quantity.toLowerCase().includes(q)) ||
            (log.notes && log.notes.toLowerCase().includes(q));
          if (!match) return false;
        }

        // Status
        if (statusFilter !== 'All' && log.status !== statusFilter) return false;

        // Priority
        if (priorityFilter !== 'All' && log.priority !== priorityFilter) return false;

        // Category
        if (categoryFilter !== 'All' && log.category !== categoryFilter) return false;

        // Area Filter
        if (areaFilter !== 'All' && log.area !== areaFilter) return false;

        // Overdue toggle
        if (onlyOverdue) {
          if (log.status === 'Completed') return false;
          if (!log.nextServiceDue || log.nextServiceDue >= today) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'timestamp') {
          return sortAsc 
            ? a.timestamp.localeCompare(b.timestamp) 
            : b.timestamp.localeCompare(a.timestamp);
        }
        if (sortField === 'nextServiceDue') {
          return sortAsc 
            ? (a.nextServiceDue || '').localeCompare(b.nextServiceDue || '') 
            : (b.nextServiceDue || '').localeCompare(a.nextServiceDue || '');
        }
        if (sortField === 'priority') {
          const priorityWeight: Record<PriorityLevel, number> = {
            Critical: 4,
            High: 3,
            Medium: 2,
            Low: 1
          };
          const wA = priorityWeight[a.priority] || 0;
          const wB = priorityWeight[b.priority] || 0;
          return sortAsc ? wA - wB : wB - wA;
        }
        return 0;
      });
  }, [logs, search, statusFilter, priorityFilter, categoryFilter, areaFilter, onlyOverdue, sortField, sortAsc, today]);

  const toggleSort = (field: 'timestamp' | 'priority' | 'nextServiceDue') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setAreaFilter('All');
    setOnlyOverdue(false);
  };

  const hasActiveFilters = search || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All' || areaFilter !== 'All' || onlyOverdue;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Maintenance Service Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized equipment service ledger ({filteredLogs.length} of {logs.length} records)
          </p>
        </div>
        <button
          onClick={onOpenNewLog}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Service Log</span>
        </button>
      </div>

      {/* Primary Search & Status Filter Console */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        {/* Row 1: Search Bar & Status Tabs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Enhanced Search Input with hotkey badge & clear button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment machine, area, serial tag, technician, parts, item no., or issue..."
              className="w-full pl-9 pr-14 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800 text-slate-900 placeholder:text-slate-400 transition-all bg-slate-50/50 focus:bg-white"
            />
            {search ? (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200 pointer-events-none">
                /
              </span>
            )}
          </div>

          {/* Status Filter Segmented Tabs with live counts */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto text-xs">
            {(
              [
                { id: 'All', label: 'All', icon: null },
                { id: 'Open', label: 'Open', icon: CircleDot },
                { id: 'In Progress', label: 'In Progress', icon: Clock },
                { id: 'Waiting for Parts', label: 'Waiting for Parts', icon: Hourglass },
                { id: 'Completed', label: 'Completed', icon: CheckCircle2 },
              ] as const
            ).map((tab) => {
              const count = statusCounts[tab.id];
              const isActive = statusFilter === tab.id;
              const IconComp = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {IconComp && (
                    <IconComp className={`w-3 h-3 ${
                      isActive 
                        ? tab.id === 'Completed' ? 'text-emerald-600' :
                          tab.id === 'In Progress' ? 'text-blue-600' :
                          tab.id === 'Waiting for Parts' ? 'text-amber-600' : 'text-slate-700'
                        : 'text-slate-400'
                    }`} />
                  )}
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono-numbers ${
                    isActive 
                      ? 'bg-slate-100 text-slate-800 font-semibold' 
                      : 'text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Search Preset Tags */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Quick search:
          </span>
          {QUICK_SEARCH_PRESETS.map((preset) => {
            const isSelected = search.toLowerCase() === preset.toLowerCase();
            return (
              <button
                key={preset}
                onClick={() => setSearch(isSelected ? '' : preset)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Controls: Area, Priority, Category, Overdue toggle, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Area Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>Area:</span>
              </span>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="py-1 px-2.5 text-xs border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 max-w-[170px] truncate"
              >
                <option value="All">All Areas ({logs.length})</option>
                {availableAreas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="py-1 px-2.5 text-xs border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="py-1 px-2.5 text-xs border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              >
                <option value="All">All Categories</option>
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Calibration">Calibration</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            {/* Overdue Checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none py-1 px-2 rounded hover:bg-slate-50 border border-slate-200/80">
              <input
                type="checkbox"
                checked={onlyOverdue}
                onChange={(e) => setOnlyOverdue(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-[11px] font-medium text-red-700">Only Overdue SLA</span>
            </label>
          </div>

          {/* Result Count and Clear Filters */}
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <span className="text-[11px] text-slate-500 font-mono-numbers">
                Showing {filteredLogs.length} of {logs.length}
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-slate-500 hover:text-slate-900 text-[11px] font-medium underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">
                  <button 
                    onClick={() => toggleSort('timestamp')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>Log ID, Date & Ack</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4">Equipment Machine & Area</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">
                  <button 
                    onClick={() => toggleSort('priority')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Parts Replaced</th>
                <th className="py-3 px-4 whitespace-nowrap">Item No.</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">
                  <button 
                    onClick={() => toggleSort('nextServiceDue')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>Next Due SLA</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No maintenance records matched your search</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? `No records found matching "${search}".` : 'Try adjusting the area, status, or priority filters.'}
                    </p>
                    <button
                      onClick={clearFilters}
                      className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isOverdue = log.status !== 'Completed' && log.nextServiceDue && log.nextServiceDue < today;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => onOpenLogDetail(log)}
                      className={`hover:bg-slate-50/90 transition-colors cursor-pointer ${
                        isOverdue ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Log ID, Timestamp & Acknowledge Date (Requested: under Log ID and Log Date) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 font-mono-numbers">{log.id}</div>
                        <div className="text-[11px] text-slate-400 font-mono-numbers">{log.timestamp}</div>
                        <div className="text-[11px] font-mono-numbers flex items-center gap-1 mt-0.5">
                          <span className="text-slate-400">Ack:</span>
                          {log.acknowledgeDate ? (
                            <span className="text-slate-700 font-medium">{log.acknowledgeDate}</span>
                          ) : (
                            <span className="text-amber-600/90 font-medium italic">Pending</span>
                          )}
                        </div>
                      </td>

                      {/* Equipment Machine & Area (Requested: Area under Equipment Machine) */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 truncate" title={log.equipmentName}>
                          {log.equipmentName}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 font-mono-numbers">
                          <span>Area: {log.area || 'General Plant'}</span>
                          <span className="text-slate-300">·</span>
                          <span>Tag: {log.assetId}</span>
                          <span className="text-slate-300">·</span>
                          <span>{log.operatingMetric || '-'}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          log.category === 'Preventive' ? 'bg-blue-50 text-blue-700' :
                          log.category === 'Emergency' ? 'bg-red-50 text-red-700' :
                          log.category === 'Calibration' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {log.category}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          log.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          log.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                          log.priority === 'Medium' ? 'bg-slate-100 text-slate-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {log.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                          log.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          log.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          log.status === 'Waiting for Parts' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {log.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {log.status === 'In Progress' && <Clock className="w-3 h-3 text-blue-600" />}
                          {log.status === 'Waiting for Parts' && <Hourglass className="w-3 h-3 text-amber-600" />}
                          {log.status === 'Open' && <CircleDot className="w-3 h-3 text-slate-500" />}
                          <span>{log.status}</span>
                        </span>
                      </td>

                      {/* Parts Replaced */}
                      <td className="py-3 px-4 max-w-[170px]">
                        <div className="text-slate-800 truncate" title={log.partsReplaced || 'None'}>
                          {log.partsReplaced || <span className="text-slate-400 italic">None</span>}
                        </div>
                      </td>

                      {/* Item No. */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.itemNo ? (
                          <span className="font-mono-numbers px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px] border border-slate-200/80">
                            {log.itemNo}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono-numbers">-</span>
                        )}
                      </td>

                      {/* Technician */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {log.technician}
                      </td>

                      {/* Next Service Due */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono-numbers">
                        <span className={isOverdue ? 'text-red-700 font-bold' : 'text-slate-600'}>
                          {log.nextServiceDue || '-'}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-red-600 uppercase font-semibold">Overdue</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono-numbers font-medium text-slate-900">
                        ${log.serviceCost ? log.serviceCost.toLocaleString() : '0'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {log.status === 'Open' && (
                            <button
                              onClick={() => onQuickUpdateStatus(log, 'In Progress')}
                              className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                            >
                              Start
                            </button>
                          )}
                          {log.status === 'In Progress' && (
                            <button
                              onClick={() => onQuickUpdateStatus(log, 'Completed')}
                              className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                            >
                              Done
                            </button>
                          )}
                          <button
                            onClick={() => onOpenLogDetail(log)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                            title="Inspect Details"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
