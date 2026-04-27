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
* **Goal Tracking**: Whether it’s an emergency fund or a major purchase, users can set specific goals. The system uses hierarchical auto-crediting, so any relevant saving is automatically added to the progress bar. It even does the advanced math to calculate exactly when a goal will be reached based on growth projections.

### 🏷️ Ultimate Organization

For the organization enthusiasts, Gringotts uses a **Three-Tier System** (**Category > SubCategory > Item**). It supports custom icons and colors, so the transaction feed looks vibrant and is easy to scan.

### 🛡️ 2FA Security

Since financial data is sensitive, the app is locked down with:

* **JWT & MFA**: Modern, secure session handling with multi-factor authentication.
* **TOTP Support**: Built-in support for authenticator apps.
* **Trusted Devices**: An option to trust frequent browsers for 90 days to balance security with convenience.

---
