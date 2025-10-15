# Order Module - API Documentation

## Overview

The Order module manages the complete order lifecycle from creation to delivery, including payment confirmation, status tracking, cancellation, and admin order management.

---

## 📋 Features

- ✅ **Order Creation** - Create orders from cart or direct checkout
- ✅ **Stock Management** - Automatic stock reduction on order placement
- ✅ **Payment Integration** - Support for multiple payment methods
- ✅ **Order Tracking** - Real-time status updates with timeline
- ✅ **Order History** - Complete order history for users
- ✅ **Cancellation** - Customer-initiated order cancellation with stock restoration
- ✅ **Admin Management** - Admin dashboard for order management
- ✅ **Status Workflow** - Structured status transitions
- ✅ **Statistics** - Order analytics for users and admins
- ✅ **Auto Order Numbers** - Unique order number generation (CYA-YYMMDD-XXXX)

---

## 🔗 API Endpoints

### USER ENDPOINTS

### 1. Create Order
**POST** `/api/orders`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "addressId": "addr_id_here",
  "paymentMethod": "UPI",
  "paymentMethodId": "payment_method_id", // Optional
  "customerNotes": "Please deliver before 6 PM", // Optional
  "useCartItems": true // Default: true (use cart items)
}
```

**Validation Rules:**
- `addressId` - Required, valid MongoDB ObjectId
- `paymentMethod` - Required, one of: "COD", "UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"
- `paymentMethodId` - Optional, valid MongoDB ObjectId
- `customerNotes` - Optional, max 500 characters
- `useCartItems` - Optional, boolean (default: true)

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "CYA-2510-1024",
      "status": "pending",
      "placedAt": "2025-10-06T10:30:00.000Z",
      "deliveryWindow": "October 9, 2025 - October 11, 2025",
      "items": [
        {
          "productId": "product_id",
          "variantSku": "TS-WHT-M",
          "title": "Classic White T-Shirt",
          "size": "M",
          "color": "White",
          "unitPrice": 2075,
          "quantity": 1,
          "imageUrl": "https://example.com/image.jpg",
          "discount": 0,
          "subtotal": 2075
        }
      ],
      "pricing": {
        "subtotal": 2075,
        "shipping": 150,
        "tax": 125,
        "discount": 0,
        "grandTotal": 2350
      },
      "shipping": {
        "recipient": "Aditi Sharma",
        "phone": "+91 9876543210",
        "addressLine1": "12, Green Vista Apartments",
        "addressLine2": "1st Main Road, Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560038",
        "country": "India",
        "instructions": "Ring bell twice"
      },
      "payment": {
        "method": "UPI",
        "status": "pending"
      },
      "timeline": [
        {
          "title": "Order received",
          "description": "We've received your order and are processing it.",
          "status": "complete",
          "timestamp": "2025-10-06T10:30:00.000Z"
        },
        {
          "title": "Payment processing",
          "description": "Your payment is being verified.",
          "status": "current",
          "timestamp": "2025-10-06T10:30:00.000Z"
        },
        {
          "title": "Preparing items",
          "description": "We'll start packing your items once payment is confirmed.",
          "status": "upcoming",
          "timestamp": "2025-10-06T10:30:00.000Z"
        }
      ]
    }
  }
}
```

**Process Flow:**
1. Validates user and shipping address
2. Retrieves items from cart (if `useCartItems: true`)
3. Validates product availability and stock
4. Calculates pricing (subtotal, shipping, tax, grand total)
5. Generates unique order number
6. Creates order with status "pending"
7. Reduces product stock and updates total sold
8. Clears user's cart
9. Returns complete order details

**Business Rules:**
- **Free Shipping:** Orders ≥ ₹5,000 get free shipping
- **Stock Validation:** All items must have sufficient stock
- **Cart Clearing:** Cart is cleared after successful order
- **Tax Rate:** 6% tax applied on subtotal
- **Delivery:** Estimated 3-5 days from order placement

**Error Responses:**
- `400` - Validation errors, cart empty, insufficient stock
- `404` - User or address not found

---

### 2. Get All Orders
**GET** `/api/orders`

**Authentication:** Required

**Query Parameters:**
- `status` - Filter by order status (optional)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (default: "placedAt")
- `sortOrder` - Sort direction: "asc" | "desc" (default: "desc")

**Example Request:**
```
GET /api/orders?status=delivered&page=1&limit=10&sortBy=placedAt&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_id",
        "orderNumber": "CYA-2510-1024",
        "status": "delivered",
        "placedAt": "2025-10-06T10:30:00.000Z",
        "deliveryWindow": "October 9, 2025 - October 11, 2025",
        "estimatedDeliveryDate": "2025-10-10T00:00:00.000Z",
        "itemCount": 2,
        "items": [
          {
            "id": "item_id",
            "productId": "product_id",
            "title": "Classic White T-Shirt",
            "size": "M",
            "color": "White",
            "quantity": 1,
            "unitPrice": 2075,
            "subtotal": 2075,
            "imageUrl": "https://example.com/image.jpg"
          }
        ],
        "pricing": {
          "subtotal": 6225,
          "shipping": 0,
          "tax": 375,
          "discount": 0,
          "grandTotal": 6600
        },
        "payment": {
          "method": "UPI",
          "status": "completed",
          "transactionId": "TXN83F24P6"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalOrders": 48,
      "hasMore": true
    }
  }
}
```

**Filters:**
- All statuses: pending, confirmed, processing, packed, shipped, out-for-delivery, delivered, cancelled, refunded
- Sorted by default: Newest orders first

---

### 3. Get Order by ID
**GET** `/api/orders/:id`

**Authentication:** Required (Own orders only)

**URL Parameters:**
- `id` - MongoDB ObjectId of order

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "CYA-2510-1024",
      "status": "delivered",
      "placedAt": "2025-10-06T10:30:00.000Z",
      "confirmedAt": "2025-10-06T10:35:00.000Z",
      "shippedAt": "2025-10-07T14:20:00.000Z",
      "deliveredAt": "2025-10-09T16:45:00.000Z",
      "cancelledAt": null,
      "items": [
        {
          "id": "item_id",
          "productId": "product_id",
          "title": "Classic White T-Shirt",
          "size": "M",
          "color": "White",
          "quantity": 1,
          "unitPrice": 2075,
          "subtotal": 2075,
          "imageUrl": "https://example.com/image.jpg",
          "discount": 0
        }
      ],
      "pricing": {
        "subtotal": 6225,
        "shipping": 0,
        "tax": 375,
        "discount": 0,
        "grandTotal": 6600
      },
      "shipping": {
        "recipient": "Aditi Sharma",
        "phone": "+91 9876543210",
        "addressLine1": "12, Green Vista Apartments",
        "addressLine2": "1st Main Road, Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560038",
        "country": "India",
        "instructions": "Ring bell twice",
        "addressId": "addr_id"
      },
      "delivery": {
        "estimatedDeliveryDate": "2025-10-10T00:00:00.000Z",
        "deliveryWindow": "October 9, 2025 - October 11, 2025",
        "actualDeliveryDate": "2025-10-09T16:45:00.000Z",
        "trackingNumber": "TRACK123456",
        "courierService": "BlueDart"
      },
      "payment": {
        "method": "UPI",
        "status": "completed",
        "transactionId": "TXN83F24P6",
        "paidAt": "2025-10-06T10:35:00.000Z"
      },
      "timeline": [
        {
          "title": "Order received",
          "description": "We've received your order and are processing it.",
          "status": "complete",
          "timestamp": "2025-10-06T10:30:00.000Z"
        },
        {
          "title": "Order confirmed",
          "description": "Payment received and order confirmed.",
          "status": "complete",
          "timestamp": "2025-10-06T10:35:00.000Z"
        },
        {
          "title": "Shipped",
          "description": "Your order has been shipped.",
          "status": "complete",
          "timestamp": "2025-10-07T14:20:00.000Z"
        },
        {
          "title": "Delivered",
          "description": "Your order has been delivered successfully.",
          "status": "complete",
          "timestamp": "2025-10-09T16:45:00.000Z"
        }
      ],
      "customer": {
        "name": "Aditi Sharma",
        "email": "aditi.sharma@example.com",
        "phone": "+91 9876543210"
      },
      "support": {
        "email": "support@ciyatake.com",
        "phone": "+91 1800-123-456",
        "hours": "Monday to Saturday, 10am - 6pm IST"
      },
      "notes": {
        "customerNotes": "Please deliver before 6 PM",
        "internalNotes": ""
      }
    }
  }
}
```

**Error Responses:**
- `404` - Order not found or doesn't belong to user

---

### 4. Cancel Order
**PATCH** `/api/orders/:id/cancel`

**Authentication:** Required (Own orders only)

**URL Parameters:**
- `id` - MongoDB ObjectId of order

**Request Body:**
```json
{
  "reason": "Found a better deal elsewhere" // Optional, min 10 chars
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "CYA-2510-1024",
      "status": "cancelled",
      "cancelledAt": "2025-10-06T11:00:00.000Z"
    }
  }
}
```

**Cancellation Rules:**
- Only orders with status "pending", "confirmed", or "processing" can be cancelled
- Product stock is automatically restored
- Timeline is updated with cancellation event
- Reason is saved in customer notes

**Error Responses:**
- `400` - Order cannot be cancelled (already shipped/delivered)
- `404` - Order not found

---

### 5. Get Order Statistics
**GET** `/api/orders/stats`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 48,
    "statusBreakdown": {
      "pending": 2,
      "confirmed": 5,
      "processing": 3,
      "packed": 1,
      "shipped": 4,
      "out-for-delivery": 2,
      "delivered": 28,
      "cancelled": 3,
      "refunded": 0
    },
    "totalSpent": 245780,
    "recentOrders": [
      {
        "id": "order_id",
        "orderNumber": "CYA-2510-1024",
        "status": "delivered",
        "placedAt": "2025-10-06T10:30:00.000Z",
        "total": 6600
      }
    ]
  }
}
```

**Use Cases:**
- User dashboard overview
- Order analytics
- Spending summary
- Quick access to recent orders

---

### ADMIN ENDPOINTS

### 6. Get All Orders (Admin)
**GET** `/api/orders/admin/all`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `status` - Filter by order status (optional)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: "placedAt")
- `sortOrder` - Sort direction: "asc" | "desc" (default: "desc")
- `search` - Search by order number, email, or customer name (optional)

**Example Request:**
```
GET /api/orders/admin/all?status=pending&search=aditi&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_id",
        "orderNumber": "CYA-2510-1024",
        "status": "pending",
        "placedAt": "2025-10-06T10:30:00.000Z",
        "customer": {
          "name": "Aditi Sharma",
          "email": "aditi.sharma@example.com",
          "phone": "+91 9876543210"
        },
        "itemCount": 2,
        "pricing": {
          "subtotal": 6225,
          "shipping": 0,
          "tax": 375,
          "discount": 0,
          "grandTotal": 6600
        },
        "payment": {
          "method": "UPI",
          "status": "pending"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 12,
      "totalOrders": 234,
      "hasMore": true
    }
  }
}
```

---

### 7. Update Order Status (Admin)
**PATCH** `/api/orders/:id/status`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` - MongoDB ObjectId of order

**Request Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123456", // Optional
  "courierService": "BlueDart" // Optional
}
```

**Validation:**
- `status` - Required, valid order status
- `trackingNumber` - Optional, 5-50 characters
- `courierService` - Optional, max 100 characters

**Status Transition Rules:**
```
pending → confirmed, cancelled
confirmed → processing, cancelled
processing → packed, cancelled
packed → shipped, cancelled
shipped → out-for-delivery
out-for-delivery → delivered
delivered → (final state)
cancelled → refunded
refunded → (final state)
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "CYA-2510-1024",
      "status": "shipped",
      "timeline": [
        {
          "title": "Shipped",
          "description": "Your order has been shipped.",
          "status": "complete",
          "timestamp": "2025-10-07T14:20:00.000Z"
        }
      ],
      "delivery": {
        "trackingNumber": "TRACK123456",
        "courierService": "BlueDart",
        "estimatedDeliveryDate": "2025-10-10T00:00:00.000Z",
        "deliveryWindow": "October 9, 2025 - October 11, 2025"
      }
    }
  }
}
```

**Auto-Updates on Status Change:**
- `confirmed` → Sets payment status to "completed", updates confirmedAt timestamp
- `shipped` → Updates shippedAt timestamp
- `delivered` → Updates deliveredAt and actualDeliveryDate
- `cancelled` → Updates cancelledAt timestamp
- All status changes add timeline event

**Error Responses:**
- `400` - Invalid status transition
- `404` - Order not found

---

### 8. Confirm Payment (Admin)
**PATCH** `/api/orders/:id/confirm-payment`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` - MongoDB ObjectId of order

**Request Body:**
```json
{
  "transactionId": "TXN83F24P6" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "CYA-2510-1024",
      "status": "confirmed",
      "payment": {
        "method": "UPI",
        "status": "completed",
        "transactionId": "TXN83F24P6",
        "paidAt": "2025-10-06T10:35:00.000Z"
      }
    }
  }
}
```

**Process:**
1. Validates order exists
2. Checks payment not already confirmed
3. Updates payment status to "completed"
4. Sets paidAt timestamp
5. Updates order status to "confirmed"
6. Adds timeline event

**Use Cases:**
- Manual payment verification (COD orders)
- Payment gateway webhook integration
- Failed payment retry confirmation

**Error Responses:**
- `400` - Payment already confirmed
- `404` - Order not found

---

## 📊 Order Status Workflow

```
┌─────────┐
│ PENDING │ (Order created, payment pending)
└────┬────┘
     │
     ├─→ [Payment Confirmed]
     │
┌────▼────────┐
│ CONFIRMED   │ (Payment received)
└────┬────────┘
     │
     ├─→ [Admin: Start processing]
     │
┌────▼───────────┐
│ PROCESSING     │ (Preparing items)
└────┬───────────┘
     │
     ├─→ [Admin: Items packed]
     │
┌────▼───────┐
│ PACKED     │ (Ready for shipment)
└────┬───────┘
     │
     ├─→ [Admin: Shipped + tracking]
     │
┌────▼───────┐
│ SHIPPED    │ (In transit)
└────┬───────┘
     │
     ├─→ [Courier: Out for delivery]
     │
┌────▼────────────────┐
│ OUT-FOR-DELIVERY    │ (Last mile)
└────┬────────────────┘
     │
     ├─→ [Delivered successfully]
     │
┌────▼──────────┐
│ DELIVERED     │ (Final - Success)
└───────────────┘

Alternative Paths:
┌─────────┐
│ PENDING │
└────┬────┘
     │
     ├─→ [Customer/Admin: Cancel]
     │
┌────▼──────────┐
│ CANCELLED     │
└────┬──────────┘
     │
     ├─→ [Admin: Process refund]
     │
┌────▼─────────┐
│ REFUNDED     │ (Final - Refund issued)
└──────────────┘
```

---

## 🔄 Business Logic

### Order Number Generation

**Format:** `CYA-YYMMDD-XXXX`

**Example:** `CYA-251006-1024`

- **CYA** - Company prefix
- **YYMMDD** - Date (251006 = October 6, 2025)
- **XXXX** - Sequential number starting from 1000

**Logic:**
```javascript
const prefix = "CYA";
const datePart = "251006"; // October 6, 2025
const sequence = lastOrderSequence + 1; // 1024

orderNumber = "CYA-251006-1024";
```

### Pricing Calculation

**Formula:**
```
Subtotal = Σ(item.unitPrice × item.quantity)
Shipping = subtotal >= ₹5,000 ? ₹0 : ₹150
Tax = subtotal × 0.06 (6%)
Discount = coupon discount (future feature)
Grand Total = subtotal + shipping + tax - discount
```

**Free Shipping Threshold:** ₹5,000

### Delivery Estimation

**Standard Delivery:** 3-5 business days

**Calculation:**
```javascript
estimatedDeliveryDate = orderDate + 4 days
deliveryWindow = (orderDate + 3 days) to (orderDate + 5 days)
```

### Stock Management

**On Order Creation:**
```javascript
// For each order item
variant.stock -= item.quantity
product.totalSold += item.quantity
```

**On Order Cancellation:**
```javascript
// Restore stock
variant.stock += item.quantity
product.totalSold -= item.quantity
```

### Cart Clearing

**After Successful Order:**
```javascript
cart.items = []
cart.savedForLater = []
cart.save()
```

---

## 🎨 Frontend Integration

### 1. Create Order API Client

**File:** `client/src/api/orders.js` (update existing)

```javascript
import { apiRequest } from "./client";

export const createOrder = async (payload) =>
  apiRequest("/orders", {
    method: "POST",
    body: payload,
  });

export const fetchOrders = async ({ status, page, limit, signal } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  return apiRequest(`/orders?${params.toString()}`, { signal });
};

export const fetchOrderById = async (orderId) =>
  apiRequest(`/orders/${orderId}`);

export const cancelOrder = async (orderId, reason) =>
  apiRequest(`/orders/${orderId}/cancel`, {
    method: "PATCH",
    body: { reason },
  });

export const fetchOrderStats = async () =>
  apiRequest("/orders/stats");

// Admin functions
export const fetchAllOrders = async ({ status, page, limit, search, signal } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (search) params.append("search", search);

  return apiRequest(`/orders/admin/all?${params.toString()}`, { signal });
};

export const updateOrderStatus = async (orderId, payload) =>
  apiRequest(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: payload,
  });

export const confirmPayment = async (orderId, transactionId) =>
  apiRequest(`/orders/${orderId}/confirm-payment`, {
    method: "PATCH",
    body: { transactionId },
  });
```

### 2. Checkout Page - Place Order

**CheckoutPage.jsx:**
```javascript
import { createOrder } from '../api/orders';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [customerNotes, setCustomerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a shipping address');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      const { data } = await createOrder({
        addressId: selectedAddressId,
        paymentMethod,
        customerNotes,
        useCartItems: true,
      });

      toast.success('Order placed successfully!');
      
      // Navigate to confirmation page
      navigate(`/confirmation/${data.order.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout">
      {/* Address selection */}
      {/* Payment method selection */}
      {/* Customer notes */}
      
      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="place-order-btn"
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </div>
  );
};
```

### 3. My Account Page - Order History

**MyAccountPage.jsx:**
```javascript
import { fetchOrders } from '../api/orders';

const OrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter, page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await fetchOrders({
        status: filter === 'all' ? undefined : filter,
        page,
        limit: 10,
      });
      setOrders(data.orders);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="orders">
      {/* Filter tabs */}
      <div className="filter-tabs">
        <button onClick={() => setFilter('all')}>All Orders</button>
        <button onClick={() => setFilter('pending')}>Pending</button>
        <button onClick={() => setFilter('shipped')}>Shipped</button>
        <button onClick={() => setFilter('delivered')}>Delivered</button>
      </div>

      {/* Order list */}
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
};
```

### 4. Order Details Page

**OrderDetailsPage.jsx:**
```javascript
import { fetchOrderById, cancelOrder } from '../api/orders';
import { useParams } from 'react-router-dom';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data } = await fetchOrderById(orderId);
      setOrder(data.order);
    } catch (error) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason || reason.length < 10) {
      toast.error('Please provide a detailed reason (min 10 characters)');
      return;
    }

    try {
      await cancelOrder(orderId, reason);
      toast.success('Order cancelled successfully');
      await loadOrder(); // Reload
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="order-details">
      <h1>Order #{order.orderNumber}</h1>
      <p>Status: {order.status}</p>
      
      {/* Timeline */}
      <div className="timeline">
        {order.timeline.map((event, i) => (
          <TimelineEvent key={i} event={event} />
        ))}
      </div>

      {/* Items */}
      <div className="items">
        {order.items.map(item => (
          <OrderItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Pricing */}
      <div className="pricing">
        <div>Subtotal: ₹{order.pricing.subtotal}</div>
        <div>Shipping: ₹{order.pricing.shipping}</div>
        <div>Tax: ₹{order.pricing.tax}</div>
        <div>Total: ₹{order.pricing.grandTotal}</div>
      </div>

      {/* Cancel button */}
      {['pending', 'confirmed', 'processing'].includes(order.status) && (
        <button onClick={handleCancel} className="cancel-btn">
          Cancel Order
        </button>
      )}
    </div>
  );
};
```

### 5. Confirmation Page

**ConfirmationPage.jsx:**
```javascript
import { fetchOrderById } from '../api/orders';
import { useParams } from 'react-router-dom';

const ConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    const { data } = await fetchOrderById(orderId);
    setOrder(data.order);
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div className="confirmation">
      <h1>Order Confirmed!</h1>
      <p>Order Number: {order.orderNumber}</p>
      <p>Placed on: {new Date(order.placedAt).toLocaleDateString()}</p>
      <p>Delivery Window: {order.deliveryWindow}</p>
      
      {/* Customer & Shipping info */}
      <div className="customer">
        <h3>Customer Details</h3>
        <p>{order.customer.name}</p>
        <p>{order.customer.email}</p>
        <p>{order.customer.phone}</p>
      </div>

      <div className="shipping">
        <h3>Shipping Address</h3>
        <p>{order.shipping.recipient}</p>
        <p>{order.shipping.addressLine1}</p>
        {order.shipping.addressLine2 && <p>{order.shipping.addressLine2}</p>}
        <p>{order.shipping.city}, {order.shipping.state} - {order.shipping.postalCode}</p>
      </div>

      {/* Timeline */}
      <div className="timeline">
        {order.timeline.map((event, i) => (
          <div key={i} className={`event ${event.status}`}>
            <h4>{event.title}</h4>
            <p>{event.description}</p>
          </div>
        ))}
      </div>

      {/* Support info */}
      <div className="support">
        <h3>Need Help?</h3>
        <p>Email: {order.support.email}</p>
        <p>Phone: {order.support.phone}</p>
        <p>Hours: {order.support.hours}</p>
      </div>
    </div>
  );
};
```

### 6. Admin Dashboard - Orders

**AdminOrdersPage.jsx:**
```javascript
import { fetchAllOrders, updateOrderStatus } from '../api/orders';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    const { data } = await fetchAllOrders({
      status: filter === 'all' ? undefined : filter,
      search,
      page: 1,
      limit: 20,
    });
    setOrders(data.orders);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      toast.success('Order status updated');
      await loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="admin-orders">
      {/* Search & Filter */}
      <input
        type="text"
        placeholder="Search by order number, email, or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Orders table */}
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.orderNumber}</td>
              <td>{order.customer.name}</td>
              <td>{order.itemCount}</td>
              <td>₹{order.pricing.grandTotal}</td>
              <td>{order.status}</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 🧪 Testing

### 1. Manual Testing

```bash
# Get auth token
TOKEN="your_jwt_token_here"

# Create order from cart
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "67020ab123456789abcdef01",
    "paymentMethod": "UPI",
    "customerNotes": "Please deliver before 6 PM"
  }'

# Get all orders
curl -X GET "http://localhost:4000/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Get order by ID
curl -X GET http://localhost:4000/api/orders/ORDER_ID \
  -H "Authorization: Bearer $TOKEN"

# Cancel order
curl -X PATCH http://localhost:4000/api/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Found a better deal elsewhere"}'

# Get order stats
curl -X GET http://localhost:4000/api/orders/stats \
  -H "Authorization: Bearer $TOKEN"

# Admin: Get all orders
curl -X GET "http://localhost:4000/api/orders/admin/all?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin: Update order status
curl -X PATCH http://localhost:4000/api/orders/ORDER_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped",
    "trackingNumber": "TRACK123456",
    "courierService": "BlueDart"
  }'

# Admin: Confirm payment
curl -X PATCH http://localhost:4000/api/orders/ORDER_ID/confirm-payment \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "TXN83F24P6"}'
```

### 2. Test Scenarios

**Scenario 1: Complete Order Flow**
1. Add items to cart
2. Create order with valid address
3. Verify order created with "pending" status
4. Verify cart cleared
5. Verify product stock reduced
6. Verify order number generated correctly

**Scenario 2: Order Cancellation**
1. Create order (status: pending)
2. Cancel order with reason
3. Verify status changed to "cancelled"
4. Verify stock restored
5. Verify timeline updated

**Scenario 3: Admin Status Updates**
1. Admin updates order: pending → confirmed
2. Verify payment status updated
3. Admin updates: confirmed → processing
4. Admin updates: processing → packed
5. Admin updates: packed → shipped (with tracking)
6. Verify tracking number saved
7. Admin updates: shipped → delivered
8. Verify delivery timestamp

**Scenario 4: Free Shipping**
1. Create order with subtotal ₹4,999
2. Verify shipping = ₹150
3. Create order with subtotal ₹5,001
4. Verify shipping = ₹0

**Scenario 5: Invalid Cancellation**
1. Create order (status: pending)
2. Admin updates to "shipped"
3. Customer tries to cancel
4. Verify error: Cannot cancel shipped order

**Scenario 6: Empty Cart Order**
1. Clear cart
2. Try to create order
3. Verify error: Cart is empty

**Scenario 7: Insufficient Stock**
1. Product variant has stock: 2
2. Try to order quantity: 5
3. Verify error: Insufficient stock

---

## 🛡️ Security & Validation

### Authentication
- All endpoints require valid JWT token
- User can only access their own orders
- Admin endpoints require admin role
- Order automatically linked to `req.user._id`

### Input Validation
- Address ID: Valid MongoDB ObjectId
- Payment Method: Enum validation (6 methods)
- Customer Notes: Max 500 characters
- Cancellation Reason: Min 10 characters
- Tracking Number: 5-50 characters
- Status: Valid order status only

### Business Rules Validation
- Cart must not be empty
- All products must be active
- All variants must have sufficient stock
- Status transitions must be valid
- Only cancellable orders can be cancelled

### Error Handling
- Invalid order ID
- Order not found
- Insufficient stock
- Invalid status transition
- Payment already confirmed
- Cart empty

---

## 📝 Migration Checklist

- [ ] Test order creation from cart
- [ ] Test empty cart scenario
- [ ] Test insufficient stock scenario
- [ ] Test free shipping threshold
- [ ] Test order number generation
- [ ] Test order listing with filters
- [ ] Test order details retrieval
- [ ] Test order cancellation
- [ ] Test stock restoration on cancel
- [ ] Test order statistics
- [ ] Test admin order listing
- [ ] Test admin status updates
- [ ] Test payment confirmation
- [ ] Update frontend API client
- [ ] Implement checkout flow
- [ ] Implement order history page
- [ ] Implement order details page
- [ ] Implement confirmation page
- [ ] Implement admin order management
- [ ] Test complete order workflow

---

## 🔄 Integration with Other Modules

### Cart Module
- Orders created from cart items
- Cart cleared after successful order
- Stock validation against cart items

### Address Module
- Shipping address snapshot in order
- Address reference maintained
- Delivery instructions

### Product Module
- Product and variant details snapshot
- Stock reduction on order
- Stock restoration on cancellation
- Total sold tracking

### User Module
- Orders linked to user
- Customer details snapshot
- Order history

### Payment Module (Future)
- Payment method reference
- Transaction tracking
- Payment status updates

---

## 🎯 Future Enhancements

1. **Payment Gateway Integration**
   - Razorpay/Stripe integration
   - Webhook for payment confirmation
   - Auto status update on payment

2. **Email Notifications**
   - Order confirmation email
   - Shipping updates
   - Delivery confirmation
   - Cancellation notification

3. **SMS Notifications**
   - Order status updates
   - Delivery tracking
   - OTP for delivery

4. **Return & Refund**
   - Return request
   - Refund processing
   - Return shipping label

5. **Order Invoice**
   - PDF invoice generation
   - GST invoice
   - Download/email invoice

6. **Courier Integration**
   - Real-time tracking
   - Delivery partner API
   - Automatic status updates

7. **Bulk Operations (Admin)**
   - Bulk status update
   - Export orders (CSV/Excel)
   - Print shipping labels

8. **Analytics**
   - Sales reports
   - Revenue analytics
   - Popular products
   - Customer lifetime value

---

**Order Module Status:** ✅ Complete

**Files Created:**
- `server/Controllers/orderController.js` (780+ lines)
- `server/routes/orderRoutes.js`
- `server/middleware/validation/orderValidation.js` (210+ lines)
- `server/docs/ORDER_MODULE.md`

**Files Updated:**
- `server/index.js` (added order routes)
- `server/middleware/authMiddleware.js` (added restrictTo middleware)

**Model:** Already exists at `server/models/Order.js` (361 lines)

**Endpoints:** 8 total (5 user + 3 admin)
