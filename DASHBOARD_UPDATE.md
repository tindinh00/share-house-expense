# Dashboard Update - Hiển thị data thật theo room

**Ngày:** 16/12/2024  
**Status:** ✅ HOÀN THÀNH

## Những gì đã làm

### 1. Chuyển Dashboard sang Client Component
- Đổi từ Server Component sang Client Component để dùng RoomContext
- Thêm `'use client'` directive
- Dùng `useSearchParams()` thay vì `searchParams` prop

### 2. Tích hợp RoomContext
Dashboard giờ hiển thị data dựa trên **room hiện tại** được chọn:
- Nếu chưa chọn room → Hiển thị "Chọn không gian"
- Nếu đã chọn room → Hiển thị stats của room đó

### 3. Thống kê thực tế

#### 💰 Chi tiêu tháng này
- Tổng tiền của tất cả transactions trong tháng hiện tại
- Lọc theo room_id và date range

#### 📊 Số giao dịch
- Đếm số lượng transactions trong tháng

#### 💳 Cân đối của bạn
- **Công thức:** `(Tiền đã trả) - (Tiền nên trả)`
- **Tiền đã trả:** Tổng transactions mà user là paid_by
- **Tiền nên trả:** Tổng chi tiêu / Số thành viên
- **Màu xanh (+):** Được trả tiền
- **Màu đỏ (-):** Cần trả tiền

#### 📝 Giao dịch gần đây
- Hiển thị 5 transactions mới nhất
- Có icon category, người trả, ngày, số tiền
- Link đến trang transactions để xem tất cả

### 4. Room Selector trong Header
Thêm dropdown chọn room ngay trong header:
- Hiển thị danh sách rooms
- Click để chuyển room
- Highlight room đang chọn
- Link đến quản lý rooms

### 5. Loading State
- Hiển thị spinner khi đang load data
- Tránh flash of empty content

### 6. Format dữ liệu
- **Tiền tệ:** `1.500.000 ₫` (format Việt Nam)
- **Ngày:** `16/12/2024` (dd/mm/yyyy)

## Files đã sửa

### 1. `app/(dashboard)/dashboard/page.tsx`
```typescript
// Trước: Server Component với hardcode data
export default async function DashboardPage() {
  // ...
  return <div>Chi tiêu tháng này: 0 ₫</div>
}

// Sau: Client Component với real data
'use client';
export default function DashboardPage() {
  const { currentRoom } = useRoom();
  // Load real data from Supabase
  // Calculate stats
  return <div>Chi tiêu tháng này: {formatCurrency(stats.monthlyTotal)}</div>
}
```

**Thay đổi chính:**
- Chuyển sang client component
- Tích hợp RoomContext
- Load transactions từ Supabase
- Tính toán stats thực tế
- Hiển thị giao dịch gần đây

### 2. `components/layout/Header.tsx`
```typescript
// Thêm room selector dropdown
const { currentRoom, rooms, setCurrentRoom } = useRoom();

return (
  <header>
    <div>Logo</div>
    <RoomSelector /> {/* NEW */}
    <UserMenu />
  </header>
);
```

**Thay đổi chính:**
- Thêm room selector dropdown
- Hiển thị room hiện tại
- Cho phép chuyển room nhanh
- Link đến quản lý rooms

### 3. `DASHBOARD_LOGIC.md` (NEW)
Document chi tiết giải thích:
- Công thức tính toán
- Logic cân đối
- Ví dụ thực tế
- Flow hoạt động

## Cách sử dụng

### 1. Chọn room
**Cách 1:** Dùng room selector trong header
- Click dropdown ở header
- Chọn room muốn xem

**Cách 2:** Vào trang Rooms
- Sidebar → Rooms
- Click "Chọn làm không gian hiện tại"

### 2. Xem thống kê
Dashboard tự động hiển thị:
- Chi tiêu tháng này của room
- Số giao dịch
- Cân đối của bạn (được trả hay cần trả)
- 5 giao dịch gần nhất

### 3. Thêm giao dịch
- Click "Thêm giao dịch" trong dashboard
- Hoặc dùng sidebar → Transactions → Thêm mới

## Ví dụ thực tế

### Scenario: Nhà trọ 3 người

**Room:** "Nhà trọ 123"  
**Thành viên:** An, Bình, Chi

**Tháng 12/2024:**
- An trả: 750,000đ (Điện + Đồ dùng)
- Bình trả: 300,000đ (Internet)
- Chi trả: 450,000đ (Ăn uống)
- **Tổng:** 1,500,000đ

**Dashboard của An:**
```
Chi tiêu tháng này: 1.500.000 ₫
Số giao dịch: 4
Cân đối: +250.000 ₫ (màu xanh)
→ An được trả 250k
```

**Dashboard của Bình:**
```
Chi tiêu tháng này: 1.500.000 ₫
Số giao dịch: 4
Cân đối: -200.000 ₫ (màu đỏ)
→ Bình cần trả 200k
```

**Dashboard của Chi:**
```
Chi tiêu tháng này: 1.500.000 ₫
Số giao dịch: 4
Cân đối: -50.000 ₫ (màu đỏ)
→ Chi cần trả 50k
```

## Auto-refresh

Dashboard tự động reload khi:
- User chuyển sang room khác
- Component mount lại

```typescript
useEffect(() => {
  loadDashboardData();
}, [currentRoom]); // Dependency: currentRoom
```

## UI/UX Improvements

### 1. Empty State
Khi chưa chọn room:
```
🏠
Bạn chưa chọn không gian nào
[Chọn không gian]
```

### 2. Loading State
```
⏳ (spinner)
Đang tải...
```

### 3. Color Coding
- **Xanh:** Số dương (được trả)
- **Đỏ:** Số âm (cần trả)
- **Xám:** Neutral

### 4. Responsive
- Desktop: Hiển thị đầy đủ
- Mobile: Stack cards vertically

## Testing Checklist

- [x] Dashboard hiển thị đúng khi chưa chọn room
- [x] Dashboard hiển thị stats khi đã chọn room
- [x] Chi tiêu tháng này tính đúng
- [x] Số giao dịch đếm đúng
- [x] Cân đối tính đúng (dương/âm)
- [x] Giao dịch gần đây hiển thị đúng
- [x] Room selector hoạt động
- [x] Chuyển room → Dashboard update
- [x] Format tiền đúng (VND)
- [x] Format ngày đúng (dd/mm/yyyy)
- [x] Loading state hiển thị
- [x] Empty state hiển thị

## Next Steps (Tương lai)

1. **Biểu đồ chi tiêu**
   - Chart theo category
   - Trend theo tháng

2. **So sánh tháng trước**
   - Tăng/giảm bao nhiêu %
   - Insight tự động

3. **Thông báo**
   - Alert khi cân đối âm quá nhiều
   - Nhắc nhở trả tiền

4. **Export báo cáo**
   - PDF/Excel
   - Gửi email

5. **Dự đoán chi tiêu**
   - AI predict tháng sau
   - Budget planning

---

**Hoàn thành:** 16/12/2024  
**Files:** 
- `app/(dashboard)/dashboard/page.tsx`
- `components/layout/Header.tsx`
- `DASHBOARD_LOGIC.md`
