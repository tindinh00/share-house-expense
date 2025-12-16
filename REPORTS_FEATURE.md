# 📊 Reports Feature

## Tổng quan

Reports page hiển thị báo cáo chi tiêu chi tiết cho room hiện tại, bao gồm:
- Tổng chi tiêu trong khoảng thời gian
- Chi tiêu theo danh mục (category)
- Chi tiêu theo người/hộ gia đình
- Thanh toán đề xuất (ai nợ ai bao nhiêu)

## Features

### 1. Transaction Details
- Hiển thị danh sách giao dịch chi tiết
- Mỗi transaction hiển thị:
  - Icon và màu category
  - Note (mô tả)
  - Số tiền
  - Ngày giao dịch
  - Category name
  - Người trả
- **Filter by Category**: Lọc theo danh mục
- **Sort Options**: 
  - Sắp xếp theo ngày (mới nhất trước)
  - Sắp xếp theo số tiền (lớn nhất trước)
- Scroll khi có nhiều transactions
- Hover effect để dễ đọc

### 2. Date Range Filter
- Chọn khoảng thời gian để xem báo cáo
- Mặc định: Từ đầu tháng đến hiện tại
- Dùng Calendar component để chọn ngày

### 2. Tổng Chi Tiêu
- Hiển thị tổng số tiền đã chi trong khoảng thời gian
- Format: VND currency

### 3. Chi Tiêu Theo Danh Mục
- Hiển thị từng category với:
  - Icon và màu sắc
  - Tổng tiền
  - Số lượng giao dịch
  - Phần trăm so với tổng
- Sắp xếp theo tổng tiền giảm dần

### 4. Chi Tiêu Theo Người/Hộ

#### Nếu split_by = 'USER':
- Hiển thị từng user với:
  - Tên user
  - Đã trả: Tổng tiền user đã trả
  - Phải trả: Phần chia đều (total / số người)
  - Balance: Đã trả - Phải trả
    - Dương (xanh): User trả nhiều hơn, được nợ
    - Âm (đỏ): User trả ít hơn, đang nợ

#### Nếu split_by = 'HOUSEHOLD':
- Hiển thị từng household với:
  - Tên household
  - Số thành viên
  - Đã trả: Tổng tiền household đã trả
  - Phải trả: Phần chia đều (total / số household)
  - Balance: Đã trả - Phải trả

### 5. Thanh Toán Đề Xuất (Settlements)
- Tính toán cách thanh toán tối ưu
- Giảm thiểu số lượng giao dịch cần thực hiện
- Hiển thị: "A trả B: X đồng"

## Thuật Toán Settlement

### Greedy Algorithm:
1. Chia thành 2 nhóm:
   - Creditors: Người được nợ (balance > 0)
   - Debtors: Người đang nợ (balance < 0)
2. Sắp xếp:
   - Creditors: Giảm dần theo balance
   - Debtors: Tăng dần theo balance
3. Match từng cặp:
   - Lấy creditor lớn nhất và debtor lớn nhất
   - Tính amount = min(creditor.balance, |debtor.balance|)
   - Tạo settlement: debtor trả creditor amount
   - Cập nhật balance
   - Lặp lại cho đến khi hết

### Ví dụ:
```
Users:
- A: +300 (được nợ 300)
- B: -100 (nợ 100)
- C: -200 (nợ 200)

Settlements:
1. C trả A: 200
2. B trả A: 100

Kết quả: 2 giao dịch thay vì 3
```

## UI Components

### Cards:
- Total Expense Card
- Category Summary Card
- User/Household Summary Card
- Settlements Card

### Date Picker:
- Popover với 2 Calendar
- Chọn "Từ ngày" và "Đến ngày"
- Format: dd/MM/yyyy (Vietnamese)

### Color Coding:
- Balance dương: text-green-600
- Balance âm: text-red-600
- Category: Dùng màu từ database

## Data Flow

### 1. Load Category Summary:
```typescript
transactions
  .filter(date in range)
  .groupBy(category_id)
  .sum(amount)
  .sort(desc)
```

### 2. Load User Summary:
```typescript
// Get all transactions
transactions = fetch transactions in date range

// Get all members
members = fetch room_members

// Calculate
totalExpense = sum(transactions.amount)
perPersonShare = totalExpense / members.length

for each member:
  paid = sum(transactions where paid_by = member)
  owed = perPersonShare
  balance = paid - owed
```

### 3. Load Household Summary:
```typescript
// Get all transactions
transactions = fetch transactions in date range

// Get all households in room
households = fetch room_members where household_id not null

// Map user -> household
userToHousehold = fetch household_members

// Calculate
totalExpense = sum(transactions.amount)
perHouseholdShare = totalExpense / households.length

for each household:
  paid = sum(transactions where paid_by in household.members)
  owed = perHouseholdShare
  balance = paid - owed
```

## Dependencies

- `date-fns`: Date formatting và manipulation
- `date-fns/locale/vi`: Vietnamese locale
- `@/components/ui/calendar`: Date picker
- `@/components/ui/popover`: Date range selector

## Charts

### 1. Pie Chart - Chi tiêu theo danh mục
- Hiển thị tỷ lệ % của từng category
- Màu sắc theo category color từ database
- Label hiển thị: "Category: XX%"
- Tooltip hiển thị số tiền VND

### 2. Bar Chart - Chi tiêu theo người/hộ
- 2 bars: "Đã trả" (xanh) và "Phải trả" (vàng)
- X-axis: Tên người/hộ (góc 45 độ)
- Y-axis: Số tiền
- Tooltip hiển thị số tiền VND

### Responsive Design:
- Desktop: 2 columns (chart + list)
- Mobile: 1 column (stack vertically)
- Charts tự động resize với ResponsiveContainer

## Dependencies

- `recharts`: Chart library
  - PieChart, Pie, Cell
  - BarChart, Bar, XAxis, YAxis
  - ResponsiveContainer, Legend, Tooltip, CartesianGrid
- `date-fns`: Date formatting
- `@/components/ui/calendar`: Date picker
- `@/components/ui/popover`: Date range selector

## Future Enhancements

1. ✅ **Charts**: Đã có Pie Chart và Bar Chart
2. **Line Chart**: Thêm line chart cho xu hướng theo thời gian
3. **Export**: Export báo cáo ra PDF/Excel
4. **Comparison**: So sánh với tháng trước
5. **Filters**: Lọc theo category, user, household
6. **Custom Periods**: Tuần, tháng, quý, năm
7. **Drill-down**: Click vào chart để xem chi tiết
