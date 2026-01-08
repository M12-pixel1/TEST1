# Case Management Web App

A minimal Next.js application demonstrating an E2E MVP flow for case management with role-based access control.

## Features

- **Case Management**: Create, view, and manage cases through their lifecycle
- **Status Workflow**: DRAFT → REVIEW → APPROVED
- **Role-Based Access**: 
  - **AUTHOR**: Can create cases, upload attachments, and submit for review
  - **APPROVER**: Can approve cases and export approved cases
- **Mock Authentication**: Switchable roles via top-right dropdown
- **Attachments**: Upload files to cases (disabled once approved)
- **Export**: Download approved cases as ZIP files

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
cd apps/web
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Usage

### Role Switching

Use the dropdown in the top-right corner to switch between:
- **AUTHOR** (author@test.com)
- **APPROVER** (approver@test.com)

### Workflow

1. **As AUTHOR**:
   - Create a new case
   - Upload attachments
   - Submit for review (DRAFT → REVIEW)

2. **As APPROVER**:
   - Review cases in REVIEW status
   - Approve cases (REVIEW → APPROVED)
   - Export approved cases

### Pages

- `/` - Case list
- `/cases/new` - Create new case
- `/cases/[id]` - Case detail with actions

### API Routes

- `GET /api/cases` - List all cases
- `POST /api/cases` - Create new case
- `GET /api/cases/[id]` - Get case details
- `PATCH /api/cases/[id]/status` - Update case status
- `POST /api/cases/[id]/attachments` - Upload attachment
- `POST /api/cases/[id]/export` - Export case

## Technical Details

### Architecture

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Plain HTML/CSS (inline styles)
- **State Management**: React Context for auth
- **Data Store**: In-memory (for demo purposes)

### Mock Authentication

All API requests include custom headers:
- `x-user-email`: User's email address
- `x-user-role`: User's role (AUTHOR/APPROVER)

### Permissions

| Action | AUTHOR | APPROVER |
|--------|--------|----------|
| Create case | ✅ | ❌ |
| Upload attachment | ✅ (not approved) | ❌ |
| Submit for review | ✅ (DRAFT only) | ❌ |
| Approve case | ❌ | ✅ (REVIEW only) |
| Export case | ❌ | ✅ (APPROVED only) |

## Project Structure

```
apps/web/
├── app/
│   ├── api/                    # API routes
│   │   ├── cases/             # Case endpoints
│   │   │   ├── [id]/
│   │   │   │   ├── attachments/
│   │   │   │   ├── export/
│   │   │   │   ├── status/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   └── data-store.ts      # In-memory data store
│   ├── cases/                  # Case pages
│   │   ├── [id]/
│   │   │   └── page.tsx       # Case detail
│   │   └── new/
│   │       └── page.tsx       # Create case
│   ├── lib/                    # Utilities
│   │   ├── api-fetch.ts       # Fetch helper with auth
│   │   ├── auth-context.tsx   # Auth context
│   │   └── role-switcher.tsx  # Role switcher UI
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Case list (home)
├── next.config.js
├── package.json
└── tsconfig.json
```
