# 🏗️ Architecture Overview

## System Design

### High-Level Architecture

```
┌─────────────┐
│   iPhone    │
│   Safari    │ ← PWA
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Vercel    │
│  (Next.js)  │
└──────┬──────┘
       │ API
       ▼
┌─────────────┐
│  Supabase   │
│ (Postgres)  │
└─────────────┘
```

### Data Flow

1. **User Action** → Component
2. **Component** → Server Action / API Route
3. **Server** → Supabase Client
4. **Supabase** → PostgreSQL + RLS Check
5. **Response** → Server → Component → UI Update

## Core Concepts

### 1. Room-Based Architecture

Mọi thứ xoay quanh **Room**:

- User có thể tham gia nhiều rooms
- Mỗi room có type: SHARED hoặc PRIVATE
- Transactions thuộc về 1 room cụ thể
- RLS filter data theo room membership

### 2. Split Methods

3 cách chia tiền:

**EQUAL** (Mặc định):
```typescript
// 2 người, tổng 100k
userA_share = 100k / 2 = 50k
userB_share = 100k / 2 = 50k
```

**PERCENTAGE**:
```typescript
// userA: 60%, userB: 40%
userA_share = 100k * 0.6 = 60k
userB_share = 100k * 0.4 = 40k
```

**CUSTOM**:
```typescript
// Tự định nghĩa trong split_config
{
  "userA_id": 70000,
  "userB_id": 30000
}
```

### 3. Settlement Calculation

Công thức tính ai nợ ai:

```typescript
// Tổng chi tiêu của room trong tháng
total = SUM(transactions.amount WHERE room_id = X AND month = Y)

// Số tiền mỗi người phải chịu
share_per_person = total / member_count

// Số tiền mỗi người đã trả
paid_by_user = SUM(transactions.amount WHERE paid_by = user_id)

// Kết quả
balance = paid_by_user - share_per_person

// balance > 0: Người này đã trả nhiều hơn, được nhận lại
// balance < 0: Người này nợ, phải trả thêm
```

## Database Design

### Key Decisions

**1. Tại sao dùng `room_members` thay vì array trong `rooms`?**

❌ Bad (Array):
```sql
rooms {
  members: ['user1', 'user2']  -- Khó query, không có foreign key
}
```

✅ Good (Junction table):
```sql
room_members {
  room_id, user_id, role  -- Dễ query, có constraints, có role
}
```

**2. Tại sao `paid_by` và `created_by` riêng biệt?**

Vì có case: Vợ nhập hộ khoản chồng trả.
- `paid_by`: Ai rút ví
- `created_by`: Ai tạo record

**3. Tại sao dùng `is_deleted` thay vì DELETE?**

Soft delete để:
- Audit trail
- Có thể restore
- Không ảnh hưởng reports cũ

**4. Tại sao `amount` là NUMERIC(10,2)?**

- INT: Không lưu được .50 (50 xu)
- FLOAT: Có rounding error (0.1 + 0.2 ≠ 0.3)
- NUMERIC: Chính xác tuyệt đối

## Security Model

### Row Level Security (RLS)

**Principle**: User chỉ thấy data của rooms mình tham gia.

```sql
-- Transactions policy
CREATE POLICY "view_own_room_transactions"
ON transactions FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM room_members 
    WHERE user_id = auth.uid()
  )
);
```

### Auth Flow

```
1. User click "Đăng nhập Google"
2. Redirect to Supabase Auth
3. Google OAuth consent
4. Callback to /auth/callback
5. Supabase set cookie
6. Trigger: Create profile in profiles table
7. Redirect to /dashboard
```

## Performance Optimizations

### 1. Indexes

```sql
-- Transactions thường query theo room + date
CREATE INDEX idx_transactions_room_date 
ON transactions(room_id, date DESC);

-- Room members thường query theo user
CREATE INDEX idx_room_members_user 
ON room_members(user_id);
```

### 2. Pagination

```typescript
// Load 20 items at a time
const { data } = await supabase
  .from('transactions')
  .select('*')
  .range(0, 19)  // First page
  .order('date', { ascending: false });
```

### 3. Caching Strategy

- **Static**: Landing page, docs
- **ISR**: Dashboard (revalidate every 60s)
- **Dynamic**: Transaction list (realtime)

## Mobile Optimizations

### 1. Touch Targets

Minimum 44x44px (Apple HIG):

```css
.button {
  min-height: 44px;
  min-width: 44px;
}
```

### 2. Input Font Size

Prevent iOS auto-zoom:

```css
input {
  font-size: 16px; /* >= 16px */
}
```

### 3. Safe Area

Handle iPhone notch:

```css
.container {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 4. PWA Manifest

```json
{
  "display": "standalone",  // Hide Safari UI
  "orientation": "portrait" // Lock orientation
}
```

## Deployment Strategy

### Environments

1. **Development**: `localhost:3000`
2. **Preview**: Vercel preview (per PR)
3. **Production**: `your-app.vercel.app`

### CI/CD Flow

```
1. Push to GitHub
2. Vercel auto-detect
3. Build Next.js
4. Run type check
5. Deploy to edge
6. Invalidate cache
```

### Environment Variables

```bash
# .env.local (local)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Vercel (production)
# Set in dashboard → Settings → Environment Variables
```

## Monitoring & Analytics

### Metrics to Track

1. **Performance**:
   - Page load time
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)

2. **Usage**:
   - Daily Active Users (DAU)
   - Transactions per day
   - Rooms created

3. **Errors**:
   - API failures
   - Auth errors
   - Database timeouts

### Tools

- Vercel Analytics (built-in)
- Supabase Dashboard (queries, RLS)
- Browser DevTools (Lighthouse)

## Future Scalability

### When to optimize?

**Current capacity** (Free tier):
- Supabase: 500MB DB, 2GB bandwidth/month
- Vercel: 100GB bandwidth/month

**Estimate**:
- 1 transaction = ~1KB
- 500MB = ~500k transactions
- Đủ cho ~100 users x 5k transactions/user

**Scale up when**:
- > 50 active users
- > 10k transactions/month
- Need realtime for > 10 concurrent users

### Migration Path

1. **Phase 1** (Current): Free tier
2. **Phase 2** (> 50 users): Supabase Pro ($25/mo)
3. **Phase 3** (> 500 users): Dedicated DB + CDN
4. **Phase 4** (> 5k users): Microservices + Redis cache

## Testing Strategy

### Unit Tests

```typescript
// lib/utils.test.ts
describe('formatCurrency', () => {
  it('formats VND correctly', () => {
    expect(formatCurrency(100000)).toBe('100.000 ₫');
  });
});
```

### Integration Tests

```typescript
// app/api/transactions/route.test.ts
describe('POST /api/transactions', () => {
  it('creates transaction with valid data', async () => {
    const res = await POST({ amount: 50000, ... });
    expect(res.status).toBe(201);
  });
});
```

### E2E Tests (Playwright)

```typescript
test('user can add transaction', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('[data-testid="add-button"]');
  await page.fill('input[name="amount"]', '50000');
  await page.click('button[type="submit"]');
  await expect(page.locator('.transaction-item')).toContainText('50.000 ₫');
});
```

## Code Organization

### Folder Structure Philosophy

```
app/              # Routes (Next.js convention)
components/       # Reusable UI
  ui/            # Generic (Button, Input)
  features/      # Domain-specific (TransactionCard)
lib/              # Business logic
  supabase/      # DB clients
  types/         # TypeScript definitions
  utils/         # Pure functions
```

### Naming Conventions

- **Components**: PascalCase (`TransactionCard.tsx`)
- **Utils**: camelCase (`formatCurrency.ts`)
- **Types**: PascalCase (`Database.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_AMOUNT`)

## Best Practices

### 1. Server vs Client Components

```typescript
// ✅ Server Component (default)
async function TransactionList() {
  const data = await fetchTransactions(); // Direct DB call
  return <div>{data.map(...)}</div>;
}

// ✅ Client Component (when needed)
'use client';
function AddButton() {
  const [open, setOpen] = useState(false); // Need state
  return <button onClick={() => setOpen(true)}>Add</button>;
}
```

### 2. Error Handling

```typescript
try {
  const { data, error } = await supabase.from('transactions').insert(...);
  if (error) throw error;
  return { success: true, data };
} catch (error) {
  console.error('Failed to create transaction:', error);
  return { success: false, error: 'Không thể tạo giao dịch' };
}
```

### 3. Type Safety

```typescript
// ✅ Use generated types
import { Database } from '@/lib/types/database';
type Transaction = Database['public']['Tables']['transactions']['Row'];

// ❌ Don't use any
const data: any = await fetch(...);
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [PWA Guide](https://web.dev/progressive-web-apps/)
