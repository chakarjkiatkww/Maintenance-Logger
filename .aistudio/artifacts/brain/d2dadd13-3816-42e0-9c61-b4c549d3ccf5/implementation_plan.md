# ServicePulse - Equipment Maintenance & Service Log System

A modern, cloud-connected maintenance log and service management system for equipment and machinery, powered directly by Google Sheets as a two-way collaborative database with automated status reporting, SLA tracking, and preventive maintenance alerts.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selections during interactive clarification, the application is scoped for equipment and machinery service operations:
> - **Primary Domain**: Heavy equipment, industrial machinery, and facility service operations.
> - **Sheet Integration**: Dual connection mode — one-click generation of a pre-formatted "Equipment Maintenance Log" Google Sheet in your Google Drive or direct linking to an existing Google Spreadsheet.
> - **Reporting & Tracking**: Live status dashboard featuring SLA overdue indicators, equipment health metrics, maintenance categories, and exportable automated status reports (PDF/print-ready and CSV summaries).

- **Confirmed Decision 1**: Equipment & machinery service logging with field technician records, machine IDs, service categories (Preventive, Corrective, Calibration, Emergency), priority tiers, and operational status.
- **Confirmed Decision 2**: Google Sheets as the authoritative data store via Google Workspace Sheets & Drive APIs with seamless schema validation and fallback offline/cache support.
- **Confirmed Decision 3**: Automated status alerts for overdue inspections and pending service tickets, along with a comprehensive summary digest report builder.

---

## 1. Overview & Core Concept

- **What It Does**: ServicePulse gives service engineers, plant managers, and field technicians a fast, high-density web interface to create, track, and update equipment maintenance records. Every record automatically syncs in real-time to a structured Google Sheet in the user's Google Drive. The platform visualizes machine uptime, flags overdue maintenance intervals, tracks resolution turnaround times, and generates professional service summary reports.
- **Target Audience / Persona**: Plant maintenance supervisors, equipment technicians, field service contractors, and operations managers who want the simplicity and collaboration of Google Sheets without dealing with manual data entry errors or messy spreadsheets.
- **Key Value**: Eliminates lost work orders, enforces standardized data entry with validation, keeps technicians aligned on critical repairs, and automates executive reporting straight from live spreadsheet rows.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Google Account & Sheet Setup**:
   - The user connects with Google via the standard Google Workspace authentication.
   - Upon connection, the user can either click **"Create Standard Equipment Sheet"** (which automatically provisions a styled spreadsheet with columns: `Log ID`, `Timestamp`, `Equipment Name`, `Serial / Asset ID`, `Category`, `Priority`, `Status`, `Technician`, `Hours Run / Odometer`, `Issue Description`, `Action Taken`, `Parts Replaced`, `Next Service Due`, `Cost`, `Notes`) or enter an **Existing Sheet ID / URL**.
2. **Service Dashboard & KPI Monitor**:
   - Immediate visibility into key operational metrics: Total Work Orders, Active Pending / In-Progress Repairs, Overdue Maintenance Alerts, and Resolved Service Logs.
   - SLA urgency flags highlighting equipment past their scheduled inspection or maintenance interval.
3. **Log Creation & Quick Entry**:
   - High-density form with equipment lookup, auto-generated unique ticket IDs, priority selector (Low, Medium, High, Critical), service category, technician assignment, and date pickers.
   - Instant optimistic UI update with direct synchronization to the connected Google Sheet.
4. **Interactive Log Grid & Detailed Inspection**:
   - Multi-parameter filtering by status (Open, In Progress, Waiting for Parts, Completed), priority, equipment asset, and date range.
   - Detail drawer modal displaying the full audit history, service notes, and immediate status change actions (e.g., mark as Completed, reschedule Next Service Due).
5. **Automated Status Reporting & Summary Export**:
   - Executive reporting view generating breakdown charts (Failure Categories, Technician Workload, Machine Downtime vs. Resolution Time).
   - One-click print-ready / PDF summary generation and formatted CSV export for compliance audits and shift handovers.

### Visual Identity & Theme
- **Aesthetic Direction**: Crisp, high-contrast industrial operations console following SaaS dashboard design principles. Clean surfaces, sharp typographic contrast, and zero AI-slop decorative fluff.
- **Color Palette & Mood**:
  - Dominant Neutral: Crisp slate canvas (`#0F172A` dark header accents, `#F8FAFC` clean workspace background).
  - Structural Surfaces: White cards (`#FFFFFF`) with precise hairline borders (`#E2E8F0`).
  - Semantic Status Tokens:
    - Nominal / Completed: Clean emerald (`#059669` / `#10B981`)
    - In Progress / Warning: Amber gold (`#D97706` / `#F59E0B`)
    - Urgent / Overdue: High-intent ruby (`#DC2626` / `#EF4444`)
    - Preventive / Scheduled: Cobalt blue (`#2563EB`)
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` / `Outfit` for confident, modern industrial authority.
  - Body Prose & Labels: Clean, scannable neo-grotesque sans with strict single-line controls (`whitespace-nowrap`).
  - Data, Metrics & Timestamps: Tabular figures (`tabular-nums font-mono`) ensuring vertical alignment across dense data grids.
- **Anti-Slop Discipline**:
  - Zero pill enclosures for static metadata; metadata separated by subtle typographic bullets (`·`).
  - No fake latency tickers, no synthetic AI innovation scoreboards, and no decorative pulsing dots.
  - Strict top-bar contract: 1-line wordmark, single-line navigation links, and 1 primary action button.

### Interactive Feedback & Motion
- Responsive button micro-interactions ($\le 150\text{ms}$) with explicit loading states.
- Clean slide-over drawers for log inspection.
- Toast notifications confirming spreadsheet row insertions and updates.
- Real-time online/sync status indicators linked directly to Google Sheets API responses.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Client-Side Google Sheets API with Firebase Auth Token**:
  - *Chosen Approach*: Authenticate via Google OAuth using Firebase Auth client SDK, obtain the access token, and interact directly with Google Sheets API v4 (`spreadsheets.values.append`, `spreadsheets.values.get`, `spreadsheets.values.update`) and Google Drive API (`files.create`).
  - *Why*: Eliminates server-side redirect URI mismatch issues in ephemeral preview environments, guarantees fast response times, and gives the user direct ownership of their spreadsheet data in their personal Google Drive.
  - *Alternatives Considered*: Server-side proxy with OAuth refresh tokens (rejected due to ephemeral domain constraints and security risk of storing user tokens on server).
- **Decision 2: Automated Schema Provisioning & Template Seeding**:
  - *Chosen Approach*: When creating a new sheet, the app automatically formats the first row with bold headers, frozen header rows, and formatted columns, plus pre-populates realistic initial sample equipment logs.
  - *Why*: Gives users an instantly functional experience out of the box with zero manual spreadsheet setup required, while still allowing them to edit the sheet directly in Google Drive.
- **Decision 3: Robust Local Caching & Optimistic State**:
  - *Chosen Approach*: Cache fetched logs in local memory/storage so the dashboard loads instantly, allowing offline drafting and sync-back when connection resumes.
  - *Why*: Equipment rooms and machine floors often have fluctuating connectivity; technicians need instant UI responsiveness.

---

## 4. Technical Architecture & Data Strategy

### System Layout & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar                              │
│  [ ServicePulse ]    [ Dashboard ] [ Logs ] [ Reports ]   [ Connect ]  │
└────────────────────────────────────────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌─────────────────────────────────┐         ┌────────────────────────────┐
│      Google Sheets Engine       │         │    Live Metrics Engine     │
│ - OAuth Token Manager           │         │ - Active Service Tickets   │
│ - Sheet Auto-Creator / Linker   │         │ - Overdue SLA Inspections  │
│ - Append / Update / BatchGet    │         │ - Equipment Category Ratio │
└─────────────────────────────────┘         └────────────────────────────┘
         │                                                   │
         ├─────────────────────────┬─────────────────────────┤
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Log Entry Form  │      │  High-Density    │      │ Automated Status │
│  - Asset Lookup  │      │  Service Grid    │      │ Reporting Engine │
│  - SLA / Dates   │      │  - Filter & Sort │      │ - Summary Digest │
│  - Action Logs   │      │  - Quick Status  │      │ - PDF & CSV Dumps│
│  - Cost Tracking │      │  - Drawer Detail │      │ - Overdue Radar  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

### Data Model & Sheet Columns

The underlying Google Sheet maintains the following standardized column schema:

| Column | Field Name | Type | Description |
|---|---|---|---|
| A | `log_id` | String | Unique identifier (e.g., `LOG-2026-1042`) |
| B | `timestamp` | ISO String | Creation timestamp |
| C | `equipment_name` | String | Machine / Asset title (e.g., `CNC Milling Unit 04`) |
| D | `asset_id` | String | Serial / Asset Tag (e.g., `EQ-CNC-998`) |
| E | `category` | Enum | `Preventive`, `Corrective`, `Calibration`, `Emergency` |
| F | `priority` | Enum | `Low`, `Medium`, `High`, `Critical` |
| G | `status` | Enum | `Open`, `In Progress`, `Waiting for Parts`, `Completed` |
| H | `technician` | String | Lead technician name / email |
| I | `operating_metric` | String | Running hours, cycle count, or odometer |
| J | `issue_description` | Text | Reported malfunction or planned inspection scope |
| K | `action_taken` | Text | Work performed and diagnostic resolution |
| L | `parts_replaced` | Text | Replaced parts and consumables |
| M | `next_service_due`| Date | Scheduled due date for preventive review |
| N | `service_cost` | Number | Parts and labor expense ($) |
| O | `notes` | Text | General observations and supervisor notes |

### Interactive Component & State Mapping

- **Auth & Connection Modal**: Handles Google Sign-In with requested scopes (`spreadsheets` and `drive.file`). Displays connected user profile, active spreadsheet title, direct link to view sheet in Google Docs/Drive, and sheet disconnect/switch affordance.
- **Service Dashboard View**:
  - KPI Cards: Total active tickets, overdue count, completed this month, total maintenance cost.
  - Urgent Attention Table: Equipment with overdue next-service dates or Critical open priority.
- **Log Management Grid**:
  - Live search by equipment name, serial ID, or technician.
  - Multi-tag segmented filters for Status and Priority.
  - Row action menu: Quick status change (Open $\rightarrow$ In Progress $\rightarrow$ Completed), edit log drawer, and direct Google Sheet row link.
- **New Service Log Modal**:
  - Validation rules for required fields (Equipment, Category, Priority, Technician, Date).
  - Auto-calculated next service recommendation based on category (e.g., 90 days for Preventive).
  - Direct append to Google Sheet with instantaneous optimistic display in table.
- **Automated Reporting View**:
  - Period selector (Current Week, Month, Quarter, Custom Range).
  - Breakdown graphs: Service types breakdown, equipment downtime frequency, technician distribution.
  - Export capabilities: Formatted print/PDF report for shift compliance and CSV download.
