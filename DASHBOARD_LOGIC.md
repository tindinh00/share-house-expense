# Dashboard Logic - Giải thích chi tiết

## Tổng quan

Dashboard hiển thị thống kê chi tiêu của **room hiện tại** (được chọn trong RoomContext).

## Các thống kê hiển thị

### 1. Chi tiêu tháng này 💰
**Công thức:**
```
Tổng = SUM(amount) của tất cả transactions trong tháng hiện tại
```

**Logic:**
- Lấy tất cả transactions có `room_id = currentRoom.id`
- Lọc theo `date` trong khoảng từ ngày 1 đến ngày cuối tháng hiện tại
- Cộng tất cả `amount`

**Ví dụ:**
```
Tháng 12/2024:
- Transaction 1: 500,000đ (Điện nước)
- Transaction 2: 300,000đ (Internet)
- Transaction 3: 200,000đ (Ăn uống)
→ Tổng = 1,000,000đ
```

---

### 2. Số giao dịch 📊
**Công thức:**
```
Số lượng = COUNT(transactions) trong tháng hiện tại
```

**Logic:**
- Đếm số lượng transactions thỏa điều kiện trên

**Ví dụ:**
```
Tháng 12/2024: 3 giao dịch
```

---

### 3. Cân đối của bạn 💳
**Công thức:**
```
Cân đối = (Số tiền bạn đã trả) - (Số tiền bạn nên trả)

Trong đó:
- Số tiền bạn đã trả = SUM(amount) của transactions có paid_by = user.id
- Số tiền bạn nên trả = (Tổng chi tiêu) / (Số thành viên trong room)
```

**Logic:**
1. Tính tổng tiền user đã trả (paid_by = user.id)
2. Tính số thành viên trong room
3. Tính số tiền user nên trả = Tổng chi tiêu / Số thành viên
4. Cân đối = Đã trả - Nên trả

**Ví dụ:**
```
Room có 3 người: A, B, C
Tổng chi tiêu tháng: 1,500,000đ

User A đã trả:
- Transaction 1: 500,000đ
- Transaction 2: 300,000đ
→ Tổng đã trả = 800,000đ

Nên trả = 1,500,000 / 3 = 500,000đ

Cân đối = 800,000 - 500,000 = +300,000đ
→ A được trả 300,000đ (màu xanh)

---

User B đã trả:
- Transaction 3: 200,000đ
→ Tổng đã trả = 200,000đ

Nên trả = 500,000đ

Cân đối = 200,000 - 500,000 = -300,000đ
→ B cần trả 300,000đ (màu đỏ)
```

**Màu sắc:**
- **Xanh (+)**: Bạn được trả tiền (đã trả nhiều hơn phần của mình)
- **Đỏ (-)**: Bạn cần trả tiền (đã trả ít hơn phần của mình)

---

### 4. Giao dịch gần đây 📝
**Logic:**
- Lấy 5 transactions mới nhất của room hiện tại
- Sắp xếp theo `date` giảm dần, sau đó `created_at` giảm dần
- Hiển thị: icon category, tên giao dịch, người trả, ngày, số tiền

---

## Flow hoạt động

```
1. User vào Dashboard
   ↓
2. Check currentRoom từ RoomContext
   ↓
3. Nếu không có room → Hiển thị "Chọn không gian"
   ↓
4. Nếu có room → Load data:
   - Lấy transactions của tháng hiện tại
   - Tính toán stats
   - Lấy 5 transactions gần nhất
   ↓
5. Hiển thị dashboard với data thật
```

---

## Khi nào dashboard cập nhật?

Dashboard tự động reload khi:
- User chuyển sang room khác (currentRoom thay đổi)
- Component mount lại

**useEffect dependency:**
```typescript
useEffect(() => {
  loadDashboardData();
}, [currentRoom]); // Chạy lại khi currentRoom thay đổi
```

---

## Ví dụ thực tế

### Scenario: Nhà trọ 3 người

**Room:** "Nhà trọ 123"  
**Thành viên:** An, Bình, Chi  
**Tháng 12/2024:**

| Ngày | Người trả | Danh mục | Số tiền | Ghi chú |
|------|-----------|----------|---------|---------|
| 01/12 | An | Điện nước | 600,000đ | Tiền điện tháng 11 |
| 05/12 | Bình | Internet | 300,000đ | Wifi tháng 12 |
| 10/12 | Chi | Ăn uống | 450,000đ | Mua đồ ăn chung |
| 15/12 | An | Đồ dùng | 150,000đ | Giấy vệ sinh |

**Dashboard của An:**
- Chi tiêu tháng này: **1,500,000đ**
- Số giao dịch: **4**
- An đã trả: 600,000 + 150,000 = **750,000đ**
- An nên trả: 1,500,000 / 3 = **500,000đ**
- Cân đối: **+250,000đ** (màu xanh - An được trả)

**Dashboard của Bình:**
- Chi tiêu tháng này: **1,500,000đ**
- Số giao dịch: **4**
- Bình đã trả: **300,000đ**
- Bình nên trả: **500,000đ**
- Cân đối: **-200,000đ** (màu đỏ - Bình cần trả)

**Dashboard của Chi:**
- Chi tiêu tháng này: **1,500,000đ**
- Số giao dịch: **4**
- Chi đã trả: **450,000đ**
- Chi nên trả: **500,000đ**
- Cân đối: **-50,000đ** (màu đỏ - Chi cần trả)

**Kiểm tra:**
```
Tổng cân đối = +250,000 + (-200,000) + (-50,000) = 0 ✅
(Luôn bằng 0 vì tổng tiền trả = tổng tiền chi)
```

---

## Lưu ý kỹ thuật

### 1. Server vs Client Component
- Dashboard là **client component** để dùng RoomContext
- Dùng `'use client'` ở đầu file

### 2. Loading State
- Hiển thị spinner khi đang load data
- Tránh flash of empty content

### 3. Format tiền tệ
```typescript
formatCurrency(1500000) → "1.500.000 ₫"
```

### 4. Format ngày
```typescript
formatDate("2024-12-16") → "16/12/2024"
```

### 5. Performance
- Chỉ load data khi có currentRoom
- Dùng `limit(5)` cho recent transactions
- Cache profile data

---

## Tương lai có thể mở rộng

1. **Biểu đồ chi tiêu theo category**
2. **So sánh với tháng trước**
3. **Dự đoán chi tiêu tháng sau**
4. **Export báo cáo PDF**
5. **Thông báo khi cân đối âm quá nhiều**
6. **Lịch sử cân đối theo tháng**

---

**File:** `app/(dashboard)/dashboard/page.tsx`  
**Context:** `contexts/RoomContext.tsx`
