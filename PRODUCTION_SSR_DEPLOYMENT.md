# 🚀 Full SSR Production Deployment Guide

## ✅ SSR is NOW ENABLED!

I've updated your configuration:
- ✅ `app.routes.server.ts` → All routes use `RenderMode.Server`
- ✅ `app.config.ts` → `provideClientHydration(withEventReplay())` enabled

---

## 🎯 Deployment Options:

You have 3 choices for deploying SSR:

---

## ✅ OPTION A: Vercel (EASIEST & FREE) - RECOMMENDED

**Why Vercel?**
- ✅ Free hosting
- ✅ Automatic SSR support
- ✅ Automatic deployments from Git
- ✅ Free SSL certificate
- ✅ CDN included
- ✅ Zero configuration needed

### Steps:

#### 1. Create Vercel account:
- Go to: https://vercel.com
- Sign up with GitHub/GitLab/Bitbucket

#### 2. Push your code to GitHub:
```bash
cd /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Zavvi Web with SSR enabled"

# Create GitHub repo, then:
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

#### 3. Deploy to Vercel:
- Go to https://vercel.com/new
- Import your GitHub repository
- Vercel will auto-detect Angular
- Click "Deploy"
- Done! ✅

**Vercel will:**
- ✅ Automatically run `npm run build:ssr`
- ✅ Deploy your SSR app
- ✅ Give you a free `.vercel.app` domain
- ✅ Auto-deploy on every git push

#### 4. Custom Domain:
- In Vercel dashboard → Settings → Domains
- Add your domain (zavvi.deals)
- Follow DNS instructions
- Done!

---

## ✅ OPTION B: Your Own Server (Node.js Required)

**Requirements:**
- Node.js v18+ installed on server
- PM2 for process management
- Nginx as reverse proxy

### Steps:

#### 1. Build SSR locally:
```bash
cd /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web
npm run build:ssr
```

#### 2. Upload to your server:
```bash
# Upload these files/folders:
- dist/
- node_modules/ (or run npm install on server)
- package.json
- package-lock.json
```

#### 3. On your server:
```bash
# Install dependencies (if you didn't upload node_modules)
npm install --production

# Install PM2 globally
npm install -g pm2

# Start the SSR server
pm2 start dist/Zavvi-Web/server/server.mjs --name zavvi-web

# Save PM2 configuration
pm2 save

# Enable PM2 to start on server reboot
pm2 startup
```

#### 4. Configure Nginx:
```nginx
server {
    listen 80;
    server_name zavvi.deals www.zavvi.deals;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5. Enable SSL with Let's Encrypt:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d zavvi.deals -d www.zavvi.deals
```

---

## ✅ OPTION C: Railway (Alternative to Vercel)

**Similar to Vercel, also free tier:**

### Steps:

#### 1. Go to https://railway.app
#### 2. Sign up with GitHub
#### 3. Click "New Project" → "Deploy from GitHub repo"
#### 4. Select your Zavvi-Web repo
#### 5. Railway auto-detects and deploys
#### 6. Done! ✅

---

## 📋 Build Commands Reference:

```bash
# Development (Client-side, no SSR)
npm start
# → http://localhost:4200

# Production SSR Build
npm run build:ssr
# → Creates: dist/Zavvi-Web/browser/ (client files)
# → Creates: dist/Zavvi-Web/server/ (SSR server)

# Test SSR locally
npm run serve:ssr
# → http://localhost:4000
```

---

## 🎯 My Strong Recommendation: VERCEL

**Why Vercel is best for you:**

1. ✅ **Free** - No cost for your traffic
2. ✅ **Zero Config** - Just push to GitHub, it works
3. ✅ **Automatic** - Deploys on every push
4. ✅ **SSL** - Free HTTPS certificate
5. ✅ **Fast** - Global CDN included
6. ✅ **Reliable** - 99.99% uptime
7. ✅ **Custom Domain** - Easy to setup zavvi.deals

**Your current server might not have Node.js, so Vercel is easier!**

---

## 🚀 Next Steps:

### I recommend:

1. **Create Vercel account** (2 minutes)
2. **Push code to GitHub** (5 minutes)
3. **Deploy on Vercel** (2 minutes)
4. **Test your SSR site** (works immediately!)
5. **Add custom domain** (5 minutes)

**Total time: ~15 minutes!**

---

## 🆘 Need Help?

Tell me which option you choose:
- **A** - Vercel (recommended!)
- **B** - Your own server
- **C** - Railway

I'll guide you through step-by-step! 🚀

