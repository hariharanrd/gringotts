# 🏦 Gringotts

**Gringotts** is a personal finance app built for anyone who wants to keep their money life organized without the usual headache. Think of it as a financial command center that’s actually easy on the eyes.

---

## 🏠 The Big Picture

Gringotts features a **Unified Dashboard** that gives a high-level view of financial health. It tracks income, spending, and savings growth with slick visualizations, making it easy to spot trends at a glance.

### 💸 Handling the Day-to-Day

It goes way beyond a basic list of expenses. The system is broken down to manage every corner of a user's wallet:

* **The Basics**: Detailed tracking for UPI spends, credit card swipes, and various income streams.
* **The "IOUs"**: A dedicated **Revolvings** section keeps track of money lent to friends or borrowed funds, ensuring no debt slips through the cracks.
* **Credit Card Ninja**: This is the heavy lifter. It handles the entire credit card lifecycle, automatically organizing transactions into billing cycles and sending alerts for overdue payments or high utilization.

### 🤖 Automation (Because manual entry is a pain)

To save users from typing in every single coffee purchase, the app includes:

* **Statement Parsing**: Users can just upload bank statements, and the app handles the data entry automatically.
* **Auto-Pilot**: For things like rent or SIPs, the **Recurring Template** engine logs transactions automatically or triggers them with a single click.

### 🎯 Planning for the Future

* **Smart Budgeting**: The app uses "Master Templates" to define an ideal month. It tracks real-time performance and shows exactly how much is being overspent in specific categories.
* **Goal Tracking & Funding**: Whether it’s a refillable emergency fund (`PERSISTENT`) or a one-time purchase like a car (`ONE_TIME`), users can define and manage high-fidelity investment goals.
  * **Auto-Crediting & Projections**: Linked saving transactions automatically credit active goals via tag matching, utilizing compound growth math to calculate precise target dates.
  * **Direct Goal Funding**: Users can fund manual or scheduled transactions (expenses and savings) directly from an active goal. Funded transactions are automatically marked `include_in_budget = false` to prevent budget double-counting, and persistent goals automatically track refill balances.
  * **Strict Overdraft & Cyclic Safeguards**: Backed by DB-level pessimistic write locking, the application prevents concurrent balance deductions, blocks tag cyclic dependencies, and strictly restricts overdraft saves across both manual and automated scheduler runs.
* **Loan Management & Payment Linking**: Hardened financial command center to organize, track, and pay off active loans.
  * **Amortization Schedules & Prepayment Simulator**: View computed month-by-month principal and interest components. Simulate target payoff tenures to calculate exact interest and months saved.
  * **Bi-directional Expense Linking**: Link normal Expense transactions to a Loan. Transactions matching the EMI log as EMI payments (advancing paid count), while others register as part-payments (reducing outstanding principal). Reciprocally, logging payments in the Loan dashboard auto-generates categorized Expense entries.
  * **Scheduled Transaction Auto-Pilot**: Link scheduled expense transactions to loans to fully automate monthly recurring EMI payments.

### 🏷️ Ultimate Organization

For the organization enthusiasts, Gringotts uses a **Three-Tier System** (**Category > SubCategory > Item**). It supports custom icons and colors, so the transaction feed looks vibrant and is easy to scan.

### 🛡️ 2FA Security

Since financial data is sensitive, the app is locked down with:

* **JWT & MFA**: Modern, secure session handling with multi-factor authentication.
* **TOTP Support**: Built-in support for authenticator apps.
* **Trusted Devices**: An option to trust frequent browsers for 90 days to balance security with convenience.

---
