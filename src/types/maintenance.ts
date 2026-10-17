/**
 * Core types for ServicePulse Maintenance Log System
 */

export type MaintenanceCategory = 
  | 'Preventive'
  | 'Corrective'
  | 'Calibration'
  | 'Emergency';

export type PriorityLevel = 
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

export type ServiceStatus = 
  | 'Open'
  | 'In Progress'
  | 'Waiting for Parts'
  | 'Completed';

export interface MaintenanceLog {
  id: string; // e.g. "LOG-2026-1001"
  timestamp: string; // ISO date string or YYYY-MM-DD HH:mm
  acknowledgeDate?: string; // Date/time acknowledged by supervisor or lead (e.g. "2026-10-14 09:15")
  equipmentName: string;
  assetId: string; // e.g. "EQ-CNC-04"
  area: string; // Shop floor area / location (e.g. "Production Cell 3")
  category: MaintenanceCategory;
  priority: PriorityLevel;
  status: ServiceStatus;
  technician: string;
  operatingMetric: string; // e.g. "4,250 hrs", "18,400 cycles"
  issueDescription: string;
  actionTaken: string;
  partsReplaced: string;
  itemNo: string; // Part item number / SKU
  quantity: string; // Quantity of parts replaced
  nextServiceDue: string; // YYYY-MM-DD
  serviceCost: number;
  notes: string;
  rowIndex?: number; // 1-based row index in Google Sheet
}

export interface SpreadsheetMetadata {
  id: string;
  name: string;
  url: string;
  sheetName: string;
  lastSyncedAt?: string;
}

export type ActiveTab = 'dashboard' | 'logs' | 'reports';

export interface FilterState {
  search: string;
  status: ServiceStatus | 'All';
  priority: PriorityLevel | 'All';
  category: MaintenanceCategory | 'All';
  onlyOverdue: boolean;
}
