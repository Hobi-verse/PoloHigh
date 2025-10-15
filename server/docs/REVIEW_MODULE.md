# Review Module - API Documentation

## Overview

The Review module enables customers to share feedback on products through ratings, comments, and photos. It includes moderation, helpful votes, and admin responses for comprehensive review management.

---

## 📋 Features

- ✅ **Product Reviews** - Customers can rate and review products
- ✅ **Verified Purchase Badges** - Auto-detect purchases from orders
- ✅ **Photo Reviews** - Upload review images
- ✅ **Helpful Votes** - Community-driven review ranking
- ✅ **Admin Moderation** - Approve/reject reviews
- ✅ **Admin Responses** - Official responses to reviews
- ✅ **Rating Distribution** - Visual breakdown of ratings
- ✅ **Review Filtering** - Filter by rating, verified purchases
- ✅ **Update/Delete** - Users can edit/remove their reviews
- ✅ **Duplicate Prevention** - One review per product per user

---

## 🔗 API Endpoints

### PUBLIC ENDPOINTS

### 1. Get Product Reviews
**GET** `/api/reviews/product/:productId`

**Authentication:** None (Public)

**URL Parameters:**
- `productId` - MongoDB ObjectId of product

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Reviews per page (default: 10)
- `rating` - Filter by rating (1-5)
- `sortBy` - Sort field: "createdAt" | "helpfulVotes" (default: "createdAt")
- `sortOrder` - Sort direction: "asc" | "desc" (default: "desc")
- `verified` - Filter verified purchases: "true" | "false"

**Example Request:**
```
GET /api/reviews/product/67020ab123456789abcdef01?page=1&limit=10&rating=5&verified=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review_id",
        "rating": 5,
        "title": "Perfect fit and great quality!",
        "comment": "I absolutely love this t-shirt! The fabric is soft and breathable, and the fit is exactly as described. Definitely worth the price.",
        "images": [
          {
            "url": "https://example.com/review1.jpg",
            "alt": "Product on model"
          }
        ],
        "isVerifiedPurchase": true,
        "helpfulVotes": 24,
        "variant": {
          "size": "M",
          "color": "White"
        },
        "createdAt": "2025-09-15T10:30:00.000Z",
        "user": {
          "name": "Aditi S."
        },
        "adminResponse": {
          "message": "Thank you for your wonderful feedback!",
          "respondedBy": "Support Team",
          "respondedAt": "2025-09-16T09:00:00.000Z"
        }
      }
    ],
    "summary": {
      "averageRating": 4.7,
      "totalReviews": 862,
      "ratingDistribution": {
        "5": 612,
        "4": 183,
        "3": 45,
        "2": 15,
        "1": 7
      }
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 87,
      "totalReviews": 862,
      "hasMore": true
    }
  }
}
```

**Key Features:**
- Only shows **approved** reviews
- Includes rating distribution chart data
- Average rating calculated from approved reviews
- User names partially hidden for privacy ("Aditi S.")
- Admin responses displayed inline

---

### USER ENDPOINTS

### 2. Create Review
**POST** `/api/reviews`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "productId": "product_id_here",
  "orderId": "order_id_here", // Optional - auto-detects if omitted
  "rating": 5,
  "title": "Perfect fit and great quality!",
  "comment": "I absolutely love this t-shirt! The fabric is soft and breathable, and the fit is exactly as described. Definitely worth the price.",
  "images": [
    {
      "url": "https://example.com/review1.jpg",
      "cloudinaryId": "cloudinary_id",
      "alt": "Product on model"
    }
  ],
  "variant": {
    "size": "M",
    "color": "White"
  }
}
```

**Validation Rules:**
- `productId` - Required, valid MongoDB ObjectId
- `orderId` - Optional, valid MongoDB ObjectId
- `rating` - Required, integer 1-5
- `title` - Optional, max 200 characters
- `comment` - Required, 10-2000 characters
- `images` - Optional, array of image objects
- `variant` - Optional, size/color information

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully. It will be visible after admin approval.",
  "data": {
    "review": {
      "id": "review_id",
      "productId": "product_id",
      "rating": 5,
      "title": "Perfect fit and great quality!",
      "comment": "I absolutely love this t-shirt!...",
      "images": [...],
      "isVerifiedPurchase": true,
      "status": "pending",
      "createdAt": "2025-10-06T10:30:00.000Z",
      "user": {
        "name": "Aditi Sharma",
        "email": "aditi@example.com"
      }
    }
  }
}
```

**Business Logic:**
1. Checks if product exists
2. Prevents duplicate reviews (one per product per user)
3. Auto-detects verified purchase from orders
4. Sets status to "pending" for moderation
5. Requires admin approval before public visibility

**Error Responses:**
- `400` - Already reviewed this product, Validation errors
- `404` - Product not found

---

### 3. Get User's Reviews
**GET** `/api/reviews/user`

**Authentication:** Required

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Reviews per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review_id",
        "product": {
          "id": "product_id",
          "title": "Classic White T-Shirt",
          "slug": "classic-white-tee",
          "image": "https://example.com/product.jpg"
        },
        "rating": 5,
        "title": "Perfect fit!",
        "comment": "I absolutely love this t-shirt!",
        "images": [...],
        "isVerifiedPurchase": true,
        "status": "approved",
        "helpfulVotes": 24,
        "createdAt": "2025-09-15T10:30:00.000Z",
        "adminResponse": {
          "message": "Thank you for your feedback!",
          "respondedBy": "Support Team",
          "respondedAt": "2025-09-16T09:00:00.000Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalReviews": 28,
      "hasMore": true
    }
  }
}
```

**Use Cases:**
- My Account page - "My Reviews" section
- Track review approval status
- See helpful votes received
- View admin responses

---

### 4. Check Review Eligibility
**GET** `/api/reviews/can-review/:productId`

**Authentication:** Required

**URL Parameters:**
- `productId` - MongoDB ObjectId of product

**Response (Can Review - Not Purchased):**
```json
{
  "success": true,
  "data": {
    "canReview": true,
    "hasPurchased": false,
    "message": "You can review this product, but it won't be marked as verified purchase"
  }
}
```

**Response (Can Review - Purchased):**
```json
{
  "success": true,
  "data": {
    "canReview": true,
    "hasPurchased": true,
    "orderId": "order_id",
    "message": "You can write a verified review for this product"
  }
}
```

**Response (Already Reviewed):**
```json
{
  "success": true,
  "data": {
    "canReview": false,
    "reason": "You have already reviewed this product",
    "existingReview": {
      "id": "review_id",
      "rating": 5,
      "status": "approved"
    }
  }
}
```

**Use Cases:**
- Product page - Show/hide review button
- Determine verified purchase badge
- Link to existing review for editing

---

### 5. Update Review
**PUT** `/api/reviews/:id`

**Authentication:** Required (Own reviews only)

**URL Parameters:**
- `id` - MongoDB ObjectId of review

**Request Body:** (all fields optional)
```json
{
  "rating": 4,
  "title": "Updated title",
  "comment": "Updated comment with more details...",
  "images": [...],
  "variant": {
    "size": "L",
    "color": "Black"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review updated successfully. It will be re-reviewed by admin.",
  "data": {
    "review": {
      "id": "review_id",
      "rating": 4,
      "title": "Updated title",
      "comment": "Updated comment...",
      "images": [...],
      "variant": {...},
      "status": "pending",
      "updatedAt": "2025-10-06T11:00:00.000Z"
    }
  }
}
```

**Behavior:**
- Only owner can update their review
- Status reset to "pending" after edit (requires re-approval)
- All fields optional - update only what you want

**Error Responses:**
- `404` - Review not found or not owned by user

---

### 6. Delete Review
**DELETE** `/api/reviews/:id`

**Authentication:** Required (Own reviews only)

**URL Parameters:**
- `id` - MongoDB ObjectId of review

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

**Behavior:**
- Only owner can delete their review
- Product rating recalculated after deletion
- Permanent deletion (cannot be recovered)

**Error Responses:**
- `404` - Review not found or not owned by user

---

### 7. Mark Review as Helpful
**PATCH** `/api/reviews/:id/helpful`

**Authentication:** Required

**URL Parameters:**
- `id` - MongoDB ObjectId of review

**Response:**
```json
{
  "success": true,
  "message": "Review marked as helpful",
  "data": {
    "helpfulVotes": 25
  }
}
```

**Behavior:**
- Users can mark reviews helpful
- One vote per user per review
- Increases helpful vote count
- Used for sorting reviews by helpfulness

**Error Responses:**
- `400` - Already marked as helpful
- `404` - Review not found

---

### 8. Remove Helpful Mark
**DELETE** `/api/reviews/:id/helpful`

**Authentication:** Required

**URL Parameters:**
- `id` - MongoDB ObjectId of review

**Response:**
```json
{
  "success": true,
  "message": "Helpful mark removed",
  "data": {
    "helpfulVotes": 24
  }
}
```

**Behavior:**
- Undo helpful vote
- Decreases helpful vote count

**Error Responses:**
- `400` - Haven't marked as helpful
- `404` - Review not found

---

### ADMIN ENDPOINTS

### 9. Get All Reviews (Admin)
**GET** `/api/reviews/admin/all`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `status` - Filter by status: "pending" | "approved" | "rejected"
- `rating` - Filter by rating (1-5)
- `verified` - Filter verified purchases: "true" | "false"
- `page` - Page number (default: 1)
- `limit` - Reviews per page (default: 20)
- `sortBy` - Sort field (default: "createdAt")
- `sortOrder` - Sort direction: "asc" | "desc" (default: "desc")
- `search` - Search in title/comment

**Example Request:**
```
GET /api/reviews/admin/all?status=pending&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review_id",
        "product": {
          "id": "product_id",
          "title": "Classic White T-Shirt",
          "slug": "classic-white-tee"
        },
        "user": {
          "id": "user_id",
          "name": "Aditi Sharma",
          "email": "aditi@example.com"
        },
        "rating": 5,
        "title": "Perfect fit!",
        "comment": "I absolutely love this t-shirt!",
        "images": [...],
        "isVerifiedPurchase": true,
        "status": "pending",
        "helpfulVotes": 0,
        "createdAt": "2025-10-06T10:30:00.000Z",
        "moderatedAt": null,
        "rejectionReason": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalReviews": 156,
      "hasMore": true
    }
  }
}
```

**Use Cases:**
- Admin dashboard - Review moderation queue
- Filter pending reviews for approval
- Search for specific reviews
- Monitor review quality

---

### 10. Approve Review (Admin)
**PATCH** `/api/reviews/:id/approve`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` - MongoDB ObjectId of review

**Response:**
```json
{
  "success": true,
  "message": "Review approved successfully",
  "data": {
    "review": {
      "id": "review_id",
      "status": "approved",
      "moderatedAt": "2025-10-06T11:00:00.000Z"
    }
  }
}
```

**Behavior:**
- Changes status from "pending" to "approved"
- Makes review publicly visible
- Updates product average rating
- Records moderator and timestamp

**Error Responses:**
- `400` - Review already approved
- `404` - Review not found

---

### 11. Reject Review (Admin)
**PATCH** `/api/reviews/:id/reject`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` - MongoDB ObjectId of review

**Request Body:**
```json
{
  "reason": "Review contains inappropriate language" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review rejected successfully",
  "data": {
    "review": {
      "id": "review_id",
      "status": "rejected",
      "rejectionReason": "Review contains inappropriate language",
      "moderatedAt": "2025-10-06T11:00:00.000Z"
    }
  }
}
```

**Behavior:**
- Changes status to "rejected"
- Review not publicly visible
- User can see rejection reason in their reviews
- Records moderator and timestamp

**Default Rejection Reason:** "Does not meet review guidelines"

---

### 12. Add Admin Response (Admin)
**PATCH** `/api/reviews/:id/respond`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` - MongoDB ObjectId of review

**Request Body:**
```json
{
  "message": "Thank you for your wonderful feedback! We're glad you love the product."
}
```

**Validation:**
- `message` - Required, 10-1000 characters

**Response:**
```json
{
  "success": true,
  "message": "Response added successfully",
  "data": {
    "adminResponse": {
      "message": "Thank you for your wonderful feedback! We're glad you love the product.",
      "respondedBy": "Admin Name",
      "respondedAt": "2025-10-06T11:00:00.000Z"
    }
  }
}
```

**Behavior:**
- Adds official brand response to review
- Displayed publicly with review
- Shows admin name and timestamp
- Can be updated by re-calling endpoint

---

## 🔄 Business Logic

### Review Creation Flow

```
1. User submits review
   ↓
2. Check if product exists
   ↓
3. Check for duplicate (one review per product)
   ↓
4. Verify purchase (check orders)
   - If delivered order found → isVerifiedPurchase = true
   - If no order found → isVerifiedPurchase = false
   ↓
5. Create review with status = "pending"
   ↓
6. Save review
   ↓
7. Return to user (not yet public)
```

### Review Approval Flow

```
Pending Review
   ↓
Admin Reviews Content
   ↓
   ├─→ APPROVE
   │   ├─ Status = "approved"
   │   ├─ Review becomes public
   │   └─ Product rating updated
   │
   └─→ REJECT
       ├─ Status = "rejected"
       ├─ Review hidden from public
       └─ User sees rejection reason
```

### Rating Calculation

**Average Rating Formula:**
```javascript
totalRatings = sum of all approved reviews
averageRating = (5-star × count + 4-star × count + ... + 1-star × count) / totalRatings
averageRating = round to 1 decimal place
```

**Example:**
```
5 stars: 612 reviews
4 stars: 183 reviews
3 stars: 45 reviews
2 stars: 15 reviews
1 star: 7 reviews

Total: 862 reviews
Average: ((5×612) + (4×183) + (3×45) + (2×15) + (1×7)) / 862 = 4.7
```

### Helpful Votes

**Logic:**
- Each user can vote once per review
- Vote stored in `helpfulBy` array
- Vote count in `helpfulVotes` field
- Can remove vote (undo)

**Use Cases:**
- Sort reviews by most helpful
- Surface quality reviews
- Community validation

---

## 🎨 Frontend Integration

### 1. Create Review API Client

**File:** `client/src/api/reviews.js` (create new)

```javascript
import { apiRequest } from "./client";

export const createReview = async (payload) =>
  apiRequest("/reviews", {
    method: "POST",
    body: payload,
  });

export const fetchProductReviews = async (productId, { page, limit, rating, verified, sortBy, signal } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (rating) params.append("rating", rating);
  if (verified) params.append("verified", verified);
  if (sortBy) params.append("sortBy", sortBy);

  return apiRequest(`/reviews/product/${productId}?${params.toString()}`, { signal });
};

export const fetchUserReviews = async ({ page, limit, signal } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  return apiRequest(`/reviews/user?${params.toString()}`, { signal });
};

export const canReviewProduct = async (productId) =>
  apiRequest(`/reviews/can-review/${productId}`);

export const updateReview = async (reviewId, payload) =>
  apiRequest(`/reviews/${reviewId}`, {
    method: "PUT",
    body: payload,
  });

export const deleteReview = async (reviewId) =>
  apiRequest(`/reviews/${reviewId}`, {
    method: "DELETE",
  });

export const markReviewHelpful = async (reviewId) =>
  apiRequest(`/reviews/${reviewId}/helpful`, {
    method: "PATCH",
  });

export const removeReviewHelpful = async (reviewId) =>
  apiRequest(`/reviews/${reviewId}/helpful`, {
    method: "DELETE",
  });

// Admin functions
export const fetchAllReviews = async ({ status, rating, verified, page, limit, search, signal } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (rating) params.append("rating", rating);
  if (verified) params.append("verified", verified);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (search) params.append("search", search);

  return apiRequest(`/reviews/admin/all?${params.toString()}`, { signal });
};

export const approveReview = async (reviewId) =>
  apiRequest(`/reviews/${reviewId}/approve`, {
    method: "PATCH",
  });

export const rejectReview = async (reviewId, reason) =>
  apiRequest(`/reviews/${reviewId}/reject`, {
    method: "PATCH",
    body: { reason },
  });

export const respondToReview = async (reviewId, message) =>
  apiRequest(`/reviews/${reviewId}/respond`, {
    method: "PATCH",
    body: { message },
  });
```

### 2. Product Page - Reviews Section

**ProductDetailsPage.jsx:**
```javascript
import { fetchProductReviews, canReviewProduct } from '../api/reviews';
import { useState, useEffect } from 'react';

const ProductReviewsSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [canReview, setCanReview] = useState(null);
  const [filter, setFilter] = useState({ rating: null, verified: false });

  useEffect(() => {
    loadReviews();
    checkReviewEligibility();
  }, [productId, filter]);

  const loadReviews = async () => {
    const { data } = await fetchProductReviews(productId, {
      page: 1,
      limit: 10,
      rating: filter.rating,
      verified: filter.verified,
    });
    setReviews(data.reviews);
    setSummary(data.summary);
  };

  const checkReviewEligibility = async () => {
    const { data } = await canReviewProduct(productId);
    setCanReview(data);
  };

  return (
    <div className="reviews-section">
      {/* Rating Summary */}
      <div className="rating-summary">
        <h3>{summary?.averageRating} ⭐</h3>
        <p>{summary?.totalReviews} reviews</p>
        
        {/* Rating Distribution */}
        <div className="rating-bars">
          {Object.entries(summary?.ratingDistribution || {})
            .reverse()
            .map(([rating, count]) => (
              <div key={rating} className="rating-bar">
                <span>{rating} ⭐</span>
                <div className="bar" style={{ width: `${(count / summary.totalReviews) * 100}%` }} />
                <span>{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Write Review Button */}
      {canReview?.canReview && (
        <button onClick={() => setShowReviewForm(true)}>
          Write a Review
          {canReview.hasPurchased && <span className="verified-badge">✓ Verified Purchase</span>}
        </button>
      )}

      {/* Filters */}
      <div className="filters">
        <select onChange={(e) => setFilter({ ...filter, rating: e.target.value || null })}>
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
        
        <label>
          <input
            type="checkbox"
            checked={filter.verified}
            onChange={(e) => setFilter({ ...filter, verified: e.target.checked })}
          />
          Verified Purchases Only
        </label>
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};
```

### 3. Write Review Form

**WriteReviewForm.jsx:**
```javascript
import { createReview } from '../api/reviews';
import { useState } from 'react';

const WriteReviewForm = ({ productId, orderId, onSuccess }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: [],
    variant: { size: '', color: '' }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createReview({
        productId,
        orderId,
        ...formData
      });
      
      toast.success('Review submitted! It will be visible after approval.');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Star Rating */}
      <div className="rating-input">
        {[5, 4, 3, 2, 1].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData({ ...formData, rating: star })}
            className={formData.rating >= star ? 'active' : ''}
          >
            ⭐
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Review title (optional)"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        maxLength={200}
      />

      {/* Comment */}
      <textarea
        placeholder="Share your experience (minimum 10 characters)"
        value={formData.comment}
        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
        minLength={10}
        maxLength={2000}
        required
      />

      {/* Variant Info */}
      <div className="variant-info">
        <input
          type="text"
          placeholder="Size (optional)"
          value={formData.variant.size}
          onChange={(e) => setFormData({
            ...formData,
            variant: { ...formData.variant, size: e.target.value }
          })}
        />
        <input
          type="text"
          placeholder="Color (optional)"
          value={formData.variant.color}
          onChange={(e) => setFormData({
            ...formData,
            variant: { ...formData.variant, color: e.target.value }
          })}
        />
      </div>

      {/* Image Upload (future feature) */}
      {/* <ImageUpload onChange={(images) => setFormData({ ...formData, images })} /> */}

      <button type="submit">Submit Review</button>
    </form>
  );
};
```

### 4. My Account - My Reviews

**MyReviewsSection.jsx:**
```javascript
import { fetchUserReviews, deleteReview } from '../api/reviews';

const MyReviewsSection = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const { data } = await fetchUserReviews({ page: 1, limit: 10 });
    setReviews(data.reviews);
  };

  const handleDelete = async (reviewId) => {
    if (confirm('Are you sure you want to delete this review?')) {
      await deleteReview(reviewId);
      toast.success('Review deleted');
      await loadReviews();
    }
  };

  return (
    <div className="my-reviews">
      <h2>My Reviews</h2>
      
      {reviews.map(review => (
        <div key={review.id} className="review-card">
          <div className="product-info">
            <img src={review.product.image} alt={review.product.title} />
            <h3>{review.product.title}</h3>
          </div>
          
          <div className="review-content">
            <div className="rating">{'⭐'.repeat(review.rating)}</div>
            <h4>{review.title}</h4>
            <p>{review.comment}</p>
            
            <div className="meta">
              <span className={`status ${review.status}`}>{review.status}</span>
              {review.isVerifiedPurchase && <span className="verified">✓ Verified Purchase</span>}
              <span className="helpful">{review.helpfulVotes} found helpful</span>
            </div>

            {review.adminResponse && (
              <div className="admin-response">
                <strong>Official Response:</strong>
                <p>{review.adminResponse.message}</p>
              </div>
            )}
          </div>

          <div className="actions">
            <button onClick={() => handleEdit(review)}>Edit</button>
            <button onClick={() => handleDelete(review.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 5. Admin Dashboard - Review Moderation

**AdminReviewsPage.jsx:**
```javascript
import { fetchAllReviews, approveReview, rejectReview, respondToReview } from '../api/reviews';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('pending');

  const loadReviews = async () => {
    const { data } = await fetchAllReviews({
      status: filter,
      page: 1,
      limit: 20
    });
    setReviews(data.reviews);
  };

  const handleApprove = async (reviewId) => {
    await approveReview(reviewId);
    toast.success('Review approved');
    await loadReviews();
  };

  const handleReject = async (reviewId) => {
    const reason = prompt('Rejection reason:');
    if (reason) {
      await rejectReview(reviewId, reason);
      toast.success('Review rejected');
      await loadReviews();
    }
  };

  const handleRespond = async (reviewId) => {
    const message = prompt('Your response:');
    if (message && message.length >= 10) {
      await respondToReview(reviewId, message);
      toast.success('Response added');
      await loadReviews();
    }
  };

  return (
    <div className="admin-reviews">
      <h1>Review Moderation</h1>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button onClick={() => setFilter('pending')}>Pending</button>
        <button onClick={() => setFilter('approved')}>Approved</button>
        <button onClick={() => setFilter('rejected')}>Rejected</button>
      </div>

      {/* Reviews Table */}
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>User</th>
            <th>Rating</th>
            <th>Review</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map(review => (
            <tr key={review.id}>
              <td>{review.product.title}</td>
              <td>
                {review.user.name}
                {review.isVerifiedPurchase && <span className="verified">✓</span>}
              </td>
              <td>{'⭐'.repeat(review.rating)}</td>
              <td>
                <strong>{review.title}</strong>
                <p>{review.comment.substring(0, 100)}...</p>
              </td>
              <td className={review.status}>{review.status}</td>
              <td>
                {filter === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(review.id)}>Approve</button>
                    <button onClick={() => handleReject(review.id)}>Reject</button>
                  </>
                )}
                <button onClick={() => handleRespond(review.id)}>Respond</button>
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

# Create review
curl -X POST http://localhost:4000/api/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "67020ab123456789abcdef01",
    "rating": 5,
    "title": "Perfect fit!",
    "comment": "I absolutely love this t-shirt! The fabric is soft and the fit is exactly as described.",
    "variant": { "size": "M", "color": "White" }
  }'

# Get product reviews (public)
curl http://localhost:4000/api/reviews/product/67020ab123456789abcdef01?page=1&limit=10

# Get user's reviews
curl http://localhost:4000/api/reviews/user \
  -H "Authorization: Bearer $TOKEN"

# Check if can review
curl http://localhost:4000/api/reviews/can-review/67020ab123456789abcdef01 \
  -H "Authorization: Bearer $TOKEN"

# Mark review helpful
curl -X PATCH http://localhost:4000/api/reviews/REVIEW_ID/helpful \
  -H "Authorization: Bearer $TOKEN"

# Admin: Get all reviews
curl http://localhost:4000/api/reviews/admin/all?status=pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin: Approve review
curl -X PATCH http://localhost:4000/api/reviews/REVIEW_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin: Reject review
curl -X PATCH http://localhost:4000/api/reviews/REVIEW_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Inappropriate content"}'

# Admin: Add response
curl -X PATCH http://localhost:4000/api/reviews/REVIEW_ID/respond \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Thank you for your wonderful feedback!"}'
```

### 2. Test Scenarios

**Scenario 1: Complete Review Flow**
1. User purchases product
2. Order delivered
3. User writes review
4. Review status = "pending"
5. Admin approves review
6. Review becomes public
7. Product rating updates

**Scenario 2: Verified Purchase**
1. User hasn't purchased product
2. Writes review
3. isVerifiedPurchase = false
4. User later purchases same product
5. Review still shows unverified (future: update mechanism)

**Scenario 3: Duplicate Prevention**
1. User writes review for product A
2. User tries to write another review for product A
3. Error: "Already reviewed"
4. User can edit existing review instead

**Scenario 4: Helpful Votes**
1. User A writes review
2. User B marks it helpful
3. helpfulVotes = 1
4. User C marks it helpful
5. helpfulVotes = 2
6. User B removes helpful
7. helpfulVotes = 1

**Scenario 5: Admin Moderation**
1. Admin views pending reviews
2. Reviews spam/inappropriate content
3. Rejects with reason
4. User sees rejection in their reviews
5. User can edit and resubmit

**Scenario 6: Rating Calculation**
1. Product has no reviews
2. User A gives 5 stars (approved)
3. Average = 5.0
4. User B gives 3 stars (approved)
5. Average = 4.0
6. User C gives 4 stars (approved)
7. Average = 4.0

---

## 🛡️ Security & Validation

### Authentication
- Public: View approved reviews
- User: Create, edit, delete own reviews
- Admin: Moderate all reviews

### Input Validation
- Rating: 1-5 stars (integer)
- Title: Max 200 characters
- Comment: 10-2000 characters (required)
- Images: Valid URLs, max length
- Variant: Max 50 characters per field

### Business Rules
- One review per product per user
- Edited reviews require re-approval
- Deleted reviews update product rating
- Only approved reviews shown publicly
- Helpful votes: one per user per review

### Error Handling
- Duplicate review attempts
- Invalid product/order IDs
- Unauthorized edits/deletes
- Already helpful/not helpful errors
- Rating calculation errors

---

## 📝 Migration Checklist

- [ ] Test review creation
- [ ] Test verified purchase detection
- [ ] Test duplicate prevention
- [ ] Test review update (re-approval)
- [ ] Test review deletion
- [ ] Test helpful votes
- [ ] Test rating calculation
- [ ] Test admin approval workflow
- [ ] Test admin rejection
- [ ] Test admin responses
- [ ] Create reviews API client
- [ ] Implement product reviews section
- [ ] Implement write review form
- [ ] Implement my reviews page
- [ ] Implement admin moderation page
- [ ] Test rating distribution chart
- [ ] Test review filtering
- [ ] Mobile responsive design

---

## 🔄 Integration with Other Modules

### Product Module
- Reviews linked to products
- Average rating stored in Product
- Review count stored in Product
- Product rating auto-updated

### Order Module
- Verified purchase detection
- Order reference in reviews
- Only delivered orders count

### User Module
- Reviews linked to users
- User name displayed (partially hidden)
- Admin users can moderate

---

## 🎯 Future Enhancements

1. **Image Upload**
   - Cloudinary integration
   - Image compression
   - Gallery view
   - User-uploaded photos

2. **Review Sorting**
   - Most helpful first
   - Most recent first
   - Highest rating first
   - Verified purchases first

3. **Review Replies**
   - Users reply to reviews
   - Threaded discussions
   - Community engagement

4. **Review Incentives**
   - Reward points for reviews
   - Verified purchase bonus
   - Photo review bonus

5. **Review Analytics**
   - Sentiment analysis
   - Review trends
   - Product insights
   - Customer satisfaction scores

6. **Email Notifications**
   - Review approval notification
   - Admin response notification
   - Helpful vote notification
   - Review request after delivery

7. **Review Templates**
   - Guided review writing
   - Question prompts
   - Pro/con structure

8. **Video Reviews**
   - Video upload support
   - Video thumbnails
   - Auto-play on hover

---

**Review Module Status:** ✅ Complete

**Files Created:**
- `server/Controllers/reviewController.js` - 720+ lines, 12 functions
- `server/routes/reviewRoutes.js` - 12 endpoints
- `server/middleware/validation/reviewValidation.js` - 220+ lines

**Files Updated:**
- `server/index.js` (added review routes)

**Model:** Already exists at `server/models/Review.js`

**Endpoints:** 12 total (1 public + 7 user + 4 admin)
