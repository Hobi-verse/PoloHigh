# Product Module - Complete Backend Implementation

## 📁 Files Created

### 1. Model
- ✅ `server/models/Product.js`

### 2. Controller
- ✅ `server/Controllers/productController.js`

### 3. Routes
- ✅ `server/routes/productRoutes.js`

### 4. Middleware
- ✅ `server/middleware/authMiddleware.js`
- ✅ `server/middleware/validation/productValidation.js`

---

## 🌐 API Endpoints

### Public Endpoints

#### 1. Get All Products
```
GET /api/products
```

**Query Parameters:**
- `category` - Filter by category (string)
- `minPrice` - Minimum price (number)
- `maxPrice` - Maximum price (number)
- `sizes` - Filter by sizes (string or array)
- `colors` - Filter by colors (string or array)
- `tags` - Filter by tags (string or array)
- `search` - Search in title/description/tags (string)
- `sort` - Sort field (default: "-createdAt")
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `inStock` - Show only in-stock items (boolean)

**Example Request:**
```javascript
GET /api/products?category=clothing&minPrice=1000&maxPrice=5000&page=1&limit=12
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "total": 45,
  "page": 1,
  "totalPages": 4,
  "products": [
    {
      "id": "classic-white-tee",
      "title": "Classic White Tee",
      "price": 2075,
      "category": "clothing",
      "sizes": ["xs", "s", "m", "l"],
      "colors": [
        {
          "value": "white",
          "label": "White",
          "hex": "#FFFFFF"
        }
      ],
      "imageUrl": "https://...",
      "description": "...",
      "isAvailable": true,
      "averageRating": 4.5,
      "reviewCount": 23
    }
  ]
}
```

---

#### 2. Get Product by ID
```
GET /api/products/:id
```

**Example Request:**
```javascript
GET /api/products/classic-white-tee
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "classic-white-tee",
    "slug": "classic-white-tee",
    "title": "Classic White Tee",
    "description": "A timeless white t-shirt...",
    "category": "clothing",
    "price": 2075,
    "basePrice": 2075,
    "media": [
      {
        "url": "https://...",
        "thumbnail": "https://...",
        "alt": "Classic White Tee",
        "isPrimary": true,
        "type": "image"
      }
    ],
    "colors": [...],
    "sizes": ["xs", "s", "m", "l"],
    "benefits": ["100% Cotton", "Machine Washable"],
    "details": {
      "description": "...",
      "features": [...]
    },
    "specifications": [...],
    "reviewHighlights": [...],
    "averageRating": 4.5,
    "reviewCount": 23,
    "tags": ["basic", "essential"],
    "isAvailable": true,
    "totalStock": 140,
    "variants": [...],
    "relatedProducts": [...]
  }
}
```

---

#### 3. Get Product Variants
```
GET /api/products/:id/variants?size=m&color=white
```

**Response:**
```json
{
  "success": true,
  "variants": [
    {
      "sku": "CWT-WHT-M",
      "size": "m",
      "color": {
        "name": "white",
        "hex": "#FFFFFF"
      },
      "stockLevel": 50,
      "priceOverride": null,
      "images": [],
      "isActive": true
    }
  ]
}
```

---

#### 4. Check Product Availability
```
GET /api/products/:id/availability?sku=CWT-WHT-M
```

**Response:**
```json
{
  "success": true,
  "available": true,
  "stockLevel": 50,
  "sku": "CWT-WHT-M"
}
```

---

### Protected Admin Endpoints

#### 5. Create Product
```
POST /api/products
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "slug": "classic-white-tee",
  "title": "Classic White Tee",
  "description": "A timeless white t-shirt",
  "category": "clothing",
  "basePrice": 2075,
  "media": [
    {
      "url": "https://...",
      "thumbnail": "https://...",
      "alt": "Classic White Tee",
      "isPrimary": true,
      "type": "image"
    }
  ],
  "variants": [
    {
      "sku": "CWT-WHT-M",
      "size": "m",
      "color": {
        "name": "white",
        "hex": "#FFFFFF"
      },
      "stockLevel": 50
    }
  ],
  "benefits": ["100% Cotton", "Machine Washable"],
  "details": {
    "description": "Premium quality",
    "features": ["Soft fabric", "Durable"]
  },
  "tags": ["basic", "essential"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {...}
}
```

---

#### 6. Update Product
```
PUT /api/products/:id
Authorization: Bearer <token>
```

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "basePrice": 2500,
  "variants": [...]
}
```

---

#### 7. Delete Product (Soft Delete)
```
DELETE /api/products/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

#### 8. Update Product Stock
```
PATCH /api/products/:id/stock
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sku": "CWT-WHT-M",
  "stockLevel": 75
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stock updated successfully",
  "variant": {
    "sku": "CWT-WHT-M",
    "stockLevel": 75
  },
  "totalStock": 215
}
```

---

## 🔄 Frontend Integration Changes

### 1. Update API Base URL

Update `client/src/api/config.js`:

```javascript
export const API_BASE_URL = "http://localhost:4000"; // Updated to match backend
```

---

### 2. Update Product API Calls

Update `client/src/api/catalog.js`:

```javascript
import { apiRequest, withApiFallback } from "./client";
import { getMockProductDetail, getMockProducts } from "./mockData";

export const fetchProducts = async (filters = {}, { signal } = {}) =>
  withApiFallback(
    () =>
      apiRequest("/products", {
        method: "GET",
        query: filters,
        signal,
      }),
    () => getMockProducts()
  );

export const fetchProductById = async (productId, { signal } = {}) => {
  if (!productId) {
    throw new Error("fetchProductById requires a productId");
  }

  return withApiFallback(
    () => apiRequest(`/products/${productId}`, { signal }),
    () => getMockProductDetail(productId)
  );
};
```

**Note:** The API now returns `products` instead of direct array. Update response handling:

```javascript
// Before
const products = await fetchProducts();

// After
const { products } = await fetchProducts(); // Destructure from response
```

---

### 3. Handle Response Structure

The backend returns paginated data:

```javascript
{
  success: true,
  count: 12,
  total: 45,
  page: 1,
  totalPages: 4,
  products: [...]
}
```

Update frontend components to handle pagination:

```javascript
const { products, total, page, totalPages } = await fetchProducts({ page: 1, limit: 12 });
```

---

### 4. Color Format Change

**Backend returns:**
```javascript
colors: [
  { value: "white", label: "White", hex: "#FFFFFF" }
]
```

**Frontend expects (in some places):**
```javascript
colors: ["white"]
```

**Solution:** The backend now provides both formats. Use `colors` for detailed display and map to array if needed:

```javascript
const colorNames = product.colors.map(c => c.value);
```

---

### 5. Product Detail Page Changes

The backend response includes more structured data. Update `ProductDetailsPage.jsx`:

```javascript
// Backend provides structured data
const {
  media,           // Array of media objects
  variants,        // Array of variant objects
  relatedProducts, // Formatted related products
  details,         // Structured details object
  specifications,  // Array of spec objects
} = productData;
```

---

### 6. Add Authentication Headers

For admin operations, include JWT token:

```javascript
// In client/src/api/client.js
const token = localStorage.getItem('authToken');

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

---

## 🧪 Testing

### Test Public Endpoints

```bash
# Get all products
curl http://localhost:4000/api/products

# Get product by ID
curl http://localhost:4000/api/products/classic-white-tee

# Get products with filters
curl "http://localhost:4000/api/products?category=clothing&minPrice=1000&limit=6"

# Check availability
curl http://localhost:4000/api/products/classic-white-tee/availability
```

---

### Test Admin Endpoints

```bash
# Login first to get token
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"1234567890","password":"password123"}'

# Use token in subsequent requests
TOKEN="your-jwt-token-here"

# Create product
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @new-product.json

# Update stock
curl -X PATCH http://localhost:4000/api/products/classic-white-tee/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"CWT-WHT-M","stockLevel":100}'
```

---

## 📝 Migration Checklist

- [ ] 1. Start backend server
- [ ] 2. Test product endpoints manually
- [ ] 3. Update frontend API base URL
- [ ] 4. Update response handling in components
- [ ] 5. Handle new color format
- [ ] 6. Add authentication headers for admin
- [ ] 7. Seed database with sample products
- [ ] 8. Remove mock fallbacks gradually
- [ ] 9. Test end-to-end flow
- [ ] 10. Update error handling

---

## 🚨 Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

Frontend should handle these errors:

```javascript
try {
  const data = await fetchProducts();
} catch (error) {
  if (error.response?.data?.errors) {
    // Handle validation errors
    console.error('Validation errors:', error.response.data.errors);
  } else {
    // Handle general error
    console.error('Error:', error.response?.data?.message || error.message);
  }
}
```

---

## ✅ Next Steps

1. ✅ Product model complete
2. 🔄 Ready to move to **Category** model
3. ⏳ Then Cart, Wishlist, Order, etc.

---

**Do you want me to proceed with the Category model next?**
