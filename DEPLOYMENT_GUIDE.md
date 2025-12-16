# 🚀 Deployment Guide - Deploy to Vercel

## Bước 1: Chuẩn bị

### 1.1. Đảm bảo code đã push lên GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1.2. Có tài khoản Vercel
- Vào https://vercel.com
- Sign up/Login với GitHub account

## Bước 2: Deploy lên Vercel

### 2.1. Import Project
1. Vào Vercel Dashboard
2. Click **"Add New..."** → **"Project"**
3. Chọn repository: `tindinh00/share-house-expense`
4. Click **"Import"**

### 2.2. Configure Project
1. **Framework Preset**: Next.js (tự động detect)
2. **Root Directory**: `./` (default)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)

### 2.3. Environment Variables
Click **"Environment Variables"** và thêm:

```
NEXT_PUBLIC_SUPABASE_URL=https://yeksmvujygzawansdmvq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Lấy từ đâu?**
- Vào Supabase Dashboard
- Project Settings → API
- Copy `URL` và `anon public` key

### 2.4. Deploy
1. Click **"Deploy"**
2. Đợi 2-3 phút
3. Done! 🎉

## Bước 3: Cấu hình Supabase

### 3.1. Update Site URL
1. Vào Supabase Dashboard
2. Authentication → URL Configuration
3. **Site URL**: `https://your-app.vercel.app`
4. **Redirect URLs**: Thêm:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app`

### 3.2. Update Google OAuth (nếu dùng)
1. Vào Google Cloud Console
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. **Authorized redirect URIs**: Thêm
   - `https://yeksmvujygzawansdmvq.supabase.co/auth/v1/callback`

## Bước 4: Test Deployment

### 4.1. Mở app trên browser
```
https://your-app.vercel.app
```

### 4.2. Test các tính năng:
- ✅ Login/Signup
- ✅ Google OAuth
- ✅ Create room
- ✅ Add transaction
- ✅ View reports

## Bước 5: Setup cho iPhone (PWA)

### 5.1. Mở Safari trên iPhone
1. Vào `https://your-app.vercel.app`
2. Click nút **Share** (icon mũi tên lên)
3. Scroll xuống → Click **"Add to Home Screen"**
4. Đặt tên app → Click **"Add"**

### 5.2. App sẽ xuất hiện trên Home Screen
- Icon: 🏠 (từ manifest.json)
- Tên: "Share House Expense"
- Mở như native app (không có browser bar)

### 5.3. Features PWA:
- ✅ Offline support (service worker)
- ✅ Install to home screen
- ✅ Full screen mode
- ✅ Fast loading
- ✅ Push notifications (future)

## Bước 6: Custom Domain (Optional)

### 6.1. Mua domain
- Namecheap, GoDaddy, etc.
- Ví dụ: `sharehouse.app`

### 6.2. Add domain to Vercel
1. Vercel Dashboard → Project → Settings
2. Domains → Add Domain
3. Nhập domain name
4. Follow instructions để config DNS

### 6.3. Update Supabase URLs
- Update Site URL và Redirect URLs với domain mới

## Troubleshooting

### Lỗi: "Invalid redirect URL"
→ Check Supabase Redirect URLs có đúng không

### Lỗi: "Supabase connection failed"
→ Check Environment Variables trên Vercel

### Lỗi: Build failed
→ Check logs trên Vercel Dashboard
→ Có thể thiếu dependencies

### App không load trên iPhone
→ Check HTTPS (Vercel tự động có SSL)
→ Clear Safari cache

## Auto Deploy

Mỗi khi push code lên GitHub:
1. Vercel tự động detect
2. Build và deploy
3. Nhận notification khi done
4. Preview URL cho mỗi PR

## Monitoring

### Vercel Analytics
- Vào Project → Analytics
- Xem traffic, performance, errors

### Supabase Logs
- Vào Supabase → Logs
- Xem API calls, errors

## Best Practices

1. **Environment Variables**: Không commit `.env.local` lên GitHub
2. **Database Migrations**: Chạy migrations trước khi deploy
3. **Testing**: Test trên staging trước khi deploy production
4. **Monitoring**: Setup alerts cho errors
5. **Backup**: Backup database thường xuyên

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Setup PWA for iPhone
3. 📧 Setup email notifications
4. 📊 Setup analytics
5. 🔔 Setup push notifications
6. 🌐 Add custom domain
