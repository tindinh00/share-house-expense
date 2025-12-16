# Household UI Implementation - Quản lý Hộ Gia Đình

**Ngày:** 16/12/2024  
**Status:** 🚧 ĐANG PHÁT TRIỂN (Phase 1 hoàn thành)

## Tổng quan

Tính năng Hộ Gia Đình cho phép chia chi tiêu theo hộ thay vì theo từng người.

**Ví dụ:**
- Room có 2 hộ: Hộ A (2 người), Hộ B (1 người)
- Chi 1.5 triệu → Mỗi hộ trả 750k
- Hộ A: 2 người chia 750k = 375k/người
- Hộ B: 1 người trả 750k

## Phase 1: UI Cơ Bản ✅

### 1. Trang Households (`/households`)

**Features:**
- Hiển thị danh sách hộ gia đình của user
- Card với icon, tên, số thành viên
- Badge "Chủ hộ" cho owner
- Empty state với CTA
- Responsive grid layout

**UI Components:**
- Card grid (1 col mobile, 2 cols tablet, 3 cols desktop)
- Icon: 👨‍👩‍👧‍👦
- Button: "Tạo hộ mới"
- Link: "Xem chi tiết"

### 2. Trang Create Household (`/households/create`)

**Features:**
- Form tạo hộ gia đình mới
- Input: Tên hộ (max 100 ký tự)
- Auto add creator as owner
- Info box với lưu ý
- Redirect to detail page sau khi tạo

**Validation:**
- Tên không được rỗng
- Max 100 ký tự
- Trim whitespace

### 3. Sidebar Navigation

Thêm menu item:
```
👨‍👩‍👧‍👦 Hộ gia đình → /households
```

## Database Schema (Đã có sẵn)

```sql
-- Households table
CREATE TABLE households (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members
CREATE TABLE household_members (
  id UUID PRIMARY KEY,
  household_id UUID REFERENCES households,
  user_id UUID REFERENCES profiles,
  role TEXT CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Room members (support household)
CREATE TABLE room_members (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms,
  user_id UUID REFERENCES profiles,
  household_id UUID REFERENCES households, -- NEW
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND household_id IS NULL) OR
    (user_id IS NULL AND household_id IS NOT NULL)
  )
);
```

## Phase 2: TODO 🚧

### 1. Household Detail Page (`/households/[id]`)

**Features cần làm:**
- Hiển thị thông tin hộ
- Danh sách thành viên
- Thêm thành viên (search by email)
- Xóa thành viên (chỉ owner)
- Sửa tên hộ (chỉ owner)
- Xóa hộ (chỉ owner, confirm)

**UI:**
```tsx
<HouseholdDetailPage>
  <Header>
    <Icon>👨‍👩‍👧‍👦</Icon>
    <Name>Gia đình Nguyễn Văn A</Name>
    <Badge>Chủ hộ</Badge>
  </Header>

  <Card title="Cài đặt">
    <Input label="Tên hộ" />
    <Button>Lưu</Button>
    <Button variant="destructive">Xóa hộ</Button>
  </Card>

  <Card title="Thành viên (3)">
    <MemberList>
      <Member>
        <Avatar>A</Avatar>
        <Name>Nguyễn Văn A</Name>
        <Badge>Chủ hộ</Badge>
      </Member>
      <Member>
        <Avatar>B</Avatar>
        <Name>Nguyễn Văn B</Name>
        <Button>Xóa</Button>
      </Member>
    </MemberList>
    <Button>➕ Mời thành viên</Button>
  </Card>
</HouseholdDetailPage>
```

### 2. Update Create Room

Thêm option chọn split_by:

```tsx
<RadioGroup label="Chia theo">
  <Radio value="USER">
    👤 Theo người
    <Description>Chia đều cho từng người</Description>
  </Radio>
  <Radio value="HOUSEHOLD">
    👨‍👩‍👧‍👦 Theo hộ gia đình
    <Description>Chia đều cho từng hộ</Description>
  </Radio>
</RadioGroup>
```

### 3. Update Room Detail

Khi `split_by = HOUSEHOLD`:
- Hiển thị danh sách hộ thay vì người
- Thêm hộ vào room (thay vì thêm người)
- Hiển thị số người trong mỗi hộ

```tsx
<Card title="Hộ gia đình trong room (2)">
  <HouseholdItem>
    <Icon>👨‍👩‍👧‍👦</Icon>
    <Name>Gia đình A</Name>
    <Count>2 người</Count>
    <Button>Xóa</Button>
  </HouseholdItem>
</Card>
```

### 4. Update Dashboard

Khi room chia theo HOUSEHOLD:
- Tính cân đối theo hộ
- Hiển thị "Hộ của bạn được trả" / "Hộ của bạn cần trả"

### 5. Update Transaction Form

Khi room chia theo HOUSEHOLD:
- Dropdown "Hộ trả" thay vì "Người trả"
- Hiển thị tên hộ + số người

## Files Đã Tạo

1. `app/(dashboard)/households/page.tsx`
   - Danh sách hộ gia đình
   - Empty state
   - Responsive grid

2. `app/(dashboard)/households/create/page.tsx`
   - Form tạo hộ mới
   - Validation
   - Auto add owner

3. `components/layout/Sidebar.tsx`
   - Thêm menu "Hộ gia đình"

## Testing Checklist

Phase 1:
- [x] Trang households hiển thị đúng
- [x] Empty state hiển thị
- [x] Tạo hộ mới thành công
- [x] Owner được add tự động
- [x] Redirect đúng sau khi tạo
- [x] Responsive trên mobile
- [x] Menu sidebar có "Hộ gia đình"

Phase 2 (TODO):
- [ ] Household detail page
- [ ] Thêm/xóa thành viên
- [ ] Sửa/xóa hộ
- [ ] Chọn split_by khi tạo room
- [ ] Room detail với households
- [ ] Dashboard tính cân đối theo hộ
- [ ] Transaction form với household

## Next Steps

1. **Tạo Household Detail Page**
   - UI hiển thị thông tin
   - Danh sách thành viên
   - CRUD operations

2. **Update Create Room**
   - Thêm radio group chọn split_by
   - Conditional rendering based on split_by

3. **Update Room Detail**
   - Hiển thị households nếu split_by = HOUSEHOLD
   - Thêm/xóa household

4. **Update Dashboard Logic**
   - Tính cân đối theo household
   - Hiển thị đúng thông tin

5. **Update Transaction Form**
   - Dropdown household thay vì user
   - Validation

---

**Status:** Phase 1 hoàn thành ✅  
**Next:** Household Detail Page
