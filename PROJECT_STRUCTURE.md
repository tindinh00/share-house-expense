# 📁 Project Structure

## Current Structure

```
share-house-expense/
│
├── 📱 app/                          # Next.js App Router
│   ├── layout.tsx                   # Root layout với metadata PWA
│   ├── page.tsx                     # Landing page
│   ├── globals.css                  # Global styles
│   │
│   ├── (auth)/                      # Auth group (TODO)
│   │   ├── login/
│   │   ├── signup/
│   │   └── auth/callback/
│   │
│   └── (dashboard)/                 # Main app (TODO)
│       ├── layout.tsx               # Dashboard layout
│       ├── page.tsx                 # Dashboard home
│       ├── transactions/
│       └── settings/
│
├── 🎨 components/                   # React Components (TODO)
│   ├── ui/                          # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Drawer.tsx
│   │
│   └── features/                    # Feature components
│       ├── TransactionCard.tsx
│       ├── RoomSelector.tsx
│       ├── AddTransactionForm.tsx
│       └── MonthlyReport.tsx
│
├── 🔧 lib/                          # Utilities & Logic
│   ├── supabase/
│   │   ├── client.ts                # Browser client ✅
│   │   └── server.ts                # Server client ✅
│   │
│   ├── types/
│   │   └── database.ts              # Database types ✅
│   │
│   └── utils.ts                     # Helper functions ✅
│
├── 🗄️ supabase/
│   └── schema.sql                   # Database schema ✅
│
├── 📄 public/
│   ├── manifest.json                # PWA manifest ✅
│   ├── icon-192.png                 # PWA icon (TODO)
│   └── icon-512.png                 # PWA icon (TODO)
│
├── 📚 Documentation
│   ├── README.md                    # Overview ✅
│   ├── SETUP.md                     # Setup guide ✅
│   ├── ARCHITECTURE.md              # Architecture docs ✅
│   └── PROJECT_STRUCTURE.md         # This file ✅
│
└── ⚙️ Config Files
    ├── .env.local.example           # Environment template ✅
    ├── .gitignore                   # Git ignore ✅
    ├── package.json                 # Dependencies ✅
    ├── tsconfig.json                # TypeScript config
    ├── tailwind.config.ts           # Tailwind config
    └── next.config.js               # Next.js config
```

## Implementation Status

### ✅ Completed (Phase 0 - Setup)

1. **Project Initialization**
   - Next.js 14+ with App Router
   - TypeScript configuration
   - Tailwind CSS setup

2. **Database Design**
   - Complete SQL schema
   - RLS policies
   - Indexes
   - Default categories

3. **Core Infrastructure**
   - Supabase client setup (browser + server)
   - Type definitions
   - Utility functions
   - PWA manifest

4. **Documentation**
   - README with overview
   - SETUP guide step-by-step
   - ARCHITECTURE deep dive
   - PROJECT_STRUCTURE map

### 🚧 TODO (Phase 1 - MVP)

#### 1. Authentication (Week 1)

```
app/(auth)/
├── login/page.tsx              # Login form
├── signup/page.tsx             # Signup form
└── auth/callback/route.ts      # OAuth callback
```

**Features**:
- Email Magic Link
- Google OAuth (optional)
- Profile creation
- Session management

#### 2. Dashboard (Week 1-2)

```
app/(dashboard)/
├── layout.tsx                  # Sidebar + Header
├── page.tsx                    # Overview + Stats
└── loading.tsx                 # Loading state
```

**Features**:
- Room selector dropdown
- Monthly summary
- Quick stats (total spent, balance)

#### 3. Transactions (Week 2)

```
app/(dashboard)/transactions/
├── page.tsx                    # Transaction list
├── [id]/page.tsx              # Transaction detail
└── add/page.tsx               # Add form (or drawer)
```

**Components**:
```
components/features/
├── TransactionCard.tsx         # List item
├── AddTransactionForm.tsx      # Form with validation
├── TransactionFilters.tsx      # Date/category filters
└── FloatingAddButton.tsx       # FAB for mobile
```

**Features**:
- List with pagination
- Add new transaction
- Edit/delete
- Filter by date/category
- Search

#### 4. Rooms (Week 2)

```
app/(dashboard)/rooms/
├── page.tsx                    # Room list
├── [id]/page.tsx              # Room detail
└── create/page.tsx            # Create room
```

**Features**:
- Create room (SHARED/PRIVATE)
- Invite members (Phase 2)
- Edit room settings
- View members

#### 5. Reports (Week 3)

```
app/(dashboard)/reports/
└── page.tsx                    # Monthly report
```

**Features**:
- Month selector
- Total spent by category
- Who paid what
- Settlement calculation
- Export (Phase 2)

#### 6. Settings (Week 3)

```
app/(dashboard)/settings/
└── page.tsx                    # User settings
```

**Features**:
- Edit profile
- Change avatar
- Logout

### 🎯 TODO (Phase 2 - Advanced)

#### 1. Charts & Visualization

```
components/features/
├── PieChart.tsx                # Category breakdown
├── BarChart.tsx                # Monthly trend
└── SettlementCard.tsx          # Who owes whom
```

**Libraries**: recharts or chart.js

#### 2. Photo Upload

```
app/(dashboard)/transactions/
└── [id]/
    └── photos/                 # Photo gallery
```

**Features**:
- Upload receipt photo
- Supabase Storage integration
- Image preview
- Delete photo

#### 3. Recurring Expenses

```
app/(dashboard)/recurring/
├── page.tsx                    # List recurring
└── create/page.tsx            # Create template
```

**Features**:
- Create template (monthly bills)
- Auto-create transactions
- Edit/pause recurring

#### 4. Realtime Sync

```
lib/supabase/
└── realtime.ts                 # Realtime subscriptions
```

**Features**:
- Live updates when others add transactions
- Toast notifications
- Optimistic UI updates

#### 5. Offline Support

```
lib/
├── db/                         # IndexedDB wrapper
└── sync.ts                     # Sync logic
```

**Features**:
- Cache transactions locally
- Queue actions when offline
- Sync when back online

### 🚀 TODO (Phase 3 - Polish)

1. **Dark Mode**
   - Theme toggle
   - Persist preference
   - System preference detection

2. **Notifications**
   - Push notifications (PWA)
   - Email reminders
   - Settlement alerts

3. **Export**
   - PDF report
   - CSV export
   - Share via WhatsApp

4. **Multi-currency**
   - Support USD, EUR
   - Exchange rate API
   - Convert to VND

5. **Advanced Filters**
   - Date range picker
   - Multiple categories
   - Amount range
   - Paid by filter

## File Naming Conventions

### Components

```typescript
// PascalCase for components
TransactionCard.tsx
AddTransactionForm.tsx
RoomSelector.tsx
```

### Pages (App Router)

```typescript
// lowercase for routes
app/transactions/page.tsx       → /transactions
app/rooms/[id]/page.tsx        → /rooms/123
app/api/transactions/route.ts  → /api/transactions
```

### Utilities

```typescript
// camelCase for utilities
formatCurrency.ts
calculateSettlement.ts
validateTransaction.ts
```

### Types

```typescript
// PascalCase for types
Database.ts
Transaction.ts
Room.ts
```

## Component Patterns

### Server Component (Default)

```typescript
// app/transactions/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('transactions').select('*');
  
  return <TransactionList transactions={data} />;
}
```

### Client Component (Interactive)

```typescript
// components/features/AddTransactionForm.tsx
'use client';

import { useState } from 'react';

export function AddTransactionForm() {
  const [amount, setAmount] = useState('');
  
  return (
    <form>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} />
    </form>
  );
}
```

### Server Action

```typescript
// app/actions/transactions.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ... });
  
  if (error) throw error;
  return data;
}
```

## Data Fetching Patterns

### 1. Server Component (Preferred)

```typescript
// Direct DB call, no API route needed
const { data } = await supabase.from('transactions').select('*');
```

### 2. Client Component + Server Action

```typescript
// Client
'use client';
import { createTransaction } from '@/app/actions/transactions';

function Form() {
  return <form action={createTransaction}>...</form>;
}
```

### 3. Client Component + API Route (When needed)

```typescript
// Client
const res = await fetch('/api/transactions', { method: 'POST', ... });

// API Route
// app/api/transactions/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  // ...
}
```

## Styling Approach

### Tailwind Utility Classes

```typescript
// Preferred for most cases
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  Click me
</button>
```

### CSS Modules (When needed)

```typescript
// For complex animations or component-specific styles
import styles from './Button.module.css';

<button className={styles.button}>Click me</button>
```

### Global Styles

```css
/* app/globals.css */
/* Only for resets and base styles */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  input {
    font-size: 16px; /* Prevent iOS zoom */
  }
}
```

## Testing Structure (Future)

```
__tests__/
├── unit/
│   ├── utils.test.ts
│   └── components/
│       └── TransactionCard.test.tsx
│
├── integration/
│   └── api/
│       └── transactions.test.ts
│
└── e2e/
    └── transactions.spec.ts
```

## Environment Variables

```bash
# .env.local (local development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-key

# .env.production (Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-key
```

## Next Steps

1. **Immediate** (This week):
   - [ ] Upgrade Node.js to v20+
   - [ ] Create Supabase project
   - [ ] Run schema.sql
   - [ ] Add .env.local
   - [ ] Test dev server

2. **Phase 1** (Week 1-3):
   - [ ] Build auth flow
   - [ ] Create dashboard
   - [ ] Implement transactions CRUD
   - [ ] Add basic reports

3. **Phase 2** (Week 4+):
   - [ ] Add charts
   - [ ] Photo upload
   - [ ] Realtime sync
   - [ ] Deploy to Vercel

## Resources

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Tailwind**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs
