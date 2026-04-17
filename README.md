# 🏦 Gringotts

**Gringotts** is a simple personal finance management system designed for cool users. It offers a set of tools to track, categorize, and analyze your financial life with peace and ease.

---

## ✨ Key Features (Web Client)

### 📊 Unified Financial Dashboard

Get a high-level view of your financial health. The dashboard provides real-time visualizations of your income, expenses, and savings, helping you identify trends and optimize your cash flow.

### 💸 Transaction Management

Manage your finances across multiple categories with specialized views:

- **Expenses**: Detailed tracking of outbound cash flow with payment mode support (UPI, Credit Cards, etc.).
- **Incomes**: Monitor various revenue streams (Salary, Cashback, etc.).
- **Savings**: Track your wealth accumulation and growth over time.
- **Revolvings**: Manage money lended and borrowed and keep track how much you owe and how much you need to settle.

## Features

### Transactions

- **Bulk Operations**: Edit or delete multiple transactions simultaneously to keep your records up-to-date efficiently.
- **Custom Views**: Dynamic column selection allows you to tailor the interface to your specific data needs.

- 📑 Automated Statement Parsing
Stop manual entry. Gringotts supports importing statements from major financial institutions:
  - **HDFC Bank** (Savings & Credit Cards)
  - **Amazon Pay ICICI Credit Card**
  - *More parsers being added regularly.*

### 🎯 Smart Budgeting & Planning

Take control of your future with our advanced budgeting engine:

- **Master Templates**: Define your ideal monthly spending structure.
- **Monthly Budgets**: Generate actual budgets from templates and track real-time performance.
- **Category Allocations**: Assign specific limits to granular categories and monitor variances.
- **Estimated Savings**: Automatically calculate projected savings based on your budget vs. actuals.

### 🏷️ Hierarchical Classification System (CSI)

Organize your data exactly how you want it. Our three-tier system (**Category > SubCategory > Item**) ensures that every transaction is mapped to its most granular level for deep insights.

- **Visual Classification**: Categories now support custom **Icons** and **Colors**, enabling instant visual identification of spending patterns across the dashboard and transaction views.

### 🛡️ Enterprise-Grade Security

Your financial data is sensitive. We protect it with:

- **JWT-Based Authentication**: Secure, stateless user sessions.
- **Multi-Factor Authentication (MFA)**: Built-in TOTP support for an extra layer of protection.
- **Trusted Browser Sessions**: Options to trust your frequent devices for 90 days, balancing security and convenience.
- **Multi-Tenancy**: Complete data isolation between users.

---

## 🚀 Getting Started

The Gringotts Web Client is the primary interface for managing your finances.

1. **Access**: Navigate to the hosted web client URL.
2. **Registration**: Create a secure account (subject to admin configuration).
3. **Setup CSI**: Configure your Categories and SubCategories in the Configuration tab.
4. **Import/Add**: Start by uploading your bank statements or manually adding your first transaction.

---

## 🏗️ Technology Stack

- **Backend**: Spring Boot 3 (Java 17), PostgreSQL, Spring Security.
- **Frontend**: React, Vite, TypeScript, Tailwind CSS (or Vanilla CSS).
- **Security**: JWT-encoded HttpOnly Cookies, TOTP MFA.
- **Infrastructure**: Designed for modern cloud deployments (Firebase/Vercel/Self-hosted).

---

## 📱 Project Status

- **Web Client**: ✅ **Stable & Active** - Fully featured and ready for daily use.
- **Android Client**: 🏗️ **Under Development** - Mobile companion app coming soon to provide on-the-go tracking and notifications.

---
