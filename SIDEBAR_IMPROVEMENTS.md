# Sidebar Improvements - Toggle & Overlay

**Ngày:** 16/12/2024  
**Status:** ✅ HOÀN THÀNH

## Vấn đề

1. **Mobile**: Sidebar mở ra nhưng overlay quá mờ, vẫn thấy content phía sau
2. **Desktop**: Không có nút để toggle sidebar, phải dùng nút mobile ở góc

## Giải pháp

### 1. Tạo DashboardShell Component

Tạo wrapper component để share state giữa Header và Sidebar:

```tsx
// components/layout/DashboardShell.tsx
'use client';

export default function DashboardShell({ user, profile, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main>{children}</main>
    </>
  );
}
```

**Lý do:** Layout là server component, không thể dùng useState. Cần wrapper client component.

### 2. Thêm Hamburger Button vào Header

```tsx
// components/layout/Header.tsx
interface HeaderProps {
  onMenuClick: () => void; // NEW
}

<button
  onClick={onMenuClick}
  className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100"
>
  <svg>☰</svg> {/* Hamburger icon */}
</button>
```

**Vị trí:** Bên trái logo, chỉ hiển thị trên desktop (hidden md:flex)

### 3. Update Sidebar với Props

```tsx
// components/layout/Sidebar.tsx
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Không cần useState nữa, dùng props
}
```

### 4. Overlay Đậm Hơn trên Mobile

```tsx
{/* Overlay */}
{isOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-60 z-40 md:bg-opacity-30"
    onClick={onClose}
  />
)}
```

**Opacity:**
- **Mobile**: `bg-opacity-60` (60% đen - đậm hơn)
- **Desktop**: `md:bg-opacity-30` (30% đen - nhẹ hơn)

### 5. Floating Button Animation

```tsx
<button
  onClick={onClose}
  className="md:hidden fixed bottom-4 right-4 z-50 bg-green-600 text-white p-4 rounded-full"
>
  <svg className={`transition-transform ${isOpen ? 'rotate-45' : ''}`}>
    {isOpen ? <X /> : <Menu />}
  </svg>
</button>
```

**Animation:**
- Icon thay đổi: Menu (☰) → Close (✕)
- Rotate 45° khi mở

### 6. Sidebar Z-Index

```tsx
<aside className="z-50"> {/* Tăng từ z-40 lên z-50 */}
```

**Lý do:** Sidebar phải nằm trên overlay (z-40)

## Flow Hoạt Động

### Mobile
```
1. User click nút floating (góc phải dưới)
   ↓
2. isSidebarOpen = true
   ↓
3. Overlay xuất hiện (bg-opacity-60 - đậm)
   ↓
4. Sidebar slide vào (translate-x-0)
   ↓
5. User click overlay hoặc link
   ↓
6. onClose() → isSidebarOpen = false
   ↓
7. Sidebar slide ra, overlay biến mất
```

### Desktop
```
1. User click hamburger button ở header
   ↓
2. isSidebarOpen = true
   ↓
3. Overlay xuất hiện (bg-opacity-30 - nhẹ)
   ↓
4. Sidebar vẫn ở vị trí (md:translate-x-0)
   ↓
5. User click overlay
   ↓
6. onClose() → isSidebarOpen = false
   ↓
7. Overlay biến mất
```

## Responsive Behavior

### Mobile (< 768px)
- Sidebar ẩn mặc định: `translate-x-full`
- Nút floating: Hiển thị (md:hidden)
- Hamburger header: Ẩn (hidden md:flex)
- Overlay: Đậm (bg-opacity-60)
- Sidebar z-index: 50 (trên overlay)

### Desktop (≥ 768px)
- Sidebar hiển thị mặc định: `md:translate-x-0`
- Nút floating: Ẩn (md:hidden)
- Hamburger header: Hiển thị (hidden md:flex)
- Overlay: Nhẹ (md:bg-opacity-30)
- Có thể toggle để tạo không gian

## CSS Classes Quan Trọng

```css
/* Overlay */
.bg-opacity-60          /* Mobile: 60% opacity */
.md:bg-opacity-30       /* Desktop: 30% opacity */

/* Sidebar */
.translate-x-0          /* Visible */
.-translate-x-full      /* Hidden (mobile) */
.md:translate-x-0       /* Always visible (desktop) */

/* Z-Index */
.z-40                   /* Overlay */
.z-50                   /* Sidebar & Button */

/* Transition */
.transition-transform   /* Smooth slide */
.duration-300           /* 300ms */
.ease-in-out            /* Smooth curve */
```

## Files Đã Tạo/Sửa

### Tạo mới:
1. `components/layout/DashboardShell.tsx`
   - Wrapper component với sidebar state
   - Share state giữa Header và Sidebar

### Sửa đổi:
1. `app/(dashboard)/layout.tsx`
   - Dùng DashboardShell thay vì Header + Sidebar riêng lẻ

2. `components/layout/Header.tsx`
   - Thêm prop `onMenuClick`
   - Thêm hamburger button (desktop only)

3. `components/layout/Sidebar.tsx`
   - Thêm props `isOpen` và `onClose`
   - Xóa internal state
   - Overlay đậm hơn trên mobile
   - Floating button animation

## Testing Checklist

- [x] Mobile: Overlay đậm (60%)
- [x] Desktop: Overlay nhẹ (30%)
- [x] Desktop: Hamburger button hoạt động
- [x] Mobile: Floating button hoạt động
- [x] Sidebar slide smooth
- [x] Click overlay → close
- [x] Click link → close
- [x] Icon animation (menu → close)
- [x] Z-index đúng (sidebar trên overlay)
- [x] Responsive breakpoints

## Kết quả

### Mobile
✅ Overlay đậm hơn (60% opacity)  
✅ Floating button với animation  
✅ Icon thay đổi khi mở/đóng  
✅ Sidebar slide mượt mà  

### Desktop
✅ Hamburger button ở header  
✅ Toggle sidebar để tạo không gian  
✅ Overlay nhẹ hơn (30% opacity)  
✅ Sidebar luôn accessible  

## UX Improvements

1. **Visual Feedback**: Icon thay đổi khi mở/đóng
2. **Overlay Contrast**: Đậm hơn trên mobile để focus vào sidebar
3. **Easy Access**: Hamburger button ở header (desktop)
4. **Smooth Animation**: Transition 300ms với ease-in-out
5. **Click Outside**: Click overlay để đóng sidebar

---

**Hoàn thành:** 16/12/2024  
**Tested on:** Mobile & Desktop
