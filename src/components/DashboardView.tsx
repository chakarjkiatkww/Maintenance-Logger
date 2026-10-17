import React from 'react';
import { MaintenanceLog } from '../types/maintenance';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Wrench, 
  ArrowUpRight, 
  ShieldAlert, 
  Calendar,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface DashboardViewProps {
  logs: MaintenanceLog[];
  onOpenLogDetail: (log: MaintenanceLog) => void;
  onOpenNewLog: () => void;
  onNavigateToTab: (tab: 'logs' | 'reports') => void;
  onQuickUpdateStatus: (log: MaintenanceLog, newStatus: MaintenanceLog['status']) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  logs,
  onOpenLogDetail,
  onOpenNewLog,
  onNavigateToTab,
  onQuickUpdateStatus,
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Calculate metrics
  const totalLogs = logs.length;
  const inProgressLogs = logs.filter(l => l.status === 'In Progress').length;
  const openLogs = logs.filter(l => l.status === 'Open').length;
  const waitingPartsLogs = logs.filter(l => l.status === 'Waiting for Parts').length;
  const completedLogs = logs.filter(l => l.status === 'Completed').length;
  const activeCount = openLogs + inProgressLogs + waitingPartsLogs;

  const totalCost = logs.reduce((acc, curr) => acc + (curr.serviceCost || 0), 0);

  // Overdue calculations
  const overdueLogs = logs.filter(log => {
    if (log.status === 'Completed') return false;
    if (!log.nextServiceDue) return false;
    return log.nextServiceDue < today;
  });

  const criticalOpenLogs = logs.filter(log => 
    log.priority === 'Critical' && log.status !== 'Completed'
  );

  // Category counts
  const categoryCounts = {
    Preventive: logs.filter(l => l.category === 'Preventive').length,
    Corrective: logs.filter(l => l.category === 'Corrective').length,
    Calibration: logs.filter(l => l.category === 'Calibration').length,
    Emergency: logs.filter(l => l.category === 'Emergency').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Equipment Service Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status monitoring, SLA enforcement, and automated Google Sheet synchronization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab('reports')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Generate Shift Report
          </button>
          <button
            onClick={onOpenNewLog}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Create Service Log</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Work Orders</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-slate-900">{activeCount}</span>
            <span className="text-xs text-slate-500">/ {totalLogs} total</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>{openLogs} open</span>
            <span aria-hidden="true">·</span>
            <span>{inProgressLogs} in progress</span>
            <span aria-hidden="true">·</span>
            <span>{waitingPartsLogs} parts</span>
          </div>
        </div>

        {/* Metric 2: Overdue SLA */}
        <div className={`p-5 rounded-xl border shadow-2xs ${
          overdueLogs.length > 0 
            ? 'bg-red-50/60 border-red-200' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium uppercase tracking-wider ${
              overdueLogs.length > 0 ? 'text-red-700 font-semibold' : 'text-slate-500'
            }`}>
              Overdue Inspections
            </span>
            <ShieldAlert className={`w-4 h-4 ${overdueLogs.length > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono-numbers ${
              overdueLogs.length > 0 ? 'text-red-700' : 'text-slate-900'
            }`}>
              {overdueLogs.length}
            </span>
            <span className="text-xs text-slate-500">past scheduled SLA</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {overdueLogs.length > 0 ? (
              <span className="text-red-700 font-medium">Immediate maintenance required</span>
            ) : (
              <span>All scheduled maintenance on track</span>
            )}
          </div>
        </div>

        {/* Metric 3: Completed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Resolved & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-slate-900">{completedLogs}</span>
            <span className="text-xs text-slate-500">
              ({totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0}% rate)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Equipment certified nominal
          </div>
        </div>

        {/* Metric 4: Total Cost */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Cumulative Service Cost</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-slate-900">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Parts, labor & fluids tally
          </div>
        </div>
      </div>

      {/* SLA Overdue Alert Radar Banner if items exist */}
      {overdueLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 bg-red-50/80 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-sm font-semibold">
                SLA Alert: {overdueLogs.length} Machine{overdueLogs.length > 1 ? 's' : ''} Past Preventive Inspection Date
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('logs')}
              className="text-xs font-medium text-red-700 hover:text-red-900 flex items-center gap-1"
            >
              <span>View In Table</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {overdueLogs.map((log) => (
              <div 
                key={log.id} 
                className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
                onClick={() => onOpenLogDetail(log)}
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-semibold text-slate-900 truncate">{log.equipmentName}</span>
                    {log.area && (
                      <>
                        <span className="text-slate-400 font-mono-numbers">·</span>
                        <span className="text-slate-500 font-mono-numbers">{log.area}</span>
                      </>
                    )}
                    <span className="text-slate-400 font-mono-numbers">·</span>
                    <span className="text-slate-500 font-mono-numbers">{log.assetId}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-red-600 font-medium font-mono-numbers">Due: {log.nextServiceDue}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{log.issueDescription}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                    log.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                    log.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.priority}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLogDetail(log);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split Grid: Category Breakdown + Recent Service Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1-col: Categories and Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Maintenance Categories</h2>
            <p className="text-xs text-slate-500 mt-0.5">Service distribution across active fleet</p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Preventive Maintenance', key: 'Preventive', count: categoryCounts.Preventive, color: 'bg-blue-500' },
              { label: 'Corrective Repair', key: 'Corrective', count: categoryCounts.Corrective, color: 'bg-amber-500' },
              { label: 'Calibration & Testing', key: 'Calibration', count: categoryCounts.Calibration, color: 'bg-emerald-500' },
              { label: 'Emergency Shutdown', key: 'Emergency', count: categoryCounts.Emergency, color: 'bg-red-500' },
            ].map(item => {
              const pct = totalLogs > 0 ? Math.round((item.count / totalLogs) * 100) : 0;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-mono-numbers text-slate-500">{item.count} logs ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-semibold text-slate-900">Service Highlights</h3>
            <div className="text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Critical Priority Tickets</span>
                <span className="font-mono-numbers font-medium text-red-600">
                  {logs.filter(l => l.priority === 'Critical').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Awaiting Spare Parts</span>
                <span className="font-mono-numbers font-medium text-amber-600">
                  {waitingPartsLogs}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Avg Repair Expense / Log</span>
                <span className="font-mono-numbers font-medium text-slate-800">
                  ${totalLogs > 0 ? Math.round(totalCost / totalLogs) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2-col: Recent Activity Stream */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Work Orders & Logs</h2>
              <p className="text-xs text-slate-500">Live operational status and technician actions</p>
            </div>
            <button
              onClick={() => onNavigateToTab('logs')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All ({logs.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {logs.slice(0, 5).map((log) => (
              <div 
                key={log.id} 
                className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                onClick={() => onOpenLogDetail(log)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{log.equipmentName}</span>
                      {log.area && (
                        <>
                          <span className="text-xs text-slate-400 font-mono-numbers">·</span>
                          <span className="text-xs text-slate-500 font-mono-numbers">{log.area}</span>
                        </>
                      )}
                      <span className="text-xs text-slate-400 font-mono-numbers">·</span>
                      <span className="text-xs text-slate-400 font-mono-numbers">{log.assetId}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        log.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        log.status === 'Waiting for Parts' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {log.issueDescription}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.technician}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-numbers">{log.timestamp}</span>
                      {log.serviceCost > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-numbers font-medium text-slate-700">
                            ${log.serviceCost}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {log.status === 'Open' && (
                      <button
                        onClick={() => onQuickUpdateStatus(log, 'In Progress')}
                        className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        Start Work
                      </button>
                    )}
                    {log.status === 'In Progress' && (
                      <button
                        onClick={() => onQuickUpdateStatus(log, 'Completed')}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                      >
                        Mark Done
                      </button>
                    )}
                    {log.status === 'Waiting for Parts' && (
                      <button
                        onClick={() => onQuickUpdateStatus(log, 'In Progress')}
                        className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
