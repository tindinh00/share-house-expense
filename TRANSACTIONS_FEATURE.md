# 💰 Transactions Feature

## Tổng quan

Feature quản lý giao dịch cho phép người dùng:
- Thêm giao dịch mới
- Xem danh sách giao dịch
- Group theo ngày
- Tự động tạo room mặc định nếu chưa có

## Cấu trúc

```
app/(dashboard)/transactions/
├── page.tsx          # Danh sách giao dịch
└── add/
    └── page.tsx      # Form thêm giao dịch
```

## Add Transaction Form

### Fields

1. **Số tiền** (required)
   - Type: number
   - Min: 0
   - Max: 1,000,000,000
   - Step: 1,000
   - Format: Hiển thị dạng tiền tệ VND

2. **Ghi chú** (required)
   - Type: textarea
   - Max length: 200 ký tự
   - Placeholder: "VD: Tiền điện tháng 12"

3. **Danh mục** (required)
   - Type: select
   - Options: Fetch từ bảng `categories`
   - Default: Category đầu tiên

4. **Ngày chi tiêu** (required)
   - Type: date
   - Default: Hôm nay
   - Max: Hôm nay (không cho chọn ngày tương lai)

### Validation

- Số tiền > 0
- Số tiền <= 1 tỷ
- Ghi chú không được rỗng
- Ghi chú <= 200 ký tự
- Phải chọn category
- Ngày không được trong tương lai

### Flow

1. User mở form `/transactions/add`
2. Load categories từ database
3. User điền form
4. Submit:
   - Validate input
   - Check user authentication
   - Get hoặc tạo room mặc định (nếu chưa có)
   - Insert transaction vào database
   - Show toast success
   - Redirect về `/transactions`
   - Refresh data

### Auto Room Creation

Nếu user chưa có room nào:
- Tự động tạo room "Ví cá nhân"
- Type: PRIVATE
- Split by: USER
- Add user vào room_members

## Transaction List

### Features

- **Group by date**: Transactions được nhóm theo ngày
- **Date labels**: "Hôm nay", "Hôm qua", hoặc DD/MM/YYYY
- **Transaction count**: Hiển thị số lượng transactions mỗi ngày
- **Category badge**: Hiển thị category với icon và màu
- **Amount formatting**: Format số tiền theo VND
- **Empty state**: Hiển thị khi chưa có transactions

### Data Fetching

```typescript
const { data: transactions } = await supabase
  .from('transactions')
  .select(`
    *,
    categories (name, icon, color),
    profiles:paid_by (username)
  `)
  .eq('created_by', user.id)
  .order('date', { ascending: false })
  .order('created_at', { ascending: false })
  .limit(50);
```

### Display

Mỗi transaction card hiển thị:
- Category icon với background color
- Note (truncate nếu quá dài)
- Category name badge
- Username (nếu có)
- Amount (format VND)

## Database Schema

### transactions table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(15,2) NOT NULL,
  note TEXT NOT NULL,
  date DATE NOT NULL,
  category_id UUID REFERENCES categories(id),
  room_id UUID REFERENCES rooms(id),
  paid_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Relations

- `categories`: Many-to-one (transaction → category)
- `rooms`: Many-to-one (transaction → room)
- `profiles` (paid_by): Many-to-one (transaction → user)
- `profiles` (created_by): Many-to-one (transaction → user)

## UI Components

### Used Components

- `Button` - Submit, Cancel, Add buttons
- `Input` - Amount, Date inputs
- `Textarea` - Note input
- `Select` - Category dropdown
- `Card` - Transaction cards, Form container
- `Label` - Form labels
- `toast` - Success/Error notifications

### Styling

- Green theme (#16a34a)
- Responsive design (mobile-first)
- Hover effects on cards
- Loading states
- Disabled states

## User Experience

### Success Flow

1. Click "Thêm mới" button
2. Fill form (autofocus on amount)
3. See formatted currency as typing
4. Character count for note
5. Submit
6. See success toast
7. Redirect to list with new transaction

### Error Handling

- Invalid amount → Toast error
- Empty note → Toast error
- Network error → Toast error with message
- Not authenticated → Redirect to login

## Performance

- Server components for list (faster initial load)
- Client component for form (interactive)
- Limit 50 transactions per page
- Optimistic UI updates (via router.refresh())
- Cached profile data in layout

## Next Steps

### Phase 2 Features

- [ ] Edit transaction
- [ ] Delete transaction (with confirmation)
- [ ] Filter by category
- [ ] Filter by date range
- [ ] Search transactions
- [ ] Pagination (load more)
- [ ] Export to CSV
- [ ] Photo upload (receipt)
- [ ] Recurring transactions

### Improvements

- [ ] Swipe to delete (mobile)
- [ ] Bulk actions
- [ ] Transaction details modal
- [ ] Quick add (FAB with drawer)
- [ ] Voice input for amount
- [ ] OCR for receipts
- [ ] Split transaction (multiple payers)

## Testing

### Manual Test Cases

1. **Add transaction**
   - ✅ Valid data → Success
   - ✅ Invalid amount → Error
   - ✅ Empty note → Error
   - ✅ Future date → Error
   - ✅ No category → Use default

2. **View transactions**
   - ✅ Empty state → Show message
   - ✅ With data → Show grouped list
   - ✅ Today's transaction → Show "Hôm nay"
   - ✅ Yesterday → Show "Hôm qua"

3. **Auto room creation**
   - ✅ First transaction → Create room
   - ✅ Subsequent → Use existing room

### Edge Cases

- Very large amount (999,999,999)
- Very long note (200 chars)
- Special characters in note
- Multiple transactions same time
- Network timeout
- Database error

## Troubleshooting

### Issue: "Room not found"
**Fix**: Check RLS policies on rooms table

### Issue: "Categories not loading"
**Fix**: Run schema.sql to insert default categories

### Issue: "Transaction not appearing"
**Fix**: Check router.refresh() is called after insert

### Issue: "Amount formatting wrong"
**Fix**: Check formatCurrency() in lib/utils.ts

## Resources

- Database schema: `supabase/schema.sql`
- Utils: `lib/utils.ts`
- Types: `lib/types/database.ts`
