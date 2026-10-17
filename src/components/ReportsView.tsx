import React, { useState, useMemo } from 'react';
import { MaintenanceLog, SpreadsheetMetadata } from '../types/maintenance';
import { 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Calendar, 
  TrendingUp, 
  Wrench, 
  AlertTriangle, 
  DollarSign, 
  Layers, 
  Users, 
  CheckCircle2, 
  Sheet,
  ExternalLink
} from 'lucide-react';

interface ReportsViewProps {
  logs: MaintenanceLog[];
  spreadsheet: SpreadsheetMetadata | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  logs,
  spreadsheet,
}) => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Filter logs by period
  const periodLogs = useMemo(() => {
    if (period === 'all') return logs;

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return logs.filter(l => {
      const datePart = l.timestamp.split(' ')[0] || l.timestamp;
      return datePart >= cutoffStr;
    });
  }, [logs, period]);

  // Aggregate metrics
  const totalInPeriod = periodLogs.length;
  const completedInPeriod = periodLogs.filter(l => l.status === 'Completed').length;
  const inProgressInPeriod = periodLogs.filter(l => l.status === 'In Progress').length;
  const openInPeriod = periodLogs.filter(l => l.status === 'Open').length;
  const waitingPartsInPeriod = periodLogs.filter(l => l.status === 'Waiting for Parts').length;
  const totalCostInPeriod = periodLogs.reduce((acc, curr) => acc + (curr.serviceCost || 0), 0);

  const overdueInPeriod = periodLogs.filter(l => 
    l.status !== 'Completed' && l.nextServiceDue && l.nextServiceDue < today
  );

  // Category counts
  const preventiveCount = periodLogs.filter(l => l.category === 'Preventive').length;
  const correctiveCount = periodLogs.filter(l => l.category === 'Corrective').length;
  const emergencyCount = periodLogs.filter(l => l.category === 'Emergency').length;
  const calibrationCount = periodLogs.filter(l => l.category === 'Calibration').length;

  const preventiveRatio = totalInPeriod > 0 
    ? Math.round(((preventiveCount + calibrationCount) / totalInPeriod) * 100) 
    : 0;

  // Equipment frequency tally
  const equipmentTally = useMemo(() => {
    const map: Record<string, { count: number; cost: number; assetId: string }> = {};
    for (const log of periodLogs) {
      if (!map[log.equipmentName]) {
        map[log.equipmentName] = { count: 0, cost: 0, assetId: log.assetId };
      }
      map[log.equipmentName].count += 1;
      map[log.equipmentName].cost += log.serviceCost || 0;
    }
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [periodLogs]);

  // Technician workload tally
  const technicianTally = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    for (const log of periodLogs) {
      const tech = log.technician || 'Unassigned';
      if (!map[tech]) {
        map[tech] = { total: 0, completed: 0 };
      }
      map[tech].total += 1;
      if (log.status === 'Completed') {
        map[tech].completed += 1;
      }
    }
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [periodLogs]);

  // Generate automated text briefing
  const briefingText = useMemo(() => {
    const periodName = period === '7d' ? 'Past 7 Days' : period === '30d' ? 'Past 30 Days' : period === '90d' ? 'Past 90 Days' : 'Full Historical Period';
    return `SERVICEPULSE MAINTENANCE STATUS DIGEST (${periodName.toUpperCase()})
Report Generated: ${new Date().toLocaleString()}
Database: ${spreadsheet ? `${spreadsheet.name} (${spreadsheet.sheetName})` : 'Local Synced Cache'}

OVERVIEW:
- Total Work Orders Processed: ${totalInPeriod}
- Completed & Certified: ${completedInPeriod} (${totalInPeriod > 0 ? Math.round((completedInPeriod / totalInPeriod) * 100) : 0}%)
- Active Backlog: ${openInPeriod + inProgressInPeriod + waitingPartsInPeriod} tickets (${inProgressInPeriod} in-progress, ${waitingPartsInPeriod} waiting for parts)
- Cumulative Service Cost: $${totalCostInPeriod.toLocaleString()}
- Preventive vs Unplanned Ratio: ${preventiveRatio}% Planned / ${100 - preventiveRatio}% Reactive

CRITICAL SLA AUDIT:
- Overdue Inspection Alerts: ${overdueInPeriod.length} machine(s) past scheduled maintenance date
${overdueInPeriod.map(l => `  * ${l.equipmentName} (${l.assetId}) - Due: ${l.nextServiceDue} [${l.priority} Priority]`).join('\n') || '  * None. All scheduled fleet maintenance currently in compliance.'}

MOST SERVICED ASSETS:
${equipmentTally.slice(0, 3).map(e => `  * ${e.name} (${e.assetId}): ${e.count} service events, $${e.cost.toLocaleString()} total expense`).join('\n') || '  * No assets serviced in this timeframe.'}

TECHNICIAN PRODUCTIVITY:
${technicianTally.map(t => `  * ${t.name}: ${t.completed}/${t.total} work orders resolved (${Math.round((t.completed / (t.total || 1)) * 100)}%)`).join('\n') || '  * None assigned'}`;
  }, [period, spreadsheet, totalInPeriod, completedInPeriod, openInPeriod, inProgressInPeriod, waitingPartsInPeriod, totalCostInPeriod, preventiveRatio, overdueInPeriod, equipmentTally, technicianTally]);

  const handleCopyBriefing = () => {
    navigator.clipboard.writeText(briefingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'Acknowledge Date',
      'Equipment Name',
      'Asset ID',
      'Area / Location',
      'Category',
      'Priority',
      'Status',
      'Technician',
      'Operating Metric',
      'Issue Description',
      'Action Taken',
      'Parts Replaced',
      'Item No.',
      'Quantity',
      'Next Service Due',
      'Service Cost',
      'Notes'
    ];

    const rows = periodLogs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${(l.acknowledgeDate || '').replace(/"/g, '""')}"`,
      `"${l.equipmentName.replace(/"/g, '""')}"`,
      `"${l.assetId}"`,
      `"${(l.area || '').replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.priority}"`,
      `"${l.status}"`,
      `"${l.technician}"`,
      `"${l.operatingMetric}"`,
      `"${(l.issueDescription || '').replace(/"/g, '""')}"`,
      `"${(l.actionTaken || '').replace(/"/g, '""')}"`,
      `"${(l.partsReplaced || '').replace(/"/g, '""')}"`,
      `"${(l.itemNo || '').replace(/"/g, '""')}"`,
      `"${(l.quantity || '').replace(/"/g, '""')}"`,
      `"${l.nextServiceDue}"`,
      l.serviceCost,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Maintenance_Report_${period}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Period Selection and Export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Automated Status & Performance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet uptime, SLA compliance analysis, technician output, and executive briefings
          </p>
        </div>

        {/* Period tabs & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                period === '7d' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                period === '30d' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriod('90d')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                period === '90d' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                period === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print-only mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900">ServicePulse Maintenance Status Report</h1>
        <p className="text-xs text-slate-600">
          Generated on {new Date().toLocaleDateString()} | Active Period: {period.toUpperCase()} | Database: {spreadsheet ? spreadsheet.name : 'Local Ledger'}
        </p>
      </div>

      {/* KPI Performance Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Service Events</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-slate-900">{totalInPeriod}</span>
            <span className="text-xs text-slate-500">logs recorded</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {completedInPeriod} completed ({totalInPeriod > 0 ? Math.round((completedInPeriod / totalInPeriod) * 100) : 0}%)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Preventive Ratio</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-blue-600">{preventiveRatio}%</span>
            <span className="text-xs text-slate-500">planned</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Target: &gt;75% planned maintenance
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">SLA Overdue Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono-numbers ${overdueInPeriod.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {overdueInPeriod.length}
            </span>
            <span className="text-xs text-slate-500">overdue inspections</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {overdueInPeriod.length === 0 ? 'Full SLA compliance' : 'Immediate attention needed'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Period Maintenance Cost</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-slate-900">
              ${totalCostInPeriod.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Parts & direct service fees
          </div>
        </div>
      </div>

      {/* Automated Executive Digest Card */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-400/10 text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Automated Shift & Executive Briefing</h2>
              <p className="text-xs text-slate-400">Synthesized narrative ready for email, shift handovers, or audits</p>
            </div>
          </div>
          <button
            onClick={handleCopyBriefing}
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Briefing Text</span>
              </>
            )}
          </button>
        </div>

        <pre className="text-xs text-slate-300 font-mono-numbers whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
          {briefingText}
        </pre>
      </div>

      {/* Two Columns: Asset Reliability & Technician Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Most Serviced Assets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Equipment Reliability & Service Load</h3>
              <p className="text-xs text-slate-500">Service frequency and maintenance spend per machine</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {equipmentTally.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No service logs in selected period</p>
            ) : (
              equipmentTally.map((item, idx) => (
                <div key={item.name} className="py-3 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-4">
                    <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono-numbers">{item.assetId}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-numbers font-semibold text-slate-900">
                      {item.count} log{item.count > 1 ? 's' : ''}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono-numbers">
                      ${item.cost.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Technician Workload */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Technician Resolution Output</h3>
              <p className="text-xs text-slate-500">Work orders assigned and resolution velocity</p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {technicianTally.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No technician assignments in selected period</p>
            ) : (
              technicianTally.map((tech) => {
                const completionPct = tech.total > 0 ? Math.round((tech.completed / tech.total) * 100) : 0;
                return (
                  <div key={tech.name} className="py-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{tech.name}</span>
                      <span className="font-mono-numbers text-slate-600">
                        {tech.completed} / {tech.total} closed ({completionPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
