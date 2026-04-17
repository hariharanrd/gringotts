# 🚀 Release Notes

## [April 17, 2026] Visual Categorization & Budget Refinements

### 🎨 Personalize Your Categories
Elevate your financial organization with enhanced visual customization! Now, you can personalize your Category Hierarchy with a rich set of icons and vibrant colors.

- **Custom Icons**: Choose from a curated library of icons (🍽️, 🚗, 🛋️, etc.) to represent your categories visually.
- **Vibrant Colors**: Assign unique colors to each category for instant identification across the dashboard and transaction lists.
- **Budget Refinement**: Improved budget utilization views to focus on open Revolvings and better handle uncategorized spending.

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
