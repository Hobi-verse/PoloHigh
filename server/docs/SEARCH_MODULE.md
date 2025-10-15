# Search Module API Documentation

## Overview

The Search Module provides global search capabilities for customers and advanced discovery tools for administrators. It supports product discovery with text relevance, faceted filtering, live suggestions, order search for support teams, and customer lookup for service or marketing workflows.

---

## Table of Contents

1. [Product Search](#product-search)
2. [Search Suggestions](#search-suggestions)
3. [Admin Order Search](#admin-order-search)
4. [Admin Customer Search](#admin-customer-search)
5. [Facets and Sorting](#facets-and-sorting)
6. [Validation Rules](#validation-rules)
7. [Integration Guide](#integration-guide)
8. [Testing Scenarios](#testing-scenarios)

---

## Product Search

**Endpoint:** `GET /api/search/products`

**Access:** Public

**Description:** Performs full-text search across active products with faceted filters and pagination.

**Query Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `q` | string | Search term (minimum 2 characters for full-text). |
| `category` | string | Filter by category slug. |
| `minPrice` / `maxPrice` | number | Price range filter (base price). |
| `minRating` | number | Minimum average rating (0-5). |
| `tags` | string | Comma-separated list of tags. |
| `inStock` | boolean | When `true`, returns only products with stock. |
| `sortBy` | string | `relevance`, `price`, `newest`, `rating`. |
| `sortOrder` | string | `asc` or `desc`. |
| `page` | number | Page number (default 1). |
| `limit` | number | Results per page (default 12, max 100). |

**Response (200):**

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 312,
    "totalPages": 26,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": {
    "query": "white tee",
    "results": [
      {
        "id": "classic-white-tee",
        "title": "Classic White Tee",
        "description": "Premium cotton round-neck tee",
        "category": "clothing",
        "price": 1299,
        "averageRating": 4.6,
        "reviewCount": 862,
        "totalStock": 145,
        "isAvailable": true,
        "tags": ["white", "tee", "summer"],
        "imageUrl": "https://cdn.ciyatake.com/products/white-tee.jpg",
        "createdAt": "2025-08-12T10:15:00.000Z",
        "updatedAt": "2025-10-01T09:30:00.000Z",
        "score": 12.54
      }
    ],
    "facets": {
      "categories": [
        {
          "category": "clothing",
          "count": 205
        }
      ],
      "priceRange": {
        "min": 299,
        "max": 4999
      },
      "ratingDistribution": [
        {
          "bucket": 4,
          "count": 180
        }
      ]
    }
  }
}
```

**Notes:**

- Uses MongoDB text index (`title`, `description`, `tags`, `seo.keywords`).
- Falls back to regex matching for very short queries (< 2 characters).
- Returns relevance scores when text search is applied.
- Provides category counts, price range, and rating distribution for UI facets.

---

## Search Suggestions

**Endpoint:** `GET /api/search/suggestions`

**Access:** Public

**Description:** Returns live search suggestions for UX auto-complete, pulling from product titles, categories, and popular tags.

**Query Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `q` | string | Partial search term (optional). |
| `limit` | number | Maximum suggestions (default 8, max 20). |

**Response (200):**

```json
{
  "success": true,
  "message": "Search suggestions fetched successfully",
  "data": {
    "query": "wh",
    "suggestions": [
      {
        "type": "product",
        "value": "Classic White Tee",
        "slug": "classic-white-tee",
        "category": "clothing",
        "highlights": {
          "averageRating": 4.6,
          "reviewCount": 862
        }
      },
      {
        "type": "category",
        "value": "White Essentials",
        "slug": "white-essentials",
        "description": "Monochrome wardrobe staples"
      },
      {
        "type": "tag",
        "value": "white",
        "popularity": 128
      }
    ]
  }
}
```

**Notes:**

- When no query is provided, returns trending products (by review count).
- Includes helpful metadata (rating, review counts, descriptions) for UI display.
- Tags are ranked by popularity, enabling quick filter chips.

---

## Admin Order Search

**Endpoint:** `GET /api/search/admin/orders`

**Access:** Private (Admin)

**Description:** Enables support and operations teams to search orders by order number, customer details, status, or date range.

**Query Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `q` | string | Matches order number, customer name/email/phone, or shipping recipient. |
| `status` | string | Order status filter. |
| `fromDate` / `toDate` | ISO date | Restrict by placed date range. |
| `sortBy` | string | `placedAt`, `grandTotal`, `status`. |
| `sortOrder` | string | `asc` or `desc`. |
| `page` | number | Page number (default 1). |
| `limit` | number | Results per page (default 20, max 100). |

**Response (200):**

```json
{
  "success": true,
  "message": "Orders fetched successfully",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 48,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": {
    "query": "CYA-2410",
    "results": [
      {
        "id": "652031fa45c0f88f8aa8d011",
        "orderNumber": "CYA-241006-1024",
        "status": "processing",
        "placedAt": "2025-10-06T07:42:00.000Z",
        "grandTotal": 4280,
        "discount": 500,
        "paymentStatus": "completed",
        "paymentMethod": "razorpay",
        "customer": {
          "id": "651fefea1d2ac186e996d8a1",
          "name": "Riya Kapoor",
          "email": "riya@ciyatake.com",
          "phone": "9876543210"
        },
        "shippingRecipient": "Riya Kapoor",
        "shippingCity": "Mumbai",
        "itemsCount": 3
      }
    ],
    "stats": [
      {
        "status": "processing",
        "count": 18,
        "totalValue": 81240
      }
    ]
  }
}
```

**Notes:**

- Performs regex search on multiple fields and cross-references matching users.
- Returns quick stats grouped by status for dashboard overviews.
- Supports date range filtering for audits or SLA tracking.

---

## Admin Customer Search

**Endpoint:** `GET /api/search/admin/customers`

**Access:** Private (Admin)

**Description:** Finds customers by name, email, phone, membership tier, or order volume to assist CRM and loyalty teams.

**Query Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `q` | string | Matches name, email, or mobile number. |
| `membershipTier` | string | Filter by tier (Bronze, Silver, Gold, Emerald, Sapphire Elite). |
| `minOrders` / `maxOrders` | number | Filter by order count range. |
| `sortBy` | string | `recentActivity`, `totalSpent`, `orders`. |
| `sortOrder` | string | `asc` or `desc`. |
| `page` | number | Page number (default 1). |
| `limit` | number | Results per page (default 20, max 100). |

**Response (200):**

```json
{
  "success": true,
  "message": "Customers fetched successfully",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 64,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": {
    "query": "Kumar",
    "results": [
      {
        "id": "651fefb91d2ac186e996d7c8",
        "userId": "651fef941d2ac186e996d7c2",
        "name": "Arjun Kumar",
        "email": "arjun.kumar@example.com",
        "phone": "9988776655",
        "membershipTier": "Gold",
        "totalOrders": 14,
        "totalSpent": 84250,
        "rewardPoints": 842,
        "walletBalance": 1200,
        "lastUpdated": "2025-10-05T15:20:00.000Z",
        "userCreatedAt": "2024-03-10T08:45:00.000Z",
        "isVerified": true
      }
    ],
    "tierDistribution": [
      {
        "tier": "Gold",
        "count": 18,
        "totalSpent": 654320
      }
    ]
  }
}
```

**Notes:**

- Uses aggregation with `$lookup` to merge `CustomerProfile` and `User` data.
- Provides tier distribution stats for marketing segmentation.
- Supports order volume filters for high-value customer identification.

---

## Facets and Sorting

- **Relevance Sorting:** Automatically applied when full-text search is used; falls back to newest products otherwise.
- **Price Sorting:** Uses base price in smallest currency unit (paise).
- **Rating Sorting:** Secondary sort by review count to surface popular products.
- **Facet Data:** Category counts, rating buckets, and price ranges are provided for building rich UI filters.

---

## Validation Rules

Validation is handled via `searchValidation.js` using `express-validator`.

- Product search enforces numeric ranges, allowed sort values, and sanitised tags.
- Suggestions limit is clamped between 1 and 20 to protect performance.
- Admin endpoints validate status enums, ISO dates, membership tiers, and pagination bounds.

---

## Integration Guide

### Frontend Product Search

```javascript
const fetchProducts = async (params) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`/api/search/products?${query}`);
  const payload = await response.json();

  if (!payload.success) throw new Error(payload.message);
  return payload.data;
};

// Usage
fetchProducts({
  q: "white tee",
  minPrice: 500,
  maxPrice: 2500,
  sortBy: "relevance",
  page: 1,
});
```

### Live Suggestions (Debounced)

```javascript
let suggestionAbortController;

async function getSuggestions(query) {
  if (suggestionAbortController) {
    suggestionAbortController.abort();
  }

  suggestionAbortController = new AbortController();

  const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
    signal: suggestionAbortController.signal,
  });

  const payload = await response.json();
  if (!payload.success) return [];
  return payload.data.suggestions;
}
```

### Order Search (Admin)

```javascript
const searchOrders = async (token, params) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`/api/search/admin/orders?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();
  if (!payload.success) throw new Error(payload.message);
  return payload.data;
};
```

---

## Testing Scenarios

1. **Product Search**
   - Query: `q=tee&minPrice=500&maxPrice=2500`
   - Expect: 200 with results, facets populated.

2. **In-Stock Filter**
   - Query: `inStock=true`
   - Expect: Only products with `totalStock > 0`.

3. **Suggestions Without Query**
   - Query: none
   - Expect: Trending products, categories, and popular tags.

4. **Order Search by Customer Email**
   - Query: `q=user@example.com`
   - Expect: Orders linked to matching user.

5. **Customer Search by Tier**
   - Query: `membershipTier=Gold&minOrders=5`
   - Expect: Gold-tier customers with >= 5 orders.

6. **Date Range Validation**
   - Query: `fromDate=invalid`
   - Expect: 400 with validation error.

---

## Logging and Monitoring

- Errors are logged server-side with contextual messages (e.g., `Error searching products`).
- Consider adding request metrics (duration, result counts) for analytics dashboards.
- Future enhancements can include query logging for popular searches and personalization.

---

## Summary

- ✅ Product search with full-text relevance and facets.
- ✅ Live suggestions for enhanced UX.
- ✅ Admin order search with status stats.
- ✅ Admin customer search with tier analytics.
- ✅ Comprehensive validation and error handling.

Total Search Module Endpoints: **4** (2 public, 2 admin).
