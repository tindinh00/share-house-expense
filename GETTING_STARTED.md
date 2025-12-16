# 🎉 Welcome to Share House Expense Tracker!

Project đã được scaffold xong. Đây là hướng dẫn nhanh để bắt đầu.

## ⚡ TL;DR (Too Long; Didn't Read)

```bash
# 1. Upgrade Node (nếu cần)
node --version  # Phải >= 20

# 2. Install
npm install

# 3. Setup Supabase
# - Tạo project tại supabase.com
# - Chạy supabase/schema.sql
# - Copy credentials

# 4. Create .env.local
cp .env.local.example .env.local
# Paste credentials vào

# 5. Run
npm run dev
```

Mở http://localhost:3000 🎉

## 📚 Documentation

Project có **8 files documentation** chi tiết:

### 🚀 Start Here

1. **[DOCS_INDEX.md](./DOCS_INDEX.md)** ← Bắt đầu từ đây
   - Index của tất cả docs
   - Hướng dẫn đọc theo role

2. **[QUICK_START.md](./QUICK_START.md)**
   - Chạy project trong 5 phút
   - Common commands
   - Troubleshooting

3. **[SETUP.md](./SETUP.md)**
   - Setup chi tiết từng bước
   - Deploy lên Vercel
   - Test trên iPhone

### 📖 Learn More

4. **[ARCHITECTURE.md](./ARCHITECTURE.md)**
   - System design
   - Database decisions
   - Best practices

5. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**
   - Folder structure
   - File naming
   - Code patterns

6. **[TODO.md](./TODO.md)**
   - Task list
   - Roadmap
   - Current sprint

7. **[CHECKLIST.md](./CHECKLIST.md)**
   - Verify setup
   - Testing checklist
   - Deployment checklist

8. **[README.md](./README.md)**
   - Project overview
   - Tech stack
   - Features

## 🎯 What's Next?

### Option 1: Đọc docs trước (Recommended)

```
1. DOCS_INDEX.md     → Hiểu structure
2. QUICK_START.md    → Setup environment
3. ARCHITECTURE.md   → Hiểu design
4. TODO.md           → Pick first task
```

### Option 2: Dive in ngay

```bash
# Setup và chạy
npm run dev

# Bắt đầu code auth flow
# Check TODO.md → Phase 1 → Week 1 → Auth
```

## 📁 What's Been Created?

### ✅ Core Infrastructure

```
✅ Next.js 14+ with App Router
✅ TypeScript configuration
✅ Tailwind CSS setup
✅ Supabase client (browser + server)
✅ Database schema with RLS
✅ Type definitions
✅ Utility functions
✅ PWA manifest
✅ Landing page
```

### ✅ Documentation

```
✅ 8 comprehensive docs
✅ Setup guides
✅ Architecture deep dive
✅ TODO list with roadmap
✅ Checklists
✅ Quick references
```

### 🚧 TODO (Phase 1)

```
🚧 Auth flow (login/signup)
🚧 Dashboard layout
🚧 Transaction CRUD
🚧 Room management
🚧 Monthly reports
🚧 Settings page
```

## 🔥 Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Type checking
npx tsc --noEmit         # Check TypeScript errors
```

## 🐛 Common Issues

### "Node version too old"

```bash
# Download Node 20+ from nodejs.org
# Or use nvm:
nvm install 20
nvm use 20
```

### "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Supabase error"

- Check `.env.local` exists
- Check credentials are correct
- Restart dev server

## 📞 Need Help?

### 1. Check Documentation

- [DOCS_INDEX.md](./DOCS_INDEX.md) - Start here
- [QUICK_START.md](./QUICK_START.md) - Fast setup
- [SETUP.md](./SETUP.md) - Detailed guide

### 2. Check Troubleshooting

- [QUICK_START.md#troubleshooting](./QUICK_START.md#troubleshooting)
- [SETUP.md#troubleshooting](./SETUP.md#troubleshooting)
- [CHECKLIST.md#common-issues](./CHECKLIST.md#common-issues)

### 3. External Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)

## 🎨 Project Structure

```
share-house-expense/
├── 📱 app/                    # Next.js pages
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
│
├── 🔧 lib/                    # Utilities
│   ├── supabase/             # DB clients
│   ├── types/                # TypeScript types
│   └── utils.ts              # Helpers
│
├── 🗄️ supabase/
│   └── schema.sql            # Database schema
│
├── 📄 public/
│   └── manifest.json         # PWA config
│
└── 📚 Documentation (8 files)
    ├── DOCS_INDEX.md         # This index
    ├── QUICK_START.md        # Fast setup
    ├── SETUP.md              # Detailed setup
    ├── ARCHITECTURE.md       # System design
    ├── PROJECT_STRUCTURE.md  # Code structure
    ├── TODO.md               # Task list
    ├── CHECKLIST.md          # Verify setup
    └── README.md             # Overview
```

## 🚀 Ready to Code?

### Step 1: Setup Environment

```bash
# Follow QUICK_START.md
1. Install Node 20+
2. npm install
3. Setup Supabase
4. Create .env.local
5. npm run dev
```

### Step 2: Verify Setup

```bash
# Follow CHECKLIST.md
✅ Dev server runs
✅ Landing page loads
✅ No console errors
✅ TypeScript compiles
```

### Step 3: Start Coding

```bash
# Check TODO.md for tasks
# First task: Auth flow
# See PROJECT_STRUCTURE.md for where to put code
```

## 💡 Pro Tips

1. **Read DOCS_INDEX.md first** - Biết đọc docs nào khi nào
2. **Bookmark QUICK_START.md** - Dùng thường xuyên
3. **Keep TODO.md open** - Track progress
4. **Use CHECKLIST.md** - Trước khi commit/deploy
5. **Refer to ARCHITECTURE.md** - Khi cần hiểu design decisions

## 🎯 Your First Task

**Implement Auth Flow** (Week 1)

1. Read: `TODO.md` → Phase 1 → Week 1 → Auth
2. Create: `app/(auth)/login/page.tsx`
3. Follow: `ARCHITECTURE.md` → Auth Flow section
4. Test: `CHECKLIST.md` → Testing Checklist

## 🎉 You're All Set!

Project đã sẵn sàng. Documentation đầy đủ. Bắt đầu code thôi!

**Next step**: Open [DOCS_INDEX.md](./DOCS_INDEX.md) và bắt đầu đọc 📚

---

**Happy coding! 🚀**

Made with ❤️ for house sharing expense management
