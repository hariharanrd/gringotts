# Feature Design: Transaction Groups (internally TransactionGroup)

Logical grouping of transactions (displayed as "Groups" in the UI) to support use cases like trips, events, projects, and custom categories.

## Architecture Decisions

1. **Internal & Database Naming**: Use `TransactionGroup` as the Java entity name and `transaction_group` as the database table name to avoid conflicts with SQL/PostgreSQL reserved word `GROUP`.
2. **Metadata & Customization**: Groups will support a type classification (`TRIP`, `EVENT`, `PROJECT`, `PERSONAL`, `CUSTOM`), an icon, and a color to provide a premium visual experience.
3. **1-to-N Relationship**: A nullable `group_id` foreign key on the `transaction` table. Deleting a group will simply unassociate the transactions (`ON DELETE SET NULL`).
4. **Security & Row Level Security (RLS)**: Row Level Security will be enabled on the `transaction_group` table to protect it from unauthorized external access.

---

## Proposed Database Schema

### `transaction_group` Table
```sql
CREATE TABLE public.transaction_group (
    id bigint NOT NULL,
    name varchar(255) NOT NULL,
    description text,
    type varchar(50) NOT NULL DEFAULT 'CUSTOM', -- TRIP, EVENT, PROJECT, PERSONAL, CUSTOM
    icon varchar(50), -- Lucide icon key
    color varchar(50), -- HSL or hex color
    status varchar(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
    user_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transaction_group_pkey PRIMARY KEY (id),
    CONSTRAINT transaction_group_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.transaction_group ENABLE ROW LEVEL SECURITY;
```

### `transaction` Table (Alterations)
```sql
ALTER TABLE public.transaction ADD COLUMN group_id bigint;

ALTER TABLE public.transaction ADD CONSTRAINT fk_transaction_group
    FOREIGN KEY (group_id) REFERENCES public.transaction_group(id) ON DELETE SET NULL;

CREATE INDEX idx_transaction_group_id ON public.transaction(group_id);
```

---

## Proposed Changes

### 1. Database Migration
#### [NEW] [20260611000000_create_transaction_groups.sql](file:///Users/hariharand/Projects/gringotts/supabase/migrations/20260611000000_create_transaction_groups.sql)
SQL migration file containing:
- Table creation for `public.transaction_group`
- Sequence creation `public.transaction_group_seq`
- Altering the `public.transaction` table to add the `group_id` foreign key column and its index
- Enabling Row Level Security (RLS) on the `transaction_group` table:
  `ALTER TABLE public.transaction_group ENABLE ROW LEVEL SECURITY;`

### 2. Backend (Spring Boot)

#### [NEW] [TransactionGroup.java](file:///Users/hariharand/Projects/gringotts/server/src/main/java/com/luna/Gringotts/records/TransactionGroup.java)
- JPA Entity representing the `transaction_group` table.
- Fields: `id`, `name`, `description`, `type`, `icon`, `color`, `status`, `user`, `createdAt`.

#### [MODIFY] [Transaction.java](file:///Users/hariharand/Projects/gringotts/server/src/main/java/com/luna/Gringotts/records/Transaction.java)
- Add relation:
  ```java
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "group_id")
  @JsonProperty("group")
  TransactionGroup group;
  ```
- Expose getter/setter for `group`.

#### [NEW] [TransactionGroupRepository.java](file:///Users/hariharand/Projects/gringotts/server/src/main/java/com/luna/Gringotts/repository/TransactionGroupRepository.java)
- JPA Repository interface:
  ```java
  List<TransactionGroup> findAllByUserOrderByCreatedAtDesc(User user);
  ```

#### [NEW] [TransactionGroupService.java](file:///Users/hariharand/Projects/gringotts/services/TransactionGroupService.java)
- Business logic for groups.
- Multi-user scoped validations via `IAMService.getCurrentUser()`.
- Logic for retrieving total group spending, category utilization within groups, and transaction mapping.

#### [NEW] [TransactionGroupController.java](file:///Users/hariharand/Projects/gringotts/controller/TransactionGroupController.java)
- CRUD REST APIs under `/api/v1/transaction-groups`.
- Wrapper logic to return data formatted as `{ data: ..., total_count: ... }`.

### 3. Frontend (React)

#### [MODIFY] [types.ts](file:///Users/hariharand/Projects/gringotts/client/types.ts)
- Add `TransactionGroup` interface:
  ```typescript
  export interface TransactionGroup {
    id: number;
    name: string;
    description?: string;
    type: 'TRIP' | 'EVENT' | 'PROJECT' | 'PERSONAL' | 'CUSTOM';
    icon?: string;
    color?: string;
    status: 'ACTIVE' | 'CLOSED';
    created_at: string;
  }
  ```
- Update `Transaction` interface to include optional `group?: TransactionGroup`.

#### [MODIFY] [api.ts](file:///Users/hariharand/Projects/gringotts/client/services/api.ts)
- Expose the REST APIs:
  - `getTransactionGroups()`
  - `createTransactionGroup(data)`
  - `updateTransactionGroup(id, data)`
  - `deleteTransactionGroup(id)`
  - `getTransactionGroupTransactions(groupId)`

#### [NEW] UI Component & View Integration (To be built next)
- **Groups Page**: List cards for all groups with custom color indicators and icons.
- **Group Detail View**: Displays group information, overall stats, and categorized lists of linked transactions.
- **Add to Group Flow**: Integrates group selection into the transaction modal and supports adding existing transactions to the group.

---

## Verification Plan

### Automated Tests
- JUnit integration tests to assert that `TransactionGroupService` methods create, read, update, and delete groups, ensuring strict multi-user scope.
- Assert that deleting a group nullifies the foreign key on its transactions rather than cascade-deleting them.

### Manual Verification
- Deploy schema changes to PostgreSQL via Supabase migrations.
- Test endpoint requests to create a group, retrieve groups, and assign transactions.
