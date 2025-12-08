# QR Code URL Fix - Matching Mobile App Flow

## Overview
Updated the web app to always use vendor redemption URLs in QR codes (matching mobile app behavior), ensuring vendors can scan and redeem coupons through the admin portal.

## Changes Made

### 1. Shop Deals Component (`shop-deals.component.ts`)
**Priority Order for QR Code Data:**
1. **PRIORITY 1**: Use existing `redemptionUrl` from API response (if provided)
2. **PRIORITY 2**: Build vendor redemption URL from `couponId` + `redemptionToken`
   - Format: `https://admin.zavvi.co.in/redeem/${couponId}?token=${redemptionToken}`
3. **FALLBACK**: Use coupon code only (if credentials are missing)

**Key Updates:**
- Enhanced field extraction to check multiple possible field names:
  - `couponId`: `couponData.couponId || couponData._id || couponData.id || couponData.coupon?._id || couponData.coupon?.id`
  - `redemptionToken`: `couponData.redemptionToken || couponData.token || couponData.coupon?.redemptionToken || couponData.coupon?.token`
  - `existingRedemptionUrl`: `couponData.redemptionUrl || couponData.vendorRedemptionUrl || couponData.coupon?.redemptionUrl`

- **After Saving Coupon**: If credentials are received from save response and we didn't have a URL before, always regenerate QR code with the URL (upgrades from coupon code to URL)

### 2. Redeemed Coupons Component (`redeemed-coupons.component.ts`)
**Updated QR Code Generation Logic:**
- **PRIORITY 1**: Use existing `redemptionUrl` or `vendorRedemptionUrl` from coupon data
- **PRIORITY 2**: Build vendor redemption URL from `couponId` + `redemptionToken` if available
- **FALLBACK**: Use coupon code

**Key Updates:**
- Now builds vendor redemption URL from credentials when loading coupons from API
- Ensures all displayed QR codes in "My Coupons" use URLs when available

## Mobile App Reference
The mobile app (`generate-qr.page.ts`) uses the same logic:
```typescript
// Build vendor redemption URL or use QR code
if (this.couponId && this.redemptionToken) {
  this.vendorRedemptionUrl = `https://admin.zavvi.co.in/redeem/${this.couponId}?token=${this.redemptionToken}`;
  this.qrCodeUrl = this.generateQRCodeUrl(this.vendorRedemptionUrl);
} else {
  this.qrCodeUrl = qrCode || this.generateQRCodeUrl(this.couponCode);
}
```

## Benefits
1. **Consistent Behavior**: Web app now matches mobile app QR code generation
2. **Vendor Portal Access**: QR codes contain URLs that vendors can scan to access the admin redemption portal
3. **Automatic Upgrade**: If credentials are received after initial generation, QR code is automatically upgraded from coupon code to URL
4. **Better UX**: Vendors can scan QR codes directly to redeem coupons without manual code entry

## Testing Checklist
- [ ] Generate QR code for new coupon → Should show URL in QR
- [ ] View QR code in "My Coupons" → Should show URL in QR
- [ ] Check QR code data display → Should show green link icon for URLs
- [ ] Verify QR code can be scanned by vendor admin portal
- [ ] Test fallback to coupon code when credentials are missing

## Files Modified
1. `/Zavvi-Web/src/app/pages/shop-deals/shop-deals.component.ts`
   - Enhanced field extraction
   - Updated save response handling to always upgrade QR to URL
   
2. `/Zavvi-Web/src/app/pages/redeemed-coupons/redeemed-coupons.component.ts`
   - Updated QR code generation to build URL from credentials
   - Added priority-based QR data selection

## Notes
- QR codes will always prefer URLs over coupon codes when credentials are available
- The visual display in the modal shows what's encoded (URL vs code) for debugging
- All QR code generation follows the same priority order across the app

