# 🏠 Household Example - Case của bạn

## 📖 Scenario

**Nhà trọ có 2 gia đình:**
- Gia đình bạn: Bạn (Tín) + Vợ
- Gia đình anh: Anh + Chị dâu

**Yêu cầu:**
- Bạn chi 100k + Vợ chi 100k = Gia đình bạn chi 200k
- Anh chi 150k + Chị chi 50k = Gia đình anh chi 200k
- Kết quả: Mỗi gia đình chịu 200k → Hòa nhau

## 🗄️ Database Setup

### Step 1: Tạo Users

```sql
INSERT INTO profiles (id, username) VALUES
  ('user-tin', 'Tín'),
  ('user-vo', 'Vợ Tín'),
  ('user-anh', 'Anh Tín'),
  ('user-chi', 'Chị dâu');
```

### Step 2: Tạo Households

```sql
INSERT INTO households (id, name) VALUES
  ('household-tin', 'Gia đình Tín'),
  ('household-anh', 'Gia đình Anh');
```

### Step 3: Thêm Members vào Households

```sql
-- Gia đình Tín
INSERT INTO household_members (household_id, user_id, role) VALUES
  ('household-tin', 'user-tin', 'owner'),
  ('household-tin', 'user-vo', 'member');

-- Gia đình Anh
INSERT INTO household_members (household_id, user_id, role) VALUES
  ('household-anh', 'user-anh', 'owner'),
  ('household-anh', 'user-chi', 'member');
```

### Step 4: Tạo Room "Nhà Chung"

```sql
INSERT INTO rooms (id, name, type, split_method, split_by) VALUES
  ('room-shared', 'Nhà Chung', 'SHARED', 'EQUAL', 'HOUSEHOLD');
  --                                                    ↑
  --                                    Quan trọng: Tính theo HOUSEHOLD!
```

### Step 5: Thêm Households vào Room

```sql
-- Lưu ý: Thêm HOUSEHOLD, không phải USER!
INSERT INTO room_members (room_id, household_id, role) VALUES
  ('room-shared', 'household-tin', 'owner'),
  ('room-shared', 'household-anh', 'viewer');
```

## 💰 Transactions trong tháng 12

### Gia đình Tín chi tiêu

```sql
-- Bạn (Tín) chi 100k
INSERT INTO transactions (
  room_id, amount, note, category_id, paid_by, created_by, date
) VALUES (
  'room-shared', 
  100000, 
  'Tiền điện tháng 12', 
  'category-dien-nuoc',
  'user-tin',      -- Bạn rút ví
  'user-tin',      -- Bạn tạo record
  '2024-12-05'
);

-- Vợ chi 100k
INSERT INTO transactions (
  room_id, amount, note, category_id, paid_by, created_by, date
) VALUES (
  'room-shared', 
  100000, 
  'Tiền nước tháng 12', 
  'category-dien-nuoc',
  'user-vo',       -- Vợ rút ví
  'user-vo',       -- Vợ tạo record
  '2024-12-10'
);
```

### Gia đình Anh chi tiêu

```sql
-- Anh chi 150k
INSERT INTO transactions (
  room_id, amount, note, category_id, paid_by, created_by, date
) VALUES (
  'room-shared', 
  150000, 
  'Tiền internet', 
  'category-internet',
  'user-anh',
  'user-anh',
  '2024-12-08'
);

-- Chị chi 50k
INSERT INTO transactions (
  room_id, amount, note, category_id, paid_by, created_by, date
) VALUES (
  'room-shared', 
  50000, 
  'Đồ dùng bếp', 
  'category-do-dung',
  'user-chi',
  'user-chi',
  '2024-12-15'
);
```

## 🧮 Settlement Calculation

### Query 1: Tổng chi tiêu

```sql
SELECT SUM(amount) as total
FROM transactions
WHERE room_id = 'room-shared'
  AND date >= '2024-12-01'
  AND date < '2025-01-01'
  AND is_deleted = false;
```

**Result:** `400,000 VND`

### Query 2: Số households

```sql
SELECT COUNT(*) as household_count
FROM room_members
WHERE room_id = 'room-shared'
  AND household_id IS NOT NULL;
```

**Result:** `2 households`

### Query 3: Mỗi household phải chịu

```
400,000 / 2 = 200,000 VND/household
```

### Query 4: Tính từng household đã chi

```sql
-- Tạo view helper
CREATE VIEW user_households AS
SELECT 
  hm.user_id,
  hm.household_id,
  h.name as household_name
FROM household_members hm
JOIN households h ON hm.household_id = h.id;

-- Query chi tiêu theo household
SELECT 
  uh.household_id,
  uh.household_name,
  SUM(t.amount) as total_paid,
  COUNT(t.id) as transaction_count
FROM transactions t
JOIN user_households uh ON t.paid_by = uh.user_id
WHERE t.room_id = 'room-shared'
  AND t.date >= '2024-12-01'
  AND t.date < '2025-01-01'
  AND t.is_deleted = false
GROUP BY uh.household_id, uh.household_name;
```

**Result:**

| household_id | household_name | total_paid | transaction_count |
|--------------|----------------|------------|-------------------|
| household-tin | Gia đình Tín | 200,000 | 2 |
| household-anh | Gia đình Anh | 200,000 | 2 |

### Query 5: Tính balance

```sql
WITH household_totals AS (
  SELECT 
    uh.household_id,
    uh.household_name,
    SUM(t.amount) as total_paid
  FROM transactions t
  JOIN user_households uh ON t.paid_by = uh.user_id
  WHERE t.room_id = 'room-shared'
    AND t.date >= '2024-12-01'
    AND t.date < '2025-01-01'
    AND t.is_deleted = false
  GROUP BY uh.household_id, uh.household_name
),
room_stats AS (
  SELECT 
    SUM(amount) as total_spent,
    COUNT(DISTINCT rm.household_id) as household_count
  FROM transactions t
  JOIN room_members rm ON t.room_id = rm.room_id
  WHERE t.room_id = 'room-shared'
    AND t.date >= '2024-12-01'
    AND t.date < '2025-01-01'
    AND t.is_deleted = false
    AND rm.household_id IS NOT NULL
)
SELECT 
  ht.household_name,
  ht.total_paid,
  (rs.total_spent / rs.household_count) as should_pay,
  (ht.total_paid - (rs.total_spent / rs.household_count)) as balance
FROM household_totals ht
CROSS JOIN room_stats rs;
```

**Result:**

| household_name | total_paid | should_pay | balance |
|----------------|------------|------------|---------|
| Gia đình Tín | 200,000 | 200,000 | 0 |
| Gia đình Anh | 200,000 | 200,000 | 0 |

**Kết luận:** ✅ Hòa nhau! Không ai nợ ai.

## 📊 Visual Breakdown

```
┌─────────────────────────────────────────────────────────┐
│                    NHÀCHUNG                            │
│                   (Room SHARED)                         │
│                                                         │
│  Split by: HOUSEHOLD                                    │
│  Split method: EQUAL                                    │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ Gia đình Tín  │       │ Gia đình Anh  │
│ (Household 1) │       │ (Household 2) │
└───────────────┘       └───────────────┘
        │                       │
    ┌───┴───┐               ┌───┴───┐
    │       │               │       │
    ▼       ▼               ▼       ▼
  ┌───┐   ┌───┐           ┌───┐   ┌───┐
  │Tín│   │Vợ │           │Anh│   │Chị│
  └───┘   └───┘           └───┘   └───┘
   100k    100k            150k    50k
    │       │               │       │
    └───┬───┘               └───┬───┘
        │                       │
        ▼                       ▼
    200,000 VND             200,000 VND
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
            Total: 400,000 VND
                    │
            ┌───────┴───────┐
            │               │
        200k/hộ         200k/hộ
            │               │
            ▼               ▼
        Balance: 0      Balance: 0
            ✅              ✅
```

## 🎯 Case khác: Không hòa

**Scenario:** Gia đình Tín chi nhiều hơn

```sql
-- Tín chi 150k
INSERT INTO transactions (...) VALUES (..., 150000, ...);

-- Vợ chi 100k
INSERT INTO transactions (...) VALUES (..., 100000, ...);

-- Anh chi 100k
INSERT INTO transactions (...) VALUES (..., 100000, ...);

-- Chị chi 50k
INSERT INTO transactions (...) VALUES (..., 50000, ...);
```

**Calculation:**

```
Total: 400,000 VND
Households: 2
Should pay: 400,000 / 2 = 200,000 VND/household

Gia đình Tín paid: 250,000 (Tín 150k + Vợ 100k)
Gia đình Anh paid: 150,000 (Anh 100k + Chị 50k)

Balance:
- Gia đình Tín: 250,000 - 200,000 = +50,000 (được nhận lại)
- Gia đình Anh: 150,000 - 200,000 = -50,000 (phải trả thêm)

→ Gia đình Anh nợ Gia đình Tín 50,000 VND
```

## 📱 UI Display

### Dashboard

```
┌─────────────────────────────────────┐
│ 🏠 Nhà Chung                        │
│                                     │
│ Tháng 12/2024                       │
│                                     │
│ 💰 Tổng chi: 400,000đ               │
│                                     │
│ 👥 Gia đình bạn                     │
│    Chi: 200,000đ                    │
│    Phải chịu: 200,000đ              │
│    ✅ Hòa                           │
│                                     │
│ 👥 Gia đình Anh                     │
│    Chi: 200,000đ                    │
│    Phải chịu: 200,000đ              │
│    ✅ Hòa                           │
└─────────────────────────────────────┘
```

### Transaction List

```
┌─────────────────────────────────────┐
│ Giao dịch gần đây                   │
│                                     │
│ 15/12 - Đồ dùng bếp                │
│ 50,000đ - Chị dâu                   │
│ 🏠 Gia đình Anh                     │
│                                     │
│ 10/12 - Tiền nước                   │
│ 100,000đ - Vợ Tín                   │
│ 🏠 Gia đình Tín                     │
│                                     │
│ 08/12 - Tiền internet               │
│ 150,000đ - Anh Tín                  │
│ 🏠 Gia đình Anh                     │
│                                     │
│ 05/12 - Tiền điện                   │
│ 100,000đ - Tín                      │
│ 🏠 Gia đình Tín                     │
└─────────────────────────────────────┘
```

## ✅ Advantages

1. **Tự động gộp**: Không cần tính thủ công vợ + chồng
2. **Minh bạch**: Vẫn thấy từng người chi bao nhiêu
3. **Linh hoạt**: Có thể switch sang tính theo user nếu cần
4. **Chính xác**: Database tự tính, không sai sót

## 🎓 Summary

**Với household logic:**
- ✅ Bạn + Vợ = 1 household
- ✅ Anh + Chị = 1 household
- ✅ Room tính theo household
- ✅ Settlement tự động gộp
- ✅ Kết quả chính xác

**Case của bạn hoàn toàn OK!** 🎉
