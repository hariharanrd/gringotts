# 🚀 Release Notes

## [June 07, 2026] Budget Redesign & Weekly Scheduled Transactions

This release introduces a complete redesign of the **Budget Management** module for historical performance tracking, lock controls, and automated leak analysis, alongside new **Weekly Scheduled Transactions** support.

### 📊 Historical Budget Timeline & Performance Tracking
- **Interactive Timeline**: A modern horizontal scroll timeline displays the last 6 months (and custom budget slots) with instant status indicators.
- **Dynamic Capacity Gauge**: Custom SVG circular progress ring visualizing overall utilization with smart alert states.
- **Leak Identification Panel**: "What went wrong?" panel highlights categories that exceeded limits and lists uncategorized leakage.
- **Planned Savings Tracker**: Tracks and compares savings progress against monthly budgeted targets.
- **Past Period Locking**: Enforces read-only controls on both client and server to prevent creating, cloning, or modifying budgets in past periods.
- **Intelligent Creation Form**: Year selection is now a select dropdown supporting up to the next 5 years, dynamically filtering months to prevent past selection.

### 📅 Weekly Scheduling Support
- **Weekly Frequency Option**: Select "Weekly" as a recurring interval when creating or editing scheduled transactions.
- **Automatic Run Date Calculation**: The backend service automatically advances the next run date by exactly 1 week upon execution or when activating a schedule.
- **Seamless Frontend Integration**: The frequency option is fully supported in the Scheduled Transaction modal, tables, list views, and details page.

## [June 04, 2026] Compact View, Spot Editing & Page Size Customization

This release introduces a space-saving **Compact View** toggle, **Spot Editing** (inline cell edits), and customizable **Page Size** controls to the transaction log, allowing users to quickly view, update, and manage financial records in-place without context switching.

### ✏️ Inline Spot Editing
- **Click-to-Edit Cells**: Edit transaction dates, descriptions, categories, subcategories, items, notes, payment modes, saving/revolving directions, closed status, and amounts directly within the table view.
- **Fully Populated Responses**: Seamlessly fetches and updates related entities in the background, keeping the UI instantly updated without manual reloads.
- **Strict Multi-User Isolation**: Automatically filters and verifies all edited transaction relationships (e.g. Category, SubCategory, Item, Credit Card, Loan) against the logged-in user to prevent unauthorized cross-user data access.
- **Cancelable Actions**: Cancel editing at any time by pressing `Escape` or clicking outside, or apply changes instantly by pressing `Enter` or blurring the field.

### 📱 Compact & Relaxed View Toggle
- **View Density Switcher**: Toggle between the spacious "Relaxed" layout and a high-density "Compact" table layout for power users who want to see more data on a single screen.
- **Micro-Animations & Clean Design**: Features smooth visual transitions, tailored margins, and refined padding that adapts beautifully based on density.
- **Persistent Preference**: Automatically saves your layout density preference to local storage and syncs it across your sessions.

### 🔢 Page Size Customization
- **Adjustable Row Counts**: Choose how many transactions to display per page (10, 20, 50, or 100 rows) directly from the pagination footer.
- **Persistent Selection**: Your chosen page size is saved locally and applied automatically on subsequent visits, preventing layout shift.

## [June 01, 2026] Export Transactions Support & Setup Layout Redesign

This release introduces **Export Transactions Support** and a **Vault Setup Layout Redesign** to Gringotts, making it easier to export your financial data and manage configurations.

### 📥 Export Transactions Support
- **Multi-Format Exports**: Export your transaction logs in either `XLSX` (Excel) or `CSV` format.
- **Flexible Scope & Ranges**: Filter by specific transaction types (All, Expense, Income, Saving) and choose between "All Data" or a custom date range.
- **Context-Aware Page Exports**: The transaction table export option automatically applies any active filters currently set in the UI.
- **Smart Limits & Guidance**: Includes a 3,000-row export threshold warning to optimize performance and prevent timeouts.

### ⚙️ Vault Setup Layout Redesign
- **Unified Navigation Drawer**: Replaces scattered setup screens with a slide-over `Vault Setup` navigation panel, preserving the user's background page state.
- **Consolidated Tabs Layout**: Contains dedicated sub-views for:
  - **Categories & Items**: Managing categories, subcategories, and individual items.
  - **Import Statement**: Bulk uploading CSV/Excel bank statements (HDFC, Amazon Pay ICICI, etc.).
  - **Export Data**: Downloading custom chunks of financial transaction history.
  - **Appearance & Themes**: Changing app color palettes with full visual previews and toggling dark/light modes.
- **Responsive Segmented Tabs**: Adapts seamlessly from a segmented tab bar on desktop to an intuitive select dropdown on mobile.

## [May 30, 2026] Account Recovery Mechanism & Secure Password Reset

This release introduces a robust, secure **Account Recovery Mechanism** to Gringotts, letting users recover access to their account via a configured **Recovery Email**.

### 📧 Secure Password Recovery Flow
- **Forgot Password flow**: Visible directly on the login screen. Users can input their Username and Recovery Email to request a reset.
- **Mailgun Integration**: Automatically sends secure recovery emails containing a cryptographically secure token valid for 15 minutes.
- **Enter New Password Page**: An interactive interface to securely reset the password using the token link received via email.
- **Robust Security**: Invalidates older recovery tokens automatically to prevent reuse attacks and validates token expiry.

### ⚠️ Proactive Recovery Email Alerts
- **Persistent Warning Banner**: Users who haven't set a recovery email will see a, non-blocking amber alert banner at the top of their dashboard layout.
- **Remind me Later**: Allows users to dismiss the banner for their active session without blocking normal app usage.
- **Seamless Configuration**: A dedicated Recovery Email setup field added directly to the Account Profile settings page.

## [May 30, 2026] Self-Service MFA Reset & Limiter Support

This release introduces a **MFA Reset** command center in the user's Account Settings under the Security tab. Users can now easily re-configure their TOTP authenticators by scanning a new QR code or entering custom keys manually.

### 🛡️ Secure Self-Service MFA Reset
- **Three-Step Verification Flow**: Verify your identity via password ➔ scan the new high-fidelity QR code (or enter the key manually) ➔ verify and activate the new 6-digit TOTP code.
- **Trusted Session Purge**: Resetting your MFA automatically invalidates all existing trusted browsers across all devices to guarantee complete account isolation and absolute security.
- **Seamless Frontend Experience**: Fully interactive status indications with amber alerts, automated Clipboard copy helpers, and loading/success transitions.

## [May 27, 2026] Dedicated Loan Management Module

This release introduces the brand new **Loan Management Module** to Gringotts, giving users a complete command center to track, schedule, and optimize active loans and liabilities. 

### 💼 Comprehensive Loan Accounts
- **Loan Details Tracking**: Register loans with details including Lender Name, Principal Amount, Annual Interest Rate, Tenure Months, and Start Date.
- **Automated Monthly EMI Calculator**: Automatically computes high-fidelity monthly Equated Monthly Installment (EMI) values using standard amortization formula.
- **Overview Dashboard**: A unified dashboard showing total payable amount, total interest due, amount paid so far, outstanding principal, and EMIs remaining, coupled with an interactive repayment progress ring.
- **Notes & History Log**: Add customized notes to active loan accounts to keep track of loan references or contact information.

### 📊 Dynamic Amortization Schedules & Prepayment Simulator
- **Month-by-Month Amortization**: View a complete breakdown of every future installment with exact interest component, principal component, and remaining balance details.
- **Target Tenure Prepayment Simulator**: Simulate prepayment/early payoff paths by inputting custom target payoff months. Calculate exactly how much interest will be saved and the number of months shaved off the loan term.
- **Prepayments & Part-Payments History**: Add manual part-payments directly to principal balance. The amortization schedule and dashboard automatically recalculate future remaining installments.

### 💼 Bi-directional Expense ↔ Loan Payment Linking
- **Automatic Payment Tracking**: Link normal Expense transactions to a Loan. If the amount matches the monthly EMI and is the first payment of the calendar month, it registers as an EMI payment (advancing the repayment progress). Otherwise, it is automatically logged as a part-payment.
- **Auto-Expense Generation**: Logging an EMI payment or part-payment from the Loan dashboard automatically creates a corresponding Expense transaction with pre-configured category, subcategory, and item settings.

### ⏰ Scheduled Transaction Loan Integration
- **Automated Recurring EMIs**: Link a Scheduled Transaction of type `EXPENSE` to a Loan to automate periodic EMI payments.
- **Smart Execution Cascade**: When a scheduled expense triggers (automatically or manually), it populates the linked loan reference, and registers the loan-side payment.
- **Visual Status Badges**: Added responsive desktop and mobile status badges next to scheduled transaction names showing a premium `💼 Loan Name` indicator for linked schedules.

## [May 23, 2026] Goal Types, Direct Funding & Scheduled Transaction Funding

This release introduces **Goal Types** (`PERSISTENT` vs `ONE_TIME`), **Goal-Funded Transactions**, and **Scheduled Transaction Goal Funding**. Users can now fund manual or recurring expenses directly from investment goals, automatically manage budget exclusions, track refills for persistent goals, and prevent overdrafts with interactive UI indicators and housekeeper-safe validations.

### 🔄 Dynamic Goal Types & Refill Tracker
- **Persistent vs One-Time Goals**: Goals can now be configured as either `PERSISTENT` (e.g., Emergency Fund) or `ONE_TIME` (e.g., Buying a Car/Home).
- **Persistent Deductions**: Spending funded by a `PERSISTENT` goal reduces its `current_amount` and automatically tags the goal with a high-fidelity **"Refill Needed"** warning badge of equal value.
- **One-Time Achievements**: Spending funded by a `ONE_TIME` goal acts as a direct allocation toward the purchase. The spent amount counts as dynamic progress but leaves the achieved balance intact.
- **Auto-Credit Isolation**: Added tag-based cyclic dependency detection that prevents a transaction from being funded by a goal it already contributes to via Category/Subcategory/Item auto-credit tags.

### 💰 Direct Transaction Funding & Schedule Support
- **Fund from Goal**: Non-income transactions (both manual and scheduled) can now be directly linked to any active investment goal from their respective creation and edit forms.
- **Auto Budget Exclusion**: Funding a transaction from a goal automatically marks it as `include_in_budget = false`, locking it out of budget utilization calculations to prevent double-counting.
- **Automatic Balance Rollbacks**: Modifying, deleting, or unlinking goal-funded transactions automatically rolls back and recalculates the balance on persistent goals.
- **Proactive Overdraft Prevention**: The backend and scheduler rigorously block overdrafts and throw structured errors if a transaction or schedule execution value exceeds the goal's remaining balance.

### ⏰ Scheduled Transaction Goal Funding
- **Recurring Goal Deductions**: Scheduled transaction executions automatically validate goal available balances and perform atomic pessimistic write-locked deductions (`deductFromGoal`) upon automated runs.
- **Graceful Housekeeper Failures**: If an automated run has insufficient funds or tag cyclic dependencies, it logs a housekeeper warning and fails gracefully without interrupting other schedules.

### 🎨 Sleek UI Indicators & Warnings
- **Available Balance Dropdowns**: The transaction and schedule modal dropdowns now display each goal's actual **Available Balance** dynamically (factoring in spent allocations for one-time goals) rather than simple achieved totals.
- **Zero Balance & Overdraft Alerts**: Added real-time visual warning cards in both modals that appear immediately when a user selects a goal with a ₹0 balance or types an amount that exceeds the goal's available limit, and automatically disable the Save button.
- **Stunning Detail Planner**: Expanded the goal details view with persistent refill notices, spending metrics cards, and a paginated list of all transactions funded from that goal.
- **Responsive Bulk Edit**: Integrates goal funding in bulk edit actions, strictly filtering the selection to open goals with a positive spendable balance ($> ₹0$).

## [May 15, 2026] Session Management & Credit Card Clarity

### 🔐 Active Session Management

- **Security Audit**: Users can now see a comprehensive list of all devices and locations (IP addresses) where they are currently logged in.
- **Remote Revocation**: Added the ability to "kill" any active session remotely from the Account page. This is critical for security if a device is lost or a login is suspicious.
- **Real-time Invalidation**: Implemented a hybrid JWT strategy where tokens are checked against a "revocation list" in the database for every request, allowing for immediate session termination.
- **Enhanced Logout**: The sign-out process now explicitly invalidates the session in the backend, ensuring the token is truly dead after logout.
- **Current Device Tagging**: A "This Device" badge helps users identify their current active session in the list.

### 💳 Credit Card Visibility & Deadlines

- **Deadline Transparency**: No more guessing when a bill is due. The UI now explicitly displays the **Exact Due Date** (e.g., "Pay by: 15 Jun") across the Dashboard, Card Grid, and Detail pages.
- **Urgent Dashboard Alerts**: Overdue and pending bills now appear as high-contrast alerts on the dashboard. Overdue bills feature a persistent pulse to ensure they are never missed.
- **Smart Status Tracking**: The dashboard now intelligently shows the *oldest* overdue date and the *nearest* pending date independently, ensuring accurate information when managing multiple cards.
- **Visual Intensity**: Overdue cards now feature a red pulsing ring and a glow effect. Pending bills use a vibrant amber-to-orange gradient to stand out from standard accounts.
- **UX Refinement**: Reserved pulsing animations for overdue items only, reducing visual noise for bills that are simply upcoming but not yet late.

### 🎯 Goal Archiving & Maintenance
- **Manual Archiving**: Once a goal is achieved, users can now mark it as "Closed" to move it into an archive, keeping the main planner focused on active targets.
- **Archived View**: Introduced a new "Archived" tab in the Investment Planner to house completed goals, allowing for a clean separation between current and past achievements.
- **Historical Context**: Archived goals retain their final progress state and metadata, serving as a record of your financial milestones.
- **Immutable State**: Closed goals are protected from further edits or accidental balance updates once archived.

### 🛠️ Backend Infrastructure

- **Session Persistence**: Introduced a dedicated `user_sessions` tracking table with automatic activity timestamping.
- **Error Handling**: Resolved Hibernate entity conflicts and null-constraint issues in the session tracking logic.


## [May 10, 2026] Timezone Localization & Regional Preferences

### 🌍 Timezone Support

- **User-Centric Localization**: Moved away from a fixed time model. The application now detects your browser's timezone on load and stores it as a persistent preference.
- **Regional Settings**: A new "Regional" section in Account Settings allows users to manually select their timezone from a comprehensive IANA list including visible UTC offsets (e.g., `Asia/Kolkata (+5:30)`).
- **Timezone-Aware Summaries**: The Dashboard and Transaction summaries now align with the user's local day/month boundaries, ensuring financial data is accurate to the user's local context.
- **Wall-Clock Time Capture**: Transaction and Schedule modals have been updated to use local "wall-clock" time for entry and editing, preventing "shifting" of dates due to UTC conversions.

### 🐞 Bugfixes & UX Polishing

- **Skeletal Loading Consistency**: Refined the Dashboard and Transaction list loading states to prevent layout shifts during data hydration.
- **Mobile Navigation Layout**: Resolved a horizontal overflow issue in the Account Settings sidebar, ensuring a seamless experience on mobile devices.
- **Form Persistence**: Fixed a bug where partial relational data (Categories/Items) would occasionally fail to hydrate in the Schedule Edit modal.

## [May 07, 2026] Identity Management & Security Hardening

### 👤 Username Customization

- **Atomic Username Updates**: Users can now update their unique username directly from the Account Settings page. The process is atomic and handles session re-issuance automatically to prevent immediate logouts.
- **Real-time Availability Check**: Implemented a debounced availability tracker that provides instant visual feedback (Available/Taken) as you type, along with character validation.
- **Strict Character Policy**: To ensure system consistency, usernames are now restricted to **lowercase alphanumeric characters, dots (`.`), and underscores (`_`)**.
- **Case Normalization**: All existing usernames have been migrated to lowercase. The login and registration flows now automatically normalize inputs to ensure a seamless experience regardless of typed casing.

## [May 03, 2026] Advanced Schedule Management & Financial Visibility

### 🔄 Schedule Workflows

- **Stable Progression**: The system now preserves the `Next Run Date` during edits unless the Start Date is explicitly changed, ensuring recurring patterns are not disrupted by cosmetic updates.
- **Hard Delete vs. Pause**: Introduced a clear distinction between **Pausing** (temporarily disabling automated runs) and **Deleting** (permanent removal). Dedicated "Pause/Resume" controls are now available in both list and detail views.

### 💳 Proactive Credit Card Tracking

- **Dashboard Bill Alerts**: Introduced a "Pending & Overdue" tracker on the main dashboard. The system now highlights upcoming and missed credit card payments, providing a clear view of debt obligations alongside liquid assets.

### 🎨 UI/UX & Filtering Refinements

- **Advanced Filter Overhaul**: Redesigned the transaction filtering interface for web users, moving away from cramped layouts to a more spacious and intuitive grid system.
- **Context-Aware Forms**: Category selectors in Income and Expense pages are now context-aware, automatically filtering the list to show only relevant categories for the active transaction type.

### 🛠️ Backend Hardening

- **Timestamp Protection**: Secured audit fields (`createdAt`/`updatedAt`) by enforcing server-side management and making them read-only for client requests.
- **Sorted Data Delivery**: Standardized the default sorting for schedules to prioritize those running soonest, improving the relevance of the "Schedules" overview.

### Bugfixes

- **Partial Updates & Persistence**: Fix issue where updating schdules required updating startdate. Fixed the logic to update only the fields that are being updated.

- **Relational Integrity**: Resolved JSON deserialization issue for Category, Item, and Credit Card mappings.

---

## [May 1, 2026] Visual Analytics & Precision Credit Management

A significant enhancement to the financial visualization and credit card management module, focusing on data clarity, robust cycle logic, and dashboard efficiency.

### 📊 Rich Financial Visualization

- **Category-Wise Spending Charts**: Every credit card statement now features a dedicated bar chart visualizing spending patterns by category (e.g., Dining, Shopping, Travel).
- **"Uncategorized" Tracking**: High visibility for uncategorized transactions within charts, encouraging better financial organization.
- **Interactive Tooltips**: Recharts-powered interactive data points provide precise spending values on hover.

### 💳 Advanced Credit Correction Tools

- **Forceful Bill Resync**: Introduced a manual "Resync History" engine that recalculates historical bill amounts from scratch. This tool resolves discrepancies caused by manual transaction edits or billing date changes.
- **Centralized Balance Engine**: Refactored the core transaction-to-balance mapping logic into a single, high-precision service to ensure consistency across the entire ecosystem.

### 📅 Precision Billing Cycles

- **Redefined Boundaries**: Standardized billing cycles so the Billing Date is now the **start** of a new cycle (00:00:00). Transactions on the billing date correctly attribute to the following month's bill.
- **Safe Date Handling**: Integrated `java.time.YearMonth` logic to safely handle months of varying lengths. Billing dates like the 31st now automatically adjust to the last day of shorter months (e.g., Feb 28th), preventing system-wide date exceptions.
- **Year-End Stability**: Resolved edge cases in year-rollover logic for December-to-January transitions.

### 🚀 Dashboard & Budget Optimizations

- **Standardized Time Ranges**: Introduced a global Time Range selector on the dashboard (30, 90, 180, 365 days) for unified financial summaries.
- **Budget Priority View**: The Budget details page now automatically selects the current active month by default, prioritizing it over the Master Template for faster access.
- **Historical Grouping**: Past budgets are now intelligently grouped to reduce clutter while preserving access to historical performance data.

---

## [April 28, 2026] Universal Payment Modes & Credit Card Integrations

### 💳 Unified Payment & Credit Tracking

- **Universal Credit Card Support**: Payment modes and credit card allocations are no longer exclusive to Expenses. You can now map credit instruments across **Income**, **Savings**, and **Revolving** workflows.
- **Automated Bill Adjustments**: Background calculations adjust constraints predictably. Income payments clear outstanding debts efficiently.
- **Cross-Type Safe Updates**: Modification mechanisms recalculate statement allocations smoothly.

### Exclude Transactions from Budget Calculation

- Have a transaction you made but it shouldn't be included in the Budget utilization? You can do it now.
- Check the option "Exclude from budget utilization" and it is not accounted in budget.

---

## [April 27, 2026] Comprehensive Credit Card Management

A major specialized update introducing advanced credit card tracking, automated billing cycle management, and a premium card-based dashboard.

### 💳 Intelligent Credit Card Tracking

Manage your credit cards with a dedicated interface that moves beyond simple expense tracking to full lifecycle management.

- **Automated Billing Cycles**: The system now automatically organizes transactions into monthly statements based on your card's billing date.
- **Smart Status Engine**: High-visibility status banners (Overdue, Pending, Fully Settled) are now calculated on the backend, ensuring your dashboard always reflects your true financial obligations.
- **Real-Time Utilization**: Visual tracking of credit limit usage with customizable warning thresholds that trigger system-wide alerts when you approach your limit.
- **Statement History**: A deep-dive view for every card, providing full access to historical statements and transaction breakdowns per billing cycle.

### 🎨 Premium Card UI Redesign

- **Action-First Dashboard**: Redesigned the card grid to prioritize actionable information. Overdue bills now feature pulsing animations and bold warnings that are impossible to miss.
- **Interactive "Maximize" Flow**: A new navigation model that separates primary "View Details" actions from secondary management tasks, reducing accidental clicks and improving flow.
- **Contextual Visuals**: Dynamic themes and hover-triggered management bars keep the interface clean while preserving power-user functionality.

### ⏰ Full Ecosystem Integration

- **Scheduled CC Expenses**: Credit cards are now fully supported in the scheduling engine, allowing you to automate recurring expenses directly to your cards.
- **Unified Data Model**: Standardized the `credit_card` object across Expenses, Scheduled Transactions, and Bills for seamless data integrity.

---

## [April 25, 2026] Scheduling, Account Management & System Reliability

A major update introducing automated transaction scheduling, user personalization, and improved system-wide transparency.

### ⏰ Automated Scheduled Transactions

Take the manual work out of your recurring finances with our new scheduling engine.

- **Recurring Templates**: Create templates for Expenses, Income, or Savings that automatically generate transactions on a Daily, Monthly, or Yearly basis.
- **Smart Execution Engine**: Automated background processing runs twice daily (2 AM & 2 PM) to handle due transactions.
- **Manual "Run Now"**: Trigger a scheduled transaction immediately without affecting the long-term automation timeline.
- **Historical Tracking**: Every schedule maintains a complete execution history, linked directly to the generated transactions.

### 👤 User Account Management

Take full control of your Gringotts profile with a dedicated management suite.

- **Profile Personalization**: Set your display name and upload a profile picture to customize your dashboard experience.
- **Secure Password Resets**: Enhanced security flow for resetting account passwords directly from the profile settings.
- **Account Deletion**: Implemented a secure account wipe feature that cascades and permanently deletes all associated financial data (transactions, categories, budgets, and goals) when an account is no longer needed.

### Enhanced API Error messages

- **Human-Readable Error Messages**: Refactored the global exception handling layer to provide clear, actionable error messages in API responses, moving away from cryptic stack traces to user-friendly feedback.
- **Improved Field Validation**: Backend validation now returns specific field-level errors for more precise feedback during data entry.

---

## [April 23, 2026] Investment Planner & Hierarchical Auto-Crediting

A comprehensive upgrade to the long-term financial planning capabilities of Gringotts, featuring a sophisticated investment goal tracking system with automated progress updates and complex growth modeling.

### 📈 Investment Planner

Visualize and track your journey toward financial freedom with our most advanced module yet.

- **Sophisticated Goal Tracking**: Set specific milestones like Emergency Funds, Home Purchases, or Retirement with custom icons and colors.
- **Compound Growth Projections**: Integrated a high-precision financial calculator (FV of Annuity) to estimate goal achievement dates based on your monthly contributions and expected annual return rate.
- **Achievement Dashboard**: A high-level summary of your total targets, overall progress, and specific goal completion metrics.

### 🏷️ Hierarchical CSI Auto-Crediting

Financial automation has been expanded to the entire Category Hierarchy.

- **Multi-Level Tagging**: You can now tag goals with an entire **Category**, a **Subcategory**, or a specific **Item** (CSI).
- **Smart Progress Tracking**: Any saving transaction that matches your goal's tags is automatically credited to that goal's balance, ensuring your progress is always up-to-date without manual entry.
- **Conflict-Free Synchronization**: Refactored the internal tagging architecture to handle bulk updates and prevent duplicate matching, ensuring data integrity across multi-level hierarchies.

### 🎨 Refined Goal UX

- **Arc Progress Visualization**: Each goal features a custom-colored arc progress bar for instant visual feedback.
- **Consolidated Goal Management**: Created a unified "Single Source of Truth" payload system for goal creation and updates, reducing API overhead and improving reliability.
- **Market Growth Tracking**: Added clear disclaimers to ensure users are aware that market gains must be manually updated to reflect actual portfolio performance.

---

## [April 22, 2026] Stability & Precision Sorting

Refining the transaction experience with improved data consistency and flexible sorting options.

### 📶 Advanced Sorting

- **Date-Based Ordering**: You can now sort your transaction list by date (ascending/descending) across all views.
- **Persistent State**: The system remembers your preferred sort order while navigating between different transaction types.

### 💳 Standardized Payment Modes

- **Fixed Mode Selection**: Transitioned from free-form text to a curated, fixed set of payment modes (UPI, Credit Card, Debit Card, Net Banking, Cash).
- **Data Integrity**: Enforced backend validation ensures all transactions adhere to these standard modes, providing cleaner analytics and reporting.

### 🔍 Filter Persistence & Reliability

- **State Preservation**: Fixed a issue where active filters were lost when performing updates or deletions in the list view.
- **Criteria Mapping**: Standardized subcategory filtering logic to use consistent JSON property names, resolving mapping errors in advanced search.

---

## [April 18, 2026] Unified Transaction Views & Improved User Registration

A major architectural consolidation that brings all transaction types into a single, high-performance hub while drastically improving UI efficiency. Improvements made to the registration and login experience, focusing on security and a seamless first-run experience.

### 📑 One Hub, All Transactions

We've unified what were previously separate pages (Expenses, Incomes, Savings, and Revolvings) into a single **Transactions** view.

- **Contextual View Switching**: A new tab system allows you to switch between transaction types instantly. The system dynamically adapts filters, table columns, and bulk operations based on your active tab.

### 🖱️ Bulk Selection Improvement

- **Hover-Triggered Checks**: Desktop checkboxes now appear only when you hover over a row, removing unnecessary visual noise and preserving a clean look.
- **Mobile Selection Mode**: Introduced a dedicated "Selection Mode" toggle in the header for mobile users. Once active, the entire card becomes a touch-target for selection, preventing accidental navigation.
- **Zero-Gap Layout**: When not in selection mode, the checkbox column completely collapses to reclaim every pixel of screen real estate.

### 🧭 Collapsible Side Navigation

- **Pinned vs. Unpinned**: The sidebar can now be collapsed to a minimal icon-only bar, perfect for power users who want a distraction-free data view.

### ⚙️ Precision Control

- **Dynamic Column Chooser**: Real-time control over visible fields ensures you only see the data points that matter for your current task.
- **Unified Actions**: Bulk actions and filters are now consistently styled and accessible across all transaction types.

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
