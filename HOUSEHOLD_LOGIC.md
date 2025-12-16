# 🏠 Household Logic (Hộ gia đình)

## 📖 Concept

**Household** = Nhóm người trong cùng 1 gia đình, chi tiêu được tính chung.

### Use Case

```
Nhà Trọ Chung
├── Hộ 1: Bạn + Vợ
└── Hộ 2: Anh/Chị + Vợ/Chồng

Khi tính quyết toán:
- Không tính từng người
- Tính theo HỘ
```

## 🗄️ Database Structure

### New Tables

```sql
-- 1. Households (Hộ gia đình)
households
├── id
├── name (VD: "Gia đình Tín")
└── created_at

-- 2. Household Members (Thành viên hộ)
household_members
├── household_id
├── user_id
├── role (owner/member)
└── created_at
```

### Updated Tables

```sql
-- Rooms: Thêm split_by
rooms
├── ...existing fields
└── split_by: 'USER' | 'HOUSEHOLD'
    ↑ Quyết định tính theo user hay household

-- Room Members: Có thể join bằng user HOẶC household
room_members
├── room_id
├── user_id (nullable)
├── household_id (nullable)
└── role
    ↑ Chỉ 1 trong 2: user_id HOẶC household_id
```

## 📊 Data Flow Example

### Setup

```sql
-- 1. Tạo 4 users
INSERT INTO profiles (id, username) VALUES
  ('user-tin', 'Tín'),
  ('user-vo-tin', 'Vợ Tín'),
  ('user-anh', 'Anh Tín'),
  ('user-chi', 'Chị dâu');

-- 2. Tạo 2 households
INSERT INTO households (id, name) VALUES
  ('household-tin', 'Gia đình Tín'),
  ('household-anh', 'Gia đình Anh');

-- 3. Thêm members vào households
INSERT INTO household_members (household_id, user_id, role) VALUES
  ('household-tin', 'user-tin', 'owner'),
  ('household-tin', 'user-vo-tin', 'member'),
  ('household-anh', 'user-anh', 'owner'),
  ('household-anh', 'user-chi', 'member');

-- 4. Tạo room "Nhà Chung" với split_by = 'HOUSEHOLD'
INSERT INTO rooms (id, name, type, split_method, split_by) VALUES
  ('room-shared', 'Nhà Chung', 'SHARED', 'EQUAL', 'HOUSEHOLD');

-- 5. Thêm 2 HOUSEHOLDS vào room (không phải users!)
INSERT INTO room_members (room_id, household_id, role) VALUES
  ('room-shared', 'household-tin', 'owner'),
  ('room-shared', 'household-anh', 'viewer');
```

### Transactions

```sql
-- Tín chi 100k
INSERT INTO transactions (room_id, amount, note, paid_by, ...) VALUES
  ('room-shared', 100000, 'Tiền điện', 'user-tin', ...);

-- Vợ Tín chi 100k
INSERT INTO transactions (room_id, amount, note, paid_by, ...) VALUES
  ('room-shared', 100000, 'Tiền nước', 'user-vo-tin', ...);

-- Anh chi 150k
INSERT INTO transactions (room_id, amount, note, paid_by, ...) VALUES
  ('room-shared', 150000, 'Tiền internet', 'user-anh', ...);

-- Chị chi 50k
INSERT INTO transactions (room_id, amount, note, paid_by, ...) VALUES
  ('room-shared', 50000, 'Đồ dùng', 'user-chi', ...);
```

## 🧮 Settlement Calculation

### Step 1: Tổng chi tiêu

```sql
SELECT SUM(amount) as total
FROM transactions
WHERE room_id = 'room-shared'
  AND date >= '2024-12-01'
  AND date < '2025-01-01';

-- Result: 400,000 VND
```

### Step 2: Số households trong room

```sql
SELECT COUNT(*) as household_count
FROM room_members
WHERE room_id = 'room-shared'
  AND household_id IS NOT NULL;

-- Result: 2 households
```

### Step 3: Mỗi household phải chịu

```
400,000 / 2 = 200,000 VND/household
```

### Step 4: Tính từng household đã chi bao nhiêu

```sql
-- Tạo view để map user → household
CREATE VIEW user_households AS
SELECT 
  hm.user_id,
  hm.household_id,
  h.name as household_name
FROM household_members hm
JOIN households h ON hm.household_id = h.id;

-- Tính tổng chi của mỗi household
SELECT 
  uh.household_id,
  uh.household_name,
  SUM(t.amount) as total_paid
FROM transactions t
JOIN user_households uh ON t.paid_by = uh.user_id
WHERE t.room_id = 'room-shared'
  AND t.date >= '2024-12-01'
  AND t.date < '2025-01-01'
GROUP BY uh.household_id, uh.household_name;

-- Result:
-- household-tin (Gia đình Tín): 200,000 (Tín 100k + Vợ 100k)
-- household-anh (Gia đình Anh): 200,000 (Anh 150k + Chị 50k)
```

### Step 5: Tính balance

```
Gia đình Tín: 200,000 - 200,000 = 0 (Hòa)
Gia đình Anh: 200,000 - 200,000 = 0 (Hòa)

→ Không ai nợ ai!
```

## 🎯 Use Cases

### Case 1: Split by Household (Default cho nhà ở ghép)

```sql
-- Room config
split_by = 'HOUSEHOLD'
split_method = 'EQUAL'

-- Kết quả: Chia đều theo số households
2 households → 50/50
3 households → 33.33/33.33/33.33
```

### Case 2: Split by User (Cho nhóm bạn)

```sql
-- Room config
split_by = 'USER'
split_method = 'EQUAL'

-- Kết quả: Chia đều theo số users
4 users → 25/25/25/25
```

### Case 3: Household với tỷ lệ khác nhau

```sql
-- Room config
split_by = 'HOUSEHOLD'
split_method = 'PERCENTAGE'
split_config = {
  "household-tin": 0.6,  -- Gia đình bạn 60% (nhiều người hơn)
  "household-anh": 0.4   -- Gia đình anh 40%
}

-- Ví dụ: Tổng 400k
-- Gia đình Tín phải chịu: 400k * 0.6 = 240k
-- Gia đình Anh phải chịu: 400k * 0.4 = 160k
```

## 🔍 Query Examples

### 1. Lấy tất cả members của household

```sql
SELECT 
  p.username,
  hm.role
FROM household_members hm
JOIN profiles p ON hm.user_id = p.id
WHERE hm.household_id = 'household-tin';

-- Result:
-- Tín (owner)
-- Vợ Tín (member)
```

### 2. Lấy tất cả rooms mà household tham gia

```sql
SELECT 
  r.name,
  r.type,
  rm.role
FROM room_members rm
JOIN rooms r ON rm.room_id = r.id
WHERE rm.household_id = 'household-tin';

-- Result:
-- Nhà Chung (SHARED, owner)
```

### 3. Lấy tất cả transactions của household

```sql
SELECT 
  t.*,
  p.username as paid_by_name
FROM transactions t
JOIN user_households uh ON t.paid_by = uh.user_id
JOIN profiles p ON t.paid_by = p.id
WHERE uh.household_id = 'household-tin'
  AND t.room_id = 'room-shared'
ORDER BY t.date DESC;

-- Result:
-- 100k - Tiền điện - Tín
-- 100k - Tiền nước - Vợ Tín
```

### 4. Report theo household

```sql
SELECT 
  h.name as household_name,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_spent
FROM households h
JOIN household_members hm ON h.id = hm.household_id
JOIN transactions t ON hm.user_id = t.paid_by
WHERE t.room_id = 'room-shared'
  AND t.date >= '2024-12-01'
GROUP BY h.id, h.name;

-- Result:
-- Gia đình Tín: 2 transactions, 200,000 VND
-- Gia đình Anh: 2 transactions, 200,000 VND
```

## 🎨 UI Flow

### 1. Onboarding

```
Step 1: Tạo household
┌─────────────────────────────┐
│ Tạo hộ gia đình             │
│                             │
│ Tên hộ: [Gia đình Tín]     │
│                             │
│ [Tiếp tục]                  │
└─────────────────────────────┘

Step 2: Thêm members
┌─────────────────────────────┐
│ Thêm thành viên             │
│                             │
│ ✓ Tín (Bạn)                │
│ + Thêm vợ/chồng            │
│ + Thêm con                  │
│                             │
│ [Hoàn tất]                  │
└─────────────────────────────┘
```

### 2. Create Room

```
┌─────────────────────────────┐
│ Tạo không gian mới          │
│                             │
│ Tên: [Nhà Chung]           │
│                             │
│ Loại: ○ Cá nhân            │
│       ● Chia sẻ            │
│                             │
│ Tính theo:                  │
│ ○ Từng người               │
│ ● Từng hộ gia đình ✓       │
│                             │
│ [Tạo]                       │
└─────────────────────────────┘
```

### 3. Add Transaction

```
┌─────────────────────────────┐
│ Thêm chi tiêu               │
│                             │
│ Số tiền: [100,000]         │
│ Ghi chú: [Tiền điện]       │
│ Danh mục: [⚡ Điện nước]   │
│                             │
│ Ai trả:                     │
│ ● Tín (Bạn)                │
│ ○ Vợ Tín                   │
│                             │
│ [Lưu]                       │
└─────────────────────────────┘
```

### 4. Monthly Report

```
┌─────────────────────────────┐
│ Báo cáo tháng 12/2024       │
│                             │
│ 📊 Tổng chi: 400,000đ       │
│                             │
│ 🏠 Gia đình Tín             │
│    Chi: 200,000đ            │
│    Phải chịu: 200,000đ      │
│    Balance: 0đ ✓            │
│                             │
│ 🏠 Gia đình Anh             │
│    Chi: 200,000đ            │
│    Phải chịu: 200,000đ      │
│    Balance: 0đ ✓            │
│                             │
│ ✅ Đã quyết toán            │
└─────────────────────────────┘
```

## 🔐 RLS Policies Update

```sql
-- Users can view rooms their household is in
CREATE POLICY "view_household_rooms"
ON rooms FOR SELECT
USING (
  id IN (
    SELECT rm.room_id 
    FROM room_members rm
    JOIN household_members hm ON rm.household_id = hm.household_id
    WHERE hm.user_id = auth.uid()
  )
  OR
  id IN (
    SELECT room_id 
    FROM room_members 
    WHERE user_id = auth.uid()
  )
);

-- Users can view transactions in their household's rooms
CREATE POLICY "view_household_transactions"
ON transactions FOR SELECT
USING (
  room_id IN (
    SELECT rm.room_id 
    FROM room_members rm
    JOIN household_members hm ON rm.household_id = hm.household_id
    WHERE hm.user_id = auth.uid()
  )
  OR
  room_id IN (
    SELECT room_id 
    FROM room_members 
    WHERE user_id = auth.uid()
  )
);
```

## 💡 Benefits

### 1. Flexibility
- Có thể dùng cho cả nhà ở ghép (households) và nhóm bạn (users)
- Switch giữa 2 modes dễ dàng

### 2. Accuracy
- Tính toán chính xác theo hộ
- Không cần tính thủ công

### 3. Privacy
- Mỗi household có thể có room riêng
- Vợ chồng thấy chi tiêu của nhau trong household

### 4. Scalability
- Household có thể có nhiều members (vợ chồng + con)
- Room có thể có nhiều households

## 🎯 Implementation Priority

### Phase 1 (MVP)
- [ ] Basic household CRUD
- [ ] Add members to household
- [ ] Room with split_by = 'HOUSEHOLD'
- [ ] Settlement calculation by household

### Phase 2
- [ ] Household settings
- [ ] Remove members
- [ ] Transfer ownership
- [ ] Household statistics

### Phase 3
- [ ] Household budget limits
- [ ] Household categories
- [ ] Household reports
- [ ] Export by household

## 📝 Notes

- Một user chỉ thuộc 1 household (trong context của app này)
- Household owner có thể thêm/xóa members
- Khi tính settlement, tất cả transactions của members trong household được gộp lại
- UI cần rõ ràng khi nào tính theo user, khi nào theo household

---

**Với logic này, case của bạn hoàn toàn OK!** 🎉

Bạn + Vợ = 1 household → Chi 200k
Anh + Chị = 1 household → Chi 200k
→ Mỗi household chịu 200k → Hòa nhau!
