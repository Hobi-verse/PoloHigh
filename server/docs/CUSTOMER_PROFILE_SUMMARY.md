# Customer Profile Module - Quick Reference

## 📊 Module Overview

**Status:** ✅ Complete  
**Endpoints:** 13  
**Model:** CustomerProfile.js (451 lines)  
**Controller:** customerProfileController.js (710+ lines)  
**Routes:** customerProfileRoutes.js  
**Validation:** customerProfileValidation.js (270+ lines)

---

## 🔗 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/profile` | Get full customer profile | ✅ |
| PUT | `/api/profile` | Update profile (birthday, avatar) | ✅ |
| GET | `/api/profile/summary` | Account summary for dashboard | ✅ |
| PATCH | `/api/profile/preferences` | Update notification preferences | ✅ |
| GET | `/api/profile/membership` | Get membership tier & benefits | ✅ |
| GET | `/api/profile/rewards` | Get reward points & wallet | ✅ |
| POST | `/api/profile/rewards/redeem` | Redeem points to wallet | ✅ |
| GET | `/api/profile/referral` | Get referral code & stats | ✅ |
| POST | `/api/profile/referral/apply` | Apply referral code | ✅ |
| GET | `/api/profile/security` | Get security settings | ✅ |
| PATCH | `/api/profile/security/2fa` | Toggle two-factor auth | ✅ |
| POST | `/api/profile/security/device` | Add trusted device | ✅ |
| DELETE | `/api/profile/security/device/:deviceId` | Remove trusted device | ✅ |

---

## 🏆 Membership Tiers

| Tier | Min. Spend | Points Rate | Key Benefits |
|------|-----------|-------------|--------------|
| **Bronze** | ₹0 | 1 pt/₹100 | Welcome bonus, birthday 5% off |
| **Silver** | ₹10,000 | 1.5 pt/₹100 | Free shipping ≥₹2,500, early sales |
| **Gold** | ₹50,000 | 2 pt/₹100 | Always free shipping, priority support |
| **Emerald** | ₹1,00,000 | 2.5 pt/₹100 | Concierge, free express shipping |
| **Sapphire Elite** | ₹2,50,000 | 3 pt/₹100 | Personal stylist, exclusive events, VIP |

**Auto-Upgrade:** Tiers automatically update based on `totalSpent`

---

## 💰 Rewards System

### Earning Points
- **Rate:** 1 point per ₹100 spent (base)
- **Multiplier:** Based on membership tier (1x to 3x)
- **Example:** ₹5,000 order @ Gold tier = 50 × 2 = 100 points

### Redeeming Points
- **Conversion:** 10 points = ₹1 wallet credit
- **Minimum:** 100 points (₹10)
- **Multiples:** Must be in multiples of 10
- **Expiry:** Redeemed credits expire in 90 days

---

## 🔗 Referral Program

### Structure
- **Referral Code:** Auto-generated (e.g., `ADITIS8X9`)
- **New User Reward:** ₹50 in wallet
- **Referrer Reward:** ₹100 in wallet
- **Share Link:** `https://ciyatake.com/register?ref=CODE`

### Rules
- Code format: 4-20 uppercase letters/numbers
- Users can only use one referral code
- Rewards added to wallet immediately
- Tracked in `referralRewards` and `referredUsers`

---

## 🔒 Security Features

### Two-Factor Authentication
- Toggle via `/api/profile/security/2fa`
- Requires OTP on login when enabled

### Trusted Devices
- Add devices via `/api/profile/security/device`
- Track: deviceId, name, location, userAgent, lastActive
- Remove devices via DELETE endpoint

### Security Tracking
- Last password change date
- Login attempts count
- Account lock on multiple failed attempts

---

## ⚙️ Preferences

### Notification Settings
- Marketing emails
- SMS updates
- WhatsApp updates
- Order reminders
- Security alerts

### Display Settings
- Language (2-5 character code)
- Currency (3-character ISO code, e.g., INR)

---

## 📦 Model Structure

```javascript
CustomerProfile {
  userId: ObjectId (unique),
  membership: {
    tier: enum [Bronze, Silver, Gold, Emerald, Sapphire Elite],
    memberSince: Date,
    nextTier: { name, progressPercent, pointsNeeded }
  },
  rewards: {
    rewardPoints: Number,
    walletBalance: Number,
    walletExpiryDate: Date
  },
  stats: {
    totalOrders: Number,
    totalSpent: Number,
    wishlistCount: Number,
    returnCount: Number
  },
  preferences: { ... },
  security: {
    twoFactorEnabled: Boolean,
    lastPasswordChange: Date,
    trustedDevices: [...],
    loginAttempts: { count, lastAttempt, lockedUntil }
  },
  referral: {
    referralCode: String (unique),
    referredBy: ObjectId,
    referredUsers: [...],
    referralRewards: Number
  },
  avatar: { url, cloudinaryId },
  birthday: Date
}
```

---

## 🎯 Key Methods

### Instance Methods
- `addRewardPoints(points, reason)` - Add reward points
- `deductRewardPoints(points)` - Deduct points
- `addToWallet(amount, expiryDate)` - Add wallet credit
- `deductFromWallet(amount)` - Deduct wallet credit
- `updateMembershipTier()` - Auto-update tier based on spending
- `recordOrder(orderAmount)` - Update stats and award points
- `addTrustedDevice(deviceInfo)` - Add/update trusted device
- `generateReferralCode()` - Generate unique referral code

### Static Methods
- `getAccountSummary(userId)` - Get complete account summary with stats

---

## 🔄 Integration Points

### Order Module
```javascript
// When order is completed
const profile = await CustomerProfile.findOne({ userId });
await profile.recordOrder(orderAmount);
```

### Registration (Referral)
```javascript
// When user signs up with referral code
await applyReferral(referralCode);
// New user gets ₹50, referrer gets ₹100
```

### Dashboard Display
```javascript
// My Account page
const summary = await CustomerProfile.getAccountSummary(userId);
// Returns profile, stats, recent orders, preferences, security
```

---

## 🧪 Test Scenarios

### 1. Profile Auto-Creation
- User logs in for first time
- Profile created automatically
- Default tier: Bronze
- No errors on first access

### 2. Tier Progression
- User with ₹15,000 total spent
- Should be Silver tier
- Progress to Gold: 70% (₹35,000 more needed)

### 3. Rewards Redemption
- User has 500 points
- Redeems 100 points
- Gets ₹10 in wallet
- Expiry: 90 days from now
- Remaining: 400 points

### 4. Referral Flow
- User A (referrer) shares code: `ADITIS8X9`
- User B (new user) applies code
- User B gets ₹50 wallet
- User A gets ₹100 wallet + ₹100 referralRewards
- User B can't apply another code

### 5. Security
- Enable 2FA
- Add 2 trusted devices
- Remove 1 device
- Check last password change

---

## 📱 Frontend Components

### Required Pages
1. **My Account Dashboard** - `/account`
   - Profile card with tier badge
   - Stats grid (orders, wishlist, credits, returns)
   - Recent orders list
   - Progress to next tier

2. **Membership Page** - `/account/membership`
   - Current tier details
   - Benefits list
   - Progress tracker
   - Tier comparison table

3. **Rewards Page** - `/account/rewards`
   - Points balance
   - Wallet balance
   - Redemption form
   - Transaction history

4. **Referral Page** - `/account/referral`
   - Referral code display
   - Share button
   - Referred users list
   - Total rewards earned

5. **Preferences Page** - `/account/preferences`
   - Notification toggles
   - Language selector
   - Currency selector

6. **Security Settings** - `/account/security`
   - 2FA toggle
   - Trusted devices list
   - Last password change
   - Login history

---

## ✅ Validation Rules

### Update Profile
- Birthday: Valid ISO8601 date, age 13-120 years
- Avatar: Object with `url` (valid URL) and `cloudinaryId` (string)

### Update Preferences
- All boolean fields must be boolean
- Language: 2-5 characters
- Currency: Exactly 3 characters

### Redeem Points
- Points: Integer, minimum 100
- Must be in multiples of 10
- User must have sufficient points

### Apply Referral
- Code: 4-20 characters, uppercase A-Z 0-9 only
- Code must exist in system
- User must not have already used a code

### 2FA Toggle
- Enabled: Required boolean

### Add Device
- DeviceId: 5-100 characters
- DeviceName: 2-100 characters
- Location: Optional, max 200 characters
- UserAgent: Optional, max 500 characters

---

## 🚀 Quick Start

### 1. Test with cURL
```bash
TOKEN="your_jwt_token"

# Get profile
curl http://localhost:4000/api/profile \
  -H "Authorization: Bearer $TOKEN"

# Redeem 100 points
curl -X POST http://localhost:4000/api/profile/rewards/redeem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points":100}'
```

### 2. Frontend Integration
```javascript
import { fetchAccountSummary, redeemPoints } from '../api/profile';

// Load dashboard
const { data } = await fetchAccountSummary();

// Redeem points
await redeemPoints(100);
```

---

## 📝 Files Created

1. **Controller:** `server/Controllers/customerProfileController.js`
   - 13 controller functions
   - 1 helper function (membership benefits)
   - Auto-profile creation
   - 710+ lines

2. **Routes:** `server/routes/customerProfileRoutes.js`
   - 13 protected endpoints
   - JWT authentication on all routes
   - Proper validation middleware

3. **Validation:** `server/middleware/validation/customerProfileValidation.js`
   - 7 validation middlewares
   - Comprehensive input validation
   - Custom validators
   - 270+ lines

4. **Documentation:**
   - `CUSTOMER_PROFILE_MODULE.md` - Complete API reference
   - `CUSTOMER_PROFILE_SUMMARY.md` - Quick reference guide

---

## 📊 Progress Update

**Total Modules:** 7/14 completed

1. ✅ Product Module - 8 endpoints
2. ✅ Category Module - 9 endpoints
3. ✅ Cart Module - 9 endpoints
4. ✅ Wishlist Module - 9 endpoints
5. ✅ Address Module - 8 endpoints
6. ✅ Order Module - 8 endpoints
7. ✅ **Customer Profile Module - 13 endpoints** ← NEW

**Total Endpoints Built:** 64

**Pending Modules:**
- Review Module
- Coupon Module
- Payment Method Module (deferred to end)
- 4 more modules

---

**Customer Profile Module:** ✅ **COMPLETE AND TESTED**
