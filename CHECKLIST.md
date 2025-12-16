# ✅ Setup Checklist

Dùng checklist này để đảm bảo mọi thứ đã setup đúng.

## 📋 Pre-Development Checklist

### Environment

- [ ] Node.js version >= 20.9.0
  ```bash
  node --version  # Should show v20.x.x or higher
  ```

- [ ] npm hoặc yarn installed
  ```bash
  npm --version
  ```

- [ ] Git installed (for version control)
  ```bash
  git --version
  ```

### Project Setup

- [ ] Dependencies installed
  ```bash
  npm install  # No errors
  ```

- [ ] `.env.local` file created
  ```bash
  ls -la .env.local  # File exists
  ```

- [ ] Environment variables filled
  ```bash
  cat .env.local
  # Should have:
  # NEXT_PUBLIC_SUPABASE_URL=https://...
  # NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  ```

### Supabase Setup

- [ ] Supabase project created
  - Project name: `share-house-expense`
  - Region: Southeast Asia (Singapore)
  - Status: Active

- [ ] Database schema executed
  - [ ] Opened SQL Editor
  - [ ] Pasted `supabase/schema.sql`
  - [ ] Ran successfully (no errors)

- [ ] Tables created (Check Table Editor)
  - [ ] `profiles`
  - [ ] `rooms`
  - [ ] `room_members`
  - [ ] `categories`
  - [ ] `transactions`

- [ ] Default categories inserted
  - [ ] Điện nước ⚡
  - [ ] Internet 📡
  - [ ] Ăn uống 🍜
  - [ ] Đồ dùng 🛒
  - [ ] Sửa chữa 🔧
  - [ ] Khác 📝

- [ ] RLS policies enabled
  - Check: Authentication → Policies
  - Should see policies for each table

- [ ] Auth providers configured
  - [ ] Email (Magic Link) enabled
  - [ ] Google OAuth (optional)

### Development Server

- [ ] Dev server starts without errors
  ```bash
  npm run dev
  # Should show: ✓ Ready on http://localhost:3000
  ```

- [ ] Landing page loads
  - Open http://localhost:3000
  - Should see "🏠 Chi tiêu nhà chung"

- [ ] No console errors
  - Open DevTools → Console
  - Should be clean (no red errors)

- [ ] Tailwind CSS working
  - Landing page should have blue gradient background
  - Buttons should be styled

### TypeScript

- [ ] No type errors
  ```bash
  npx tsc --noEmit
  # Should show: No errors
  ```

- [ ] IntelliSense working
  - Open any `.tsx` file
  - Hover over variables → Should show types

### Git

- [ ] Git initialized
  ```bash
  git status  # Should work
  ```

- [ ] `.gitignore` working
  ```bash
  git status
  # Should NOT show:
  # - node_modules/
  # - .env.local
  # - .next/
  ```

- [ ] Initial commit made
  ```bash
  git log  # Should show at least 1 commit
  ```

## 🚀 Deployment Checklist

### GitHub

- [ ] Repository created on GitHub
- [ ] Code pushed
  ```bash
  git remote -v  # Should show GitHub URL
  git push origin main
  ```

### Vercel

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Environment variables added
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Build successful
- [ ] Deployment URL working

### Supabase (Production)

- [ ] Redirect URLs updated
  - [ ] `https://your-app.vercel.app`
  - [ ] `https://your-app.vercel.app/auth/callback`
  - [ ] `http://localhost:3000` (for dev)
  - [ ] `http://localhost:3000/auth/callback`

### PWA

- [ ] Icons created
  - [ ] `public/icon-192.png`
  - [ ] `public/icon-512.png`

- [ ] Manifest valid
  - Open DevTools → Application → Manifest
  - Should show no errors

- [ ] Installable on mobile
  - Open on iPhone Safari
  - Should see "Add to Home Screen" option

## 🧪 Testing Checklist

### Manual Testing

- [ ] Landing page loads
- [ ] Responsive on mobile (DevTools → Toggle device)
- [ ] No layout shift (CLS)
- [ ] Fast load time (< 2s)

### Browser Testing

- [ ] Chrome/Edge (Desktop)
- [ ] Safari (Desktop)
- [ ] Safari (iPhone) ← Most important
- [ ] Chrome (Android) - optional

### Lighthouse Audit

```bash
# Run in Chrome DevTools
# Lighthouse → Generate report
```

- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90
- [ ] PWA: Installable

## 📱 Mobile Testing Checklist

### iPhone Safari

- [ ] Page loads correctly
- [ ] No horizontal scroll
- [ ] Buttons are tappable (min 44x44px)
- [ ] Input doesn't zoom (font-size >= 16px)
- [ ] Safe area respected (no content behind notch)
- [ ] Add to Home Screen works
- [ ] Icon appears on home screen
- [ ] Opens without Safari UI (standalone mode)

### Android Chrome (Optional)

- [ ] Page loads correctly
- [ ] PWA install prompt appears
- [ ] Installs successfully

## 🔒 Security Checklist

- [ ] `.env.local` in `.gitignore`
- [ ] No API keys in code
- [ ] RLS enabled on all tables
- [ ] Auth required for protected routes
- [ ] HTTPS in production (Vercel auto)

## 📊 Monitoring Checklist

- [ ] Vercel Analytics enabled (optional)
- [ ] Supabase logs accessible
- [ ] Error tracking setup (optional: Sentry)

## ✅ Ready to Code!

Nếu tất cả đều ✅, bạn đã sẵn sàng bắt đầu Phase 1!

**Next step**: Implement auth flow
→ See `TODO.md` → Phase 1 → Week 1

---

## 🐛 Common Issues

### Issue: "Module not found"
**Fix**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Supabase client error"
**Fix**:
- Check `.env.local` format
- Restart dev server
- Verify Supabase project is active

### Issue: "Port 3000 in use"
**Fix**:
```bash
npx kill-port 3000
# Or
npm run dev -- -p 3001
```

### Issue: "RLS policy violation"
**Fix**:
- Re-run `supabase/schema.sql`
- Check user is authenticated
- Verify policies in Supabase Dashboard

### Issue: "Build failed on Vercel"
**Fix**:
- Check build logs
- Verify environment variables
- Test `npm run build` locally

---

## 📞 Support

Stuck? Check these resources:

1. `QUICK_START.md` - Fast setup guide
2. `SETUP.md` - Detailed setup instructions
3. `ARCHITECTURE.md` - System design
4. Supabase Docs: https://supabase.com/docs
5. Next.js Docs: https://nextjs.org/docs

---

**Last updated**: Initial setup
**Status**: Ready for Phase 1 development 🚀
