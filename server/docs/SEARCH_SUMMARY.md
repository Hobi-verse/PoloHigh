# Search Module – Quick Reference

## Snapshot

- **Endpoints:** 4 (2 public, 2 admin)
- **Controllers:** `searchController.js`
- **Routes:** `searchRoutes.js`
- **Validations:** `searchValidation.js`
- **Models Used:** Product, Category, Order, User, CustomerProfile
- **Mongo Index:** Text index on `Product` (`title`, `description`, `tags`, `seo.keywords`)

---

## Endpoints

### Public

1. `GET /api/search/products`
   - Full-text product discovery with facets, pagination, and sorting.

2. `GET /api/search/suggestions`
   - Live search suggestions (products, categories, tags).

### Admin

1. `GET /api/search/admin/orders`
   - Order lookup by order number, customer data, status, or date range.

2. `GET /api/search/admin/customers`
   - Customer lookup with membership tier, order volume, and spend analytics.

---

## Key Features

- Relevance ranking using MongoDB text indexes.
- Faceted filters (categories, price range, rating distribution).
- In-stock filter and tag-based filtering.
- Trending fallback for suggestions when query is empty.
- Order stats grouped by status for quick dashboards.
- Customer tier distribution for marketing insights.

---

## Request Examples

```http
GET /api/search/products?q=white+tee&minPrice=500&maxPrice=2500&sortBy=relevance&page=1
```

```http
GET /api/search/suggestions?q=wh
```

```http
GET /api/search/admin/orders?q=CYA-2410&status=processing
Authorization: Bearer <ADMIN_TOKEN>
```

```http
GET /api/search/admin/customers?membershipTier=Gold&minOrders=5
Authorization: Bearer <ADMIN_TOKEN>
```

---

## Response Highlights

- **products**: includes relevance `score`, availability, rating, and facets.
- **suggestions**: returns combined list with `type` (`product`, `category`, `tag`).
- **orders**: includes customer snapshot, payment status, item count, and status stats.
- **customers**: merges `CustomerProfile` + `User` data with spend metrics.

---

## Validation Guards

- Query lengths capped at 120 characters.
- Pagination limited to 100 results per page.
- Status, sort, and membership enums enforced.
- ISO date validation for range filters.

---

## Metrics to Monitor

- Popular search queries (log `q`).
- Zero-result search rate.
- Average search latency.
- Suggestion hit rate (client-side).
- Order search conversions (support resolution time).

---

## Next Enhancements (Optional)

- Search history tracking per user.
- Personalized suggestions using recent views.
- Synonym management for better recall.
- ElasticSearch/OpenSearch integration for scale.
- Analytics dashboard for search performance.
