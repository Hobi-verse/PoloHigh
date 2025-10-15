# Cart Module - API Documentation

## Overview

The Cart module handles shopping cart functionality including add/remove items, quantity updates, save for later feature, and cart validation.

---

## 📋 Features

- ✅ **User-specific carts** - Each user has their own cart
- ✅ **Add/Remove items** - Manage cart items
- ✅ **Quantity updates** - Adjust item quantities
- ✅ **Save for later** - Move items to saved list
- ✅ **Auto-totals calculation** - Subtotal, tax, shipping
- ✅ **Stock validation** - Check availability before adding
- ✅ **Price sync** - Update prices when product changes
- ✅ **Cart expiry** - Auto-delete after 30 days of inactivity
- ✅ **Product snapshots** - Preserve product data at time of adding

---

## 🔗 API Endpoints

### 1. Get Cart
**GET** `/api/cart`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "cart_id",
      "items": [
        {
          "id": "item_id",
          "productId": "classic-white-tee",
          "title": "Classic White Tee",
          "price": 2075,
          "size": "M",
          "color": "white",
          "quantity": 1,
          "imageUrl": "https://...",
          "savedForLater": false,
          "addedAt": "2025-10-06T10:30:00.000Z",
          "variantSku": "CWT-M-WHT"
        }
      ],
      "totals": {
        "subtotal": 2075,
        "itemCount": 1,
        "savedItemCount": 0
      },
      "lastActivityAt": "2025-10-06T10:30:00.000Z"
    }
  }
}
```

---

### 2. Add Item to Cart
**POST** `/api/cart/items`

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "67023abc123def456789",
  "variantSku": "CWT-M-WHT",
  "quantity": 1
}
```

**Validation Rules:**
- `productId` - Required, valid MongoDB ObjectId
- `variantSku` - Required, string
- `quantity` - Optional (default: 1), integer 1-99

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cart": {
      "id": "cart_id",
      "items": [...],
      "totals": {
        "subtotal": 2075,
        "itemCount": 1,
        "savedItemCount": 0
      }
    }
  }
}
```

**Error Responses:**
- `400` - Validation failed, insufficient stock
- `404` - Product or variant not found

---

### 3. Update Cart Item Quantity
**PATCH** `/api/cart/items/:itemId`

**Authentication:** Required

**URL Parameters:**
- `itemId` - MongoDB ObjectId of the cart item

**Request Body:**
```json
{
  "quantity": 2
}
```

**Validation Rules:**
- `quantity` - Required, integer 1-99

**Response:**
```json
{
  "success": true,
  "message": "Cart item updated",
  "data": {
    "cart": { ... }
  }
}
```

**Error Responses:**
- `400` - Invalid quantity, insufficient stock
- `404` - Cart or item not found

---

### 4. Remove Item from Cart
**DELETE** `/api/cart/items/:itemId`

**Authentication:** Required

**URL Parameters:**
- `itemId` - MongoDB ObjectId of the cart item

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "cart": { ... }
  }
}
```

**Error Responses:**
- `404` - Cart or item not found

---

### 5. Save Item for Later
**PATCH** `/api/cart/items/:itemId/save-for-later`

**Authentication:** Required

**URL Parameters:**
- `itemId` - MongoDB ObjectId of the cart item

**Response:**
```json
{
  "success": true,
  "message": "Item saved for later",
  "data": {
    "cart": { ... }
  }
}
```

**Behavior:**
- Moves item from active cart to "saved for later"
- Removed from subtotal calculation
- Doesn't count toward item count
- Still visible in cart UI under "Saved Items"

---

### 6. Move Item Back to Cart
**PATCH** `/api/cart/items/:itemId/move-to-cart`

**Authentication:** Required

**URL Parameters:**
- `itemId` - MongoDB ObjectId of the cart item

**Response:**
```json
{
  "success": true,
  "message": "Item moved to cart",
  "data": {
    "cart": { ... }
  }
}
```

**Validation:**
- Checks stock availability before moving back
- Returns error if out of stock

---

### 7. Clear Cart
**DELETE** `/api/cart`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared",
  "data": {
    "cart": {
      "id": "cart_id",
      "items": [],
      "totals": {
        "subtotal": 0,
        "itemCount": 0,
        "savedItemCount": 0
      }
    }
  }
}
```

**Behavior:**
- Removes all items (including saved for later)
- Resets all totals to 0

---

### 8. Get Cart Summary
**GET** `/api/cart/summary`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "itemCount": 3,
    "subtotal": 8300,
    "savedItemCount": 1
  }
}
```

**Use Case:**
- Display cart badge in header
- Quick overview without full cart data
- Lightweight endpoint for frequent polling

---

### 9. Validate Cart
**POST** `/api/cart/validate`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "issues": [
      {
        "itemId": "item_123",
        "type": "insufficient_stock",
        "message": "Only 2 items available for \"Classic White Tee\" (M, white)",
        "availableStock": 2,
        "requestedQuantity": 5
      },
      {
        "itemId": "item_456",
        "type": "price_changed",
        "message": "Price for \"Slim Fit Jeans\" has changed",
        "oldPrice": 4980,
        "newPrice": 3980
      }
    ],
    "updatedItems": ["item_456"],
    "cart": { ... }
  }
}
```

**Issue Types:**
- `product_not_found` - Product deleted/unavailable
- `variant_not_found` - Size/color no longer available
- `insufficient_stock` - Not enough stock
- `price_changed` - Price updated (automatically synced)

**Use Case:**
- Call before checkout
- Validate stock availability
- Sync prices with current product data

---

## 🔄 Business Logic

### Automatic Calculations

**Subtotal Calculation:**
```
subtotal = sum(item.price × item.quantity) for active items only
```

**Tax Calculation:**
```
tax = (subtotal - discount) × 0.18  // 18% GST
```

**Shipping Calculation:**
```
shipping = subtotal >= ₹2000 ? 0 : ₹100
```

**Total Calculation:**
```
total = subtotal - discount + tax + shipping
```

### Stock Validation

Before adding/updating items:
1. Fetch product and variant
2. Check `variant.stockLevel >= requested quantity`
3. Return error if insufficient stock

### Duplicate Item Handling

When adding item with same `productId` + `variantSku`:
- Increments quantity instead of creating duplicate
- Updates `priceAtAdd` to current price

### Product Snapshot

Each cart item stores:
```javascript
{
  productSnapshot: {
    title: "Classic White Tee",
    slug: "classic-white-tee",
    brand: "StyleHub",
    price: 2075,
    salePrice: null,
    imageUrl: "https://...",
    category: "clothing"
  }
}
```

**Purpose:**
- Preserve product details even if product is updated
- Show accurate data at time of adding
- Enable price change detection

### Cart Expiry

- TTL (Time To Live): 30 days
- Resets on any cart activity
- MongoDB automatically deletes expired carts
- Users get fresh cart on next login

---

## 🎨 Frontend Integration

### 1. Update Cart API Client

**File:** `client/src/api/cart.js`

```javascript
import { apiRequest } from "./client";

export const fetchCart = async ({ signal } = {}) =>
  apiRequest("/cart", { signal });

export const addCartItem = async (payload) =>
  apiRequest("/cart/items", {
    method: "POST",
    body: payload,
  });

export const updateCartItem = async (itemId, payload) =>
  apiRequest(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: payload,
  });

export const removeCartItem = async (itemId) =>
  apiRequest(`/cart/items/${itemId}`, {
    method: "DELETE",
  });

export const saveItemForLater = async (itemId) =>
  apiRequest(`/cart/items/${itemId}/save-for-later`, {
    method: "PATCH",
  });

export const moveItemToCart = async (itemId) =>
  apiRequest(`/cart/items/${itemId}/move-to-cart`, {
    method: "PATCH",
  });

export const clearCart = async () =>
  apiRequest("/cart", {
    method: "DELETE",
  });

export const fetchCartSummary = async ({ signal } = {}) =>
  apiRequest("/cart/summary", { signal });

export const validateCart = async () =>
  apiRequest("/cart/validate", {
    method: "POST",
  });
```

### 2. Remove Mock Data

**Remove:**
- `client/src/data/cart.json`
- `getMockCart()` from `mockData.js`

### 3. Update Cart Components

**CartPage.jsx:**
```javascript
import { fetchCart, removeCartItem, updateCartItem } from '../api/cart';

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const { data } = await fetchCart();
      setCart(data.cart);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, quantity) => {
    try {
      await updateCartItem(itemId, { quantity });
      await loadCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeCartItem(itemId);
      await loadCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  // ... rest of component
};
```

### 4. Add to Cart from Product Page

**ProductDetailsPage.jsx:**
```javascript
import { addCartItem } from '../api/cart';

const handleAddToCart = async () => {
  try {
    const payload = {
      productId: product._id,
      variantSku: selectedVariant.sku,
      quantity: quantity
    };
    
    await addCartItem(payload);
    
    // Show success message
    toast.success('Added to cart!');
    
    // Optionally update cart badge
    updateCartBadge();
  } catch (error) {
    if (error.response?.status === 400) {
      toast.error(error.response.data.message); // e.g., "Insufficient stock"
    } else {
      toast.error('Failed to add to cart');
    }
  }
};
```

### 5. Cart Badge in Header

**Navbar.jsx:**
```javascript
import { fetchCartSummary } from '../api/cart';

const Navbar = () => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCartSummary();
  }, []);

  const loadCartSummary = async () => {
    try {
      const { data } = await fetchCartSummary();
      setCartCount(data.itemCount);
    } catch (error) {
      console.error('Failed to load cart summary:', error);
    }
  };

  return (
    <nav>
      {/* ... */}
      <Link to="/cart">
        <ShoppingBag />
        {cartCount > 0 && <span className="badge">{cartCount}</span>}
      </Link>
    </nav>
  );
};
```

### 6. Validate Before Checkout

**CheckoutPage.jsx:**
```javascript
import { validateCart } from '../api/cart';

const handleProceedToCheckout = async () => {
  try {
    const { data } = await validateCart();
    
    if (!data.valid) {
      // Show issues to user
      data.issues.forEach(issue => {
        toast.warning(issue.message);
      });
      
      // Refresh cart with updated prices
      loadCart();
      
      return;
    }
    
    // Proceed to checkout
    navigate('/checkout');
  } catch (error) {
    toast.error('Failed to validate cart');
  }
};
```

---

## 🧪 Testing

### 1. Manual Testing

```bash
# Get cart (requires login token)
curl -X GET http://localhost:4000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add item to cart
curl -X POST http://localhost:4000/api/cart/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "67023abc123def456789",
    "variantSku": "CWT-M-WHT",
    "quantity": 2
  }'

# Update quantity
curl -X PATCH http://localhost:4000/api/cart/items/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3}'

# Save for later
curl -X PATCH http://localhost:4000/api/cart/items/ITEM_ID/save-for-later \
  -H "Authorization: Bearer YOUR_TOKEN"

# Move back to cart
curl -X PATCH http://localhost:4000/api/cart/items/ITEM_ID/move-to-cart \
  -H "Authorization: Bearer YOUR_TOKEN"

# Remove item
curl -X DELETE http://localhost:4000/api/cart/items/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clear cart
curl -X DELETE http://localhost:4000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get summary
curl -X GET http://localhost:4000/api/cart/summary \
  -H "Authorization: Bearer YOUR_TOKEN"

# Validate cart
curl -X POST http://localhost:4000/api/cart/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Scenarios

**Scenario 1: Add Product to Cart**
1. Login as customer
2. View product details
3. Select size and color
4. Add to cart
5. Verify cart item count increases
6. View cart page - item should appear

**Scenario 2: Update Quantity**
1. Open cart
2. Change quantity to 3
3. Verify subtotal updates
4. Try quantity > stock - should show error

**Scenario 3: Save for Later**
1. Click "Save for Later" on cart item
2. Item moves to "Saved Items" section
3. Subtotal decreases
4. Click "Move to Cart"
5. Item returns to active cart

**Scenario 4: Stock Validation**
1. Add item with max stock to cart
2. Try adding more - should fail
3. Update product stock in admin
4. Try adding again - should work

**Scenario 5: Price Changes**
1. Add item to cart (price ₹2000)
2. Admin updates product price to ₹1800
3. Call validate cart endpoint
4. Price should update in cart
5. Issue logged with old/new price

**Scenario 6: Cart Persistence**
1. Add items to cart
2. Logout
3. Login again
4. Cart should still have items

---

## 🛡️ Security & Validation

### Authentication
- All endpoints require valid JWT token
- User can only access their own cart
- Cart automatically linked to `req.user._id`

### Input Validation
- Product ID: Valid MongoDB ObjectId
- Variant SKU: Non-empty string
- Quantity: Integer 1-99
- Stock level: Checked before adding/updating

### Error Handling
- Product not found
- Variant not found
- Insufficient stock
- Invalid item ID
- Cart not found

---

## 📊 Database Schema

### Cart Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  items: [
    {
      _id: ObjectId,
      productId: ObjectId (ref: Product),
      variantSku: String,
      title: String,
      price: Number,
      size: String,
      color: String,
      imageUrl: String,
      quantity: Number,
      savedForLater: Boolean,
      addedAt: Date
    }
  ],
  totals: {
    subtotal: Number,
    itemCount: Number,
    savedItemCount: Number
  },
  lastActivityAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `userId` (unique) - Fast user cart lookup
- `lastActivityAt` - For cart cleanup queries
- `items.productId` - For product-cart relationships

---

## 📝 Migration Checklist

- [ ] Test all cart endpoints with Postman/curl
- [ ] Update frontend cart API client
- [ ] Remove mock cart data
- [ ] Update CartPage component
- [ ] Update cart badge in header
- [ ] Add "Add to Cart" to product pages
- [ ] Implement cart validation before checkout
- [ ] Test save for later feature
- [ ] Test quantity updates
- [ ] Test stock validation
- [ ] Test price sync
- [ ] Handle authentication errors gracefully

---

## 🔄 Next Steps

After completing Cart module:

1. **Wishlist Module** - Similar to cart but for saved products
2. **Order Module** - Convert cart to order
3. **Address Module** - Shipping addresses for checkout
4. **PaymentMethod Module** - Saved payment methods

---

## 💡 Tips

1. **Always validate cart before checkout** - Stock and prices may have changed
2. **Call summary endpoint for header badge** - Lighter than full cart
3. **Handle 401 errors** - Redirect to login
4. **Show loading states** - Cart operations can take time
5. **Optimistic UI updates** - Update UI before API call for better UX
6. **Error recovery** - Reload cart on update failures

---

**Cart Module Status:** ✅ Complete

**Files Created:**
- `server/Controllers/cartController.js`
- `server/routes/cartRoutes.js`
- `server/middleware/validation/cartValidation.js`
- `server/docs/CART_MODULE.md`

**Files Updated:**
- `server/index.js` (added cart routes)

**Model:** Already exists at `server/models/Cart.js`
