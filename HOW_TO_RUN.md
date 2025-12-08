# 🚀 How to Run Your Zavvi Web App

## ✅ **SIMPLE - 3 STEPS:**

### **Step 1: Start the Server**
```bash
npm start
```

### **Step 2: Open Browser**
Go to: **`http://localhost:4200`**

### **Step 3: That's it!** ✅

---

## ⚠️ **IMPORTANT - ALWAYS USE PORT 4200!**

### ✅ **CORRECT URL:**
```
http://localhost:4200
```

### ❌ **WRONG URL (Don't use!):**
```
http://localhost:4000  ← SSR server (doesn't work locally!)
```

---

## 🔧 **If Server Stops Working:**

### **Symptoms:**
- Browser shows "ERR_CONNECTION_REFUSED"
- Browser shows "ERR_NETWORK_IO_SUSPENDED"
- Page says "This site can't be reached"

### **Cause:**
- Computer went to sleep
- Server crashed
- Terminal was closed

### **Solution:**

**1. Stop any old servers:**
```bash
# Kill all old processes
lsof -ti:4200 | xargs kill -9
```

**2. Start fresh server:**
```bash
cd /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web
npm start
```

**3. Wait 10-15 seconds for build**

**4. Reload browser (Cmd + Shift + R)**

**5. App will work!** ✅

---

## 📊 **Port Reference:**

| Port | Command | Use For | Works Locally? |
|------|---------|---------|----------------|
| **4200** | `npm start` | **Development** | ✅ **YES - Always use!** |
| **4000** | `npm run serve:ssr` | Production testing | ❌ No - Only for production |

---

## 🎯 **Common Issues:**

### **Issue 1: "ERR_NETWORK_IO_SUSPENDED"**
**Cause:** Computer went to sleep  
**Fix:** Restart server (see above)

### **Issue 2: "ERR_CONNECTION_REFUSED"**
**Cause:** Server not running  
**Fix:** Run `npm start`

### **Issue 3: "Port 4200 is already in use"**
**Cause:** Old server still running  
**Fix:** Kill it first: `lsof -ti:4200 | xargs kill -9`

### **Issue 4: Page shows "Loading..." forever**
**Cause:** You're on port 4000 (SSR)  
**Fix:** Change to port 4200!

---

## ✅ **Quick Restart Script:**

Save this in your terminal:

```bash
# Quick restart script
cd /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web && \
lsof -ti:4200 | xargs kill -9 2>/dev/null; \
npm start
```

---

## 🚀 **For Production Deployment:**

When you're ready to deploy to production:

```bash
# Build with SSR
npm run build:ssr

# Deploy to Vercel
vercel --prod
```

**Then SSR will work perfectly!** ✅

---

## 💡 **Remember:**

1. ✅ **Development:** Always use `npm start` on port **4200**
2. ✅ **Production:** Deploy with `vercel --prod` (SSR works there)
3. ❌ **Never:** Use port 4000 locally (SSR doesn't work locally)

---

## 📖 **Summary:**

**To run your app:**
1. Terminal: `npm start`
2. Browser: `http://localhost:4200`
3. Done! ✅

**If it breaks:**
1. Restart server
2. Reload browser (Cmd + Shift + R)
3. Done! ✅

---

**Keep this guide handy!** 🎯

