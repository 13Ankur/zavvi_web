# 🌐 Zavvi Web Application

## ✨ Overview

This is a **separate Angular web application** for Zavvi with a completely different UI optimized for web browsers. It shares the same backend API and business logic as the mobile app but has a professional web-first design.

---

## 🎯 Project Structure

```
Zavvi-Web/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── header/          # Fixed header with logo
│   │   │   ├── footer/          # Footer component
│   │   │   ├── banner/          # Banner slider
│   │   │   ├── category-card/   # Category cards
│   │   │   └── offer-card/      # Offer cards
│   │   ├── pages/
│   │   │   ├── home/            # Home page
│   │   │   ├── shop-details/    # Shop details
│   │   │   ├── category/        # Category page
│   │   │   ├── deals/           # Premium deals
│   │   │   ├── login/           # Login page
│   │   │   └── register/        # Register page
│   │   ├── services/
│   │   │   └── api.service.ts   # API service
│   │   ├── models/
│   │   │   └── models.ts        # Data models
│   │   └── app.ts               # Main app component
│   ├── environments/
│   │   ├── environment.ts       # Development config
│   │   └── environment.prod.ts  # Production config
│   └── styles.scss              # Global styles
├── package.json
└── angular.json
```

---

## 🚀 Getting Started

### Installation
```bash
cd Zavvi-Web
npm install
```

### Development Server
```bash
npm start
# or
ng serve

# Opens at http://localhost:4200
```

### Production Build
```bash
npm run build
# or
ng build --configuration production

# Output in dist/zavvi-web/
```

---

## 🎨 Features

### ✅ Fixed Header
- Always visible (sticky)
- Logo on left
- Search bar in center
- Location selector
- Navigation links
- Sign in button

### ✅ Web-Optimized UI
- Professional desktop layout
- Grid-based design (not mobile-first)
- Large banner slider
- Category grid (5-6 per row)
- Offer grid (4-5 per row)
- Hover effects & animations

### ✅ Shared Backend
- Same API as mobile app
- Same data models
- Same business logic
- API: `https://api.zavvi.co.in/api`

### ✅ Responsive
- Desktop: Full web experience
- Tablet: Optimized layout
- Mobile: Simplified grid

---

## 🎨 Design Principles

### Web-First Approach
- **Not mobile-first**: Built specifically for web
- **Desktop optimized**: Best experience on large screens
- **Professional UI**: Modern e-commerce design
- **Grid layouts**: Clean rows and columns

### Theme Consistency
- **Same colors**: Purple (#6C47FF) primary
- **Same branding**: Zavvi logo and identity
- **Same data**: Synchronized with mobile app

---

## 📱 Differences from Mobile App

| Feature | Mobile App | Web App |
|---------|------------|---------|
| **Framework** | Ionic + Angular | Pure Angular |
| **UI Design** | Mobile-first | Web-first |
| **Navigation** | Bottom tabs/slides | Top header menu |
| **Layout** | Vertical scrolling | Grid-based |
| **Header** | Scrolls away | Fixed always visible |
| **Banner** | Card style | Full-width slider |
| **Categories** | 2-3 per row | 5-6 per row |
| **Offers** | 2 per row | 4-5 per row |

---

## 🔗 API Endpoints (Shared)

All endpoints use: `https://api.zavvi.co.in/api`

- GET `/deals` - Get all offers
- GET `/deals/:id` - Get offer by ID
- GET `/deals/category/:categoryId` - Offers by category
- GET `/deals/search/:term` - Search offers
- GET `/categories` - Get all categories
- GET `/shops` - Get all shops
- GET `/shops/:id` - Get shop by ID
- GET `/locations` - Get all locations
- GET `/banners` - Get banners
- GET `/premium-deals` - Get premium deals

---

## 🎯 Current Status

### ✅ Completed
- [x] Project setup
- [x] Folder structure
- [x] Environment configuration
- [x] API service
- [x] Data models
- [x] Header component (with logo)
- [x] Basic routing setup

### 🚧 To Complete
- [ ] Home page component
- [ ] Banner slider component
- [ ] Category card component
- [ ] Offer card component
- [ ] Shop details page
- [ ] Category page
- [ ] Premium deals page
- [ ] Login/Register pages
- [ ] Footer component
- [ ] Global styles
- [ ] Routing configuration

---

## 🛠️ Next Steps

### 1. Continue Building Components
```bash
# The structure is ready, now build:
- Home page with grid layouts
- Banner slider
- Card components
- Detail pages
```

### 2. Apply Global Styles
```bash
# Add to src/styles.scss:
- Purple theme
- Typography
- Grid system
- Animations
```

### 3. Configure Routing
```bash
# Update app.routes.ts with:
- Home route
- Category routes
- Shop routes
- Deal routes
```

### 4. Test & Deploy
```bash
# Test locally
npm start

# Build for production
npm run build

# Deploy to hosting
```

---

## 🎨 Theme Colors

```scss
// Primary
--primary: #6C47FF;
--primary-tint: #7b59ff;
--primary-shade: #5e3ee0;

// Secondary
--secondary: #f107a3;

// Backgrounds
--bg-white: #ffffff;
--bg-light: #f8f9fa;
--bg-gray: #f3f4f6;

// Text
--text-dark: #1a1a1a;
--text-medium: #666666;
--text-light: #9ca3af;
```

---

## 📦 Dependencies

### Core
- **Angular 20**: Latest version
- **TypeScript**: Type safety
- **SCSS**: Styling

### HTTP
- **HttpClient**: API calls
- **RxJS**: Reactive programming

### Routing
- **Angular Router**: Navigation

---

## 🌐 Deployment Options

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist/zavvi-web/browser
```

### Vercel
```bash
npm install -g vercel
npm run build
vercel --prod
```

---

## 🔧 Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Build and watch
npm run watch

# Run linter
npm run lint

# Run tests
npm test
```

---

## 📝 Environment Variables

### Development (`environment.ts`)
```typescript
apiUrl: 'https://api.zavvi.co.in/api'
// or local: 'http://localhost:3000/api'
```

### Production (`environment.prod.ts`)
```typescript
apiUrl: 'https://api.zavvi.co.in/api'
```

---

## ✅ Benefits

### Separate Projects
- **Independent**: Can deploy separately
- **Optimized**: Different UI for different platforms
- **Maintainable**: Clear separation of concerns
- **Scalable**: Easy to extend

### Shared Backend
- **Consistent data**: Same API
- **Cost effective**: One backend
- **Easy sync**: Updates reflect everywhere

---

## 🎊 Summary

**Zavvi-Web** is a professional web application built with Angular, featuring:
- ✨ Fixed header with logo
- 🎨 Web-first UI design
- 📊 Grid-based layouts
- 🔗 Same backend API
- 💜 Consistent branding
- 🚀 Optimized for desktop

**Ready to build the complete application!**

---

## 📞 Next Actions

1. **Continue development** in `Zavvi-Web/`
2. **Build remaining components**
3. **Apply global styles**
4. **Test thoroughly**
5. **Deploy to production**

Let me know when you're ready to continue building!
