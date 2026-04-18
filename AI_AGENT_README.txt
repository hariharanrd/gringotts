# Gringotts - AI Agent Repository Guide

This document is designed to help AI agents understand the structure and purpose of the `Gringotts` repository.

## Overview

Gringotts is a multi-user, full-stack financial tracking application. It manages accounts, transactions (Income, Expense, Saving, Revolving), categorizations, and budgets with strict data isolation.

The repository is a monorepo:
- **`server/`**: Spring Boot backend (Java 21).
- **`web-client/`**: React frontend (TypeScript + Vite).
- **`android-client/`**: Android native app (Kotlin + Jetpack Compose).

## Multi-User Architecture

The application implements strict multi-tenancy at the database level:
- **Data Isolation**: All core entities (`Transaction`, `Category`, `SubCategory`, `Item`, `Budget`) have a `user_id` foreign key.
- **IAM Service**: Use `IAMService.getCurrentUser()` to retrieve the currently authenticated user from the Spring Security context. 
- **Query Scoping**: All JPA queries must be scoped by the current user. See `TransactionSpecification.forUser()` for how dynamic queries are filtered.
- **Trusted Browsers**: Supports "Trust this browser" functionality, allowing users to bypass MFA for 90 days via secure trust tokens.

## Backend (`server/`)

### Key Technologies
- **Java**: 21
- **Spring Boot**: 4.0.1
- **Security**: JWT via HttpOnly cookies (`gtauth`), Google Authenticator (TOTP), Trusted Browser tokens.
- **Database**: PostgreSQL with `InheritanceType.JOINED` for Transactions.

### Package Structure (`src/main/java/com/luna/Gringotts`)
- **`records/`**: Domain models. `Transaction` is the base for `Expense`, `Income`, `Saving`, and `Revolving`.
- **`services/`**: 
    - `IAMService`: Session and User context.
    - `TransactionService`: Handles CRUD and "Transaction Swapping" (morphing an Expense to Income etc., while retaining the ID).
    - `BudgetService`: Monthly allocations and savings calculations.
- **`parsers/`**: Statements parsing (HDFC, APayCC, etc.) using `StatementParser` abstractions.

## Frontend (`client/`)

### Key Technologies
- **React**: 19 + Vite 6 + TailwindCSS.
- **State Management**: React Hooks + Service pattern.
- **UI Components**: Lucide Icons, Recharts for trends.

### Key Features
- **Dynamic List Views**: Features a **Column Chooser** to toggle visibility of fields.
- **Integrated Bulk Actions**: Field updates (Category, Notes, etc.) are integrated directly into the list headers for efficiency.
- **Transaction Modal**: Supports cross-type updates (changing type mid-edit).

## Workflows & Best Practices

1. **Isolation First**: When adding a new entity, **always** include a `user_id` relationship and ensure any repository query filters by the current user.
2. **Transaction Swapping**: Use the surgical "swap" methods in `TransactionService` if a user changes the type of an existing transaction to preserve its history and ID.
3. **API Consistency**: Maintain the response wrapper format (`data`, `total_count`, `has_more`) used by the client services.
4. **No Build**: Do not run `mvn compile` or `npm build` in this environment; focus on code logic and the user will verify.

## Current Focus
The system is now fully multi-user capable. Current tasks often involve refining budget allocations, adding new statement parsers, or enhancing the dashboard visualizations.