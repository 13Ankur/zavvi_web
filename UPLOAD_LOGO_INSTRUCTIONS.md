# 📸 How to Upload Your Zavvi Logo

## Method 1: Replace the Existing Icon (Recommended)

Since you uploaded a beautiful purple/pink gradient "Z" logo, save it as:

```
/Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web/src/assets/icon/zavvi-logo.png
```

**The header is already configured to use this logo!**

## Method 2: Use the Mobile App's Icon

If you want to use the same icon as the mobile app:

```bash
cp /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Frontend/resources/icon.png \
   /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web/src/assets/icon/zavvi-logo.png
```

## Method 3: Save Your Uploaded Image

1. The image you just uploaded (the purple "Z" logo)
2. Save it to your desktop or downloads
3. Then run:

```bash
# If saved to Downloads:
cp ~/Downloads/your-logo-name.png \
   /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web/src/assets/icon/zavvi-logo.png

# Or if saved to Desktop:
cp ~/Desktop/your-logo-name.png \
   /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web/src/assets/icon/zavvi-logo.png
```

## Current Status:

✅ Header component updated to use `zavvi-logo.png`
✅ Temporary placeholder created
⏳ Replace with your actual logo file

## Logo Specifications:

- **Size**: 512x512px recommended (will be scaled to 40px height)
- **Format**: PNG with transparent background (preferred)
- **Colors**: Purple gradient (matches your brand)

## After Replacing:

The logo will automatically appear in:
- Website header (top-left)
- Browser tab (favicon)
- All pages

---

**Quick Copy Command** (if your logo is named `zavvi-logo.png` on Desktop):

```bash
cp ~/Desktop/zavvi-logo.png /Users/keshav/Desktop/Zavvi-Projects/Zavvi-Web/src/assets/icon/zavvi-logo.png
```

Then refresh your browser! 🎉

