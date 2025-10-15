# Coupon Module - Quick Reference

## Module Overview
Complete discount and promotion management system with percentage/fixed discounts, free shipping, usage limits, eligibility rules, and auto-apply functionality.

---

## 📊 Statistics
- **Total Endpoints**: 11 (4 User + 7 Admin)
- **Lines of Code**: ~1050 (Controller: 750+ lines)
- **Features**: Discount types, eligibility rules, usage limits, analytics, auto-apply

---

## 🔌 API Endpoints

### User Endpoints (4)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/coupons/validate` | Validate and apply coupon code | Customer |
| GET | `/api/coupons/available` | Get available coupons for user | Customer |
| GET | `/api/coupons/my-usage` | Get user's coupon usage history | Customer |
| POST | `/api/coupons/auto-apply` | Auto-apply best coupon for cart | Customer |

### Admin Endpoints (7)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/coupons/admin/create` | Create new coupon | Admin |
| GET | `/api/coupons/admin/all` | Get all coupons with filters | Admin |
| GET | `/api/coupons/admin/analytics` | Get coupon performance analytics | Admin |
| GET | `/api/coupons/admin/:id` | Get coupon details with usage data | Admin |
| PUT | `/api/coupons/admin/:id` | Update coupon | Admin |
| DELETE | `/api/coupons/admin/:id` | Delete unused coupon | Admin |
| PATCH | `/api/coupons/admin/:id/toggle-status` | Activate/deactivate coupon | Admin |

---

## 💰 Discount Types

1. **Percentage Discount**
   - Value: 0-100%
   - Optional max discount cap
   - Example: "20% off, max ₹1000"

2. **Fixed Discount**
   - Fixed amount deduction
   - Example: "₹500 off"

3. **Free Shipping**
   - Removes shipping charges
   - Discount handled separately

---

## 🎯 Key Features

### Eligibility Rules
- ✅ New users only restriction
- ✅ Membership tier filtering (Bronze, Silver, Gold, Emerald)
- ✅ Specific user whitelist
- ✅ Minimum order amount requirement

### Product Restrictions
- ✅ Applicable categories
- ✅ Applicable products
- ✅ Excluded products

### Usage Limits
- ✅ Total usage limit (global)
- ✅ Per-user usage limit
- ✅ Validity period (start/end dates)

### Advanced Features
- ✅ Auto-apply best coupon algorithm
- ✅ Real-time validation
- ✅ Usage tracking and analytics
- ✅ Campaign type categorization

---

## 📋 Coupon Schema

```javascript
{
  code: String (unique, uppercase),
  description: String,
  discountType: "percentage" | "fixed" | "freeShipping",
  discountValue: Number,
  maxDiscount: Number,
  minOrderAmount: Number,
  
  validity: {
    startDate: Date,
    endDate: Date
  },
  
  usageLimit: {
    total: Number (null = unlimited),
    perUser: Number
  },
  
  usageCount: Number,
  
  usedBy: [{
    userId: ObjectId,
    orderId: ObjectId,
    discountApplied: Number,
    usedAt: Date
  }],
  
  applicableCategories: [String],
  applicableProducts: [ObjectId],
  excludedProducts: [ObjectId],
  
  eligibility: {
    newUsersOnly: Boolean,
    membershipTiers: [String],
    specificUsers: [ObjectId]
  },
  
  isActive: Boolean,
  campaignType: String,
  createdBy: ObjectId
}
```

---

## 🔄 Integration with Order Module

Order model updated with coupon tracking:

```javascript
{
  coupon: {
    couponId: ObjectId,
    code: String,
    discountType: String,
    discountValue: Number,
    discountApplied: Number
  }
}
```

---

## 🧪 Quick Test Commands

### 1. Create Test Coupon (Admin)
```bash
POST /api/coupons/admin/create
{
  "code": "WELCOME20",
  "description": "20% off for new users",
  "discountType": "percentage",
  "discountValue": 20,
  "maxDiscount": 1000,
  "minOrderAmount": 500,
  "validity": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z"
  },
  "usageLimit": { "total": 100, "perUser": 1 },
  "eligibility": { "newUsersOnly": true },
  "isActive": true,
  "campaignType": "promotional"
}
```

### 2. Validate Coupon (User)
```bash
POST /api/coupons/validate
{
  "code": "WELCOME20",
  "orderAmount": 2500,
  "items": [
    { "productId": "60d5f484f1b2c72b8c8e4f3a", "quantity": 2 }
  ]
}
```

### 3. Auto-Apply Best Coupon (User)
```bash
POST /api/coupons/auto-apply
{
  "orderAmount": 3500,
  "items": [
    { "productId": "60d5f484f1b2c72b8c8e4f3a", "quantity": 3 }
  ]
}
```

### 4. Get Analytics (Admin)
```bash
GET /api/coupons/admin/analytics?campaignType=promotional
```

---

## ⚙️ Controller Functions

### User Functions (4)
1. **validateCoupon** - Validate coupon code and calculate discount
2. **getAvailableCoupons** - Get all eligible coupons for user
3. **getUserCouponUsage** - Get user's coupon usage history
4. **autoApplyBestCoupon** - Find and apply best coupon automatically

### Admin Functions (7)
5. **createCoupon** - Create new coupon with validation
6. **getAllCoupons** - Get all coupons with filters/pagination
7. **getCouponById** - Get detailed coupon info with analytics
8. **updateCoupon** - Update coupon (restrictions apply)
9. **deleteCoupon** - Delete unused coupon
10. **toggleCouponStatus** - Activate/deactivate coupon
11. **getCouponAnalytics** - Get overall performance statistics

### Helper Function (1)
12. **checkProductApplicability** - Verify coupon applies to cart items

---

## 🔐 Validation Rules

### Create Coupon
- Code: 3-50 chars, uppercase, alphanumeric + hyphens/underscores
- Discount Type: percentage, fixed, or freeShipping
- Discount Value: 0-100 for percentage, positive for fixed
- Dates: End date must be after start date
- Membership Tiers: Bronze, Silver, Gold, Emerald

### Apply Coupon
- Code: 3-50 characters
- Order Amount: Positive number
- Items: Array with at least 1 item
- Product IDs: Valid MongoDB ObjectIds

---

## 📈 Analytics Provided

- Total coupons created
- Active vs expired coupons
- Total usage count
- Total discount given
- Average discount per coupon
- Breakdown by discount type
- Breakdown by campaign type
- Top performing coupons (by usage)
- Unique users per coupon

---

## 🚨 Error Handling

### Common Errors
- **404** - Coupon not found
- **400** - Invalid coupon code
- **400** - Coupon expired
- **400** - Usage limit reached
- **400** - Minimum order not met
- **400** - User not eligible (new users only, membership tier)
- **400** - Product/category not applicable
- **400** - Cannot delete used coupon
- **400** - Cannot change code of used coupon

---

## 🎨 Campaign Types

1. **promotional** - General promotions
2. **seasonal** - Season-specific sales (Summer, Winter, etc.)
3. **referral** - Referral program rewards
4. **loyalty** - Loyalty program benefits
5. **custom** - Custom marketing campaigns

---

## ✨ Auto-Apply Algorithm

```
1. Fetch all active coupons within validity period
2. Filter by minimum order amount
3. For each coupon:
   - Check basic validity (active, not expired, usage limits)
   - Check user eligibility (new user, membership, specific users)
   - Check product applicability (categories, products, exclusions)
   - Calculate discount amount
4. Select coupon with maximum discount
5. Return best coupon with savings amount
```

---

## 🔒 Business Rules

1. **Coupon codes are case-insensitive** (auto-converted to uppercase)
2. **Cannot delete coupons with usage history** (use deactivate instead)
3. **Cannot change code after first use** (prevents fraud)
4. **One coupon per order** (enforced at order creation)
5. **Discount cannot exceed order amount** (automatic capping)
6. **Percentage discounts respect maxDiscount** (optional limit)

---

## 📦 Files Created

1. **server/Controllers/couponController.js** (~750 lines)
   - 11 controller functions
   - 1 helper function
   - Complete validation and error handling

2. **server/routes/couponRoutes.js** (~115 lines)
   - 11 route definitions
   - Authentication middleware integration
   - Validation middleware integration

3. **server/middleware/validation/couponValidation.js** (~240 lines)
   - 5 validation groups
   - Comprehensive field validation
   - Custom validation rules

4. **server/models/Order.js** (updated)
   - Added coupon field for tracking

5. **server/index.js** (updated)
   - Mounted coupon routes at /api/coupons

---

## 🔗 Dependencies

### Model References
- **Coupon** (primary model)
- **Order** (for order tracking and verified purchase)
- **CustomerProfile** (for membership tier and new user checks)
- **Product** (for product applicability)
- **User** (for user references)

### Middleware
- **protect** - JWT authentication
- **restrictTo** - Role-based authorization
- **express-validator** - Input validation

---

## 📝 Usage Example (Frontend)

```javascript
// Apply coupon at checkout
const response = await fetch('/api/coupons/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: 'WELCOME20',
    orderAmount: cart.total,
    items: cart.items
  })
});

const { data } = await response.json();
// data.discountApplied = 500
// data.finalAmount = 2000
```

---

## ✅ Module Status

**STATUS: COMPLETE ✓**

- ✅ Coupon model (pre-existing, comprehensive)
- ✅ Controller (11 functions + helper)
- ✅ Routes (11 endpoints)
- ✅ Validation (5 validation groups)
- ✅ Order integration (coupon field added)
- ✅ Server integration (routes mounted)
- ✅ Error handling (all scenarios covered)
- ✅ No compilation errors

---

## 🎯 Next Steps

1. Test all endpoints with Postman/Thunder Client
2. Create seed data for test coupons
3. Implement frontend coupon UI components
4. Add coupon notifications (email, SMS)
5. Create scheduled jobs for expired coupon cleanup

---

## 💡 Best Practices

1. **Set realistic usage limits** to control costs
2. **Use maxDiscount for percentage coupons** to prevent abuse
3. **Set minOrderAmount** to ensure profitability
4. **Monitor analytics regularly** for campaign effectiveness
5. **Deactivate instead of delete** to preserve history
6. **Test coupons thoroughly** before public release
7. **Use clear, memorable codes** (e.g., WELCOME20, SUMMER30)
8. **Set specific validity periods** for time-sensitive campaigns

---

**Total System Endpoints: 75** (64 previous + 11 coupon)

**Module 8 of 14 Complete** ✓
