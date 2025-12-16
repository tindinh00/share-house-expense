# 📱 PWA Setup - Progressive Web App

## Tổng quan

App này đã được config sẵn PWA, có thể cài đặt như native app trên iPhone/Android.

## Đã có sẵn

### 1. Manifest.json ✅
File: `public/manifest.json`

```json
{
  "name": "Share House Expense",
  "short_name": "House Expense",
  "description": "Quản lý chi tiêu nhà chung",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Meta Tags ✅
File: `app/layout.tsx`

```tsx
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<meta name="theme-color" content="#10b981" />
<link rel="manifest" href="/manifest.json" />
```

### 3. Icons ✅
- `public/icon-192.png` - Icon 192x192
- `public/icon-512.png` - Icon 512x512 (cần tạo)

## Cài đặt trên iPhone

### Bước 1: Mở Safari
- **Quan trọng**: Phải dùng Safari, không phải Chrome
- Vào URL: `https://your-app.vercel.app`

### Bước 2: Add to Home Screen
1. Click nút **Share** (icon mũi tên lên ở bottom bar)
2. Scroll xuống trong menu
3. Click **"Add to Home Screen"**
4. Đặt tên app (hoặc giữ nguyên)
5. Click **"Add"**

### Bước 3: Mở app
- Icon xuất hiện trên Home Screen
- Click để mở
- App mở full screen (không có Safari bar)

## Cài đặt trên Android

### Bước 1: Mở Chrome
- Vào URL: `https://your-app.vercel.app`

### Bước 2: Install
- Chrome sẽ tự động hiện banner "Add to Home Screen"
- Hoặc: Menu (3 dots) → "Install app"

### Bước 3: Mở app
- Icon xuất hiện trên Home Screen
- Mở như native app

## Features PWA

### ✅ Đã có:
1. **Standalone Mode**: Mở full screen, không có browser bar
2. **App Icon**: Icon riêng trên home screen
3. **Splash Screen**: Màn hình loading khi mở app
4. **Theme Color**: Màu theme bar (xanh lá)
5. **Responsive**: Tự động adapt với mọi màn hình

### 🔄 Có thể thêm:
1. **Offline Support**: Service Worker để cache data
2. **Push Notifications**: Thông báo khi có giao dịch mới
3. **Background Sync**: Sync data khi online lại
4. **Install Prompt**: Custom install button

## Tạo Icons

### Cần tạo icon 512x512:

**Option 1: Dùng online tool**
1. Vào https://realfavicongenerator.net/
2. Upload logo/icon
3. Generate và download
4. Đổi tên thành `icon-512.png`
5. Copy vào `public/`

**Option 2: Dùng design tool**
1. Tạo canvas 512x512px
2. Design icon (đơn giản, dễ nhận diện)
3. Export PNG
4. Save as `public/icon-512.png`

**Gợi ý design:**
- Background: Xanh lá (#10b981)
- Icon: 🏠 hoặc 💰
- Text: "SHE" (Share House Expense)

## Service Worker (Optional)

Để thêm offline support, tạo file `public/sw.js`:

```javascript
// Service Worker for offline support
const CACHE_NAME = 'share-house-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/transactions',
  '/reports',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

Và register trong `app/layout.tsx`:

```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

## Testing PWA

### Lighthouse Audit
1. Mở Chrome DevTools
2. Tab "Lighthouse"
3. Select "Progressive Web App"
4. Click "Generate report"

### Checklist:
- ✅ Manifest.json valid
- ✅ Icons có đủ sizes
- ✅ HTTPS enabled
- ✅ Responsive design
- ✅ Fast loading
- ⬜ Service Worker (optional)
- ⬜ Offline support (optional)

## Troubleshooting

### Icon không hiện
→ Check file path: `/icon-192.png` và `/icon-512.png`
→ Clear browser cache

### "Add to Home Screen" không hiện
→ Phải dùng HTTPS (Vercel tự động có)
→ Phải có manifest.json valid
→ Trên iPhone: Phải dùng Safari

### App không mở full screen
→ Check `display: "standalone"` trong manifest.json
→ Reinstall app

### Theme color không đúng
→ Check `theme_color` trong manifest.json
→ Check `<meta name="theme-color">` trong HTML

## Best Practices

1. **Icon Design**: Đơn giản, dễ nhận diện, contrast tốt
2. **Loading Speed**: Optimize images, lazy loading
3. **Offline UX**: Hiển thị message khi offline
4. **Update Strategy**: Prompt user khi có version mới
5. **Analytics**: Track install rate, usage

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- [Icon Generator](https://realfavicongenerator.net/)
- [Service Worker Guide](https://developers.google.com/web/fundamentals/primers/service-workers)
