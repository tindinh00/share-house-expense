# Toast Implementation Guide

## Tổng quan

App sử dụng thư viện `sonner` để hiển thị toast notifications.

## Cấu hình

### 1. Toaster Component
File: `components/ui/sonner.tsx`

```tsx
import { Toaster as Sonner } from "sonner"

const Toaster = () => {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      expand={false}
      duration={3000}
    />
  )
}
```

### 2. Đã thêm Toaster vào layouts

- **Dashboard Layout**: `app/(dashboard)/layout.tsx`
- **Auth Layout**: `app/(auth)/layout.tsx`

## Cách sử dụng

### Import toast
```tsx
import { toast } from 'sonner';
```

### Các loại toast

```tsx
// Success
toast.success('🎉 Thành công!', { duration: 3000 });

// Error
toast.error('❌ Có lỗi xảy ra!', { duration: 4000 });

// Info
toast.info('ℹ️ Thông tin', { duration: 3000 });

// Warning
toast.warning('⚠️ Cảnh báo', { duration: 3000 });

// Default
toast('👋 Thông báo', { duration: 3000 });
```

## Các trường hợp sử dụng trong app

### 1. Đăng nhập thành công (Google OAuth hoặc Magic Link)

**Flow:**
1. User đăng nhập → Auth callback → Redirect đến `/dashboard?login=success`
2. `DashboardClient` component kiểm tra query param
3. Hiển thị toast: "🎉 Chào mừng [username] quay lại!"
4. Clean URL bằng `router.replace('/dashboard')`

**File:** `app/(dashboard)/dashboard/DashboardClient.tsx`

### 2. Đăng xuất thành công

**Flow:**
1. User click "Đăng xuất" → POST `/auth/signout`
2. Signout route xử lý → Redirect đến `/login?logout=success`
3. Login page kiểm tra query param
4. Hiển thị toast: "👋 Đã đăng xuất thành công!"
5. Clean URL bằng `window.history.replaceState()`

**File:** `app/(auth)/login/page.tsx`

### 3. Lỗi authentication

**Flow:**
1. Nếu có lỗi → Redirect đến `/login?error=[message]`
2. Login page hiển thị toast error
3. Clean URL

## Test Toast

Truy cập `/test-toast` để test các loại toast:
- Success toast
- Error toast
- Info toast
- Default toast

## Lưu ý

1. **Duration mặc định**: 3000ms (3 giây)
2. **Position**: top-center
3. **Rich colors**: Enabled (màu sắc tự động theo loại toast)
4. **Close button**: Có nút đóng
5. **Clean URL**: Luôn clean query params sau khi hiển thị toast để tránh toast hiện lại khi refresh

## Troubleshooting

### Toast không hiển thị?

1. Kiểm tra `<Toaster />` đã được thêm vào layout chưa
2. Kiểm tra import: `import { toast } from 'sonner'`
3. Kiểm tra component có `'use client'` directive chưa
4. Mở console để xem có lỗi không

### Toast hiển thị nhiều lần?

- Đảm bảo useEffect có dependency array đúng
- Clean URL sau khi hiển thị toast
- Kiểm tra component không bị re-render nhiều lần

## Mở rộng

### Thêm toast cho các tính năng khác:

```tsx
// Thêm transaction thành công
toast.success('✅ Đã thêm giao dịch!');

// Xóa transaction
toast.success('🗑️ Đã xóa giao dịch!');

// Cập nhật profile
toast.success('💾 Đã lưu thay đổi!');

// Tạo household
toast.success('🏠 Đã tạo household mới!');

// Mời thành viên
toast.success('📧 Đã gửi lời mời!');
```

### Custom toast với action button:

```tsx
toast.success('Đã xóa giao dịch!', {
  action: {
    label: 'Hoàn tác',
    onClick: () => {
      // Restore transaction
    }
  }
});
```

### Loading toast:

```tsx
const toastId = toast.loading('Đang xử lý...');

// Sau khi xong
toast.success('Hoàn thành!', { id: toastId });
// hoặc
toast.error('Lỗi!', { id: toastId });
```

## Resources

- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [Sonner GitHub](https://github.com/emilkowalski/sonner)
