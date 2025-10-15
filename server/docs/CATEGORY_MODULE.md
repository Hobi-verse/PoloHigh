# Category Module - Complete Backend Implementation

## 📁 Files Created

### 1. Model
- ✅ `server/models/Category.js` (already created)

### 2. Controller
- ✅ `server/Controllers/categoryController.js`

### 3. Routes
- ✅ `server/routes/categoryRoutes.js`

### 4. Middleware
- ✅ `server/middleware/validation/categoryValidation.js`

### 5. Scripts
- ✅ `server/scripts/seedCategories.js`

---

## 🌐 API Endpoints

### Public Endpoints

#### 1. Get All Categories
```http
GET /api/categories
```

**Query Parameters:**
- `includeInactive` - Include inactive categories (boolean, default: false)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "categories": [
    {
      "id": "clothing",
      "slug": "clothing",
      "name": "Clothing",
      "description": "Discover our collection...",
      "heroImage": {
        "url": "https://...",
        "alt": "Clothing Collection"
      },
      "productCount": 24,
      "displayOrder": 1,
      "isActive": true
    }
  ]
}
```

---

#### 2. Get Category by Slug
```http
GET /api/categories/:slug
```

**Example:**
```http
GET /api/categories/clothing
```

**Response:**
```json
{
  "success": true,
  "category": {
    "id": "clothing",
    "slug": "clothing",
    "name": "Clothing",
    "description": "...",
    "heroImage": {...},
    "parentCategory": null,
    "filters": {
      "sizes": ["xs", "s", "m", "l", "xl"],
      "colors": [
        { "name": "white", "hex": "#FFFFFF" }
      ],
      "priceRanges": [...]
    },
    "productCount": 24,
    "displayOrder": 1,
    "subcategories": [
      {
        "slug": "mens-clothing",
        "name": "Men's Clothing",
        "productCount": 12
      }
    ],
    "seo": {...}
  }
}
```

---

#### 3. Get Category Filters
```http
GET /api/categories/:slug/filters
```

Returns available filters for a category (computed from products if not predefined).

**Response:**
```json
{
  "success": true,
  "filters": {
    "sizes": ["xs", "s", "m", "l", "xl"],
    "colors": [
      { "name": "white", "hex": "#FFFFFF" },
      { "name": "black", "hex": "#000000" }
    ],
    "priceRanges": [
      { "label": "Under ₹1000", "min": 0, "max": 1000 },
      { "label": "₹1000 - ₹3000", "min": 1000, "max": 3000 }
    ]
  }
}
```

---

#### 4. Get Category Products
```http
GET /api/categories/:slug/products
```

**Query Parameters:**
- `minPrice` - Minimum price (number)
- `maxPrice` - Maximum price (number)
- `sizes` - Filter by sizes (string or array)
- `colors` - Filter by colors (string or array)
- `sort` - Sort field (default: "-createdAt")
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)

**Example:**
```http
GET /api/categories/clothing/products?minPrice=1000&maxPrice=5000&page=1&limit=12
```

**Response:**
```json
{
  "success": true,
  "category": {
    "slug": "clothing",
    "name": "Clothing"
  },
  "count": 12,
  "total": 24,
  "page": 1,
  "totalPages": 2,
  "products": [...]
}
```

---

#### 5. Get Category Tree
```http
GET /api/categories/tree
```

Returns hierarchical category structure.

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "clothing",
      "slug": "clothing",
      "name": "Clothing",
      "productCount": 24,
      "children": [
        {
          "id": "mens-clothing",
          "slug": "mens-clothing",
          "name": "Men's Clothing",
          "productCount": 12,
          "children": []
        }
      ]
    }
  ]
}
```

---

### Protected Admin Endpoints

#### 6. Create Category
```http
POST /api/categories
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "slug": "summer-collection",
  "name": "Summer Collection",
  "description": "Fresh styles for summer",
  "heroImage": {
    "url": "https://...",
    "alt": "Summer Collection"
  },
  "parentCategory": null,
  "filters": {
    "sizes": ["xs", "s", "m", "l"],
    "colors": [
      { "name": "white", "hex": "#FFFFFF" }
    ],
    "priceRanges": [...]
  },
  "displayOrder": 6,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "category": {
    "id": "summer-collection",
    "slug": "summer-collection",
    "name": "Summer Collection",
    "description": "Fresh styles for summer"
  }
}
```

---

#### 7. Update Category
```http
PUT /api/categories/:slug
Authorization: Bearer <token>
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "displayOrder": 2
}
```

---

#### 8. Delete Category
```http
DELETE /api/categories/:slug
Authorization: Bearer <token>
```

**Note:** Cannot delete categories with:
- Active products
- Active subcategories

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

#### 9. Update Product Count
```http
PATCH /api/categories/:slug/product-count
Authorization: Bearer <token>
```

Recalculates and updates the product count for a category.

**Response:**
```json
{
  "success": true,
  "message": "Product count updated successfully",
  "productCount": 24
}
```

---

## 🔄 Frontend Integration Changes

### 1. Update Category API Calls

Update `client/src/data/categories.js` or create new API file:

```javascript
// client/src/api/categories.js
import { apiRequest } from "./client";

export const fetchCategories = async () => {
  return apiRequest("/categories", { method: "GET" });
};

export const fetchCategoryBySlug = async (slug) => {
  return apiRequest(`/categories/${slug}`, { method: "GET" });
};

export const fetchCategoryFilters = async (slug) => {
  return apiRequest(`/categories/${slug}/filters`, { method: "GET" });
};

export const fetchCategoryProducts = async (slug, filters = {}) => {
  return apiRequest(`/categories/${slug}/products`, {
    method: "GET",
    query: filters,
  });
};

export const fetchCategoryTree = async () => {
  return apiRequest("/categories/tree", { method: "GET" });
};
```

---

### 2. Update CategoryTabs Component

The backend now provides structured category data:

```javascript
// Before (mock data)
const categories = ["All", "Clothing", "Shoes", "Accessories"];

// After (from API)
const { categories } = await fetchCategories();
// categories = [
//   { id: "clothing", name: "Clothing", productCount: 24 },
//   { id: "shoes", name: "Shoes", productCount: 18 },
//   ...
// ]
```

Update component to use `category.id` for filtering and `category.name` for display.

---

### 3. Product Filtering by Category

Instead of filtering on frontend, use the category products endpoint:

```javascript
// Before
const filteredProducts = products.filter(p => p.category === selectedCategory);

// After
const { products } = await fetchCategoryProducts(selectedCategory, {
  page: 1,
  limit: 12,
  minPrice: 1000,
  maxPrice: 5000
});
```

---

### 4. Category Filters Integration

Use category filters for dynamic filter UI:

```javascript
const { filters } = await fetchCategoryFilters("clothing");

// filters = {
//   sizes: ["xs", "s", "m", "l"],
//   colors: [{ name: "white", hex: "#FFFFFF" }],
//   priceRanges: [...]
// }

// Use these to populate filter dropdowns/checkboxes
```

---

### 5. Category Tree for Navigation

Use category tree for mega menu or sidebar navigation:

```javascript
const { categories: categoryTree } = await fetchCategoryTree();

// Render recursive menu
function renderCategoryMenu(categories) {
  return categories.map(cat => (
    <div key={cat.id}>
      <Link to={`/category/${cat.slug}`}>{cat.name}</Link>
      {cat.children.length > 0 && (
        <ul>{renderCategoryMenu(cat.children)}</ul>
      )}
    </div>
  ));
}
```

---

## 🧪 Testing

### Seed Categories First

```bash
cd server
node scripts/seedCategories.js
```

This will create 5 sample categories:
- Clothing
- Shoes
- Accessories
- Bags
- Watches

---

### Test Public Endpoints

```bash
# Get all categories
curl http://localhost:4000/api/categories

# Get specific category
curl http://localhost:4000/api/categories/clothing

# Get category filters
curl http://localhost:4000/api/categories/clothing/filters

# Get category products
curl http://localhost:4000/api/categories/clothing/products?page=1&limit=12

# Get category tree
curl http://localhost:4000/api/categories/tree
```

---

### Test Admin Endpoints

```bash
# Login first to get token
TOKEN="your-jwt-token-here"

# Create category
curl -X POST http://localhost:4000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "winter-collection",
    "name": "Winter Collection",
    "description": "Stay warm in style",
    "displayOrder": 7
  }'

# Update category
curl -X PUT http://localhost:4000/api/categories/winter-collection \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayOrder": 1}'

# Update product count
curl -X PATCH http://localhost:4000/api/categories/clothing/product-count \
  -H "Authorization: Bearer $TOKEN"

# Delete category
curl -X DELETE http://localhost:4000/api/categories/winter-collection \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Category-Product Relationship

### Automatic Product Count Updates

The Product controller automatically updates category product counts when:
- Creating a product → increments count
- Updating product category → decrements old, increments new
- Deleting product → decrements count

**In Product Controller:**
```javascript
// When creating product
await Category.findOneAndUpdate(
  { slug: productData.category },
  { $inc: { productCount: 1 } }
);

// When deleting product
await Category.findOneAndUpdate(
  { slug: product.category },
  { $inc: { productCount: -1 } }
);
```

---

## 🎯 Frontend Components to Update

### 1. HomePage
- Fetch categories for navigation/tabs
- Use category products endpoint for filtered display

### 2. CategoryTabs Component
- Fetch categories from API
- Display with product counts
- Handle category selection

### 3. Product Listing Page
- Use category products endpoint
- Display category info (hero image, description)
- Show category-specific filters

### 4. Navigation Menu
- Use category tree for hierarchical menu
- Show product counts in menu items

### 5. Filter Components
- Fetch and display category-specific filters
- Apply filters via category products endpoint

---

## 🚨 Error Handling

### Cannot Delete Category with Products

```json
{
  "success": false,
  "message": "Cannot delete category with 24 active products. Please reassign or delete products first."
}
```

**Solution:** First reassign or delete all products in the category.

---

### Cannot Delete Category with Subcategories

```json
{
  "success": false,
  "message": "Cannot delete category with 2 subcategories. Please delete subcategories first."
}
```

**Solution:** Delete child categories first, then parent.

---

## ✅ Migration Checklist

- [ ] 1. Seed categories using script
- [ ] 2. Test category endpoints
- [ ] 3. Update frontend API calls
- [ ] 4. Update CategoryTabs component
- [ ] 5. Integrate category filters
- [ ] 6. Use category products endpoint
- [ ] 7. Implement category tree navigation
- [ ] 8. Test category-product relationship
- [ ] 9. Update admin category management
- [ ] 10. Remove mock category data

---

## 📝 Next Steps

### Recommended Order:
1. ✅ **Product** - Complete
2. ✅ **Category** - Complete
3. 🔄 **Cart** - Shopping cart functionality
4. ⏳ **Wishlist** - Saved items
5. ⏳ **Address** - Shipping addresses
6. ⏳ **Order** - Order management

---

**Ready to move to Cart model?**
