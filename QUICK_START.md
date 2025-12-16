# ⚡ Quick Start Guide

## 🚀 Chạy project trong 5 phút

### 1. Prerequisites

```bash
# Check Node version (phải >= 20)
node --version

# Nếu < 20, download tại: https://nodejs.org/
```

### 2. Install Dependencies

```bash
cd share-house-expense
npm install
```

### 3. Setup Supabase

**A. Tạo project**:
1. Vào https://supabase.com
2. New Project → Đặt tên `share-house-expense`
3. Chọn region `Southeast Asia`
4. Đợi 2 phút

**B. Lấy credentials**:
1. Settings → API
2. Copy `Project URL` và `anon public key`

**C. Setup database**:
1. SQL Editor → New Query
2. Copy paste toàn bộ `supabase/schema.sql`
3. Run (Ctrl+Enter)
4. Check Table Editor → Phải có 5 tables

### 4. Environment Variables

```bash
# Tạo file .env.local
cp .env.local.example .env.local

# Edit .env.local, paste credentials từ Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 5. Run Dev Server

```bash
npm run dev
```

Mở http://localhost:3000 🎉

---

## 📱 Test trên iPhone

### Option 1: Ngrok (Nhanh nhất)

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Copy URL (https://xxx.ngrok.io)
# Mở trên iPhone Safari
```

### Option 2: Deploy Vercel (Production-like)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
# Copy URL → Test trên iPhone
```

---

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
# (Chạy trong Supabase SQL Editor)
# supabase/schema.sql    # Full schema
```

---

## 🔍 Troubleshooting

### "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Supabase client error"

- Check `.env.local` có đúng format không
- Restart dev server: `Ctrl+C` → `npm run dev`
- Check Supabase project có đang chạy không

### "RLS policy violation"

- Chạy lại `supabase/schema.sql`
- Check user đã login chưa
- Check RLS policies trong Supabase Dashboard

### "Port 3000 already in use"

```bash
# Kill process
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

---

## 📂 Key Files

```
.env.local                    # Credentials (KHÔNG commit)
supabase/schema.sql           # Database schema
lib/supabase/client.ts        # Browser Supabase client
lib/supabase/server.ts        # Server Supabase client
app/page.tsx                  # Landing page
```

---

## 🎯 Next Steps

1. ✅ Project chạy được
2. 📖 Đọc `SETUP.md` để hiểu chi tiết
3. 🏗️ Đọc `ARCHITECTURE.md` để hiểu design
4. ✅ Check `TODO.md` để bắt đầu code
5. 📁 Xem `PROJECT_STRUCTURE.md` để biết file nào ở đâu

---

## 💡 Tips

- **Hot reload**: Save file → Browser tự refresh
- **TypeScript**: Hover để xem type hints
- **Tailwind**: Dùng IntelliSense để autocomplete classes
- **Supabase**: Check Dashboard → Table Editor để xem data
- **Vercel**: Mỗi push tự động deploy preview

---

## 🆘 Need Help?

1. Check `SETUP.md` (chi tiết hơn)
2. Check `ARCHITECTURE.md` (giải thích design)
3. Google error message
4. Check Supabase docs: https://supabase.com/docs
5. Check Next.js docs: https://nextjs.org/docs

---

## 🎉 You're Ready!

Project đã sẵn sàng. Bắt đầu code thôi! 🚀

**Recommended first task**: Implement auth flow (login/signup)
→ Check `TODO.md` → Phase 1 → Week 1 → Auth Flow
