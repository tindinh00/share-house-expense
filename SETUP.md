# 📋 Hướng dẫn Setup chi tiết

## Bước 1: Cài đặt Node.js

**QUAN TRỌNG**: Project yêu cầu Node.js >= 20.9.0

### Kiểm tra version hiện tại:
```bash
node --version
```

### Nếu < v20, cài đặt mới:

**Windows**:
- Download từ [nodejs.org](https://nodejs.org/) (chọn LTS)
- Hoặc dùng [nvm-windows](https://github.com/coreybutler/nvm-windows)

**Mac/Linux**:
```bash
# Dùng nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

## Bước 2: Setup Supabase

### 2.1. Tạo Project

1. Vào [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click "New Project"
4. Điền thông tin:
   - Name: `share-house-expense`
   - Database Password: Tạo password mạnh (lưu lại)
   - Region: `Southeast Asia (Singapore)` (gần VN nhất)
5. Đợi ~2 phút để project khởi tạo

### 2.2. Lấy API Keys

1. Vào project → Settings → API
2. Copy 2 giá trị:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.3. Chạy Database Schema

1. Vào project → SQL Editor
2. Click "New Query"
3. Copy toàn bộ nội dung file `supabase/schema.sql`
4. Paste vào editor
5. Click "Run" (hoặc Ctrl+Enter)
6. Kiểm tra: Vào Table Editor, phải thấy 5 tables:
   - profiles
   - rooms
   - room_members
   - categories
   - transactions

### 2.4. Setup Google OAuth (Optional - cho Phase 1)

1. Vào project → Authentication → Providers
2. Enable "Google"
3. Làm theo hướng dẫn để lấy Google Client ID/Secret
4. Hoặc tạm thời dùng Email Magic Link (đơn giản hơn)

## Bước 3: Setup Local Environment

### 3.1. Clone/Download project

```bash
cd share-house-expense
npm install
```

### 3.2. Tạo file .env.local

```bash
# Copy từ example
cp .env.local.example .env.local

# Hoặc tạo thủ công file .env.local với nội dung:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Lưu ý**: Thay `your-project` và `your-anon-key-here` bằng giá trị thực từ Supabase.

### 3.3. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Bước 4: Deploy lên Vercel

### 4.1. Push code lên GitHub

```bash
# Khởi tạo git (nếu chưa có)
git init
git add .
git commit -m "Initial commit"

# Tạo repo mới trên GitHub, sau đó:
git remote add origin https://github.com/your-username/share-house-expense.git
git branch -M main
git push -u origin main
```

### 4.2. Deploy trên Vercel

1. Vào [vercel.com](https://vercel.com)
2. Sign up/Login bằng GitHub
3. Click "Add New" → "Project"
4. Import repository `share-house-expense`
5. Thêm Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"
7. Đợi ~2 phút
8. Copy URL production (VD: `https://share-house-expense.vercel.app`)

### 4.3. Update Supabase Redirect URLs

1. Vào Supabase → Authentication → URL Configuration
2. Thêm vào "Site URL": `https://your-app.vercel.app`
3. Thêm vào "Redirect URLs":
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (cho dev)

## Bước 5: Test trên iPhone

### 5.1. Mở Safari

Vào URL production: `https://your-app.vercel.app`

### 5.2. Cài đặt PWA

1. Tap nút Share (⬆️) ở thanh dưới
2. Scroll xuống → Chọn "Add to Home Screen"
3. Đặt tên (VD: "Chi tiêu nhà")
4. Tap "Add"

### 5.3. Mở app

- Icon sẽ xuất hiện trên Home Screen
- Tap để mở như app native
- Không có thanh URL của Safari

## Troubleshooting

### Lỗi: "Supabase client not initialized"

→ Kiểm tra file `.env.local` có đúng format không
→ Restart dev server: `Ctrl+C` rồi `npm run dev` lại

### Lỗi: "Failed to fetch"

→ Kiểm tra Supabase project có đang chạy không
→ Kiểm tra API keys có đúng không

### Lỗi: "Row Level Security policy violation"

→ Chạy lại file `supabase/schema.sql`
→ Đảm bảo đã login vào app

### App không hiển thị đúng trên iPhone

→ Kiểm tra viewport meta tag
→ Clear Safari cache: Settings → Safari → Clear History

### Node version warning

→ Upgrade Node lên v20+
→ Hoặc dùng nvm để switch version

## Next Steps

Sau khi setup xong:

1. Tạo account đầu tiên (Sign up)
2. Tạo room "Nhà Chung"
3. Thêm giao dịch test
4. Mời người khác vào room (Phase 2)

## Support

Gặp vấn đề? Tạo issue trên GitHub hoặc liên hệ qua email.
