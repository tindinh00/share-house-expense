# 🔐 Google OAuth Setup Guide

## Bước 1: Tạo Google OAuth Credentials

### 1.1. Vào Google Cloud Console

1. Vào https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. Click "APIs & Services" → "Credentials"

### 1.2. Tạo OAuth 2.0 Client ID

1. Click "Create Credentials" → "OAuth client ID"
2. Nếu chưa có OAuth consent screen:
   - Click "Configure Consent Screen"
   - Chọn "External"
   - Điền thông tin:
     - App name: `Chi tiêu nhà chung`
     - User support email: Your email
     - Developer contact: Your email
   - Save and Continue
   - Scopes: Không cần thêm gì, Next
   - Test users: Thêm email của bạn (để test)
   - Save

3. Quay lại "Credentials" → "Create Credentials" → "OAuth client ID"
4. Application type: **Web application**
5. Name: `Share House Expense`
6. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-app.vercel.app
   ```
7. Authorized redirect URIs:
   ```
   https://yeksmvujygzawansdmvq.supabase.co/auth/v1/callback
   ```
   (Thay `yeksmvujygzawansdmvq` bằng project ID của bạn)

8. Click "Create"
9. Copy **Client ID** và **Client Secret**

---

## Bước 2: Config trong Supabase

### 2.1. Enable Google Provider

1. Vào Supabase Dashboard
2. **Authentication** → **Providers**
3. Tìm "Google" → Click để expand
4. Enable "Google enabled"
5. Paste:
   - **Client ID** (từ Google Console)
   - **Client Secret** (từ Google Console)
6. Click "Save"

### 2.2. Update Redirect URLs

1. Vào **Authentication** → **URL Configuration**
2. Thêm vào **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://your-app.vercel.app/auth/callback
   ```
3. **Site URL**: `http://localhost:3000` (hoặc production URL)
4. Click "Save"

---

## Bước 3: Test trên Local

### 3.1. Restart dev server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### 3.2. Test Google Login

1. Vào http://localhost:3000/login
2. Click "Đăng nhập với Google"
3. Chọn Google account
4. Phải redirect về `/dashboard`

---

## Bước 4: Test trên iPhone

### 4.1. Deploy lên Vercel (để có HTTPS)

```bash
git add .
git commit -m "Add Google OAuth"
git push

# Deploy on Vercel
vercel
```

### 4.2. Update Google Console

1. Vào Google Cloud Console → Credentials
2. Edit OAuth client ID
3. Thêm production URL vào:
   - Authorized JavaScript origins: `https://your-app.vercel.app`
   - Authorized redirect URIs: `https://yeksmvujygzawansdmvq.supabase.co/auth/v1/callback`

### 4.3. Update Supabase

1. Vào Supabase → Authentication → URL Configuration
2. Thêm production URL: `https://your-app.vercel.app/auth/callback`
3. Update Site URL: `https://your-app.vercel.app`

### 4.4. Test trên iPhone Safari

1. Mở Safari trên iPhone
2. Vào `https://your-app.vercel.app/login`
3. Click "Đăng nhập với Google"
4. Login với Google account
5. Phải redirect về dashboard

---

## 🎯 Lợi ích Google OAuth trên iPhone

### 1. Không cần nhập password
- Chỉ cần chọn Google account
- Tự động login

### 2. Nhanh hơn Magic Link
- Magic Link: Nhập email → Check email → Click link
- Google: Click button → Chọn account → Done

### 3. Sync với Google account
- Tự động lấy tên từ Google
- Tự động lấy avatar
- Không cần nhập thông tin

### 4. Bảo mật cao
- Google xử lý authentication
- Không lưu password
- 2FA tự động (nếu Google account có)

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"

**Nguyên nhân**: Redirect URI không khớp

**Fix**:
1. Check Google Console → Credentials → OAuth client ID
2. Đảm bảo có đúng redirect URI:
   ```
   https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
   ```
3. Không có trailing slash `/`
4. Phải dùng HTTPS (không phải HTTP)

### Error: "Access blocked: This app's request is invalid"

**Nguyên nhân**: OAuth consent screen chưa config đúng

**Fix**:
1. Google Console → OAuth consent screen
2. Thêm email vào "Test users"
3. Hoặc publish app (nếu muốn public)

### Error: "Invalid client"

**Nguyên nhân**: Client ID/Secret sai

**Fix**:
1. Check lại Client ID và Secret trong Supabase
2. Copy lại từ Google Console
3. Paste chính xác (không có space)

### Google login không work trên localhost

**Nguyên nhân**: Localhost không có HTTPS

**Workaround**:
1. Dùng ngrok để có HTTPS:
   ```bash
   ngrok http 3000
   ```
2. Thêm ngrok URL vào Google Console
3. Test với ngrok URL

### iPhone Safari không redirect về app

**Nguyên nhân**: Redirect URL không đúng

**Fix**:
1. Check Supabase → URL Configuration
2. Đảm bảo có production URL
3. Clear Safari cache
4. Test lại

---

## 📱 Best Practices cho iPhone

### 1. Dùng Universal Links (Phase 2)

Thay vì redirect về web, có thể deep link vào PWA:
```
https://your-app.vercel.app/auth/callback
→ Opens in PWA (nếu đã installed)
```

### 2. Handle Safari Popup Blocker

```typescript
// Mở OAuth trong same window thay vì popup
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    skipBrowserRedirect: false, // Quan trọng cho mobile
  },
});
```

### 3. Test trên nhiều browsers

- Safari (primary)
- Chrome iOS
- Firefox iOS

---

## ✅ Checklist

**Setup:**
- [ ] Tạo Google OAuth credentials
- [ ] Enable Google provider trong Supabase
- [ ] Add redirect URLs
- [ ] Test trên localhost

**Production:**
- [ ] Deploy lên Vercel
- [ ] Update Google Console với production URL
- [ ] Update Supabase với production URL
- [ ] Test trên iPhone Safari
- [ ] Test PWA install

**Optional:**
- [ ] Add Apple Sign In (cho iOS native feel)
- [ ] Add Facebook Login
- [ ] Add GitHub Login

---

## 🎉 Done!

Sau khi setup xong, users có thể:
- ✅ Login bằng Google (1 click)
- ✅ Login bằng Email Magic Link (backup)
- ✅ Work trên cả desktop và iPhone
- ✅ Không cần nhớ password

**Next step**: Test thử và báo mình nếu có lỗi! 😊
