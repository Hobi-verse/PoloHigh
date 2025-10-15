# Wishlist Module - API Documentation

## Overview

The Wishlist module allows users to save favorite products for later purchase, track stock availability, set priorities, and move items to cart.

---

## 📋 Features

- ✅ **Save favorite products** - Add products to wishlist
- ✅ **Stock tracking** - Monitor product availability
- ✅ **Priority levels** - Organize items (low, medium, high)
- ✅ **Personal notes** - Add notes to items
- ✅ **Variant preference** - Save specific size/color
- ✅ **Move to cart** - Quick add to cart from wishlist
- ✅ **Stock sync** - Auto-update stock and prices
- ✅ **Duplicate prevention** - One product per wishlist
- ✅ **Check wishlist** - Quick check if product is saved

---

## 🔗 API Endpoints

### 1. Get Wishlist
**GET** `/api/wishlist`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "wishlist": {
      "id": "wishlist_id",
      "name": "My Wishlist",
      "isPublic": false,
      "items": [
        {
          "id": "item_id",
          "productId": "classic-white-tee",
          "title": "Classic White T-Shirt",
          "price": 2075,
          "size": "M",
          "color": "white",
          "imageUrl": "https://...",
          "inStock": true,
          "priority": "high",
          "notes": "For summer collection",
          "addedAt": "2025-10-06T10:30:00.000Z",
          "variantSku": "CWT-M-WHT"
        }
      ],
      "itemCount": 3,
      "lastActivityAt": "2025-10-06T10:30:00.000Z"
    }
  }
}
```

**Auto-sync:** Automatically updates stock status and prices

---

### 2. Add Item to Wishlist
**POST** `/api/wishlist`

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "67023abc123def456789",
  "variantSku": "CWT-M-WHT",
  "priority": "high",
  "notes": "Birthday gift idea"
}
```

**Validation Rules:**
- `productId` - Required, valid MongoDB ObjectId
- `variantSku` - Optional, string (SKU of preferred variant)
- `priority` - Optional, enum: "low" | "medium" | "high" (default: "medium")
- `notes` - Optional, string, max 500 characters

**Response:**
```json
{
  "success": true,
  "message": "Item added to wishlist",
  "data": {
    "wishlist": {
      "id": "wishlist_id",
      "items": [...],
      "itemCount": 4
    }
  }
}
```

**Error Responses:**
- `400` - Item already exists in wishlist
- `404` - Product or variant not found

**Behavior:**
- If product already in wishlist → Returns error
- Creates wishlist if doesn't exist
- Saves product snapshot (title, price, image)
- If variant specified → Saves size, color, variant price

---

### 3. Update Wishlist Item
**PATCH** `/api/wishlist/:itemId`

**Authentication:** Required

**URL Parameters:**
- `itemId` - MongoDB ObjectId of wishlist item

**Request Body:**
```json
{
  "priority": "low",
  "notes": "Updated notes",
  "variantSku": "CWT-L-BLK"
}
```

**Validation Rules:**
- `priority` - Optional, enum: "low" | "medium" | "high"
- `notes` - Optional, string, max 500 characters
- `variantSku` - Optional, string (change preferred variant)

**Response:**
```json
{
  "success": true,
  "message": "Wishlist item updated",
  "data": {
    "wishlist": { ... }
  }
}
```

**Use Cases:**
- Change priority level
- Add/update notes
- Change preferred size/color

---

### 4. Remove Item from Wishlist
**DELETE** `/api/wishlist/:itemId`

**Authentication:** Required

**URL Parameters:**
- `itemId` - MongoDB ObjectId of wishlist item

**Response:**
```json
{
  "success": true,
  "message": "Item removed from wishlist",
  "data": {
    "wishlist": {
      "id": "wishlist_id",
      "items": [...],
      "itemCount": 2
    }
  }
}
```

**Error Responses:**
- `404` - Wishlist or item not found

---

### 5. Clear Wishlist
**DELETE** `/api/wishlist`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Wishlist cleared",
  "data": {
    "wishlist": {
      "id": "wishlist_id",
      "items": [],
      "itemCount": 0
    }
  }
}
```

**Behavior:**
- Removes all items from wishlist
- Resets item count to 0

---

### 6. Move Item to Cart
**POST** `/api/wishlist/:itemId/move-to-cart`

**Authentication:** Required

**URL Parameters:**
- `itemId` - MongoDB ObjectId of wishlist item

**Request Body:**
```json
{
  "quantity": 1
}
```

**Validation Rules:**
- `quantity` - Optional (default: 1), integer 1-99

**Response:**
```json
{
  "success": true,
  "message": "Item moved to cart",
  "data": {
    "cart": {
      "id": "cart_id",
      "itemCount": 2
    },
    "wishlist": {
      "id": "wishlist_id",
      "itemCount": 1
    }
  }
}
```

**Behavior:**
1. Validates variant is specified (size/color required)
2. Checks stock availability
3. Adds to cart
4. Removes from wishlist
5. Returns both cart and wishlist status

**Error Responses:**
- `400` - No variant selected, insufficient stock
- `404` - Item, product, or variant not found

---

### 7. Check if Product in Wishlist
**GET** `/api/wishlist/check/:productId`

**Authentication:** Required

**URL Parameters:**
- `productId` - MongoDB ObjectId of product

**Response:**
```json
{
  "success": true,
  "data": {
    "inWishlist": true,
    "itemId": "item_id"
  }
}
```

**Use Case:**
- Display "heart" icon state on product cards
- Show "Added to wishlist" vs "Add to wishlist"
- Quick check without loading full wishlist

---

### 8. Get Wishlist Summary
**GET** `/api/wishlist/summary`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "itemCount": 5
  }
}
```

**Use Case:**
- Display wishlist badge in header
- Lightweight endpoint for badge updates
- Frequent polling without heavy data

---

### 9. Sync Wishlist
**POST** `/api/wishlist/sync`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Wishlist synced successfully",
  "data": {
    "wishlist": {
      "id": "wishlist_id",
      "items": [
        {
          "id": "item_id",
          "productId": "classic-white-tee",
          "title": "Classic White T-Shirt",
          "price": 1899,
          "inStock": false,
          ...
        }
      ],
      "itemCount": 3
    }
  }
}
```

**Behavior:**
- Updates stock status for all items
- Syncs prices with current product data
- Updates variant availability
- Returns refreshed wishlist

**Use Case:**
- Manual sync button
- Before checkout
- Periodic background sync

---

## 🔄 Business Logic

### Adding Items

**Process:**
1. Validate product exists
2. Check if already in wishlist → Error if exists
3. Get product snapshot (title, price, image)
4. If variant specified → Get variant details
5. Save to wishlist
6. Return updated wishlist

**Duplicate Prevention:**
- One product per wishlist
- Can update variant/priority instead

### Stock Sync

**Auto-sync on GET:**
```javascript
// Updates for each item:
- Check product exists
- Get current price
- Check variant stock level
- Update inStock flag
```

**Called on:**
- Get wishlist
- Manual sync endpoint
- Can be scheduled via cron job

### Move to Cart

**Requirements:**
1. Variant must be specified (size + color)
2. Stock must be available
3. Quantity must be valid

**Process:**
1. Validate wishlist item has variant
2. Check stock availability
3. Add to cart with quantity
4. Remove from wishlist
5. Return both statuses

---

## 🎨 Frontend Integration

### 1. Update Wishlist API Client

**File:** `client/src/api/wishlist.js`

```javascript
import { apiRequest } from "./client";

export const fetchWishlist = async ({ signal } = {}) =>
  apiRequest("/wishlist", { signal });

export const addWishlistItem = async (payload) =>
  apiRequest("/wishlist", {
    method: "POST",
    body: payload,
  });

export const updateWishlistItem = async (itemId, payload) =>
  apiRequest(`/wishlist/${itemId}`, {
    method: "PATCH",
    body: payload,
  });

export const removeWishlistItem = async (itemId) =>
  apiRequest(`/wishlist/${itemId}`, {
    method: "DELETE",
  });

export const clearWishlist = async () =>
  apiRequest("/wishlist", {
    method: "DELETE",
  });

export const moveItemToCart = async (itemId, payload) =>
  apiRequest(`/wishlist/${itemId}/move-to-cart`, {
    method: "POST",
    body: payload,
  });

export const checkProductInWishlist = async (productId) =>
  apiRequest(`/wishlist/check/${productId}`);

export const fetchWishlistSummary = async ({ signal } = {}) =>
  apiRequest("/wishlist/summary", { signal });

export const syncWishlist = async () =>
  apiRequest("/wishlist/sync", {
    method: "POST",
  });
```

### 2. Product Card - Add to Wishlist Button

**ProductCard.jsx:**
```javascript
import { addWishlistItem, checkProductInWishlist, removeWishlistItem } from '../api/wishlist';

const ProductCard = ({ product }) => {
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);

  useEffect(() => {
    checkWishlistStatus();
  }, [product._id]);

  const checkWishlistStatus = async () => {
    const { data } = await checkProductInWishlist(product._id);
    setInWishlist(data.inWishlist);
    setWishlistItemId(data.itemId);
  };

  const handleWishlistToggle = async () => {
    if (inWishlist) {
      // Remove from wishlist
      await removeWishlistItem(wishlistItemId);
      setInWishlist(false);
      toast.success('Removed from wishlist');
    } else {
      // Add to wishlist
      await addWishlistItem({ productId: product._id });
      setInWishlist(true);
      toast.success('Added to wishlist');
      await checkWishlistStatus(); // Get item ID
    }
  };

  return (
    <div className="product-card">
      <button 
        className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
        onClick={handleWishlistToggle}
      >
        <Heart filled={inWishlist} />
      </button>
      {/* ... rest of card */}
    </div>
  );
};
```

### 3. Wishlist Page

**WishlistPage.jsx:**
```javascript
import { fetchWishlist, removeWishlistItem, moveItemToCart } from '../api/wishlist';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const { data } = await fetchWishlist();
      setWishlist(data.wishlist);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeWishlistItem(itemId);
      await loadWishlist();
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleMoveToCart = async (itemId) => {
    try {
      await moveItemToCart(itemId, { quantity: 1 });
      await loadWishlist();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  // Render wishlist items
  return (
    <div className="wishlist-page">
      {wishlist?.items.map(item => (
        <WishlistItem
          key={item.id}
          item={item}
          onRemove={() => handleRemove(item.id)}
          onMoveToCart={() => handleMoveToCart(item.id)}
        />
      ))}
    </div>
  );
};
```

### 4. Wishlist Badge in Header

**Navbar.jsx:**
```javascript
import { fetchWishlistSummary } from '../api/wishlist';

const Navbar = () => {
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    loadWishlistSummary();
  }, []);

  const loadWishlistSummary = async () => {
    try {
      const { data } = await fetchWishlistSummary();
      setWishlistCount(data.itemCount);
    } catch (error) {
      console.error('Failed to load wishlist summary:', error);
    }
  };

  return (
    <nav>
      {/* ... */}
      <Link to="/wishlist">
        <Heart />
        {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
      </Link>
    </nav>
  );
};
```

### 5. Product Detail Page - Advanced Wishlist

**ProductDetailsPage.jsx:**
```javascript
const handleAddToWishlist = async () => {
  try {
    const payload = {
      productId: product._id,
      variantSku: selectedVariant?.sku,
      priority: 'high',
      notes: ''
    };
    
    await addWishlistItem(payload);
    toast.success('Added to wishlist!');
    
  } catch (error) {
    if (error.response?.status === 400) {
      // Already in wishlist
      toast.info('Already in wishlist');
    } else {
      toast.error('Failed to add to wishlist');
    }
  }
};
```

---

## 🧪 Testing

### 1. Manual Testing

```bash
# Get auth token first
TOKEN="your_jwt_token_here"

# Get wishlist
curl -X GET http://localhost:4000/api/wishlist \
  -H "Authorization: Bearer $TOKEN"

# Add item
curl -X POST http://localhost:4000/api/wishlist \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "67023abc123def456789",
    "variantSku": "CWT-M-WHT",
    "priority": "high",
    "notes": "Birthday gift"
  }'

# Check if product in wishlist
curl -X GET http://localhost:4000/api/wishlist/check/67023abc123def456789 \
  -H "Authorization: Bearer $TOKEN"

# Update item
curl -X PATCH http://localhost:4000/api/wishlist/ITEM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priority": "low"}'

# Move to cart
curl -X POST http://localhost:4000/api/wishlist/ITEM_ID/move-to-cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'

# Remove item
curl -X DELETE http://localhost:4000/api/wishlist/ITEM_ID \
  -H "Authorization: Bearer $TOKEN"

# Sync wishlist
curl -X POST http://localhost:4000/api/wishlist/sync \
  -H "Authorization: Bearer $TOKEN"

# Get summary
curl -X GET http://localhost:4000/api/wishlist/summary \
  -H "Authorization: Bearer $TOKEN"

# Clear wishlist
curl -X DELETE http://localhost:4000/api/wishlist \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Test Scenarios

**Scenario 1: Add to Wishlist from Product Page**
1. View product details
2. Click heart icon
3. Verify item added to wishlist
4. Check wishlist badge count increases
5. View wishlist page - item should appear

**Scenario 2: Priority Levels**
1. Add item with high priority
2. Add item with medium priority
3. Add item with low priority
4. View wishlist sorted by priority
5. Update priority of an item

**Scenario 3: Move to Cart**
1. Add product to wishlist with variant
2. Navigate to wishlist
3. Click "Move to Cart"
4. Verify item added to cart
5. Verify item removed from wishlist

**Scenario 4: Stock Tracking**
1. Add in-stock product to wishlist
2. Admin updates product stock to 0
3. Sync wishlist
4. Verify inStock = false
5. Try moving to cart - should fail

**Scenario 5: Duplicate Prevention**
1. Add product to wishlist
2. Try adding same product again
3. Should show error "Already in wishlist"
4. Can update variant/priority instead

**Scenario 6: Price Updates**
1. Add product to wishlist (price ₹2000)
2. Admin updates product price to ₹1800
3. Sync wishlist
4. Verify price updated in wishlist

---

## 🛡️ Security & Validation

### Authentication
- All endpoints require valid JWT token
- User can only access their own wishlist
- Wishlist automatically linked to `req.user._id`

### Input Validation
- Product ID: Valid MongoDB ObjectId
- Variant SKU: String (optional)
- Priority: Enum (low, medium, high)
- Notes: Max 500 characters

### Error Handling
- Product not found
- Variant not found
- Item not found
- Duplicate item
- Stock unavailable

---

## 📊 Database Schema

### Wishlist Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
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
      inStock: Boolean,
      priority: String (enum: low, medium, high),
      notes: String,
      addedAt: Date
    }
  ],
  name: String,
  isPublic: Boolean,
  lastActivityAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `userId` (unique) - Fast user lookup
- `items.productId` - Product-wishlist relationships
- `lastActivityAt` - Activity queries

### Virtual Fields
- `itemCount` - Computed from items.length

---

## 📝 Migration Checklist

- [ ] Test all wishlist endpoints
- [ ] Update frontend wishlist API client
- [ ] Remove mock wishlist data
- [ ] Update WishlistPage component
- [ ] Add heart icon to product cards
- [ ] Update wishlist badge in header
- [ ] Implement check wishlist status
- [ ] Test add/remove from wishlist
- [ ] Test move to cart feature
- [ ] Test priority levels
- [ ] Test stock sync
- [ ] Handle authentication errors

---

## 🔄 Integration with Other Modules

### Product Module
- Wishlist syncs stock from Product.variants[].stockLevel
- Wishlist stores product snapshot from Product data
- Wishlist updates prices from current Product pricing

### Cart Module
- Move to cart creates Cart item from Wishlist item
- Removes from wishlist after adding to cart
- Validates stock before adding to cart

### User Module
- Each user has one wishlist
- Wishlist linked via userId
- Can be extended to multiple wishlists per user

---

## 🎯 Future Enhancements

1. **Multiple Wishlists** - Allow users to create themed wishlists
2. **Share Wishlist** - Generate share links for gift registries
3. **Price Alerts** - Notify when price drops below target
4. **Stock Alerts** - Email when out-of-stock item restocks
5. **Wishlist Analytics** - Track most wished products
6. **Social Features** - Follow other users' public wishlists

---

**Wishlist Module Status:** ✅ Complete

**Files Created:**
- `server/Controllers/wishlistController.js`
- `server/routes/wishlistRoutes.js`
- `server/middleware/validation/wishlistValidation.js`
- `server/docs/WISHLIST_MODULE.md`

**Files Updated:**
- `server/index.js` (added wishlist routes)

**Model:** Already exists at `server/models/Wishlist.js`
