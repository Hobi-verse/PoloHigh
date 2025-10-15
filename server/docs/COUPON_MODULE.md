# Coupon Module API Documentation

## Overview
The Coupon Module provides a comprehensive discount and promotion system for the e-commerce platform. It supports percentage discounts, fixed amount discounts, free shipping, usage limits, user eligibility rules, product/category restrictions, and detailed analytics.

---

## Table of Contents
1. [User Endpoints](#user-endpoints)
2. [Admin Endpoints](#admin-endpoints)
3. [Models](#models)
4. [Validation Rules](#validation-rules)
5. [Integration Guide](#integration-guide)
6. [Testing](#testing)

---

## User Endpoints

### 1. Validate Coupon
Validate and calculate discount for a coupon code.

**Endpoint:** `POST /api/coupons/validate`  
**Access:** Private (Customer)  
**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "code": "WELCOME20",
  "orderAmount": 2500,
  "items": [
    {
      "productId": "60d5f484f1b2c72b8c8e4f3a",
      "quantity": 2,
      "price": 1250
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Coupon is valid",
  "data": {
    "couponId": "60d5f484f1b2c72b8c8e4f3b",
    "code": "WELCOME20",
    "discountType": "percentage",
    "discountValue": 20,
    "discountApplied": 500,
    "finalAmount": 2000,
    "freeShipping": false
  }
}
```

**Error Responses:**
- `400` - Coupon invalid (expired, usage limit reached, minimum order not met)
- `404` - Coupon code not found

---

### 2. Get Available Coupons
Retrieve all coupons available for the current user.

**Endpoint:** `GET /api/coupons/available`  
**Access:** Private (Customer)  
**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Available coupons retrieved successfully",
  "count": 5,
  "data": [
    {
      "_id": "60d5f484f1b2c72b8c8e4f3b",
      "code": "WELCOME20",
      "description": "20% off on your first order",
      "discountType": "percentage",
      "discountValue": 20,
      "maxDiscount": 1000,
      "minOrderAmount": 500,
      "validUntil": "2025-12-31T23:59:59.999Z",
      "campaignType": "promotional",
      "usageRemaining": 100,
      "userUsageRemaining": 1
    }
  ]
}
```

**Features:**
- Filters coupons based on user eligibility (new user, membership tier, specific users)
- Shows remaining usage for both total and per-user limits
- Excludes expired coupons and those at usage limits

---

### 3. Get User Coupon Usage History
View all coupons used by the current user.

**Endpoint:** `GET /api/coupons/my-usage`  
**Access:** Private (Customer)  
**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Coupon usage history retrieved successfully",
  "count": 3,
  "data": [
    {
      "couponCode": "WELCOME20",
      "description": "20% off on your first order",
      "discountType": "percentage",
      "discountApplied": 500,
      "usedAt": "2025-10-01T10:30:00.000Z",
      "orderId": "60d5f484f1b2c72b8c8e4f3c"
    }
  ]
}
```

---

### 4. Auto-Apply Best Coupon
Automatically find and apply the best available coupon for the cart.

**Endpoint:** `POST /api/coupons/auto-apply`  
**Access:** Private (Customer)  
**Authentication:** Required

**Request Body:**
```json
{
  "orderAmount": 3500,
  "items": [
    {
      "productId": "60d5f484f1b2c72b8c8e4f3a",
      "quantity": 3,
      "price": 1000
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Best coupon found and applied",
  "data": {
    "couponId": "60d5f484f1b2c72b8c8e4f3b",
    "code": "SUMMER30",
    "description": "30% off summer sale",
    "discountType": "percentage",
    "discountValue": 30,
    "discountApplied": 1050,
    "finalAmount": 2450,
    "freeShipping": false,
    "savings": 1050
  }
}
```

**Error Response:**
- `404` - No applicable coupons found for cart

**Algorithm:**
- Evaluates all valid coupons for the user
- Checks eligibility and product applicability
- Selects coupon with maximum discount value
- Returns the best option automatically

---

## Admin Endpoints

### 5. Create Coupon
Create a new discount coupon.

**Endpoint:** `POST /api/coupons/admin/create`  
**Access:** Private (Admin only)  
**Authentication:** Required

**Request Body:**
```json
{
  "code": "AUTUMN25",
  "description": "25% off autumn collection",
  "discountType": "percentage",
  "discountValue": 25,
  "maxDiscount": 2000,
  "minOrderAmount": 1000,
  "validity": {
    "startDate": "2025-09-01T00:00:00.000Z",
    "endDate": "2025-11-30T23:59:59.999Z"
  },
  "usageLimit": {
    "total": 500,
    "perUser": 1
  },
  "applicableCategories": ["60d5f484f1b2c72b8c8e4f3a"],
  "applicableProducts": [],
  "excludedProducts": [],
  "eligibility": {
    "newUsersOnly": false,
    "membershipTiers": ["Gold", "Emerald"],
    "specificUsers": []
  },
  "isActive": true,
  "campaignType": "seasonal"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "data": {
    "_id": "60d5f484f1b2c72b8c8e4f3b",
    "code": "AUTUMN25",
    "description": "25% off autumn collection",
    "discountType": "percentage",
    "discountValue": 25,
    "maxDiscount": 2000,
    "minOrderAmount": 1000,
    "validity": {
      "startDate": "2025-09-01T00:00:00.000Z",
      "endDate": "2025-11-30T23:59:59.999Z"
    },
    "usageLimit": {
      "total": 500,
      "perUser": 1
    },
    "usageCount": 0,
    "isActive": true,
    "campaignType": "seasonal",
    "createdBy": "60d5f484f1b2c72b8c8e4f3d",
    "createdAt": "2025-10-06T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed (invalid discount type, percentage > 100, end date before start date)
- `400` - Coupon code already exists

**Discount Types:**
- `percentage` - Discount as percentage (0-100) with optional maxDiscount cap
- `fixed` - Fixed amount discount
- `freeShipping` - Free shipping (discount handled separately)

**Campaign Types:**
- `promotional` - General promotions
- `seasonal` - Season-specific sales
- `referral` - Referral rewards
- `loyalty` - Loyalty program rewards
- `custom` - Custom campaigns

---

### 6. Get All Coupons (Admin)
Retrieve all coupons with filtering and pagination.

**Endpoint:** `GET /api/coupons/admin/all`  
**Access:** Private (Admin only)  
**Authentication:** Required

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `status` - Filter by status: `active`, `inactive`, `expired`
- `discountType` - Filter by type: `percentage`, `fixed`, `freeShipping`
- `campaignType` - Filter by campaign type
- `search` - Search in code or description
- `sortBy` (default: createdAt) - Sort field
- `sortOrder` (default: desc) - Sort order: `asc`, `desc`

**Example Request:**
```
GET /api/coupons/admin/all?page=1&limit=10&status=active&discountType=percentage&search=WELCOME
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Coupons retrieved successfully",
  "count": 10,
  "total": 45,
  "totalPages": 5,
  "currentPage": 1,
  "data": [
    {
      "_id": "60d5f484f1b2c72b8c8e4f3b",
      "code": "WELCOME20",
      "description": "20% off on your first order",
      "discountType": "percentage",
      "discountValue": 20,
      "maxDiscount": 1000,
      "minOrderAmount": 500,
      "validity": {
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-12-31T23:59:59.999Z"
      },
      "usageLimit": {
        "total": 1000,
        "perUser": 1
      },
      "usageCount": 234,
      "isActive": true,
      "campaignType": "promotional",
      "createdBy": {
        "_id": "60d5f484f1b2c72b8c8e4f3d",
        "name": "Admin User",
        "email": "admin@ciyatake.com"
      },
      "isExpired": false,
      "isCurrentlyActive": true,
      "usagePercentage": "23.40",
      "remainingUsage": 766,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 7. Get Coupon by ID
Get detailed information about a specific coupon.

**Endpoint:** `GET /api/coupons/admin/:id`  
**Access:** Private (Admin only)  
**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Coupon details retrieved successfully",
  "data": {
    "_id": "60d5f484f1b2c72b8c8e4f3b",
    "code": "WELCOME20",
    "description": "20% off on your first order",
    "discountType": "percentage",
    "discountValue": 20,
    "maxDiscount": 1000,
    "minOrderAmount": 500,
    "validity": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.999Z"
    },
    "usageLimit": {
      "total": 1000,
      "perUser": 1
    },
    "usageCount": 234,
    "usedBy": [
      {
        "userId": {
          "_id": "60d5f484f1b2c72b8c8e4f3e",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "orderId": {
          "_id": "60d5f484f1b2c72b8c8e4f3f",
          "orderNumber": "CYA-241006-1001",
          "pricing": {
            "grandTotal": 2000
          }
        },
        "discountApplied": 500,
        "usedAt": "2025-10-01T10:30:00.000Z"
      }
    ],
    "applicableProducts": [],
    "excludedProducts": [],
    "applicableCategories": [],
    "eligibility": {
      "newUsersOnly": true,
      "membershipTiers": [],
      "specificUsers": []
    },
    "isActive": true,
    "campaignType": "promotional",
    "createdBy": {
      "_id": "60d5f484f1b2c72b8c8e4f3d",
      "name": "Admin User",
      "email": "admin@ciyatake.com"
    },
    "analytics": {
      "totalUsage": 234,
      "totalDiscountGiven": "117000.00",
      "averageDiscountPerUse": "500.00",
      "uniqueUsers": 234
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-10-06T10:00:00.000Z"
  }
}
```

**Error Response:**
- `404` - Coupon not found

---

### 8. Update Coupon
Update an existing coupon.

**Endpoint:** `PUT /api/coupons/admin/:id`  
**Access:** Private (Admin only)  
**Authentication:** Required

**Request Body:** (All fields optional for partial update)
```json
{
  "description": "Updated description",
  "discountValue": 30,
  "validity": {
    "endDate": "2025-12-31T23:59:59.999Z"
  },
  "isActive": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Coupon updated successfully",
  "data": {
    /* Updated coupon object */
  }
}
```

**Error Responses:**
- `400` - Cannot change code for used coupon
- `400` - Coupon code already exists (if changing code)
- `400` - Validation failed
- `404` - Coupon not found

**Restrictions:**
- Cannot change coupon code if it has been used (usageCount > 0)
- End date must be after start date

---

### 9. Delete Coupon
Delete a coupon permanently.

**Endpoint:** `DELETE /api/coupons/admin/:id`  
**Access:** Private (Admin only)  
**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Coupon deleted successfully"
}
```

**Error Responses:**
- `400` - Cannot delete coupon that has been used (suggest deactivating instead)
- `404` - Coupon not found

**Note:** Coupons with usage history cannot be deleted to maintain order integrity. Use toggle status instead.

---

### 10. Toggle Coupon Status
Activate or deactivate a coupon.

**Endpoint:** `PATCH /api/coupons/admin/:id/toggle-status`  
**Access:** Private (Admin only)  
**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Coupon activated successfully",
  "data": {
    "code": "WELCOME20",
    "isActive": true
  }
}
```

**Error Response:**
- `404` - Coupon not found

---

### 11. Get Coupon Analytics
Get overall coupon performance statistics.

**Endpoint:** `GET /api/coupons/admin/analytics`  
**Access:** Private (Admin only)  
**Authentication:** Required

**Query Parameters:**
- `startDate` - Filter from date (ISO 8601)
- `endDate` - Filter to date (ISO 8601)
- `campaignType` - Filter by campaign type

**Example Request:**
```
GET /api/coupons/admin/analytics?startDate=2025-01-01&endDate=2025-12-31&campaignType=promotional
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Coupon analytics retrieved successfully",
  "data": {
    "totalCoupons": 25,
    "activeCoupons": 18,
    "expiredCoupons": 7,
    "totalUsage": 1250,
    "totalDiscountGiven": 625000,
    "averageDiscountPerCoupon": "25000.00",
    "byDiscountType": {
      "percentage": 15,
      "fixed": 8,
      "freeShipping": 2
    },
    "byCampaignType": {
      "promotional": 10,
      "seasonal": 8,
      "loyalty": 5,
      "referral": 2
    },
    "topPerformingCoupons": [
      {
        "code": "WELCOME20",
        "usageCount": 234,
        "discountType": "percentage",
        "discountValue": 20,
        "totalDiscountGiven": "117000.00"
      },
      {
        "code": "SUMMER30",
        "usageCount": 189,
        "discountType": "percentage",
        "discountValue": 30,
        "totalDiscountGiven": "142000.00"
      }
    ]
  }
}
```

---

## Models

### Coupon Model Schema

```javascript
{
  code: String (uppercase, unique, 3-50 chars),
  description: String (max 500 chars),
  discountType: Enum ["percentage", "fixed", "freeShipping"],
  discountValue: Number (min 0),
  maxDiscount: Number (min 0, for percentage discounts),
  minOrderAmount: Number (min 0, default 0),
  
  validity: {
    startDate: Date,
    endDate: Date
  },
  
  usageLimit: {
    total: Number (null = unlimited),
    perUser: Number (default 1)
  },
  
  usageCount: Number (default 0),
  
  usedBy: [
    {
      userId: ObjectId (ref: User),
      usedAt: Date,
      orderId: ObjectId (ref: Order),
      discountApplied: Number
    }
  ],
  
  applicableCategories: [String],
  applicableProducts: [ObjectId (ref: Product)],
  excludedProducts: [ObjectId (ref: Product)],
  
  eligibility: {
    newUsersOnly: Boolean (default false),
    membershipTiers: [String] (Bronze, Silver, Gold, Emerald),
    specificUsers: [ObjectId (ref: User)]
  },
  
  isActive: Boolean (default true),
  createdBy: ObjectId (ref: User),
  campaignType: Enum ["promotional", "seasonal", "referral", "loyalty", "custom"],
  
  timestamps: true
}
```

### Order Model Integration

The Order model has been updated to include coupon information:

```javascript
{
  coupon: {
    couponId: ObjectId (ref: Coupon),
    code: String,
    discountType: String,
    discountValue: Number,
    discountApplied: Number
  }
}
```

---

## Validation Rules

### Create/Update Coupon
- `code`: 3-50 characters, uppercase, alphanumeric with hyphens/underscores only
- `discountType`: Must be "percentage", "fixed", or "freeShipping"
- `discountValue`: 
  - Percentage: 0-100
  - Fixed: Positive number
  - Free Shipping: Any positive number
- `validity.endDate`: Must be after startDate
- `usageLimit.total`: Minimum 1 if specified
- `usageLimit.perUser`: Minimum 1
- `membershipTiers`: Must be valid tier (Bronze, Silver, Gold, Emerald)

### Validate Coupon
- `code`: Required, 3-50 characters
- `orderAmount`: Required, positive number
- `items`: Required array with at least one item
- `items[].productId`: Valid MongoDB ObjectId

---

## Integration Guide

### Frontend Integration

#### 1. Apply Coupon at Checkout

```javascript
// Validate coupon when user enters code
const applyCoupon = async (code, cartTotal, cartItems) => {
  try {
    const response = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code,
        orderAmount: cartTotal,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update cart with discount
      setDiscount(data.data.discountApplied);
      setFinalAmount(data.data.finalAmount);
      setCouponData(data.data);
    } else {
      // Show error message
      showError(data.message);
    }
  } catch (error) {
    console.error('Coupon validation failed:', error);
  }
};
```

#### 2. Auto-Apply Best Coupon

```javascript
const autoApplyBestCoupon = async (cartTotal, cartItems) => {
  try {
    const response = await fetch('/api/coupons/auto-apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        orderAmount: cartTotal,
        items: cartItems
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Auto-apply the best coupon
      setCouponData(data.data);
      showSuccess(`Coupon ${data.data.code} applied! You save ₹${data.data.savings}`);
    }
  } catch (error) {
    // No applicable coupons found
  }
};
```

#### 3. Display Available Coupons

```javascript
const fetchAvailableCoupons = async () => {
  const response = await fetch('/api/coupons/available', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    setCoupons(data.data);
  }
};
```

### Backend Integration (Order Creation)

When creating an order, include coupon information:

```javascript
// In orderController.js
const orderData = {
  // ... other order fields
  pricing: {
    subtotal: calculatedSubtotal,
    shipping: shippingCost,
    tax: taxAmount,
    discount: couponData?.discountApplied || 0,
    grandTotal: finalTotal
  },
  coupon: couponData ? {
    couponId: couponData.couponId,
    code: couponData.code,
    discountType: couponData.discountType,
    discountValue: couponData.discountValue,
    discountApplied: couponData.discountApplied
  } : undefined
};

const order = await Order.create(orderData);

// Apply coupon usage
if (couponData) {
  const coupon = await Coupon.findById(couponData.couponId);
  coupon.applyCoupon(userId, order._id, couponData.discountApplied);
  await coupon.save();
}
```

---

## Testing

### Manual Testing with Postman/Thunder Client

#### 1. Create Test Coupon (Admin)

**POST** `/api/coupons/admin/create`
```json
{
  "code": "TEST20",
  "description": "Test 20% discount",
  "discountType": "percentage",
  "discountValue": 20,
  "maxDiscount": 500,
  "minOrderAmount": 1000,
  "validity": {
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z"
  },
  "usageLimit": {
    "total": 100,
    "perUser": 1
  },
  "isActive": true,
  "campaignType": "promotional"
}
```

#### 2. Validate Coupon (User)

**POST** `/api/coupons/validate`
```json
{
  "code": "TEST20",
  "orderAmount": 2500,
  "items": [
    {
      "productId": "60d5f484f1b2c72b8c8e4f3a",
      "quantity": 2
    }
  ]
}
```

#### 3. Get Available Coupons (User)

**GET** `/api/coupons/available`

#### 4. Auto-Apply Best Coupon (User)

**POST** `/api/coupons/auto-apply`
```json
{
  "orderAmount": 3500,
  "items": [
    {
      "productId": "60d5f484f1b2c72b8c8e4f3a",
      "quantity": 3
    }
  ]
}
```

#### 5. Get All Coupons (Admin)

**GET** `/api/coupons/admin/all?page=1&limit=10&status=active`

#### 6. Get Coupon Analytics (Admin)

**GET** `/api/coupons/admin/analytics?campaignType=promotional`

#### 7. Toggle Coupon Status (Admin)

**PATCH** `/api/coupons/admin/:id/toggle-status`

### Test Scenarios

1. **Valid Coupon Application**
   - Create active coupon
   - Validate with eligible cart
   - Verify discount calculation

2. **Expired Coupon**
   - Create coupon with past endDate
   - Attempt validation
   - Expect error: "Coupon has expired"

3. **Usage Limit Reached**
   - Create coupon with total limit = 1
   - Apply coupon to create order
   - Attempt second usage
   - Expect error: "Coupon usage limit reached"

4. **Minimum Order Not Met**
   - Create coupon with minOrderAmount = 2000
   - Validate with cart total = 1000
   - Expect error: "Minimum order amount is ₹2000"

5. **New Users Only**
   - Create coupon with newUsersOnly = true
   - Test with existing customer (orders > 0)
   - Expect error: "This coupon is only for new users"

6. **Category Restriction**
   - Create coupon for specific category
   - Validate with products from different category
   - Expect error: "Coupon not applicable to product categories"

7. **Auto-Apply Best Coupon**
   - Create multiple coupons (10%, 20%, 30% discount)
   - Call auto-apply endpoint
   - Verify 30% coupon is selected

---

## Key Features

### 1. Discount Types
- **Percentage Discount**: Calculate as percentage of order amount with optional maximum cap
- **Fixed Discount**: Apply fixed amount discount
- **Free Shipping**: Mark order for free shipping

### 2. Eligibility Rules
- **New Users Only**: Restrict to users with zero previous orders
- **Membership Tiers**: Limit to specific loyalty tiers (Bronze, Silver, Gold, Emerald)
- **Specific Users**: Whitelist individual users by ID
- **Product/Category Restrictions**: Apply to specific products or categories
- **Excluded Products**: Block specific products from discount

### 3. Usage Limits
- **Total Usage Limit**: Cap total number of times coupon can be used
- **Per-User Limit**: Limit how many times each user can use the coupon
- **Validity Period**: Set start and end dates for coupon availability

### 4. Analytics
- Track total usage and discount given
- Calculate average discount per use
- Monitor unique users
- Top performing coupons ranking
- Usage breakdown by discount type and campaign type

### 5. Auto-Apply Logic
- Automatically find best coupon for user's cart
- Consider all eligibility rules and restrictions
- Select coupon with maximum discount value
- Seamless user experience

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "code",
      "message": "Coupon code is required"
    }
  ]
}
```

**Common Error Codes:**
- `400` - Bad request (validation failed, business logic violation)
- `404` - Resource not found
- `500` - Server error

---

## Best Practices

1. **Coupon Codes**: Use uppercase, short, memorable codes (e.g., WELCOME20, SUMMER30)
2. **Percentage Discounts**: Always set maxDiscount to prevent excessive discounts
3. **Minimum Order**: Set minOrderAmount to ensure profitability
4. **Usage Limits**: Set realistic limits to control promotion costs
5. **Validity Period**: Set clear start and end dates for campaigns
6. **Testing**: Always test coupons before public release
7. **Deactivation**: Deactivate instead of deleting coupons with usage history
8. **Monitoring**: Regularly check analytics to evaluate campaign performance

---

## Notes

- Coupon codes are automatically converted to uppercase
- Coupons with usage history cannot be deleted (only deactivated)
- Coupon codes cannot be changed after first use
- All monetary values use Indian Rupees (₹)
- Dates use ISO 8601 format
- Pagination uses 1-based indexing

---

## Summary

The Coupon Module provides a complete promotion management system with:
- ✅ 11 endpoints (4 user, 7 admin)
- ✅ Multiple discount types (percentage, fixed, free shipping)
- ✅ Advanced eligibility rules (new users, membership tiers, product restrictions)
- ✅ Usage limit controls (total and per-user)
- ✅ Auto-apply best coupon functionality
- ✅ Comprehensive analytics and reporting
- ✅ Full validation and error handling
- ✅ Integration with Order and CustomerProfile modules

**Total Endpoints in System: 75** (64 previous + 11 new)
