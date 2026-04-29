# Agent Instructions

## ⚠️ Critical Rules

- **Do not run `mvnw compile` or `mvn compile`** or any other Java build command for this project after making modifications.
- The user will run and test the application themselves.
- When making backend changes, follow the established response map format (`data`, `total_count`, `has_more`, etc.).
- **Strict Multi-User Isolation**: Every new entity must have a `User` field. All repository queries must filter by the current user (using `IAMService.getCurrentUser()`).
- **Feature Planning**: Before building any new feature, create a comprehensive plan and get explicit consent from the user.
- **Database Migrations**: If schema changes are required, always create a corresponding migration file under `supabase/migrations`.
- **Implementation Order**: Always implement the backend logic and APIs first before proceeding to the frontend implementation.

## 🏢 Project Overview

**Gringotts** (referenced as `fintrack-pro` in the client) is a full-stack financial tracking application for managing accounts, transactions (Income, Expense, Saving), and categorizations.

### Architecture

The repository is a monorepo:

- **`server/`**: Java 21 Spring Boot backend.
- **`client/`**: React 19 Frontend + TypeScript + Vite.

### Tech Stack

- **Backend**: Spring Boot 4.0.1, PostgreSQL, JWT (HttpOnly cookies), Google Authenticator (2FA).
- **Frontend**: React 19, Vite 6, Recharts, Lucide Icons, Google Generative AI integration.

## 📁 Repository Structure

### Backend (`server/src/main/java/com/luna/Gringotts`)

- `records/`: JPA Entity models (Transaction, Expense, Income, etc.)
- `controller/`: REST API endpoints under `/api/v1`.
- `services/`: Business logic.
- `parsers/`: Logic for bank statement ingestion (PDF/CSV).
- `repository/`: Spring Data JPA interfaces.

### Frontend (`client/`)

- `components/`: Reusable UI elements.
- `pages/`: Route-specific components.
- `services/`: API client services.
- `types.ts`: Global TypeScript definitions.

## 🔄 Common Workflows

1. **Full-Stack Features**: Usually require changes in `server/records/`, `server/controller/`, `client/types.ts`, and `client/services/`.
2. **Database Migrations**: Entity changes in `records/` affect the database schema directly via JPA.
3. **Security**: Most endpoints require a `gtauth` JWT cookie. Public endpoints are configured in `server/config/SecurityConfig.java`.

## 📚 Detailed Context Documents

- **server_context_for_agents.md**: Deep dive into Backend architecture, models, and endpoints.
