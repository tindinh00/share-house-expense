# 📅 Tính năng Hóa đơn tháng (Monthly Bills)

## Tổng quan

Tính năng **Hóa đơn tháng** cho phép tự động tạo và quản lý hóa đơn thanh toán theo từng tháng, giúp theo dõi lịch sử chi tiêu và thanh toán một cách có hệ thống.

## Tính năng chính

### 1. 📋 Tạo hóa đơn tháng

**Cách hoạt động**:
- Click nút "Đóng kỳ tháng này" để tạo hóa đơn cho tháng hiện tại
- Hệ thống tự động:
  - Tính tổng chi tiêu trong tháng
  - Đếm số giao dịch
  - Tính toán ai nợ ai bao nhiêu (settlements)
  - Lưu snapshot vào database

**Dữ liệu được lưu**:
- Kỳ thanh toán: Từ ngày 1 đến ngày cuối tháng
- Tổng chi tiêu
- Số lượng giao dịch
- Danh sách thanh toán đề xuất
- Trạng thái: OPEN / CLOSED / PAIDx

### 2. 📊 Xem lịch sử hóa đơn

**Hiển thị**:
- Danh sách tất cả hóa đơn các tháng trước
- Sắp xếp: Mới nhất trước
- Mỗi hóa đơn hiển thị:
  - Tháng/Năm
  - Kỳ thanh toán
  - Tổng chi tiêu
  - Số giao dịch
  - Trạng thái
  - Danh sách thanh toán

### 3. 💸 Theo dõi thanh toán

**Chi tiết hóa đơn**:
- Xem tổng quan hóa đơn
- Danh sách thanh toán đề xuất
- Tạo danh sách thanh toán từ settlements
- Đánh dấu từng khoản đã thanh toán
- Tự động cập nhật trạng thái khi tất cả đã trả

**Trạng thái thanh toán**:
- ⏳ PENDING: Chưa thanh toán
- ✅ PAID: Đã thanh toán

### 4. 🔄 Tự động cập nhật trạng thái

**Logic**:
- Khi tạo hóa đơn: Status = CLOSED
- Khi tạo danh sách thanh toán: Tạo bill_payments
- Khi đánh dấu từng khoản: Update payment status
- Khi tất cả đã trả: Bill status = PAID

## Database Schema

### Bảng `monthly_bills`

```sql
CREATE TABLE monthly_bills (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms,
  year INTEGER,
  month INTEGER (1-12),
  period_start DATE,
  period_end DATE,
  total_amount NUMERIC(10,2),
  transaction_count INTEGER,
  settlements JSONB,
  status TEXT ('OPEN', 'CLOSED', 'PAID'),
  closed_at TIMESTAMP,
  closed_by UUID REFERENCES profiles,
  created_at TIMESTAMP,
  UNIQUE(room_id, year, month)
);
```

### Bảng `bill_payments`

```sql
CREATE TABLE bill_payments (
  id UUID PRIMARY KEY,
  bill_id UUID REFERENCES monthly_bills,
  from_user_id UUID REFERENCES profiles,
  from_household_id UUID REFERENCES households,
  to_user_id UUID REFERENCES profiles,
  to_household_id UUID REFERENCES households,
  amount NUMERIC(10,2),
  status TEXT ('PENDING', 'PAID'),
  paid_at TIMESTAMP,
  note TEXT,
  created_at TIMESTAMP
);
```

## Use Cases

### Use Case 1: Đóng kỳ tháng

**Kịch bản**: Cuối tháng 12/2025, muốn tạo hóa đơn

**Các bước**:
1. Vào trang "Hóa đơn tháng"
2. Click "Đóng kỳ tháng này"
3. Hệ thống tính toán và tạo hóa đơn
4. Hiển thị hóa đơn với settlements

**Kết quả**:
- Hóa đơn tháng 12/2025 được tạo
- Tổng chi tiêu: 5.000.000 ₫
- Settlements: A nợ B 500.000 ₫

### Use Case 2: Theo dõi thanh toán

**Kịch bản**: Xem chi tiết hóa đơn và đánh dấu đã trả

**Các bước**:
1. Click vào hóa đơn tháng 12/2025
2. Click "Tạo danh sách thanh toán"
3. Hệ thống tạo bill_payments từ settlements
4. A chuyển tiền cho B
5. Click "Đã trả" cho khoản A → B
6. Trạng thái cập nhật thành PAID

**Kết quả**:
- Payment status: PENDING → PAID
- Bill status: CLOSED → PAID (khi tất cả đã trả)

### Use Case 3: Xem lịch sử

**Kịch bản**: Xem lại chi tiêu các tháng trước

**Các bước**:
1. Vào trang "Hóa đơn tháng"
2. Xem danh sách hóa đơn
3. Click vào hóa đơn tháng 11/2025
4. Xem chi tiết: tổng chi tiêu, thanh toán

**Kết quả**:
- Thấy tháng 11 chi 4.500.000 ₫
- Đã thanh toán đầy đủ ✅
- So sánh với tháng 12

## Workflow

### Workflow tạo hóa đơn

```
1. User click "Đóng kỳ tháng này"
2. Kiểm tra hóa đơn đã tồn tại chưa
3. Lấy tất cả transactions trong tháng
4. Tính tổng chi tiêu
5. Tính settlements (theo USER hoặc HOUSEHOLD)
6. Lưu vào monthly_bills
7. Hiển thị thông báo thành công
```

### Workflow theo dõi thanh toán

```
1. User vào chi tiết hóa đơn
2. Click "Tạo danh sách thanh toán"
3. Tạo bill_payments từ settlements
4. Hiển thị danh sách payments
5. User click "Đã trả" cho từng khoản
6. Update payment status = PAID
7. Kiểm tra tất cả payments
8. Nếu tất cả PAID → Update bill status = PAID
```

## Tính toán Settlements

### Cho USER split_by

```typescript
// 1. Lấy tất cả members
members = [A, B, C]

// 2. Tính phần chia đều
totalAmount = 3.000.000 ₫
perPersonShare = 3.000.000 / 3 = 1.000.000 ₫

// 3. Tính balance
A paid: 1.500.000 ₫ → balance: +500.000 ₫ (được nợ)
B paid: 800.000 ₫ → balance: -200.000 ₫ (nợ)
C paid: 700.000 ₫ → balance: -300.000 ₫ (nợ)

// 4. Tính settlements
Creditors: [A: +500k]
Debtors: [C: -300k, B: -200k]

Settlements:
- C trả A: 300k
- B trả A: 200k
```

### Cho HOUSEHOLD split_by

```typescript
// 1. Lấy tất cả households trong room
households = [Hộ 1, Hộ 2]

// 2. Map user → household
userToHousehold = {
  user_A: household_1,
  user_B: household_1,
  user_C: household_2
}

// 3. Tính phần chia đều
totalAmount = 4.000.000 ₫
perHouseholdShare = 4.000.000 / 2 = 2.000.000 ₫

// 4. Tính balance
Hộ 1 paid: 2.500.000 ₫ → balance: +500.000 ₫
Hộ 2 paid: 1.500.000 ₫ → balance: -500.000 ₫

// 5. Settlements
- Hộ 2 trả Hộ 1: 500.000 ₫
```

## UI/UX

### Trang danh sách hóa đơn

**Layout**:
- Header: Tiêu đề + Nút "Đóng kỳ tháng này"
- Cards: Mỗi hóa đơn 1 card
- Empty state: Khi chưa có hóa đơn

**Card hóa đơn**:
- Tháng/Năm
- Kỳ thanh toán
- Status badge
- Tổng chi tiêu
- Số giao dịch
- Danh sách settlements (rút gọn)
- Nút "Xem chi tiết"

### Trang chi tiết hóa đơn

**Sections**:
1. **Header**: Tháng/Năm + Status + Nút quay lại
2. **Tổng quan**: 4 metrics (kỳ, tổng, số giao dịch, ngày đóng)
3. **Thanh toán đề xuất**: Settlements từ bill
4. **Theo dõi thanh toán**: Danh sách bill_payments với nút "Đã trả"

**Colors**:
- OPEN: Blue (đang mở)
- CLOSED: Orange (chưa thanh toán)
- PAID: Green (đã thanh toán)

## Security

### Row Level Security (RLS)

**monthly_bills**:
- SELECT: User trong room
- INSERT: User trong room
- UPDATE: User trong room

**bill_payments**:
- SELECT: User liên quan hoặc trong room
- INSERT: User là from_user hoặc trong from_household
- UPDATE: User là from_user hoặc trong from_household

## Migration

### Chạy migration

```bash
# Copy SQL vào Supabase SQL Editor
# File: supabase/migrations/add_monthly_bills.sql
# Run (Ctrl+Enter)
```

### Rollback (nếu cần)

```sql
DROP TABLE IF EXISTS bill_payments CASCADE;
DROP TABLE IF EXISTS monthly_bills CASCADE;
```

## Future Enhancements

### Phase 2

1. **Tự động tạo hóa đơn**
   - Cron job chạy ngày 1 hàng tháng
   - Tự động tạo hóa đơn tháng trước

2. **Thông báo**
   - Nhắc nhở thanh toán
   - Thông báo khi có người đánh dấu đã trả

3. **Export**
   - Export hóa đơn ra PDF
   - Gửi email hóa đơn

4. **Ghi chú**
   - Thêm ghi chú cho từng payment
   - Lịch sử chỉnh sửa

5. **Phân tích**
   - So sánh chi tiêu các tháng
   - Trend chart
   - Dự đoán chi tiêu tháng sau

## Testing

### Test Cases

1. **Tạo hóa đơn**
   - ✅ Tạo thành công với data đúng
   - ✅ Không cho tạo duplicate (cùng room + tháng)
   - ✅ Tính settlements đúng

2. **Xem hóa đơn**
   - ✅ Hiển thị đúng danh sách
   - ✅ Sắp xếp đúng (mới nhất trước)
   - ✅ Status badge đúng màu

3. **Thanh toán**
   - ✅ Tạo payments từ settlements
   - ✅ Đánh dấu PAID thành công
   - ✅ Auto update bill status khi tất cả PAID

4. **Security**
   - ✅ Chỉ thấy hóa đơn của rooms mình tham gia
   - ✅ Không thể xem hóa đơn của room khác

## Troubleshooting

### Lỗi: "Hóa đơn tháng này đã tồn tại"

**Nguyên nhân**: Đã tạo hóa đơn cho tháng này rồi

**Giải pháp**: Xem lại danh sách, không cần tạo lại

### Lỗi: "Không thể tạo hóa đơn"

**Nguyên nhân**: 
- Không có quyền
- Database error
- Network error

**Giải pháp**:
1. Kiểm tra có phải member của room không
2. Kiểm tra console log
3. Thử lại sau

### Settlements không đúng

**Nguyên nhân**: Logic tính toán sai

**Giải pháp**:
1. Kiểm tra split_by (USER vs HOUSEHOLD)
2. Kiểm tra số members/households
3. Kiểm tra transactions trong tháng

## Best Practices

1. **Đóng kỳ đúng thời điểm**
   - Nên đóng vào đầu tháng sau
   - Đảm bảo đã nhập đủ giao dịch tháng trước

2. **Theo dõi thanh toán**
   - Tạo danh sách thanh toán ngay sau khi đóng kỳ
   - Đánh dấu đã trả ngay khi chuyển tiền

3. **Lưu bằng chứng**
   - Chụp ảnh chuyển khoản
   - Thêm ghi chú vào payment

4. **Review định kỳ**
   - Xem lại hóa đơn các tháng
   - Phân tích xu hướng chi tiêu

---

**Tính năng này giúp quản lý chi tiêu có hệ thống hơn, dễ dàng theo dõi lịch sử và thanh toán!** 🎉
