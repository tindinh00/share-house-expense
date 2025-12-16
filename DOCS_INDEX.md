# 📚 Documentation Index

Tổng hợp tất cả tài liệu của project. Đọc theo thứ tự để hiểu rõ nhất.

## 🚀 Getting Started (Bắt đầu)

### 1. [README.md](./README.md)
**Đọc đầu tiên** - Overview của project
- Tính năng chính
- Tech stack
- Quick start
- Roadmap

### 2. [QUICK_START.md](./QUICK_START.md)
**Chạy project trong 5 phút**
- Prerequisites
- Install dependencies
- Setup Supabase
- Run dev server
- Common commands

### 3. [SETUP.md](./SETUP.md)
**Hướng dẫn setup chi tiết**
- Cài đặt Node.js
- Setup Supabase (step-by-step)
- Setup local environment
- Deploy lên Vercel
- Test trên iPhone
- Troubleshooting

### 4. [CHECKLIST.md](./CHECKLIST.md)
**Verify setup đúng chưa**
- Pre-development checklist
- Deployment checklist
- Testing checklist
- Mobile testing checklist
- Security checklist

## 🏗️ Architecture & Design

### 5. [ARCHITECTURE.md](./ARCHITECTURE.md)
**Deep dive vào system design**
- High-level architecture
- Core concepts (Room, Split methods, Settlement)
- Database design decisions
- Security model (RLS)
- Performance optimizations
- Mobile optimizations
- Deployment strategy
- Testing strategy
- Best practices

### 6. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
**Cấu trúc thư mục & files**
- Current structure
- Implementation status
- TODO by phase
- File naming conventions
- Component patterns
- Data fetching patterns
- Styling approach

## 📋 Development

### 7. [TODO.md](./TODO.md)
**Task list & roadmap**
- Phase 1: MVP (Week 1-3)
- Phase 2: Advanced features
- Phase 3: Polish
- Bugs to fix
- Ideas / Nice to have
- Current sprint

## 📁 Technical Files

### 8. [supabase/schema.sql](./supabase/schema.sql)
**Database schema**
- Tables definition
- Indexes
- RLS policies
- Triggers
- Default data

### 9. [.env.local.example](./.env.local.example)
**Environment variables template**
- Supabase URL
- Supabase Anon Key

### 10. [public/manifest.json](./public/manifest.json)
**PWA configuration**
- App name
- Icons
- Display mode
- Theme color

## 📖 How to Use This Documentation

### Nếu bạn là Developer mới join:

1. Đọc `README.md` để hiểu overview
2. Follow `QUICK_START.md` để chạy project
3. Check `CHECKLIST.md` để verify setup
4. Đọc `ARCHITECTURE.md` để hiểu design
5. Xem `PROJECT_STRUCTURE.md` để biết code ở đâu
6. Check `TODO.md` để pick task

### Nếu bạn đang develop:

- `TODO.md` - Xem task cần làm
- `PROJECT_STRUCTURE.md` - Tìm file cần edit
- `ARCHITECTURE.md` - Hiểu logic & patterns
- `CHECKLIST.md` - Verify trước khi commit

### Nếu bạn đang deploy:

- `SETUP.md` → Section "Deploy lên Vercel"
- `CHECKLIST.md` → Section "Deployment Checklist"
- `ARCHITECTURE.md` → Section "Deployment Strategy"

### Nếu bạn gặp lỗi:

- `QUICK_START.md` → Section "Troubleshooting"
- `SETUP.md` → Section "Troubleshooting"
- `CHECKLIST.md` → Section "Common Issues"

## 📊 Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| README.md | ✅ Complete | Initial |
| QUICK_START.md | ✅ Complete | Initial |
| SETUP.md | ✅ Complete | Initial |
| CHECKLIST.md | ✅ Complete | Initial |
| ARCHITECTURE.md | ✅ Complete | Initial |
| PROJECT_STRUCTURE.md | ✅ Complete | Initial |
| TODO.md | 🔄 Living doc | Initial |
| schema.sql | ✅ Complete | Initial |

## 🔄 Living Documents

Các file này sẽ được update liên tục:

- **TODO.md** - Thêm/xóa tasks khi develop
- **PROJECT_STRUCTURE.md** - Update khi thêm files/folders mới
- **CHECKLIST.md** - Thêm items khi phát hiện issues

## 📝 Contributing to Docs

Khi thêm feature mới:

1. Update `TODO.md` - Mark task as done
2. Update `PROJECT_STRUCTURE.md` - Thêm files mới
3. Update `ARCHITECTURE.md` - Nếu có design decision mới
4. Update `README.md` - Nếu thay đổi major

## 🎯 Quick Links

### Setup & Run
- [Quick Start](./QUICK_START.md)
- [Detailed Setup](./SETUP.md)
- [Checklist](./CHECKLIST.md)

### Understanding the System
- [Architecture](./ARCHITECTURE.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Database Schema](./supabase/schema.sql)

### Development
- [TODO List](./TODO.md)
- [Component Patterns](./PROJECT_STRUCTURE.md#component-patterns)
- [Best Practices](./ARCHITECTURE.md#best-practices)

### Deployment
- [Deployment Strategy](./ARCHITECTURE.md#deployment-strategy)
- [Deployment Checklist](./CHECKLIST.md#-deployment-checklist)

## 💡 Tips

- **Bookmark this page** để dễ tìm docs
- **Ctrl+F** để search trong docs
- **VS Code**: Install "Markdown All in One" extension để preview
- **GitHub**: Docs tự động render đẹp

## 🆘 Still Need Help?

1. Search trong docs (Ctrl+F)
2. Check Troubleshooting sections
3. Google error message
4. Check official docs:
   - [Next.js](https://nextjs.org/docs)
   - [Supabase](https://supabase.com/docs)
   - [Tailwind](https://tailwindcss.com/docs)
5. Create GitHub issue

---

**Happy coding! 🚀**

Last updated: Initial setup
