# 🚀 Release Notes

## [August 21, 2026] Usability & AI Enhancements: Movable Goblin AI Vault Keeper

This release introduces a **Movable & Draggable Goblin AI Pill**, ensuring the floating AI assistant trigger never obscures critical action buttons, table controls, pagination, or forms across the application.

---

## [August 19, 2026] Loan-Funded Transactions, Dual-Perspective Reporting (Consumption vs. Cash Flow) & Principal Spending

This release introduces comprehensive support for **Transactions Funded by Loan** and a new **Dual-Perspective Financial Reporting** architecture across Gringotts. Similar to funding from savings goals, users can now track disbursements and expenditures funded directly out of loan principals (such as Home Loans, Education Loans, or Auto Loans), automatically exclude funded spending from monthly budget utilization, track principal spending inside the Loan Detail Vault, and switch effortlessly between **Consumption** and **Cash Flow** analytics without double-counting liabilities.

### 🔀 Dual-Perspective Reporting: Consumption vs. Cash Flow
- **Eliminate Financial Double-Counting**: Cleanly separates **Consumption (Incurred Spending)** from **Cash Flow (Out-of-Pocket Bank Outflows)** to resolve double-counting between loan-funded purchases & EMIs, as well as credit card swipes & bill payments.
- **Interactive Dashboard Perspective Switcher**: Added a dual-mode toggle (`📊 Consumption` vs `💵 Cash Flow`) in the Financial Activity dashboard section.
- **Consumption Mode (Accrual / Incurred)**: Focuses on lifestyle consumption by aggregating direct cash payments and credit card swipes for 100% accurate category breakdown while excluding capital loan borrowings and debt settlements.
- **Cash Flow Mode (Liquidity / Bank Outflows)**: Focuses on actual bank liquidity by tracking true money leaving bank accounts (direct expenses + loan EMIs) while deferring unsettled credit card swipes.
- **Dynamic StatCard Context & Insight Badges**: Total Expenses card adapts dynamically with contextual tooltips and informative pill badges for `🏛️ Financed: ₹X`, `💳 Card Swipes: ₹Y`, `🏛️ EMIs Paid: ₹Z`, and `💵 Direct Cash: ₹W`.
- **Session Persistence**: User's chosen reporting mode is saved automatically across sessions via `personalizationSync`.

### 🏛️ Loan-Funded Transactions & Scheduled Payments
- **Fund Expenses & Savings from Loan**: Tag any Expense or Saving transaction with an active loan to record disbursements and purchases made against loan capital.
- **Goal vs. Loan Mutual Exclusivity**: Strict business rules ensure transactions can be funded by either a Goal or a Loan, but never both. Selecting one funding source automatically clears and disables the other.
- **Available Principal & Overdraft Protection**: Real-time balance checks ensure spending cannot exceed available loan principal amount (`Principal − Total Funded`), complete with visual zero-balance warnings and submit-time validation.
- **Automated Recurring Schedules**: Create recurring scheduled expenses/savings pre-linked to funding loans with auto-tagging upon execution.

### 🛡️ Automatic Budget Exclusion
- **Smart Budget Protection**: Loan-funded expenditures are automatically excluded from budget utilization by default (`include_in_budget = false`), ensuring major capital expenditures funded via borrowings do not distort regular monthly spending budgets.
- **Locked Indicator Feedback**: The "Exclude from budget utilization" checkbox visually locks with a contextual badge (*"(Locked by loan funding)"*) whenever a funding loan is selected.

### 📊 Loan Detail Vault: Principal Utilization & Funded Transactions
- **Principal Spending Metrics**: Overview tab now displays a dedicated **Loan Principal Spending** card with **Total Funded**, **Available to Spend**, and **Utilization Percentage**.
- **Dedicated "Funded Spending" Tab**: View a paginated ledger of all transactions funded by a specific loan, detailing transaction dates, amounts, categories, and quick types.
- **Mobile-Responsive Table Optimization**: Amortization schedule and transaction tables streamlined to eliminate empty space and format cleanly on mobile screens.

### ⚡ Ledger Enhancements & Bulk Actions
- **Visual Ledger Badges**: Transactions funded by loans feature prominent 🏛️ badges in both table and mobile card views.
- **Bulk Funding Operations**: Select multiple transactions in the ledger and update their funding loan or clear loan funding in a single bulk operation.
- **Transaction Details Navigation**: Direct navigation link from transaction details view straight to the associated Loan vault.

---

## [August 10, 2026] Investment Planner: Market Value Tracking, Portfolio Returns & Dual-Progress Visualization

This release enhances the **Investment Planner** with portfolio tracking capabilities. Users can now track both their principal **Invested Amount** and live **Current Market Value**, visualize investment gains/losses with a dual-segment progress indicator, and perform quick market value updates.

### 📈 Two-Column Portfolio & Returns Tracking
- **Invested vs. Current Value Split**: Disambiguates contributed principal (*Invested Amount*) from today's market value (*Current Market Value*), allowing users to track market-linked instruments like Mutual Funds, Stocks, and Fixed Deposits accurately.
- **Computed Returns & Percentage Badges**: Real-time computation of net gain or loss (`Current Value − Invested Amount`) with color-coded directional badges (`+₹60K / +13.3%` in green, or losses in red).
- **Option C Auto-Credit Delta Propagation**: Tagged savings transactions auto-increment the Invested Amount and automatically propagate the contribution delta to Current Market Value when set.

### 🎨 Dual-Segment Progress Indicator & Visual Redesign
- **Dual-Segment Progress Bar**: Replaces static progress bars with a layered progress track—muted band representing invested principal progress and a bright band extending to current market value, including green gain extensions or red loss overlays.
- **Quick "Update Market Value" Action**: Lightweight single-number modal accessible via a dedicated pencil button on goal cards and detail views for rapid NAV/portfolio updates without opening full edit flows.
- **4-Column Goal Detail Metrics**: Enhanced detail dialog presenting Target, Invested, Current Value, and Returns side-by-side with timestamped update history (*"Updated 3d ago"*).
- **Portfolio-Level Summary Stats**: Page-level metrics bar expanded with **Total Invested**, **Portfolio Value**, and total portfolio return highlights.

---

## [July 26, 2026] Goblin AI Vault Keeper, Full Natural Language CRUD & AI Security Hardening

This release introduces **Goblin AI**, a sharp-witted Gringotts Bank Teller assistant for natural language financial management. Users can log transactions, search ledger records with criteria, update entry values/descriptions, or delete transactions in character—all with interactive confirmation cards and strict security protections.

### 🧙 Goblin AI Assistant & Conversational Ledger Management
- **Full CRUD Natural Language Support**: Expressive financial parsing for creating transactions (*"Spent 350 on Coffee via UPI"*), reading/searching (*"Show my Groceries expenses"*, *"List all my Dividends"*), updating (*"Update last Uber ride to 420"*), and deleting (*"Delete transaction #42"*).
- **Dedicated AI Chat & Floating Assistant Drawer**: Access Goblin AI via the full-page `/ai-chat` view or the bottom-right floating AI drawer from anywhere in the application.
- **Interactive Action Cards**: Interactive UI cards for transaction previews, confirmation steps, and search query results with direct action triggers.
- **Standalone SubCategory & Item Resolution**: Deep catalogue lookup enabling Goblin to resolve queries referencing only a subcategory (*"Dividend"*) or item (*"Milk"*) without needing the parent category explicitly specified.
- **Humorous Vault Teller Personality**: Out-of-scope fallback messaging and animated typing effect on load and ledger clear for an engaging, immersive experience.

### 🔒 AI Security Hardening & Rate Limiting
- **Per-User Rate Limiter**: Enforces strict sliding-window rate limits of **2 requests per minute**, **20 requests per hour**, and **50 requests per day** per user, returning HTTP 429 status with Goblin's vault limit warning.
- **Prompt Injection & Input Sanitization**: Comprehensive input escaping and sanitization for control characters and special prompt injection sequences in user prompts and chat history.
- **Strict Chat History Window**: Restricts sent chat history to the **last 5 messages**, preventing payload inflation and context-stuffing exploits.
- **Data Privacy Protection**: Full omission of user transaction history snapshots from external LLM prompts; LLM yields structured search filters that are safely evaluated locally against database records.
- **Search Field Whitelisting**: Strict JPA field name whitelisting (`category.name`, `subCategory.name`, `item.name`, `description`, `value`, `transactionTime`, `paymentMode`) preventing arbitrary database field access.

---

## [July 25, 2026] Group Member Analytics & Spending Breakdown, Group Budgets & Flexible Group Categorization

This release introduces **Member-Wise Spending Analytics & Category Breakdown Charts** for shared groups, providing deep visibility into individual group member contributions, spending shares, and category distributions. It also introduces **Group Budgets** (Overall Spend vs. Recurring Monthly Reset) with category-level budget allocations, along with **Flexible Group Categorization** for Personal Groups and member privacy enforcement for Shared Groups.

### 📊 Member Spending Analytics & Share
- **Member Spending Distribution**: Interactive donut charts and color-coded member legend badges displaying each member's total expense share and percentage contribution.
- **Member Category Breakdown**: Per-member horizontal bar charts (`layout="vertical"`) mapping category spending distributions for each group member with custom category color palettes.
- **Member Transaction Filtering**: Instant member filter dropdown on the Transactions tab (`All Members`, `@username`), allowing quick filtering of group transactions by member.

### 💰 Group Budgets (Overall Spend & Monthly Reset)
- **Flexible Budget Types**: Create one-time budgets for trips/events (`OVERALL` total spend cap) or recurring budgets for household/family groups (`RECURRING_MONTHLY` reset spend budget).
- **Category-Level Budget Allocations**: Allocate custom budget amounts across group categories with real-time percentage progress bars, budget health badges, and spend utilization tracking.
- **Monthly Filter Dropdown**: Easily review historical monthly spend utilization for recurring monthly group budgets using integrated Month and Year selectors.
- **Budget Management Modal**: Interactive modal dialog for creating, editing, and deleting group budgets and category allocations.

### 🏷️ Flexible Group Categorization & CSI Breakdown Restoration
- **Optional Group Categorization for Personal Groups**: Personal groups can toggle between custom Group-Specific Categories or standard personal CSI (Category, SubCategory, Item) categories.
- **CSI Category Breakdown Restoration**: When group-specific categories are disabled for personal groups, group analytics dynamically restores the full Category, Subcategory, and Item breakdown charts.
- **Smart UI & Modal Adaptations**:
  - Hides the `CATEGORIES` subtab and `Group Category` transaction field when group-specific categories are disabled.
  - Automatically enforces Group-Specific Categories for all Shared Groups to safeguard member privacy and prevent personal CSI category exposure.
  - Enables full category management (Add, Edit, Delete Group Categories) for personal group owners under the Categories subtab.

## [July 18, 2026] Transaction Group Sharing & Collaboration

This release introduces **Group Sharing and Collaboration**, allowing users to co-manage shared groups (like shared trip expenses, shared apartment accounts, etc.), invite members by recovery email or username, and co-log transactions, all while strictly preserving privacy, security, and access control.

### 👥 Shared Groups & Real-time Collaboration
- **Collaboration Groups**: Mark groups as shared to collaborate with other users on shared events, budgets, or projects.
- **Member Management**: Invite other users using their username or verified recovery email. Group owners (`ADMIN`) can manage invitations and remove members, while invitees can accept, decline, or leave groups.
- **Unified Transaction Feed**: Co-log transactions to the shared group, displaying who logged each transaction with profile avatar badges.

### 🛡️ Multi-User Security & Isolation
- **Strict Access Control**: Transactions added in group can be viewed only joined group members. Only the owner of a transaction can edit it or remove it from the group.
- **Unique Recovery Emails**: Made recovery email fields unique across all accounts to ensure accurate and secure member identification during invites.
- **Secure API Filters**: Implemented secure custom repository and service queries to validate group membership status prior to fetching statistics or lists, preventing cross-tenant access.

### 🎨 Visual & UX Refinements
- **Distinct Shared Card Design**: Shared groups are highlighted with a neon-cyan border strip, glow shadow, and an inline `Shared` badge.
- **Responsive Group Detail View**: Side-by-side member controls and transaction tables with automatic stack-wrap formatting on mobile viewports.
- **Privacy Mode**: Automatically hides Category-Subcategory-Item (CSI) analytics and disables transaction click-to-view navigations for transactions logged by other users.

## [June 27, 2026] Quick Filters and Searchable Lookups
### Context-Sensitive Quick Filters & Custom Filter Presets
- **Quick Filter Bar**: Added a horizontally scrollable strip of filter pills right above the transactions table (All, Expense, Income, Saving, Revolving).
- **Context-Sensitive System Presets**: Automatically displays relevant filters (e.g. *This Month*, *This Year*, *Last 30 Days*, Savings direction: *In/Out*, Revolving status/direction: *Active/Settled*, *Given/Received*).
- **Custom Preset Creation**: Users can save any advanced filter criteria combination as a custom quick filter preset with a personalized name.
- **Sync & Cloud Persistence**: Saved presets sync instantly to the backend's user preferences database, persisting settings across different devices.
- **Management Center**: Added a "Quick Filters" sub-tab in *Settings → Vault Configuration* to rename or delete saved custom filter combinations per tab view.

### Searchable Lookup Filters & Subcategory Scroll Fix
- **Searchable Select**: Category, Sub-Category, Item, and Credit Card lookup dropdowns in the Advanced Filters are now fully searchable.
- **Debounced Backend Queries**: Typing in the search input triggers live, debounced database queries on the backend for categories, subcategories, and items.
- **Infinite Scroll Nesting Fix**: Bound the infinite scroll observer to the dropdown's viewport container, resolving parent overflow clipping bugs that truncated list loading.

## [June 26, 2026] Credit Cards UI Revamp
Redesigned Credit cards view with card mockup and responsive layout for mobile and desktop views

## [June 12, 2026] Transaction Groups, Allowed Type Constraints & Custom Cover Images

This release introduces **Transaction Groups** to logically organize transactions for projects, trips, or events, along with allowed transaction type metadata validations, custom cover image uploads, and seamless transaction creation directly from group views.

### 🏢 Custom Transaction Groups
- **Customized Groups**: Users can create, update, and manage transaction groups tailored for trips, events, or projects.
- **Color Accents & Symbols**: Premium customization options support choosing HSL color accents and dedicated Lucide icons.
- **Collapsible Archived Section**: Finished or settled groups can be archived and are housed in a dedicated collapsible dashboard section at the bottom, keeping active workspaces clutter-free.

### 🛡️ Allowed Transaction Type Restrictions
- **Type Restrictions (Group Meta)**: Configure allowed transaction types (Expenses, Incomes, Savings, and/or Revolving Transactions) for each group using checkboxes.
- **Compatibility Checks**:
  - Enforces type compatibility checks during transaction creation, single updates, and bulk editing.
  - Rejects transactions whose types are not permitted by their selected group.
- **Dynamic Stats & Chart Scaling**: The Group Details statistics cards and category breakdown charts automatically scale and hide panels for disallowed transaction types.

### 🖼️ Group Cover & Thumbnail Images
- **Base64 Database Storage**: Upload custom thumbnail cover images (up to 2MB) that are converted and stored as Base64 text.
- **Visual Dashboards**: Cards in the main group list display the cover image with a sleek hover zoom animation.
- **Premium Details Banner**: The Group Details view renders a beautiful full-width cover banner above the page title.

### 📥 Add Transactions directly from Group Details
- **Contextual Add Actions**: Instantly add new transactions via buttons in the page header, list header, or empty states.
- **Automatic Group Locking**: Opened transaction modals auto-select the current group and disable the field.
- **Dynamic Tab Filtering**: The transaction type selector tab bar is dynamically filtered to show only allowed types, and is completely hidden if only one type is permitted.
- **Instant List Refresh**: Saving a new transaction immediately updates the group statistics and transaction lists without page reload.

## [June 08, 2026] Quick Add Transaction in Calendar View, Full Page Setup, Dedicated Upcoming Budgets Section

This release adds a **Quick Add** shortcut directly in the Transactions Calendar date cells, consolidates the sidebar setup panel and account preferences into a **Dedicated Setup & Settings Page**, and refines the budget dashboard by separating future budget templates into an **Upcoming Budgets** section.

### 📅 Quick Add Transaction in Calendar View
- **Hover Action Button**: A hover-triggered "+" button has been added to every date cell in the Transactions Calendar grid.
- **Pre-filled Modals**: Clicking the "+" button opens the transaction modal automatically pre-filled with the selected date, facilitating fast and seamless transaction entry.

### ⚙️ Consolidated Settings & Vault Setup Page
- **Unified Settings Hub**: Merged the slide-out `SetupPanel` and `Account` components into a single consolidated `/settings` page.
- **Categorized Left Navigation**: Organized account configurations under *Account Settings* (Profile, Regional, Security, Active Sessions) and *Vault Configuration* (Appearance, Categories, Import, Export).
- **Header Dropdown**: Restored the top-right profile photo dropdown with a clean **Sign Out** button. Other configuration panels are accessed via the Settings Gear (Setup) button next to it.
- **Secure Warning Banner Redirect**: Corrected the recovery email warning banner navigation to point to the Profile settings tab rather than the Security tab.
- **Automatic Field Focusing & Highlight**: Navigating from the warning banner automatically focuses the Recovery Email input field and triggers a temporary visual amber glow/scale highlight that transitions out after 3 seconds.

### 📊 Excluded Future Budgets & Upcoming Section
- **Historical Timeline Boundary**: The Historical Utilization Timeline now displays only past and current months, ending exactly at the current month.
- **Upcoming Budgets Panel**: Added a new card list at the bottom of the Budget dashboard displaying all pre-configured budgets for future periods.
- **Allocated Metrics & Category Splits**: Lists the total cap limit, planned savings targets, and category allocation splits for each upcoming budget, with integrated Edit and Delete actions.

## [June 07, 2026] Budget Redesign, Weekly Scheduled Transactions & Transactions Calendar View

This release introduces the interactive **Transactions Calendar View** (with monthly/weekly toggles, compact mobile support, and consolidated summary stats), a complete redesign of the **Budget Management** module for historical performance tracking, lock controls, and automated leak analysis, alongside new **Weekly Scheduled Transactions** support.

### 📊 Historical Budget Timeline & Performance Tracking
- **Interactive Timeline**: A modern horizontal scroll timeline displays the last 6 months (and custom budget slots) with instant status indicators.
- **Dynamic Capacity Gauge**: Custom SVG circular progress ring visualizing overall utilization with smart alert states.
- **Leak Identification Panel**: "What went wrong?" panel highlights categories that exceeded limits and lists uncategorized leakage.
- **Planned Savings Tracker**: Tracks and compares savings progress against monthly budgeted targets.
- **Past Period Locking**: Enforces read-only controls on both client and server to prevent creating, cloning, or modifying budgets in past periods.
- **Intelligent Creation Form**: Year selection is now a select dropdown supporting up to the next 5 years, dynamically filtering months to prevent past selection.

### 📅 Interactive Transactions Calendar View
- **Dual Layout Modes**: Switch seamlessly between a standard monthly calendar grid view and a weekly vertical timeline layout with summarized details.
- **Stacked Compact Indicators**: Mobile grid cells dynamically display stacked, space-optimized numeric tags for all active transaction types (Income, Expense, Saving, Revolving) simultaneously.
- **Consistent Type-Specific Colors**: Unified indicator styling where savings remain violet (`text-violet-500`) and revolving transactions remain blue (`text-blue-500`) regardless of sign, keeping signs intact.
- **Daily Details Modal View**: Click any day in the monthly grid or weekly view to open a detail modal listing each transaction's descriptions, categories, payment methods, and exact values, with direct links to details.
- **Query Filter & Tab Integration**: Integrates directly with current transaction search filters and category tabs to display customized summaries.
- **Consolidated Period Stat Cards**: Period footer dashboard showing aggregated summary statistics tracking total income, total expenses, net savings, and net revolving balances for the active period.

### 📅 Weekly Scheduling Support
- **Weekly Frequency Option**: Select "Weekly" as a recurring interval when creating or editing scheduled transactions.
- **Automatic Run Date Calculation**: The backend service automatically advances the next run date by exactly 1 week upon execution or when activating a schedule.
- **Seamless Frontend Integration**: The frequency option is fully supported in the Scheduled Transaction modal, tables, list views, and details page.

### Performance Improvements
- **Unused App-level Fetch Removal**: Removed redundant parallel API queries (`getExpenses`, `getIncomes`, `getSavings`) from the main application mount, eliminating unnecessary network overhead.
- **Personalization Sync Optimization**: Refactored column selection and search filter sync in the Transactions module. Settings are now persisted to the backend only on explicit user actions (e.g., check/uncheck columns, apply/clear filters) rather than triggering redundant API writes on every tab switch or page load.

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
