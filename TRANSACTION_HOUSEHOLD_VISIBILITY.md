# Transaction Visibility for Households

## Vấn đề

Trong room có nhiều households, các household members cần:
- ✅ **Xem được** transactions của tất cả households trong room
- ❌ **Không được sửa/xóa** transactions của người khác
- ✅ **Chỉ được sửa/xóa** transactions của chính mình

## Giải pháp

Update transaction policies để:
1. **SELECT**: Cho phép xem transactions nếu user là member (trực tiếp hoặc qua household) của room
2. **INSERT**: Cho phép tạo transactions nếu user là member của room
3. **UPDATE**: Chỉ cho phép sửa transactions của chính mình
4. **DELETE**: Chỉ cho phép xóa transactions của chính mình

## Cách chạy

### Chạy SQL Migration

Vào Supabase Dashboard → SQL Editor, chạy file:
```
share-house-expense/supabase/migrations/fix_transaction_visibility_for_households.sql
```

## Kết quả

### Trước khi fix:
- User A trong Household 1 **KHÔNG** thấy transactions của User B trong Household 2 (cùng room)

### Sau khi fix:
- User A trong Household 1 **THẤY** transactions của User B trong Household 2 (cùng room)
- User A **KHÔNG THỂ** sửa/xóa transactions của User B
- User A **CHỈ CÓ THỂ** sửa/xóa transactions của chính mình

## Use Case

**Scenario:**
- Room: "Nhà chung ABC"
- Household 1: Gia đình A (User A1, User A2)
- Household 2: Gia đình B (User B1, User B2)

**Transactions:**
- User A1 tạo transaction: "Mua điện" - 500k
- User B1 tạo transaction: "Mua nước" - 300k

**Kết quả:**
- User A1, A2, B1, B2 đều **THẤY** cả 2 transactions
- User A1 chỉ **SỬA/XÓA** được "Mua điện"
- User B1 chỉ **SỬA/XÓA** được "Mua nước"

## Testing

1. **Test view transactions:**
   - Tạo room với 2 households
   - User từ household 1 tạo transaction
   - User từ household 2 phải thấy transaction đó

2. **Test edit restriction:**
   - User từ household 2 thử sửa transaction của household 1
   - Phải bị reject (không có nút Edit hoặc API trả lỗi)

3. **Test delete restriction:**
   - User từ household 2 thử xóa transaction của household 1
   - Phải bị reject (không có nút Delete hoặc API trả lỗi)

## SQL Policies

### SELECT Policy
```sql
-- User thấy transactions nếu:
-- 1. User là direct member của room
-- 2. User là member của household trong room
room_id IN (
  SELECT room_id FROM room_members WHERE user_id = auth.uid()
)
OR
room_id IN (
  SELECT rm.room_id 
  FROM room_members rm
  INNER JOIN household_members hm ON hm.household_id = rm.household_id
  WHERE hm.user_id = auth.uid()
)
```

### UPDATE/DELETE Policies
```sql
-- Chỉ cho phép sửa/xóa transactions của chính mình
created_by = auth.uid()
```
