# ⚡ Quick Deploy to Vercel

## 5 Phút Deploy App

### Bước 1: Push code lên GitHub ✅
```bash
cd share-house-expense
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Bước 2: Deploy trên Vercel (2 phút)

1. **Vào Vercel**: https://vercel.com
2. **Login** với GitHub
3. **Import Project**:
   - Click "Add New..." → "Project"
   - Chọn repo: `tindinh00/share-house-expense`
   - Click "Import"

4. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://yeksmvujygzawansdmvq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_key_here>
   ```
   
5. **Click "Deploy"** → Đợi 2-3 phút

### Bước 3: Config Supabase (1 phút)

1. **Vào Supabase Dashboard**
2. **Authentication → URL Configuration**
3. **Site URL**: `https://your-app.vercel.app`
4. **Redirect URLs**: Add
   - `https://your-app.vercel.app/auth/callback`

### Bước 4: Test trên iPhone (1 phút)

1. **Mở Safari** trên iPhone
2. **Vào**: `https://your-app.vercel.app`
3. **Click Share** → **"Add to Home Screen"**
4. **Done!** App xuất hiện trên Home Screen

## Lấy Supabase Keys

1. Vào Supabase Dashboard
2. Project Settings → API
3. Copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Lấy Vercel URL

Sau khi deploy xong:
- Vercel sẽ show URL: `https://your-app.vercel.app`
- Copy URL này để config Supabase

## Troubleshooting

### Build failed?
→ Check logs trên Vercel
→ Có thể thiếu dependencies: `npm install`

### Login không work?
→ Check Supabase Redirect URLs
→ Phải có `/auth/callback`

### App không load trên iPhone?
→ Phải dùng Safari (không phải Chrome)
→ Check HTTPS (Vercel tự động có)

## Next Steps

✅ Deploy to Vercel
✅ Config Supabase
✅ Install on iPhone
📧 Setup email notifications (optional)
🌐 Add custom domain (optional)
📊 Setup analytics (optional)

## Support

Có vấn đề? Check:
- `DEPLOYMENT_GUIDE.md` - Chi tiết đầy đủ
- `PWA_SETUP.md` - Hướng dẫn PWA
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
