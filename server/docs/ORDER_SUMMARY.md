# Order Module - Quick Reference

## 📦 Overview

Complete order management system with checkout, tracking, cancellation, and admin controls.

---

## 🎯 Key Features

✅ Order creation from cart  
✅ Auto stock management  
✅ Order tracking with timeline  
✅ Customer cancellation  
✅ Admin order management  
✅ Payment confirmation  
✅ Unique order numbers (CYA-YYMMDD-XXXX)  
✅ Free shipping (≥ ₹5,000)

---

## 📍 Endpoints Summary

### User Endpoints (5)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Create order from cart | ✅ |
| GET | `/api/orders` | Get user's orders | ✅ |
| GET | `/api/orders/:id` | Get order details | ✅ |
| PATCH | `/api/orders/:id/cancel` | Cancel order | ✅ |
| GET | `/api/orders/stats` | Get order statistics | ✅ |

### Admin Endpoints (3)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/orders/admin/all` | Get all orders | 🔒 Admin |
| PATCH | `/api/orders/:id/status` | Update order status | 🔒 Admin |
| PATCH | `/api/orders/:id/confirm-payment` | Confirm payment | 🔒 Admin |

---

## 🔄 Order Status Flow

```
PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → OUT-FOR-DELIVERY → DELIVERED
   ↓
CANCELLED → REFUNDED
```

**Valid Transitions:**
- Pending → Confirmed, Cancelled
- Confirmed → Processing, Cancelled
- Processing → Packed, Cancelled
- Packed → Shipped, Cancelled
- Shipped → Out-for-Delivery
- Out-for-Delivery → Delivered
- Cancelled → Refunded

---

## 💰 Pricing Logic

```
Subtotal = Σ(item.price × quantity)
Shipping = subtotal >= ₹5,000 ? ₹0 : ₹150
Tax = subtotal × 6%
Discount = coupon discount (future)
Total = subtotal + shipping + tax - discount
```

**Free Shipping:** ≥ ₹5,000

---

## 📦 Create Order

**Request:**
```json
{
  "addressId": "addr_id",
  "paymentMethod": "UPI",
  "customerNotes": "Deliver before 6 PM"
}
```

**Process:**
1. Validates address & cart
2. Checks product stock
3. Calculates pricing
4. Generates order number
5. Reduces stock
6. Clears cart
7. Returns order details

**Payment Methods:**
- COD (Cash on Delivery)
- UPI
- Credit Card
- Debit Card
- Net Banking
- Wallet

---

## 🚫 Cancel Order

**Rules:**
- Only "pending", "confirmed", "processing" can be cancelled
- Stock automatically restored
- Reason required (min 10 chars)

**Request:**
```json
{
  "reason": "Found a better deal elsewhere"
}
```

---

## 👨‍💼 Admin Features

### Update Status
```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123456",
  "courierService": "BlueDart"
}
```

### Confirm Payment
```json
{
  "transactionId": "TXN83F24P6"
}
```

**Auto-updates:**
- Confirmed → Payment status = completed
- Shipped → Updates shippedAt timestamp
- Delivered → Updates deliveredAt timestamp

---

## 📊 Order Statistics

**Returns:**
- Total orders count
- Status breakdown
- Total amount spent
- Recent 5 orders

**Example Response:**
```json
{
  "totalOrders": 48,
  "statusBreakdown": {
    "pending": 2,
    "confirmed": 5,
    "delivered": 28,
    "cancelled": 3
  },
  "totalSpent": 245780,
  "recentOrders": [...]
}
```

---

## 🔍 Filters & Pagination

**Query Parameters:**
- `status` - Filter by status
- `page` - Page number (default: 1)
- `limit` - Per page (default: 10)
- `sortBy` - Sort field (default: placedAt)
- `sortOrder` - asc/desc (default: desc)
- `search` - Search orders (admin only)

---

## 📝 Order Timeline

Each status change adds timeline event:

```json
{
  "title": "Order confirmed",
  "description": "Payment received and order confirmed.",
  "status": "complete",
  "timestamp": "2025-10-06T10:35:00.000Z"
}
```

**Status Types:**
- `complete` - Done
- `current` - In progress
- `upcoming` - Not started

---

## 🔐 Security

- ✅ JWT authentication required
- ✅ User can only access own orders
- ✅ Admin role required for admin endpoints
- ✅ Ownership verification on all operations
- ✅ Stock validation before order
- ✅ Status transition validation

---

## 🎨 Frontend Integration

### Create Order
```javascript
import { createOrder } from '../api/orders';

const handleCheckout = async () => {
  const { data } = await createOrder({
    addressId: selectedAddress,
    paymentMethod: 'UPI',
    customerNotes: notes
  });
  
  navigate(`/confirmation/${data.order.id}`);
};
```

### View Orders
```javascript
import { fetchOrders } from '../api/orders';

const { data } = await fetchOrders({
  status: 'delivered',
  page: 1,
  limit: 10
});
```

### Cancel Order
```javascript
import { cancelOrder } from '../api/orders';

await cancelOrder(orderId, 'Found better deal');
```

---

## 🧪 Quick Tests

```bash
# Create order
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"addressId":"addr_id","paymentMethod":"UPI"}'

# Get orders
curl http://localhost:4000/api/orders \
  -H "Authorization: Bearer $TOKEN"

# Cancel order
curl -X PATCH http://localhost:4000/api/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason":"Changed my mind"}'
```

---

## ⚠️ Common Errors

| Error | Reason | Solution |
|-------|--------|----------|
| Cart is empty | No items in cart | Add items before checkout |
| Insufficient stock | Not enough inventory | Reduce quantity |
| Cannot cancel | Already shipped | Contact support |
| Address not found | Invalid address ID | Select valid address |
| Invalid transition | Wrong status flow | Follow status rules |

---

## 📈 Future Enhancements

- [ ] Payment gateway integration (Razorpay)
- [ ] Email notifications
- [ ] SMS updates
- [ ] Invoice generation (PDF)
- [ ] Return & refund flow
- [ ] Courier API integration
- [ ] Real-time tracking
- [ ] Bulk order operations (admin)

---

## 📁 Files

**Created:**
- `server/Controllers/orderController.js` - 780+ lines, 8 functions
- `server/routes/orderRoutes.js` - 8 endpoints
- `server/middleware/validation/orderValidation.js` - 210+ lines

**Updated:**
- `server/index.js` - Added order routes
- `server/middleware/authMiddleware.js` - Added restrictTo middleware

**Model:**
- `server/models/Order.js` - 361 lines (already existed)

---

## 🔗 Dependencies

**Modules:**
- ✅ Cart Module (order items source)
- ✅ Address Module (shipping address)
- ✅ Product Module (stock management)
- ✅ User Module (customer details)
- ⏳ Payment Module (future)
- ⏳ Coupon Module (future)

---

**Status:** ✅ Complete & Ready for Testing

**Total Endpoints:** 51 (43 previous + 8 new)

**See full documentation:** `ORDER_MODULE.md`
