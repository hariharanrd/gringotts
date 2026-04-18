# 🚀 Release Notes

## [April 18, 2026] Secure Onboarding & Authentication
Major improvements to the registration and login experience, focusing on security and a seamless first-run experience.

### 🛡️ Mandatory Account Confirmation
We've introduced a gated registration process to ensure all accounts are properly secured from the start.
- **Mandatory 2FA Verification**: New users are now required to successfully verify their TOTP setup before their account is activated.
- **Automated Onboarding**: Successfully verifying your 2FA during registration now automatically logs you in and takes you straight to your dashboard.
- **Gated Authentication**: Only fully confirmed users can access the system, preventing incomplete or insecure registrations.

### 🏠 Smart Account Initialization
No more starting from scratch! New users now land on a fully prepared system.
- **Pre-populated Categories**: Upon account activation, the system automatically creates a essential set of categories (Home, Utilities, Work, etc.) for Expenses, Income, Savings, and Revolvings.
- **Design Consistent Defaults**: Initialization is driven by a customizable JSON configuration and uses the project's standard icon and color palettes.

### 🎨 Refined Authentication UX
- **Password Protection**: Added password confirmation during registration to prevent accidental lockout.
- **Secret Management**: Improved TOTP setup with a hidden-by-default secret and one-click copy functionality.
- **Seamless Navigation**: Added a "Don't have an account? Sign Up" link to the login page for easier discovery.
- **Clearer Error Feedback**: Optimized system messages to provide helpful feedback (e.g., "User already exists") while maintaining security best practices (e.g., "User doesn't exist" for unconfirmed accounts).

---

## [April 17, 2026] Visual Categorization & Dashboard Refinements

### 🎨 Personalize Your Categories
Elevate your financial organization with enhanced visual customization! Now, you can personalize your Category Hierarchy with a rich set of icons and vibrant colors.

- **Custom Icons**: Choose from a curated library of icons (🍽️, 🚗, 🛋️, etc.) to represent your categories visually.
- **Vibrant Colors**: Assign unique colors to each category for instant identification across the dashboard and transaction lists.
- **Savings Breakdown**: Replaced the "Spending Split" pie chart with a dynamic "Savings Breakdown" bar chart. This new widget supports negative net savings, correctly visualizing both deposits and withdrawals.
- **Outstanding Balances**: New dashboard cards for Revolvings provide at-a-glance summaries of "To Pay" (IOU) and "To Collect" (UOM) for all open transactions.
- **Dashboard Layout Optimizations**: Balanced the charts row with equal widths and added gridlines for improved data reference on large screens.

---

## [April 14, 2026] Multi-Tenancy & Security

### 🛡️ Enterprise-Grade Isolation
This major update focuses on security and data integrity, ensuring Gringotts is ready for multi-user environments.

- **Multi-User Data Isolation**: Transactions, Categories, and Budgets are now fully isolated per user account.
- **"Trust this Browser"**: Added support for 90-day trusted browser sessions, balancing security with a seamless second-factor authentication (MFA) experience.
- **IAM Integration**: Implemented a robust `IAMService` to manage user contexts across the backend.

---

## [April 6, 2026] Advanced Budgeting Engine

### 🎯 Strategic Financial Planning
Take control of your future with our advanced budgeting engine and dashboard improvements.

- **Master Templates**: Define your ideal monthly spending structure once and reuse it.
- **Monthly Budget Generation**: Generate actual budgets from templates with one click and track real-time performance.
- **Utilization Dashboard**: High-level overview of budget vs. actuals with smart variance tracking.
- **Bulk Operations**: Edit multiple transactions simultaneously to keep your records up-to-date efficiently.
- **Safety Dialogs**: Integrated confirmation dialogs for all destructive delete actions.

---

## [April 3, 2026] Transaction Insights

### 🔍 Deep Dive into Spending
- **Transaction Details**: A dedicated view for individual transactions, providing space for extensive notes and audit details.
- **Atomic Operations**: Backend logic updated to ensure all category transitions and updates are transactional, preventing data corruption.
- **Auto-Cleanup**: Forms now automatically clear upon successful submission or cancellation.

---

## [March 27, 2026] Modern Foundation

### 📱 Responsive UI & Automation
- **Responsive Design**: Complete layout overhaul to ensure a premium, architectural interface on all devices (Mobile, Tablet, Desktop).
- **Automated Statement Parsing**: Stop manual entry with support for HDFC Bank savings and credit card statements.
- **Infrastructure as Code**: Integrated GitHub Actions for automated Firebase Hosting deployments.
- **Supabase Integration**: Stability improvements for Supabase PostgreSQL persistence.

---
*Gringotts - Tracking wealth with peace and style.*
