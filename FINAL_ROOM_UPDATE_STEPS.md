# Final Room Update Steps - Thay thế Members Card UI

## ✅ Đã hoàn thành

1. ✅ Thêm interfaces (HouseholdMember)
2. ✅ Thêm states (householdMembers, userHouseholds, selectedHouseholdId)
3. ✅ Update loadRoomDetails function (load households based on split_by)
4. ✅ Thêm handleInviteHousehold function
5. ✅ Thêm handleRemoveHousehold function

## 🔧 Cần làm thủ công

### Bước cuối: Thay thế Members Card UI

**File:** `app/(dashboard)/rooms/[id]/page.tsx`

**Tìm đoạn code:**
```tsx
      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Thành viên ({members.length})</CardTitle>
```

**Thay thế toàn bộ Card đó bằng code trong file:**
`ROOM_MEMBERS_CARD_UI.tsx`

### Hoặc tìm theo pattern:

1. Tìm comment `{/* Members */}`
2. Thay thế toàn bộ `<Card>...</Card>` đó
3. Paste code từ `ROOM_MEMBERS_CARD_UI.tsx`

## Test Checklist

Sau khi update:

### Test với split_by = USER (hiện tại)
- [ ] Hiển thị "Thành viên" trong title
- [ ] Hiển thị danh sách users
- [ ] Button "Mời thành viên" hoạt động
- [ ] Dialog mời member bằng email
- [ ] Xóa member hoạt động

### Test với split_by = HOUSEHOLD (sau khi tạo room mới)
- [ ] Hiển thị "Hộ gia đình" trong title
- [ ] Hiển thị danh sách households
- [ ] Button "Thêm hộ" hoạt động
- [ ] Dialog chọn household từ dropdown
- [ ] Hiển thị số thành viên trong mỗi hộ
- [ ] Xóa household hoạt động

## Lưu ý

- Room hiện tại có `split_by = 'USER'` (default)
- Để test household, cần:
  1. Tạo household ở `/households/create`
  2. Thêm thành viên vào household
  3. Tạo room mới với `split_by = 'HOUSEHOLD'` (cần update create room page)

## Next: Update Create Room Page

Cần thêm option chọn split_by khi tạo room:

```tsx
<div className="space-y-2">
  <Label>Chia theo</Label>
  <RadioGroup value={splitBy} onValueChange={setSplitBy}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="USER" id="user" />
      <Label htmlFor="user">
        👤 Theo người
        <p className="text-xs text-gray-500">Chia đều cho từng người</p>
      </Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="HOUSEHOLD" id="household" />
      <Label htmlFor="household">
        👨‍👩‍👧‍👦 Theo hộ gia đình
        <p className="text-xs text-gray-500">Chia đều cho từng hộ</p>
      </Label>
    </div>
  </RadioGroup>
</div>
```

---

**Status:** 95% hoàn thành  
**Còn lại:** Thay thế Members Card UI (1 bước)
