# 🏠 Share House Expense Tracker

Web App (PWA) quản lý chi tiêu cho nhà ở ghép - Minh bạch, đơn giản, hiệu quả.

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup Supabase (see SETUP.md)
# 3. Create .env.local with Supabase credentials
# 4. Run dev server
npm run dev
```

**📚 Đọc [GETTING_STARTED.md](./GETTING_STARTED.md) để bắt đầu!**

## 🎯 Tính năng chính

- ✅ Phân biệt chi tiêu **Chung** và **Riêng**
- ✅ Theo dõi ai đã trả tiền
- ✅ Tính toán quyết toán cuối tháng tự động
- ✅ PWA - Cài đặt như app native trên iPhone
- ✅ 100% miễn phí

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deployment**: Vercel
- **Cost**: $0/month (Free tier)

## 📚 Documentation

Project có **10 files documentation** đầy đủ:

### 🚀 Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** ← **Bắt đầu từ đây!**
- [DOCS_INDEX.md](./DOCS_INDEX.md) - Index của tất cả docs
- [QUICK_START.md](./QUICK_START.md) - Setup trong 5 phút
- [SETUP.md](./SETUP.md) - Hướng dẫn chi tiết

### 📖 Technical
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Code structure
- [TODO.md](./TODO.md) - Task list & roadmap
- [CHECKLIST.md](./CHECKLIST.md) - Verification checklists

### 📊 Summary
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - What's been built
- [README.md](./README.md) - This file

## 📊 Database Schema

5 tables với Row Level Security:

- **profiles** - Thông tin người dùng
- **rooms** - Không gian chi tiêu (Chung/Riêng)
- **room_members** - Phân quyền thành viên
- **categories** - Danh mục chi tiêu (6 defaults)
- **transactions** - Giao dịch chi tiêu

Chi tiết: `supabase/schema.sql`

## 🎨 Project Structure

```
share-house-expense/
├── 📱 app/                    # Next.js pages
├── 🔧 lib/                    # Utilities & types
├── 🗄️ supabase/               # Database schema
├── 📄 public/                 # Static files & PWA
└── 📚 Documentation/          # 10 comprehensive docs
```

## 📝 Current Status

### ✅ Phase 0: Setup (DONE)
- [x] Project scaffolding
- [x] Database schema
- [x] Core infrastructure
- [x] Comprehensive documentation
- [x] Landing page

### 🚧 Phase 1: MVP (TODO - Week 1-3)
- [ ] Auth flow (login/signup)
- [ ] Dashboard layout
- [ ] Transaction CRUD
- [ ] Room management
- [ ] Monthly reports

### 🎨 Phase 2: Advanced (TODO - Week 4+)
- [ ] Charts & visualization
- [ ] Photo upload
- [ ] Recurring expenses
- [ ] Realtime sync

## 🚀 Next Steps

1. **Read**: [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Setup**: Follow [QUICK_START.md](./QUICK_START.md)
3. **Verify**: Use [CHECKLIST.md](./CHECKLIST.md)
4. **Code**: Check [TODO.md](./TODO.md) for tasks

## 💡 Key Features

### For Users
- Phân biệt chi tiêu chung/riêng rõ ràng
- Tính toán quyết toán tự động
- PWA - Cài đặt như app native
- Miễn phí 100%

### For Developers
- TypeScript for type safety
- Supabase RLS for security
- Comprehensive documentation
- Clear architecture
- Zero cost to run

## 🔒 Security

- ✅ Row Level Security (RLS)
- ✅ Environment variables for secrets
- ✅ Auth required for protected routes
- ✅ HTTPS in production

## 📱 Mobile Optimized

- ✅ PWA manifest
- ✅ Viewport optimization
- ✅ Touch-friendly (44x44px)
- ✅ Safe area handling
- ✅ Standalone mode

## 🤝 Contributing

Contributions welcome! See [TODO.md](./TODO.md) for tasks.

## 📄 License

MIT License - Free for personal and commercial use.

---

**🎉 Project is ready! Start with [GETTING_STARTED.md](./GETTING_STARTED.md)**
