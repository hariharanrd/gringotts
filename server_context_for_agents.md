# Gringotts Server - Context for AI Agents

This document provides a comprehensive overview of the `Gringotts` backend server. It is intended for AI agents to quickly understand the architecture, domain models, and key components of the backend.

## 1. Project Overview

**Gringotts** is a Spring Boot application focused on personal finance tracking. It provides APIs to handle authentication (JWT-based), hierarchical categorization (Category -> SubCategory -> Item), comprehensive transaction management, automated scheduling, credit card tracking, and investment planning.

### Tech Stack

- **Framework**: Spring Boot 4.0.1
- **Language**: Java 21
- **Database**: PostgreSQL
- **Security**: Spring Security + JWT Tokens via HttpOnly Cookies (`gtauth`)
- **Build Tool**: Maven (`pom.xml`, `mvnw`)

## 2. Core Domain Models (Entities)

The entities are mapped to a relational database using Jakarta Persistence (JPA) / Hibernate. All core entities feature strict multi-user isolation via a `User` relationship.

### Transaction Models

The system uses `InheritanceType.JOINED` for transactions, where `Transaction` is the base class for specialized financial records.

- **`Transaction`**: Base entity (`transaction` table).
  - **Fields**: `id`, `value` (Double), `description`, `referenceNo`, `transactionTime`, `createdAt`, `notes`, `imported`, `paymentMode` (String), `creditCard` (ManyToOne), `includeInBudget` (Boolean), `createdBy` (String), `scheduleId` (Long).
  - **Relationships**: Many-to-One with `Category`, `SubCategory`, `Item`, `CreditCard`, and `User`.
- **`Expense`**: Extends `Transaction` (`expense` table).
- **`Income`**: Extends `Transaction` (`income` table).
- **`Saving`**: Extends `Transaction` (`saving` table).
  - **Fields**: `active` (Boolean), `withdrawnAmount` (Double).
- **`Revolving`**: Extends `Transaction` (`revolving` table).

### Categorization System (CSI)

- **`Category`**: Root level category. Fields: `id`, `name`, `description`, `icon`, `color`.
- **`SubCategory`**: Belongs to a Category. Fields: `id`, `name`, `description`, `category` (ManyToOne).
- **`Item`**: Granular item belonging to a SubCategory. Fields: `id`, `name`, `description`, `subCategory` (ManyToOne).

### Credit Cards

- **`CreditCard`**: Tracks credit card limits and bill dates.
  - **Fields**: `id`, `nickname`, `issuer`, `billingDate` (Integer), `dueDate` (Integer), `creditLimit` (Double), `thresholdPercentage` (Integer).
- **`CreditCardBill`**: Tracks monthly generated bills.
  - **Fields**: `id`, `creditCard` (ManyToOne), `billingMonth`, `billingYear`, `amountDue`, `amountPaid`, `paymentStatus` (`UNPAID`/`PAID`).

### Investment Planner

- **`InvestmentGoal`**: Tracks long-term financial goals.
  - **Fields**: `id`, `name`, `icon`, `color`, `targetAmount`, `currentAmount`, `monthlyContribution`, `annualRate`, `notes`, `tags` (OneToMany `InvestmentGoalTag`).
- **`InvestmentGoalTag`**: Links goals to CSI nodes for auto-crediting.
  - **Fields**: `type` (`CATEGORY`, `SUBCATEGORY`, `ITEM`), `id`.

### Automation

- **`ScheduledTransaction`**: Defines templates for recurring transactions.
  - **Fields**: `id`, `name`, `transactionType` (`EXPENSE`, `INCOME`, `SAVING`), `amount`, `description`, `category`, `subCategory`, `item`, `paymentMode`, `creditCard`, `frequency` (`ONE_TIME`, `DAILY`, `MONTHLY`, `YEARLY`), `startDate`, `endDate`, `nextRunDate`, `lastRunDate`, `isActive`.

### User & Security

- **`User`**: Implements `UserDetails`. Maps to `app_user`.
  - **Fields**: `username`, `password`, `totpSecret`, `displayName`, `profilePicture` (Base64).
- **`TrustedBrowser`**: Bypasses MFA for remembered devices.

## 3. Controllers & Endpoints

All endpoints fall under the `/api/v1` base path. Standard responses follow the `{ "data": ..., "total_count": ... }` pattern.

### Authentication & Account (`/api/v1/auth`, `/api/v1/account`)
- `POST /auth/authenticate`: Issues `gtauth` cookie.
- `GET /account/profile`: Fetches user profile.
- `PUT /account/profile`: Updates display name and picture.
- `DELETE /account`: Purges user data.

### Financial Operations (`/api/v1`)
- `/credit-cards`: CRUD + `/bills/{billId}` payment.
- `/scheduled-transactions`: CRUD + `/{id}/history` and `/{id}/execute`.
- `/investment-goals`: CRUD goal tracking.
- `/expenses`, `/incomes`, `/savings`, `/transactions`.

## 4. Key Services

- `TransactionService`: Handles financial transactions & smart auto-crediting hooks.
- `ScheduledTransactionScheduler`: Background cron worker executing tasks.

---
*Generated context derived from origin/main repository state.*
