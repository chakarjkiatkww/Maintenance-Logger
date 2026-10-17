import { MaintenanceLog, SpreadsheetMetadata, MaintenanceCategory, PriorityLevel, ServiceStatus } from '../types/maintenance';
import { SHEET_COLUMNS, INITIAL_SAMPLE_LOGS } from './sampleData';

const VALID_CATEGORIES: MaintenanceCategory[] = ['Preventive', 'Corrective', 'Calibration', 'Emergency'];
const VALID_PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High', 'Critical'];
const VALID_STATUSES: ServiceStatus[] = ['Open', 'In Progress', 'Waiting for Parts', 'Completed'];

/**
 * Parses a spreadsheet ID from a raw ID or full Google Sheets URL.
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Converts a MaintenanceLog object to an array of cell values matching SHEET_COLUMNS.
 */
export function logToRowValues(log: MaintenanceLog): (string | number)[] {
  return [
    log.id, // A (0)
    log.timestamp, // B (1)
    log.acknowledgeDate || '', // C (2) - Acknowledge Date
    log.equipmentName, // D (3)
    log.assetId, // E (4)
    log.area || '', // F (5) - Area / Location
    log.category, // G (6)
    log.priority, // H (7)
    log.status, // I (8)
    log.technician, // J (9)
    log.operatingMetric, // K (10)
    log.issueDescription, // L (11)
    log.actionTaken, // M (12)
    log.partsReplaced, // N (13)
    log.itemNo || '', // O (14) - Item No.
    log.quantity || '', // P (15) - Quantity
    log.nextServiceDue, // Q (16)
    log.serviceCost, // R (17)
    log.notes // S (18)
  ];
}

/**
 * Converts a raw row array from Google Sheets to a typed MaintenanceLog.
 * Intelligently handles schemas with Acknowledge Date, Area, or legacy layouts.
 */
export function rowValuesToLog(row: any[], rowIndex: number): MaintenanceLog {
  const defaultCategory: MaintenanceCategory = 'Preventive';
  const defaultPriority: PriorityLevel = 'Medium';
  const defaultStatus: ServiceStatus = 'Open';

  let acknowledgeDate = '';
  let equipmentName = 'Unspecified Equipment';
  let assetId = 'N/A';
  let area = '';
  let category: MaintenanceCategory = defaultCategory;
  let priority: PriorityLevel = defaultPriority;
  let status: ServiceStatus = defaultStatus;
  let technician = 'Unassigned';
  let operatingMetric = '-';
  let issueDescription = '';
  let actionTaken = '';
  let partsReplaced = '';
  let itemNo = '';
  let quantity = '';
  let nextServiceDue = '';
  let costRaw: any = 0;
  let notes = '';

  // Case 1: 19-column schema (Acknowledge Date at col 2, Area at col 5, Category at col 6)
  if (VALID_CATEGORIES.includes(row[6] as any)) {
    acknowledgeDate = String(row[2] || '');
    equipmentName = String(row[3] || 'Unspecified Equipment');
    assetId = String(row[4] || 'N/A');
    area = String(row[5] || '');
    category = row[6];
    priority = VALID_PRIORITIES.includes(row[7]) ? row[7] : defaultPriority;
    status = VALID_STATUSES.includes(row[8]) ? row[8] : defaultStatus;
    technician = String(row[9] || 'Unassigned');
    operatingMetric = String(row[10] || '-');
    issueDescription = String(row[11] || '');
    actionTaken = String(row[12] || '');
    partsReplaced = String(row[13] || '');
    itemNo = String(row[14] || '');
    quantity = String(row[15] || '');
    nextServiceDue = String(row[16] || '');
    costRaw = row[17];
    notes = String(row[18] || '');
  } 
  // Case 2: 18-column schema (Area at col 4, Category at col 5, no Acknowledge Date)
  else if (VALID_CATEGORIES.includes(row[5] as any)) {
    acknowledgeDate = '';
    equipmentName = String(row[2] || 'Unspecified Equipment');
    assetId = String(row[3] || 'N/A');
    area = String(row[4] || '');
    category = row[5];
    priority = VALID_PRIORITIES.includes(row[6]) ? row[6] : defaultPriority;
    status = VALID_STATUSES.includes(row[7]) ? row[7] : defaultStatus;
    technician = String(row[8] || 'Unassigned');
    operatingMetric = String(row[9] || '-');
    issueDescription = String(row[10] || '');
    actionTaken = String(row[11] || '');
    partsReplaced = String(row[12] || '');
    itemNo = String(row[13] || '');
    quantity = String(row[14] || '');
    nextServiceDue = String(row[15] || '');
    costRaw = row[16];
    notes = String(row[17] || '');
  } 
  // Case 3: Legacy 17-column schema (Category at col 4, no Area, no Acknowledge Date)
  else {
    acknowledgeDate = '';
    equipmentName = String(row[2] || 'Unspecified Equipment');
    assetId = String(row[3] || 'N/A');
    area = '';
    category = VALID_CATEGORIES.includes(row[4]) ? row[4] : defaultCategory;
    priority = VALID_PRIORITIES.includes(row[5]) ? row[5] : defaultPriority;
    status = VALID_STATUSES.includes(row[6]) ? row[6] : defaultStatus;
    technician = String(row[7] || 'Unassigned');
    operatingMetric = String(row[8] || '-');
    issueDescription = String(row[9] || '');
    actionTaken = String(row[10] || '');
    partsReplaced = String(row[11] || '');
    itemNo = String(row[12] || '');
    quantity = String(row[13] || '');
    nextServiceDue = String(row[14] || '');
    costRaw = row[15];
    notes = String(row[16] || '');
  }

  const costNum = typeof costRaw === 'number' 
    ? costRaw 
    : parseFloat(String(costRaw || '0').replace(/[^0-9.-]+/g, '')) || 0;

  return {
    id: String(row[0] || `LOG-${Date.now()}`),
    timestamp: String(row[1] || new Date().toISOString().replace('T', ' ').substring(0, 16)),
    acknowledgeDate,
    equipmentName,
    assetId,
    area,
    category,
    priority,
    status,
    technician,
    operatingMetric,
    issueDescription,
    actionTaken,
    partsReplaced,
    itemNo,
    quantity,
    nextServiceDue,
    serviceCost: costNum,
    notes,
    rowIndex
  };
}

/**
 * Creates a new pre-formatted Google Sheet in the user's Google Drive.
 */
export async function createMaintenanceSpreadsheet(
  token: string,
  title: string = 'Equipment Maintenance Logs (ServicePulse)'
): Promise<SpreadsheetMetadata> {
  const requestBody = {
    properties: {
      title
    },
    sheets: [
      {
        properties: {
          title: 'Maintenance Logs',
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 22,
            rowCount: 100
          }
        }
      }
    ]
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${createRes.status} ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const sheetName = 'Maintenance Logs';
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // Populate header and sample data
  const initialRows = [
    SHEET_COLUMNS,
    ...INITIAL_SAMPLE_LOGS.map(logToRowValues)
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:R${initialRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `${sheetName}!A1:R${initialRows.length}`,
        majorDimension: 'ROWS',
        values: initialRows
      })
    }
  );

  if (!appendRes.ok) {
    console.warn('Initial data population failed, but sheet was created');
  }

  // Format header row style
  try {
    const sheetId = sheetData.sheets?.[0]?.properties?.sheetId || 0;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.09, green: 0.12, blue: 0.18 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 10
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 19
              }
            }
          }
        ]
      })
    });
  } catch (fmtErr) {
    console.warn('Header formatting optional step failed:', fmtErr);
  }

  return {
    id: spreadsheetId,
    name: title,
    url,
    sheetName,
    lastSyncedAt: new Date().toISOString()
  };
}

/**
 * Validates and retrieves information for an existing spreadsheet.
 */
export async function getSpreadsheetDetails(
  token: string,
  rawIdOrUrl: string
): Promise<SpreadsheetMetadata> {
  const spreadsheetId = extractSpreadsheetId(rawIdOrUrl);
  if (!spreadsheetId) {
    throw new Error('Please enter a valid Google Spreadsheet ID or URL');
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 404) {
      throw new Error('Spreadsheet not found. Please verify the ID or ensure your Google account has access.');
    }
    if (res.status === 403) {
      throw new Error('Permission denied. Please ensure this spreadsheet is shared with your account.');
    }
    throw new Error(`Failed to load spreadsheet: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const sheets = data.sheets || [];
  const targetSheet = sheets.find((s: any) => 
    s.properties?.title?.toLowerCase().includes('maintenance') || 
    s.properties?.title?.toLowerCase().includes('log')
  ) || sheets[0];

  const sheetName = targetSheet?.properties?.title || 'Sheet1';

  return {
    id: spreadsheetId,
    name: data.properties?.title || 'Maintenance Spreadsheet',
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    sheetName,
    lastSyncedAt: new Date().toISOString()
  };
}

/**
 * Reads all maintenance logs from the specified Google Sheet.
 */
export async function fetchSheetLogs(
  token: string,
  spreadsheetId: string,
  sheetName: string = 'Maintenance Logs'
): Promise<MaintenanceLog[]> {
  // Read range A2:S1000
  const range = `${sheetName}!A2:S1000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`Error reading from Google Sheet (${res.status})`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows
    .map((row, idx) => rowValuesToLog(row, idx + 2))
    .filter(log => log.equipmentName && log.equipmentName.trim() !== '');
}

/**
 * Appends a new maintenance record to the Google Sheet.
 */
export async function appendSheetLog(
  token: string,
  spreadsheetId: string,
  log: MaintenanceLog,
  sheetName: string = 'Maintenance Logs'
): Promise<void> {
  const range = `${sheetName}!A:S`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const values = [logToRowValues(log)];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append log to Google Sheet: ${res.status} ${errText}`);
  }
}

/**
 * Updates an existing maintenance record on the Google Sheet.
 */
export async function updateSheetLog(
  token: string,
  spreadsheetId: string,
  log: MaintenanceLog,
  sheetName: string = 'Maintenance Logs'
): Promise<void> {
  let targetRowIndex = log.rowIndex;

  // If rowIndex is unknown, locate by log.id in column A
  if (!targetRowIndex || targetRowIndex < 2) {
    const colARes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:A`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (colARes.ok) {
      const colAData = await colARes.json();
      const colRows = colAData.values || [];
      const foundIdx = colRows.findIndex((r: any[]) => r[0] === log.id);
      if (foundIdx !== -1) {
        targetRowIndex = foundIdx + 1; // 1-based index
      }
    }
  }

  if (!targetRowIndex || targetRowIndex < 2) {
    return appendSheetLog(token, spreadsheetId, log, sheetName);
  }

  const range = `${sheetName}!A${targetRowIndex}:S${targetRowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const values = [logToRowValues(log)];

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update log in Google Sheet: ${res.status} ${errText}`);
  }
}

/**
 * Deletes a row from the Google Sheet.
 */
export async function deleteSheetLogRow(
  token: string,
  spreadsheetId: string,
  rowIndex: number,
  sheetName: string = 'Maintenance Logs'
): Promise<void> {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!metaRes.ok) {
    throw new Error('Failed to resolve sheet metadata for deletion.');
  }

  const metaData = await metaRes.json();
  const sheet = (metaData.sheets || []).find(
    (s: any) => s.properties?.title === sheetName
  ) || metaData.sheets?.[0];

  const sheetIdNum = sheet?.properties?.sheetId ?? 0;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetIdNum,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-based inclusive
              endIndex: rowIndex // 0-based exclusive
            }
          }
        }
      ]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to delete row from Google Sheet: ${res.status} ${errText}`);
  }
}
