# 🏦 Gringotts

Gringotts is a full-stack personal finance and group expense management application. It provides financial tracking, budget allocation, investment goal management, loan tracking, shared group expense settlement, and AI-assisted transaction processing.

---

## Tech Stack and Architecture

- **Backend**: Java 21, Spring Boot 4.0, PostgreSQL, Spring Data JPA, JWT (HttpOnly cookies), Google Authenticator (TOTP 2FA), Caffeine Cache.
- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, Recharts, Lucide Icons.
- **Repository Structure**: Monorepo with `server/` (Spring Boot API) and `client/` (React SPA).

---

## Features

### 📊 Financial Tracking and Taxonomy
- **Transaction Management**: Logging and filtering of expenses, incomes, savings, and revolving transactions across multiple payment modes (UPI, Net Banking, Credit Card, ATM, Cash).
- **Revolvings**: Tracking for money which is given and received from friends/family etc (more like a casual exchange of money).
- **Credit Card Management**: Tracking of credit card accounts, billing cycle dates, statement periods, and payment status monitoring.
- **Three-Tier Taxonomy**: Categorization using a `Category > SubCategory > Item` structure with custom icons and color assignments.

### 👥 Shared and Personal Groups
- **Group Management**: Support for shared multi-member groups and personal single-user groups with invitation workflows.
- **Expense Splitting**: Logging of shared group expenses with equal, percentage, or itemized split allocations among members.
- **Member Analytics**: Member-wise spending totals, donut chart distribution, category breakdown bar charts, and member transaction filters.
- **Group Budgets**: Configuration of one-time (`OVERALL`) or recurring monthly (`RECURRING_MONTHLY`) budgets with category-level allocations and real-time utilization tracking.
- **Categorization Modes**: Support for custom group-specific categories or fallback to personal category taxonomies.

### 🎯 Goals and Investment Planning
- **Goal Types**: Support for `PERSISTENT` (refillable target balance) and `ONE_TIME` (single target purchase) goals.
- **Auto-Crediting and Projections**: Automatic crediting of matching saving transactions to active goals with target completion projections based on compound growth calculations.
- **Direct Goal Funding**: Funding of manual or scheduled transactions directly from goal balances with budget double-counting safeguards (`include_in_budget = false`).
- **Concurrency Protections**: Pessimistic database write locking to prevent concurrent overdraft deductions and cyclic goal dependencies.

### 🏦 Loan Management
- **Loan Tracking**: Centralized management of active loan accounts, principal amounts, interest rates, and remaining balances.
- **Amortization and Prepayment Simulation**: Calculation of month-by-month principal and interest components with tenure and interest-saving prepayment simulations.
- **Bi-Directional Transaction Linking**: Linking expense entries to loan records to update EMI counts or reduce outstanding principal balance.
- **Scheduled EMI Automation**: Integration with recurring scheduled transactions for automated monthly EMI payment logging.

### 🤖 Ingestion and Automation
- **Bank Statement Ingestion**: Automated parsing of bank statements in PDF and CSV formats into structured transaction records.
- **Recurring Schedules**: Scheduled transaction engine for automated execution of recurring expenses, savings, and loan payments.

### 🧙 Goblin AI Assistant
- **Natural Language Parsing**: Text-based interface for transaction creation, search queries, entry updates, and deletions.
- **Structured Filter Generation**: Conversion of user queries into structured JPA database search filters without exposing user transaction records to external model APIs.
- **Standalone Term Resolution**: Catalogue lookup resolving standalone subcategory (*"Dividend"*) or item (*"Milk"*) queries to their parent category and corresponding target API.
- **Rate Limiting and Sanitization**: Per-user sliding-window rate limiting (2 requests/minute, 20 requests/hour, 50 requests/day) and input sanitization against prompt injection.

### 🛡️ Security and Multi-User Isolation
- **Authentication and MFA**: JWT-based session handling stored in HttpOnly cookies with optional TOTP-based Multi-Factor Authentication.
- **Trusted Devices**: Device registration mechanism to trust verified hardware for 90 days.
- **Multi-User Data Isolation**: Database-level filtering scoping all transactions, categories, groups, and AI endpoints strictly to the authenticated user context (`IAMService.getCurrentUser()`).
