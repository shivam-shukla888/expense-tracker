# 💰 RupeeTrack - Full-Stack Personal Finance & Expense Tracker

RupeeTrack is a responsive, secure, professional personal finance management web application built to help users record income and expenses, manage transaction histories, analyze monthly spending trends, and visualize category cash flows.

Designed with an aesthetic, modern user interface, server-side session management with **Argon2id** password hashing, **CSRF protection**, **precise monetary arithmetic (integer paise)**, and **SQLite persistent storage**.

---

## 🌟 Key Features

- **📊 Comprehensive Financial Dashboard:**
  - Net cash flow summary (Total Income, Total Expenses, and Net Balance).
  - Month-over-month (MoM) trend percentages and indicators.
  - Interactive Monthly Income vs. Expense bar charts (via Recharts).
  - Category-wise expense breakdown with donut visualization and percentages.
  - Quick recent transactions preview.

- **💳 Complete Transaction Management (CRUD):**
  - Add, view, edit, and delete transactions with confirmation dialogs.
  - Pre-categorized streams for Income (*Salary, Freelance, Business, Investment Returns, Other*) and Expenses (*Food, Transport, Rent, Shopping, Bills, Healthcare, Education, Entertainment, Other*).
  - Real-time search by description, type filters, category filters, and custom date range filters.
  - Multi-column sorting (Date, Amount, Category) and server-paginated data tables.

- **🔒 Enterprise-Grade Security & Authentication:**
  - State-of-the-art **Argon2id** password hashing with timing attack mitigation.
  - Server-side session store with cryptographically random tokens and SQLite persistence.
  - Secure, `HttpOnly`, `SameSite=lax` cookies.
  - Cross-Site Request Forgery (**CSRF**) header verification on all state-modifying requests.
  - Rate limiting on authentication endpoints to prevent brute-force attacks.
  - Security headers enforced with **Helmet**.
  - Strict payload size limits (10 KB max) to prevent memory exhaustion DoS.
  - Absolute data isolation: Users can never access, edit, or delete another user's transactions.

- **🇮🇳 Precise Monetary Arithmetic:**
  - All monetary values are calculated and stored in **integer paise** (1 INR = 100 paise) in SQLite, eliminating binary floating-point errors (e.g. `0.1 + 0.2`).
  - Automatic formatting into standard Indian numbering system (`₹1,25,000.00`).

- **🌱 Safe, Synthetic Demo Seeding:**
  - 1-click demo login button for instant previewing.
  - Synthetic data generation across multiple months.
  - Idempotent seeding prevents duplicate records on restart.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Vanilla CSS Design System, Recharts, Lucide Icons |
| **Backend** | Node.js (v20+), Express.js |
| **Database** | SQLite3 via `better-sqlite3` (WAL mode enabled) |
| **Security** | Argon2id, Express Rate Limit, Helmet, Cookie-Parser, Zod |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert/strict`), Supertest |

---

## 📁 Project Structure

```text
expense-tracker/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions automated test & build pipeline
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/            # Sidebar, Navbar, StatCards, Charts, Modals, Tables
│   │   ├── context/               # AuthContext, ToastContext
│   │   ├── pages/                 # DashboardPage, TransactionsPage, ReportsPage, AuthPages
│   │   ├── services/              # API fetch client with CSRF token handling
│   │   ├── utils/                 # Currency & date formatters
│   │   ├── App.jsx                # Layout & navigation coordinator
│   │   ├── index.css              # Custom responsive CSS design system
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js             # Vite config with backend proxy
├── server/                        # Node.js + Express backend
│   ├── src/
│   │   ├── config/env.js          # Environment variables & startup validation
│   │   ├── db/                    # SQLite connection, schema, and demo seeder
│   │   ├── middleware/            # Auth, CSRF, Rate Limiter, Error handling, Validation
│   │   ├── routes/                # Auth, Transactions, Dashboard, Reports, Health
│   │   ├── services/              # Business logic & database queries
│   │   ├── utils/                 # Precise currency math and safe logging
│   │   ├── app.js                 # Express application factory
│   │   └── server.js              # Server bootstrapper & graceful shutdown
│   ├── tests/                     # Automated unit and integration test suites
│   ├── storage/                   # SQLite database persistent storage (gitignored)
│   ├── package.json
│   └── .env.example
├── .gitignore
├── .env.example
├── package.json                   # Root workspace orchestration scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.x, v22.x, or v24.x recommended)
- npm (v10+ or v11+)

### 1. Installation

Clone or open the repository folder, then install all dependencies:

```bash
# Install root, server, and client dependencies
cd server && npm install && cd ../client && npm install && cd ..
```

### 2. Environment Configuration

Copy the example environment files:

```bash
# In the server folder:
cp server/.env.example server/.env
```

Ensure `SESSION_SECRET` is set (must be at least 32 characters in production):

```env
PORT=5000
NODE_ENV=development
SESSION_SECRET=dev-insecure-secret-key-change-in-production-min-32-chars!
CORS_ORIGIN=http://localhost:5173
DB_PATH=./storage/expense_tracker.db
```

### 3. Running Locally

You can run both the backend API and frontend dev server simultaneously:

#### Terminal 1: Backend Server (Port 5000)
```bash
npm run server:dev
```

#### Terminal 2: Frontend Client (Port 5173)
```bash
npm run client
```

Open your browser at: **`http://localhost:5173`**

---

## 🧪 Testing

The test suite runs using Node.js's native test runner with Supertest for end-to-end API integration and security testing.

Run all tests from the root or server directory:

```bash
npm test
```

### Tested Capabilities:
- **Authentication:** Registration, login, logout, password complexity, duplicate rejection, and generic auth error timing.
- **Data Isolation:** User B cannot read, update, or delete User A's transactions.
- **Security:** Missing or invalid CSRF tokens are rejected with `403 Forbidden`; request payloads over 10 KB are rejected with `413 Payload Too Large`.
- **SQL Injection Resistance:** Input sanitization in query filters, categories, and descriptions.
- **Arithmetic Precision:** Integer paise conversion and accurate formatting in Indian Rupees (`₹`).
- **Reports:** Summaries accurately reflect all transaction database records.

---

## 📖 REST API Documentation

All protected endpoints require an active session cookie (`et_session_id`). State-changing methods (`POST`, `PUT`, `DELETE`) require the `x-csrf-token` header.

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/health` | Health & database connectivity check | No |
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Login and receive session cookie & CSRF token | No |
| `POST` | `/api/auth/logout` | Terminate session and clear cookie | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & CSRF token | Yes |
| `GET` | `/api/transactions` | Filter, search, and paginate transactions | Yes |
| `POST` | `/api/transactions` | Record a new income or expense transaction | Yes |
| `GET` | `/api/transactions/:id` | Get single transaction details | Yes |
| `PUT` | `/api/transactions/:id` | Update an existing transaction | Yes |
| `DELETE` | `/api/transactions/:id` | Delete a transaction | Yes |
| `GET` | `/api/transactions/categories` | List available transaction categories | Yes |
| `GET` | `/api/dashboard/summary` | Retrieve period totals and MoM comparisons | Yes |
| `GET` | `/api/reports/monthly` | Retrieve monthly income vs expense history | Yes |
| `GET` | `/api/reports/categories` | Retrieve category expense breakdown | Yes |

---

## 💾 Database Management & Backups

### Database Location
The default SQLite database is stored locally at `server/storage/expense_tracker.db` and is automatically created upon first run.

### Backing Up the Database
Because SQLite is a single file, backup is simple and atomic when using the SQLite backup API or copying during downtime:

```bash
# Create an atomic backup snapshot (using sqlite3 CLI)
sqlite3 server/storage/expense_tracker.db ".backup 'server/storage/backup_$(date +%Y%m%d).db'"
```

### Restoring from Backup
```bash
cp server/storage/backup_20261018.db server/storage/expense_tracker.db
```

### Hosting Considerations
SQLite requires persistent disk storage. When deploying to platforms like Render, Railway, Fly.io, or AWS EC2/DigitalOcean, ensure a **persistent volume** is attached to the `/storage` directory. Do not deploy SQLite to ephemeral serverless containers (like AWS Lambda or Vercel serverless functions) without an external database adapter.

---

## 🛡️ Privacy & Financial Safety Disclaimer

- **Self-Reported Records:** RupeeTrack is an independent personal budgeting tool. All totals, charts, and reports are computed solely from records entered into the application.
- **No Direct Bank Integration:** The application does not store bank account numbers, credentials, or credit cards, and does not connect to external financial institutions.
- **No Regulated Financial Advice:** The insights and summaries provided are for personal informational purposes only and do not constitute certified financial or tax advice.

---

## 📸 Screenshots & Visual Tour

To take screenshots for presentation:
1. Start the server and client (`npm run server:dev` and `npm run client`).
2. Log in using the 1-click **Demo User** button on `http://localhost:5173`.
3. Capture:
   - **Dashboard View:** Shows the summary cards, MoM comparison, bar chart, and category donut chart.
   - **Transactions Manager:** Shows filter bar, search query results, and the transaction list.
   - **Record Transaction Modal:** Shows the modal dialog with INR formatting and category selection.
   - **Reports & Analytics:** Shows timeframe picker and category progress bars.

---

## 📄 License
This project is licensed under the MIT License.
