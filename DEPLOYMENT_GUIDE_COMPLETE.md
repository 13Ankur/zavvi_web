# 🚀 Complete Deployment Guide - Zavvi.deals (SSR Enabled)

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Build Instructions](#build-instructions)
3. [Deployment to Vercel (Recommended)](#deployment-to-vercel-recommended)
4. [Deployment to Railway](#deployment-to-railway)
5. [Deployment to DigitalOcean](#deployment-to-digitalocean)
6. [Deployment to AWS](#deployment-to-aws)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment Steps](#post-deployment-steps)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Angular Universal (SSR) is installed ✅ (DONE!)
- [ ] All localStorage calls replaced with SafeStorage ✅ (DONE!)
- [ ] Server routes configured ✅ (DONE!)
- [ ] Environment variables set correctly
- [ ] Google Analytics/tracking codes added (optional)
- [ ] All tests passing
- [ ] API endpoint configured

---

## 🔨 Build Instructions

### For SSR (Server-Side Rendering)

```bash
# Development build with SSR
npm run dev:ssr

# Production build with SSR
npm run build

# Serve production build locally
npm run serve:ssr:Zavvi-Web
```

### For Static (CSR only - fallback)

```bash
# Production build without SSR
npm run build:prod
```

**SSR Build Output:**
```
dist/
├── Zavvi-Web/
    ├── browser/        ← Client files
    │   ├── index.html
    │   ├── main-*.js
    │   ├── styles-*.css
    │   └── ...
    └── server/         ← Server files
        └── server.mjs
```

---

## 🌟 Deployment to Vercel (RECOMMENDED - Easiest!)

### Why Vercel?
- ✅ **Best for Angular SSR** - Built-in support
- ✅ **FREE tier** - Perfect for startups
- ✅ **Auto SSL** - HTTPS included
- ✅ **Global CDN** - Fast everywhere
- ✅ **Easy setup** - 5 minutes
- ✅ **Auto deploys** - Push to GitHub = deploy

### Setup Steps:

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

Enter your email → Verify

#### 3. Deploy

```bash
cd /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web
vercel
```

**Answer prompts:**
```
? Set up and deploy "Zavvi-Web"? Yes
? Which scope? Your personal account
? Link to existing project? No
? What's your project's name? zavvi-web
? In which directory is your code located? ./
? Want to override the settings? No
```

#### 4. Production Deployment

```bash
vercel --prod
```

**Your site will be live at:**
```
https://zavvi-web.vercel.app
```

#### 5. Add Custom Domain

In Vercel Dashboard:
1. Go to your project
2. Click "Settings" → "Domains"
3. Add `www.zavvi.deals`
4. Follow DNS instructions
5. Vercel auto-configures SSL ✅

### Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "name": "zavvi-web",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/Zavvi-Web/server/server.mjs"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Environment Variables (Vercel)

In Vercel Dashboard → Settings → Environment Variables:

```
API_URL=https://api.zavvi.co.in
NODE_ENV=production
PORT=3000
```

---

## 🚂 Deployment to Railway

### Why Railway?
- ✅ **Easy** - Simple as Vercel
- ✅ **FREE $5/month** credit
- ✅ **Auto SSL**
- ✅ **Database support** if needed later

### Setup Steps:

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login

```bash
railway login
```

#### 3. Initialize Project

```bash
cd /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web
railway init
```

**Answer prompts:**
```
? Project name: zavvi-web
? Select a starter: Empty project
```

#### 4. Deploy

```bash
railway up
```

#### 5. Add Custom Domain

```bash
railway domain
```

Or in Railway Dashboard:
1. Go to your project
2. Click "Settings"
3. Add custom domain: `www.zavvi.deals`
4. Update DNS (CNAME record)

### Railway Configuration

Create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run serve:ssr:Zavvi-Web",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Environment Variables (Railway)

```bash
railway variables set API_URL=https://api.zavvi.co.in
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

---

## 💧 Deployment to DigitalOcean App Platform

### Why DigitalOcean?
- ✅ **Reliable** - Enterprise-grade
- ✅ **Scalable** - Easy to upgrade
- ✅ **$5/month** - Affordable
- ✅ **Great docs** - Easy to learn

### Setup Steps:

#### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit with SSR"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zavvi-web.git
git push -u origin main
```

#### 2. Create App on DigitalOcean

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect GitHub repository
4. Select `zavvi-web` repo
5. Branch: `main`

#### 3. Configure Build

**Build Command:**
```
npm run build
```

**Run Command:**
```
npm run serve:ssr:Zavvi-Web
```

**Environment Variables:**
```
API_URL=https://api.zavvi.co.in
NODE_ENV=production
PORT=8080
```

**HTTP Port:** `8080`

#### 4. Add Custom Domain

1. In App settings → Domains
2. Add `www.zavvi.deals`
3. Update DNS:
   ```
   Type: CNAME
   Name: www
   Value: your-app.ondigitalocean.app
   ```

---

## ☁️ Deployment to AWS (Advanced)

### Using AWS Amplify (Easiest on AWS)

#### 1. Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

#### 2. Initialize Amplify

```bash
cd /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web
amplify init
```

**Answer prompts:**
```
? Enter a name for the project: zavviweb
? Enter a name for the environment: prod
? Choose your default editor: Visual Studio Code
? Choose the type of app: javascript
? Framework: angular
? Source Directory Path: src
? Distribution Directory Path: dist/Zavvi-Web/browser
? Build Command: npm run build
? Start Command: npm run serve:ssr:Zavvi-Web
```

#### 3. Add Hosting

```bash
amplify add hosting
```

**Select:**
```
? Select the plugin module to execute: Hosting with Amplify Console (SSR)
? Choose a type: Manual deployment
```

#### 4. Publish

```bash
amplify publish
```

#### 5. Custom Domain

In AWS Amplify Console:
1. Domain management
2. Add domain: `zavvi.deals`
3. AWS handles SSL automatically ✅

---

## 🔐 Environment Variables

### Required Variables

Create `.env` file (for local development):

```env
# API Configuration
API_URL=https://api.zavvi.co.in

# Environment
NODE_ENV=production

# Server Port
PORT=4000

# Optional: Analytics
GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

### For Each Platform:

**Vercel:**
Dashboard → Settings → Environment Variables

**Railway:**
```bash
railway variables set KEY=value
```

**DigitalOcean:**
App Settings → Environment Variables

**AWS:**
Amplify Console → Environment variables

---

## ✅ Post-Deployment Steps

After deployment, complete these steps:

### 1. Verify SSR is Working

Test server-side rendering:

```bash
# View page source (should show full HTML, not just <app-root>)
curl https://www.zavvi.deals/ | grep "Discover exclusive deals"
```

**Should see:** Full HTML content, not empty `<app-root>`

### 2. Test Performance

```bash
# Google PageSpeed Insights
https://pagespeed.web.dev/?url=https://www.zavvi.deals
```

**Target Scores:**
- Mobile: 90+
- Desktop: 95+

### 3. Submit to Google Search Console

```
1. Go to: https://search.google.com/search-console
2. Add property: https://www.zavvi.deals
3. Verify with HTML tag (already in your code!)
4. Submit sitemap: https://www.zavvi.deals/sitemap.xml
5. Request indexing
```

### 4. Test Social Media Previews

```bash
# Facebook Debugger
https://developers.facebook.com/tools/debug/?q=https://www.zavvi.deals

# Twitter Card Validator
https://cards-dev.twitter.com/validator
```

Should show:
- ✅ Title: "Zavvi - Exclusive Deals & Discount Offers"
- ✅ Description: Full description
- ✅ Image: Logo

### 5. Set Up Monitoring

**Vercel Analytics:** (Built-in, free)
- Automatically tracks performance
- View in Vercel Dashboard

**Google Analytics:**
Add to `src/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 6. Enable HTTPS Redirect

Most platforms do this automatically.

**Verify:**
```
http://www.zavvi.deals → https://www.zavvi.deals ✅
```

### 7. Set Up Automatic Deployments

**For Vercel/Railway/DigitalOcean:**
1. Connect GitHub repository
2. Enable auto-deploy
3. Every push to `main` = automatic deployment ✅

---

## 🐛 Troubleshooting

### Issue: "500 Internal Server Error"

**Solution:**
```bash
# Check logs
vercel logs           # For Vercel
railway logs          # For Railway

# Common fix: Check environment variables
railway variables     # List all variables
```

### Issue: "Build Failed"

**Solution:**
```bash
# Test build locally first
npm run build

# If successful, check platform build logs
# Usually missing dependencies or env variables
```

### Issue: "Page Shows Blank"

**Solution:**
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check CORS settings on API

### Issue: "SSR Not Working" (Still CSR)

**Verify SSR:**
```bash
# View source - should show full HTML
curl https://www.zavvi.deals/ | head -100

# Should NOT just be <app-root></app-root>
```

**Fix:**
```bash
# Rebuild with SSR
npm run build

# Ensure server script runs
npm run serve:ssr:Zavvi-Web
```

### Issue: "localStorage is not defined"

**Solution:**
All `localStorage` calls should use `SafeStorage`:

```typescript
// ❌ Wrong
localStorage.getItem('token')

// ✅ Correct
SafeStorage.getItem('token')
```

Already fixed in your code! ✅

### Issue: "Custom Domain Not Working"

**Solution:**

Check DNS propagation:
```bash
dig www.zavvi.deals
```

**Correct DNS:**
```
# For Vercel
www.zavvi.deals.  CNAME  cname.vercel-dns.com.

# For Railway
www.zavvi.deals.  CNAME  your-app.up.railway.app.
```

Wait 24-48 hours for DNS propagation.

---

## 📊 Performance Optimization

### After Deployment

#### 1. Enable Compression

Most platforms enable this automatically.

**Verify:**
```bash
curl -H "Accept-Encoding: gzip" -I https://www.zavvi.deals/
```

Should see: `Content-Encoding: gzip`

#### 2. Enable Caching

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### 3. Optimize Images

Convert to WebP:
```bash
# Install sharp
npm install sharp --save-dev

# Create script to convert images
node scripts/convert-images.js
```

---

## 🎯 Quick Deploy Commands

### Vercel (Fastest)

```bash
# One command deploy
npx vercel --prod
```

### Railway

```bash
# One command deploy
railway up
```

### Manual Server (VPS)

```bash
# SSH into server
ssh root@your-server-ip

# Clone repo
git clone https://github.com/YOUR_USERNAME/zavvi-web.git
cd zavvi-web

# Install dependencies
npm install

# Build
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/Zavvi-Web/server/server.mjs --name zavvi-web

# Save PM2 config
pm2 save
pm2 startup
```

---

## 🌐 DNS Configuration

### For www.zavvi.deals

**Type:** CNAME  
**Name:** www  
**Value:** (depends on platform)

**Vercel:** `cname.vercel-dns.com`  
**Railway:** `your-app.up.railway.app`  
**DigitalOcean:** `your-app.ondigitalocean.app`  

### For zavvi.deals (root domain)

**Type:** A  
**Name:** @  
**Value:** (platform IP - varies)

Or use **ALIAS/ANAME** record pointing to www

---

## ✅ Deployment Checklist

Before going live:

- [ ] Build completes successfully
- [ ] All environment variables set
- [ ] Custom domain configured
- [ ] SSL/HTTPS working
- [ ] Social media previews working
- [ ] Google Search Console verified
- [ ] Sitemap submitted
- [ ] Analytics tracking setup
- [ ] Performance score 90+
- [ ] Mobile responsive tested
- [ ] All API calls working
- [ ] Error pages configured
- [ ] Monitoring enabled

---

## 🎉 You're Live!

**Your website is now:**
- ✅ Server-side rendered (SSR)
- ✅ SEO optimized
- ✅ Fast & performant
- ✅ Globally distributed (CDN)
- ✅ SSL secured
- ✅ Auto-scaling
- ✅ Production ready!

**Next:** Focus on marketing (backlinks, content, reviews)!

---

## 📞 Need Help?

**Platform Documentation:**
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- DigitalOcean: https://docs.digitalocean.com
- AWS Amplify: https://docs.amplify.aws

**Test Your Site:**
- PageSpeed: https://pagespeed.web.dev
- SSL Test: https://www.ssllabs.com/ssltest/
- Mobile-Friendly: https://search.google.com/test/mobile-friendly

---

**Recommended:** Start with **Vercel** (easiest, fastest, free!)

Deploy in 5 minutes! 🚀

