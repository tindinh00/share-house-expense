# ✅ TODO List

## 🔴 URGENT - Setup (Làm ngay)

- [ ] **Upgrade Node.js lên v20+** (Bắt buộc để chạy được)
- [ ] Tạo Supabase project
- [ ] Chạy `supabase/schema.sql` trong SQL Editor
- [ ] Copy `.env.local.example` → `.env.local` và điền keys
- [ ] Test `npm run dev` → Mở http://localhost:3000

## 📅 Phase 1: MVP (Week 1-3)

### Week 1: Auth + Dashboard + Household

- [ ] **Auth Flow**
  - [ ] Login page với Email Magic Link
  - [ ] Signup page
  - [ ] Auth callback handler
  - [ ] Protected routes middleware
  - [ ] Logout button

- [ ] **Household Setup (Onboarding)**
  - [ ] Create household form
  - [ ] Add household members
  - [ ] Set household name
  - [ ] Skip option (for solo users)

- [ ] **Dashboard Layout**
  - [ ] Header với logo + user menu
  - [ ] Room selector dropdown
  - [ ] Navigation (Transactions, Rooms, Reports, Settings)
  - [ ] Mobile responsive

- [ ] **Dashboard Home**
  - [ ] Tổng chi tiêu tháng này
  - [ ] Balance (nợ/được nợ)
  - [ ] 5 giao dịch gần nhất
  - [ ] Hiển thị household name

### Week 2: Transactions

- [ ] **Transaction List**
  - [ ] Fetch từ Supabase
  - [ ] TransactionCard component
  - [ ] Group by date
  - [ ] Pagination (20 items/page)
  - [ ] Loading skeleton

- [ ] **Add Transaction**
  - [ ] Floating Action Button (FAB)
  - [ ] Drawer slide up from bottom
  - [ ] Form: Amount, Note, Category, Date, Paid by
  - [ ] Validation
  - [ ] Submit → Refresh list

- [ ] **Edit/Delete**
  - [ ] Swipe left to delete (mobile)
  - [ ] Edit form (reuse Add form)
  - [ ] Confirm dialog

### Week 3: Rooms + Reports

- [ ] **Rooms**
  - [ ] Create room (SHARED/PRIVATE)
  - [ ] Choose split_by (USER/HOUSEHOLD)
  - [ ] Add households to room (if split_by = HOUSEHOLD)
  - [ ] List rooms
  - [ ] Switch between rooms
  - [ ] Edit room name

- [ ] **Monthly Report**
  - [ ] Month selector
  - [ ] Total by category
  - [ ] List: Who paid what
  - [ ] Settlement calculation by household (if applicable)
  - [ ] Settlement calculation by user (if applicable)
  - [ ] "Ai nợ ai bao nhiêu" / "Hộ nào nợ hộ nào"

- [ ] **Settings**
  - [ ] Edit profile (username, avatar)
  - [ ] Manage household members
  - [ ] Leave household
  - [ ] Logout

## 🚀 Phase 2: Advanced (Week 4+)

- [ ] **Charts**
  - [ ] Pie chart: Chi tiêu theo category
  - [ ] Bar chart: Trend theo tháng

- [ ] **Photo Upload**
  - [ ] Chụp/upload hóa đơn
  - [ ] Supabase Storage
  - [ ] Gallery view

- [ ] **Recurring Expenses**
  - [ ] Template cho bills hàng tháng
  - [ ] Auto-create transactions

- [ ] **Realtime**
  - [ ] Subscribe to room changes
  - [ ] Toast notification khi có transaction mới

- [ ] **Offline Support**
  - [ ] Cache data với IndexedDB
  - [ ] Queue actions khi offline
  - [ ] Sync khi online

## 🎨 Phase 3: Polish

- [ ] Dark mode
- [ ] Push notifications
- [ ] Export PDF/CSV
- [ ] Multi-currency
- [ ] Invite members via link
- [ ] WhatsApp share

## 🐛 Bugs to Fix

_(Thêm bugs khi phát hiện)_

## 💡 Ideas / Nice to Have

- [ ] Biểu đồ so sánh tháng này vs tháng trước
- [ ] Budget limit warning
- [ ] Recurring reminder (Nhắc đóng tiền điện)
- [ ] Split bill calculator (Chia bill nhà hàng)
- [ ] QR code scan receipt
- [ ] Voice input amount

## 📝 Notes

- Ưu tiên mobile-first (iPhone)
- Mỗi feature phải test trên Safari thật
- Commit thường xuyên
- Deploy preview trên Vercel mỗi PR

## 🎯 Current Sprint

**Sprint 1** (This week):
1. Setup environment ✅
2. Auth flow
3. Basic dashboard

**Next Sprint**:
- Transactions CRUD
- Room management
