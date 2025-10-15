# Customer Profile Module - API Documentation

## Overview

The Customer Profile module manages extended user profiles with membership tiers, rewards system, referral program, preferences, and security settings.

---

## 📋 Features

- ✅ **Extended Profile** - Birthday, avatar, personal details
- ✅ **Membership Tiers** - 5-tier system (Bronze to Sapphire Elite)
- ✅ **Rewards Program** - Earn and redeem points
- ✅ **Wallet System** - Store credit with expiry
- ✅ **Referral Program** - Earn rewards for referrals
- ✅ **Preferences** - Email, SMS, WhatsApp notifications
- ✅ **Security Settings** - 2FA, trusted devices
- ✅ **Account Summary** - Dashboard with stats
- ✅ **Auto Tier Upgrades** - Based on spending

---

## 🏆 Membership Tiers

### Tier Structure

| Tier | Min. Spend | Points Rate | Benefits |
|------|------------|-------------|----------|
| **Bronze** | ₹0 | 1 point/₹100 | Welcome bonus, birthday discount |
| **Silver** | ₹10,000 | 1.5 points/₹100 | Free shipping ≥₹2,500, early sale access |
| **Gold** | ₹50,000 | 2 points/₹100 | Free shipping all orders, priority support |
| **Emerald** | ₹1,00,000 | 2.5 points/₹100 | Concierge service, free express shipping |
| **Sapphire Elite** | ₹2,50,000 | 3 points/₹100 | Personal stylist, exclusive events, VIP access |

### Auto-Upgrade

Tiers are automatically updated based on `totalSpent`:
- System calculates tier on profile access
- Progress tracking to next tier
- Points needed displayed

---

## 💰 Rewards System

### Earning Points

**On Order Completion:**
```
Points Earned = Order Amount / 100
Example: ₹2,500 order = 25 points
```

**Tier Multipliers:**
- Bronze: 1x (1 point per ₹100)
- Silver: 1.5x (1.5 points per ₹100)
- Gold: 2x (2 points per ₹100)
- Emerald: 2.5x (2.5 points per ₹100)
- Sapphire Elite: 3x (3 points per ₹100)

### Redeeming Points

**Conversion Rate:** 10 points = ₹1

**Rules:**
- Minimum redemption: 100 points (₹10)
- Must be in multiples of 10
- Redeemed to wallet balance
- Wallet credit expires in 90 days

---

## 🔗 API Endpoints

### 1. Get Customer Profile
**GET** `/api/profile`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "profile_id",
      "userId": "user_id",
      "name": "Aditi Sharma",
      "email": "aditi@example.com",
      "phone": "9876543210",
      "membership": {
        "tier": "Silver",
        "memberSince": "2024-01-15T00:00:00.000Z",
        "nextTier": {
          "name": "Gold",
          "progressPercent": 45,
          "pointsNeeded": 27500
        }
      },
      "rewards": {
        "rewardPoints": 450,
        "walletBalance": 150,
        "walletExpiryDate": "2025-12-31T00:00:00.000Z"
      },
      "stats": {
        "totalOrders": 12,
        "totalSpent": 22500,
        "wishlistCount": 8,
        "returnCount": 1
      },
      "preferences": {
        "marketingEmails": true,
        "smsUpdates": true,
        "whatsappUpdates": false,
        "orderReminders": true,
        "securityAlerts": true,
        "language": "en",
        "currency": "INR"
      },
      "birthday": "1995-06-15T00:00:00.000Z",
      "avatar": {
        "url": "https://example.com/avatar.jpg",
        "cloudinaryId": "avatar_id"
      },
      "referral": {
        "referralCode": "ADITIS8X9",
        "referralRewards": 300,
        "referredCount": 3
      }
    }
  }
}
```

---

### 2. Get Account Summary
**GET** `/api/profile/summary`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "user_id",
      "name": "Aditi Sharma",
      "email": "aditi@example.com",
      "phone": "9876543210",
      "memberSince": "2024-01-15T00:00:00.000Z",
      "membershipTier": "Silver",
      "rewardPoints": 450,
      "walletBalance": 150,
      "nextTier": {
        "name": "Gold",
        "progressPercent": 45,
        "pointsNeeded": 27500
      }
    },
    "stats": [
      {
        "id": "orders",
        "label": "Orders placed",
        "value": 12,
        "trend": "5 this year"
      },
      {
        "id": "wishlist",
        "label": "Wishlist items",
        "value": 8,
        "trend": "Recent saves"
      },
      {
        "id": "credits",
        "label": "Wallet credits",
        "value": 150,
        "trend": "Expires 31 Dec 2025"
      },
      {
        "id": "returns",
        "label": "Returns",
        "value": 1,
        "trend": "All resolved"
      }
    ],
    "recentOrders": [
      {
        "id": "CYA-2510-1024",
        "placedOn": "2025-10-06",
        "status": "delivered",
        "total": 2500,
        "items": 2,
        "expectedDelivery": "2025-10-10T00:00:00.000Z",
        "paymentMethod": "UPI"
      }
    ],
    "preferences": { ... },
    "security": {
      "lastPasswordChange": "2025-09-15T00:00:00.000Z",
      "twoFactorEnabled": false,
      "trustedDevices": [ ... ]
    },
    "support": {
      "concierge": {
        "name": "Ciyatake Care",
        "email": "support@ciyatake.com",
        "phone": "+91 90876 54321",
        "hours": "All days, 9 AM – 9 PM"
      },
      "tickets": []
    }
  }
}
```

**Use Cases:**
- My Account page dashboard
- Profile overview
- Quick stats display

---

### 3. Update Profile
**PUT** `/api/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "birthday": "1995-06-15",
  "avatar": {
    "url": "https://cloudinary.com/avatar.jpg",
    "cloudinaryId": "avatar_abc123"
  }
}
```

**Validation:**
- `birthday` - Optional, valid ISO date, age 13-120
- `avatar` - Optional, object with url and cloudinaryId

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "birthday": "1995-06-15T00:00:00.000Z",
      "avatar": {
        "url": "https://cloudinary.com/avatar.jpg",
        "cloudinaryId": "avatar_abc123"
      }
    }
  }
}
```

---

### 4. Update Preferences
**PATCH** `/api/profile/preferences`

**Authentication:** Required

**Request Body:**
```json
{
  "marketingEmails": true,
  "smsUpdates": true,
  "whatsappUpdates": false,
  "orderReminders": true,
  "securityAlerts": true,
  "language": "en",
  "currency": "INR"
}
```

**Validation:**
- All boolean fields must be boolean
- `language` - 2-5 characters
- `currency` - Exactly 3 characters (ISO code)

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "preferences": {
      "marketingEmails": true,
      "smsUpdates": true,
      "whatsappUpdates": false,
      "orderReminders": true,
      "securityAlerts": true,
      "language": "en",
      "currency": "INR"
    }
  }
}
```

---

### 5. Get Membership Details
**GET** `/api/profile/membership`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "membership": {
      "tier": "Silver",
      "memberSince": "2024-01-15T00:00:00.000Z",
      "nextTier": {
        "name": "Gold",
        "progressPercent": 45,
        "pointsNeeded": 27500
      },
      "benefits": [
        "All Bronze benefits",
        "Earn 1.5 points per ₹100 spent",
        "Free shipping on orders above ₹2,500",
        "Early access to sales"
      ],
      "stats": {
        "totalOrders": 12,
        "totalSpent": 22500,
        "rewardPoints": 450
      }
    }
  }
}
```

**Auto-Update:**
- Tier recalculated on each request
- Based on `totalSpent` value
- Progress to next tier calculated

---

### 6. Get Rewards & Wallet
**GET** `/api/profile/rewards`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "rewards": {
      "rewardPoints": 450,
      "walletBalance": 150,
      "walletExpiryDate": "2025-12-31T00:00:00.000Z",
      "pointsValue": 45,
      "conversion": {
        "rate": "10 points = ₹1",
        "minRedemption": 100
      }
    }
  }
}
```

**Calculation:**
- Points Value: `points / 10` (450 points = ₹45)
- Minimum redemption: 100 points (₹10)

---

### 7. Redeem Reward Points
**POST** `/api/profile/rewards/redeem`

**Authentication:** Required

**Request Body:**
```json
{
  "points": 100
}
```

**Validation:**
- `points` - Required, minimum 100
- Must be in multiples of 10
- User must have sufficient points

**Response:**
```json
{
  "success": true,
  "message": "Successfully redeemed 100 points to ₹10 wallet balance",
  "data": {
    "pointsRedeemed": 100,
    "walletAmountAdded": 10,
    "remainingPoints": 350,
    "currentWalletBalance": 160,
    "expiryDate": "2026-01-04T00:00:00.000Z"
  }
}
```

**Process:**
1. Validates sufficient points
2. Deducts points (100 points)
3. Adds to wallet (₹10)
4. Sets 90-day expiry
5. Returns updated balances

**Error Responses:**
- `400` - Insufficient points, invalid amount
- `404` - Profile not found

---

### 8. Get Referral Details
**GET** `/api/profile/referral`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "referral": {
      "code": "ADITIS8X9",
      "totalRewards": 300,
      "referredCount": 3,
      "referredUsers": [
        {
          "name": "Rahul Verma",
          "phone": "9876543211"
        },
        {
          "name": "Priya Singh",
          "phone": "9876543212"
        }
      ],
      "rewards": {
        "perReferral": 100,
        "forReferred": 50
      },
      "shareLink": "https://ciyatake.com/register?ref=ADITIS8X9"
    }
  }
}
```

**Referral Code:**
- Auto-generated from name + random
- Format: `NAMEXXXX` (uppercase)
- Example: `ADITIS8X9`

**Rewards:**
- Referrer gets: ₹100 in wallet
- New user gets: ₹50 in wallet
- Tracked in `referralRewards`

---

### 9. Apply Referral Code
**POST** `/api/profile/referral/apply`

**Authentication:** Required

**Request Body:**
```json
{
  "referralCode": "ADITIS8X9"
}
```

**Validation:**
- `referralCode` - Required, 4-20 characters
- Must be uppercase letters and numbers only
- Code must exist in system
- User must not have used a code before

**Response:**
```json
{
  "success": true,
  "message": "Referral code applied successfully! ₹50 added to your wallet",
  "data": {
    "walletBalance": 50,
    "referralBonus": 50
  }
}
```

**Process:**
1. Validates referral code exists
2. Checks user hasn't used code before
3. Adds ₹50 to new user's wallet
4. Adds ₹100 to referrer's wallet
5. Updates referrer's referral list
6. Tracks in referral rewards

**Error Responses:**
- `400` - Already used referral code
- `404` - Invalid referral code

---

### 10. Get Security Settings
**GET** `/api/profile/security`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "security": {
      "twoFactorEnabled": false,
      "lastPasswordChange": "2025-09-15T00:00:00.000Z",
      "trustedDevices": [
        {
          "id": "device_abc123",
          "name": "iPhone 13",
          "lastActive": "2025-10-06T10:00:00.000Z",
          "location": "Bengaluru, Karnataka",
          "trusted": true
        },
        {
          "id": "device_xyz789",
          "name": "MacBook Pro",
          "lastActive": "2025-10-05T14:30:00.000Z",
          "location": "Bengaluru, Karnataka",
          "trusted": true
        }
      ],
      "loginAttempts": {
        "count": 0,
        "lockedUntil": null
      }
    }
  }
}
```

---

### 11. Toggle Two-Factor Authentication
**PATCH** `/api/profile/security/2fa`

**Authentication:** Required

**Request Body:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully",
  "data": {
    "twoFactorEnabled": true
  }
}
```

**Use Cases:**
- Enable 2FA for extra security
- Disable 2FA if needed
- Requires OTP on login when enabled

---

### 12. Add Trusted Device
**POST** `/api/profile/security/device`

**Authentication:** Required

**Request Body:**
```json
{
  "deviceId": "device_abc123",
  "deviceName": "iPhone 13",
  "location": "Bengaluru, Karnataka",
  "userAgent": "Mozilla/5.0..."
}
```

**Validation:**
- `deviceId` - Required, 5-100 characters
- `deviceName` - Required, 2-100 characters
- `location` - Optional, max 200 characters
- `userAgent` - Optional, max 500 characters

**Response:**
```json
{
  "success": true,
  "message": "Device added to trusted devices",
  "data": {
    "trustedDevices": [ ... ]
  }
}
```

**Behavior:**
- If device exists: Updates lastActive
- If new device: Adds to list
- Marks as trusted automatically

---

### 13. Remove Trusted Device
**DELETE** `/api/profile/security/device/:deviceId`

**Authentication:** Required

**URL Parameters:**
- `deviceId` - Device identifier

**Response:**
```json
{
  "success": true,
  "message": "Device removed from trusted devices",
  "data": {
    "trustedDevices": [ ... ]
  }
}
```

---

## 🔄 Business Logic

### Membership Tier Calculation

**Algorithm:**
```javascript
function updateMembershipTier(totalSpent) {
  const tiers = {
    Bronze: 0,
    Silver: 10000,
    Gold: 50000,
    Emerald: 100000,
    "Sapphire Elite": 250000
  };
  
  let tier = "Bronze";
  for (const [name, threshold] of Object.entries(tiers)) {
    if (totalSpent >= threshold) tier = name;
  }
  
  // Calculate progress to next tier
  const currentIndex = tiers.indexOf(tier);
  const nextTier = tiers[currentIndex + 1];
  const progress = (totalSpent - tiers[tier]) / (tiers[nextTier] - tiers[tier]) * 100;
  
  return { tier, progress, nextTier };
}
```

### Reward Points Calculation

**On Order Completion:**
```javascript
function calculateRewardPoints(orderAmount, membershipTier) {
  const basePoints = Math.floor(orderAmount / 100);
  
  const multipliers = {
    Bronze: 1,
    Silver: 1.5,
    Gold: 2,
    Emerald: 2.5,
    "Sapphire Elite": 3
  };
  
  return Math.floor(basePoints * multipliers[membershipTier]);
}
```

**Example:**
- Order: ₹5,000
- Tier: Gold (2x multiplier)
- Base Points: 5000 / 100 = 50
- Earned Points: 50 × 2 = 100 points

### Wallet Expiry

**Rules:**
- Redeemed points → 90-day expiry
- Referral rewards → No expiry
- Promotional credits → Custom expiry

**Auto-Expiry:** (Future feature)
- Cron job checks expired credits
- Deducts expired amounts
- Notifies user before expiry

---

## 🎨 Frontend Integration

### 1. Profile API Client

**File:** `client/src/api/profile.js` (create new)

```javascript
import { apiRequest } from "./client";

// Profile
export const fetchProfile = async () =>
  apiRequest("/profile");

export const fetchAccountSummary = async () =>
  apiRequest("/profile/summary");

export const updateProfile = async (payload) =>
  apiRequest("/profile", {
    method: "PUT",
    body: payload,
  });

// Preferences
export const updatePreferences = async (preferences) =>
  apiRequest("/profile/preferences", {
    method: "PATCH",
    body: preferences,
  });

// Membership
export const fetchMembership = async () =>
  apiRequest("/profile/membership");

// Rewards
export const fetchRewards = async () =>
  apiRequest("/profile/rewards");

export const redeemPoints = async (points) =>
  apiRequest("/profile/rewards/redeem", {
    method: "POST",
    body: { points },
  });

// Referral
export const fetchReferral = async () =>
  apiRequest("/profile/referral");

export const applyReferral = async (referralCode) =>
  apiRequest("/profile/referral/apply", {
    method: "POST",
    body: { referralCode },
  });

// Security
export const fetchSecurity = async () =>
  apiRequest("/profile/security");

export const toggle2FA = async (enabled) =>
  apiRequest("/profile/security/2fa", {
    method: "PATCH",
    body: { enabled },
  });

export const addTrustedDevice = async (deviceInfo) =>
  apiRequest("/profile/security/device", {
    method: "POST",
    body: deviceInfo,
  });

export const removeTrustedDevice = async (deviceId) =>
  apiRequest(`/profile/security/device/${deviceId}`, {
    method: "DELETE",
  });
```

### 2. My Account Page - Dashboard

**MyAccountPage.jsx:**
```javascript
import { fetchAccountSummary } from '../api/profile';

const AccountDashboard = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    const { data } = await fetchAccountSummary();
    setSummary(data);
  };

  return (
    <div className="account-dashboard">
      {/* Profile Card */}
      <div className="profile-card">
        <h2>Welcome, {summary.profile.name}!</h2>
        <div className="membership-badge">{summary.profile.membershipTier}</div>
        <div className="rewards">
          <span>{summary.profile.rewardPoints} Points</span>
          <span>₹{summary.profile.walletBalance} Wallet</span>
        </div>
        
        {/* Progress to next tier */}
        <div className="tier-progress">
          <p>Progress to {summary.profile.nextTier.name}</p>
          <div className="progress-bar">
            <div style={{ width: `${summary.profile.nextTier.progressPercent}%` }} />
          </div>
          <p>₹{summary.profile.nextTier.pointsNeeded} more to unlock</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {summary.stats.map(stat => (
          <div key={stat.id} className="stat-card">
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
            <span className="trend">{stat.trend}</span>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="recent-orders">
        <h3>Recent Orders</h3>
        {summary.recentOrders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};
```

### 3. Membership Page

**MembershipPage.jsx:**
```javascript
import { fetchMembership } from '../api/profile';

const MembershipPage = () => {
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    loadMembership();
  }, []);

  const loadMembership = async () => {
    const { data } = await fetchMembership();
    setMembership(data.membership);
  };

  return (
    <div className="membership">
      <h1>Your Membership</h1>
      
      {/* Current Tier */}
      <div className="current-tier">
        <h2>{membership.tier} Member</h2>
        <p>Since {new Date(membership.memberSince).toLocaleDateString()}</p>
      </div>

      {/* Benefits */}
      <div className="benefits">
        <h3>Your Benefits</h3>
        <ul>
          {membership.benefits.map((benefit, i) => (
            <li key={i}>{benefit}</li>
          ))}
        </ul>
      </div>

      {/* Next Tier */}
      <div className="next-tier">
        <h3>Progress to {membership.nextTier.name}</h3>
        <div className="progress">
          <div style={{ width: `${membership.nextTier.progressPercent}%` }} />
        </div>
        <p>Spend ₹{membership.nextTier.pointsNeeded} more to unlock!</p>
      </div>

      {/* Tier Comparison */}
      <div className="tier-comparison">
        <TierCard tier="Bronze" active={membership.tier === "Bronze"} />
        <TierCard tier="Silver" active={membership.tier === "Silver"} />
        <TierCard tier="Gold" active={membership.tier === "Gold"} />
        <TierCard tier="Emerald" active={membership.tier === "Emerald"} />
        <TierCard tier="Sapphire Elite" active={membership.tier === "Sapphire Elite"} />
      </div>
    </div>
  );
};
```

### 4. Rewards Page

**RewardsPage.jsx:**
```javascript
import { fetchRewards, redeemPoints } from '../api/profile';

const RewardsPage = () => {
  const [rewards, setRewards] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState(100);

  const loadRewards = async () => {
    const { data } = await fetchRewards();
    setRewards(data.rewards);
  };

  const handleRedeem = async () => {
    if (redeemAmount < 100) {
      toast.error('Minimum 100 points required');
      return;
    }

    if (redeemAmount % 10 !== 0) {
      toast.error('Points must be in multiples of 10');
      return;
    }

    try {
      const { data } = await redeemPoints(redeemAmount);
      toast.success(data.message);
      await loadRewards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to redeem');
    }
  };

  return (
    <div className="rewards">
      <h1>Rewards & Wallet</h1>

      {/* Points Balance */}
      <div className="points-card">
        <h2>{rewards.rewardPoints} Points</h2>
        <p>Worth ₹{rewards.pointsValue}</p>
      </div>

      {/* Wallet Balance */}
      <div className="wallet-card">
        <h2>₹{rewards.walletBalance}</h2>
        <p>Wallet Balance</p>
        {rewards.walletExpiryDate && (
          <span>Expires {new Date(rewards.walletExpiryDate).toLocaleDateString()}</span>
        )}
      </div>

      {/* Redeem Section */}
      <div className="redeem">
        <h3>Redeem Points</h3>
        <p>Conversion: {rewards.conversion.rate}</p>
        <input
          type="number"
          value={redeemAmount}
          onChange={(e) => setRedeemAmount(parseInt(e.target.value))}
          min={100}
          step={10}
        />
        <p>You'll get ₹{Math.floor(redeemAmount / 10)}</p>
        <button onClick={handleRedeem}>Redeem Points</button>
      </div>
    </div>
  );
};
```

### 5. Referral Page

**ReferralPage.jsx:**
```javascript
import { fetchReferral } from '../api/profile';

const ReferralPage = () => {
  const [referral, setReferral] = useState(null);

  useEffect(() => {
    loadReferral();
  }, []);

  const loadReferral = async () => {
    const { data } = await fetchReferral();
    setReferral(data.referral);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Ciyatake',
        text: `Use my referral code ${referral.code} and get ₹50!`,
        url: referral.shareLink,
      });
    } else {
      navigator.clipboard.writeText(referral.shareLink);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="referral">
      <h1>Refer & Earn</h1>

      {/* Referral Code */}
      <div className="code-card">
        <h2>{referral.code}</h2>
        <button onClick={handleShare}>Share Code</button>
      </div>

      {/* Stats */}
      <div className="stats">
        <div>
          <h3>{referral.referredCount}</h3>
          <p>Friends Referred</p>
        </div>
        <div>
          <h3>₹{referral.totalRewards}</h3>
          <p>Total Earned</p>
        </div>
      </div>

      {/* How it works */}
      <div className="how-it-works">
        <h3>How it works</h3>
        <ol>
          <li>Share your referral code</li>
          <li>Friend signs up using your code</li>
          <li>They get ₹{referral.rewards.forReferred}</li>
          <li>You get ₹{referral.rewards.perReferral}</li>
        </ol>
      </div>

      {/* Referred Users */}
      {referral.referredUsers.length > 0 && (
        <div className="referred-list">
          <h3>Your Referrals</h3>
          {referral.referredUsers.map((user, i) => (
            <div key={i} className="referred-user">
              <p>{user.name}</p>
              <span>{user.phone}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 6. Preferences Page

**PreferencesPage.jsx:**
```javascript
import { fetchProfile, updatePreferences } from '../api/profile';

const PreferencesPage = () => {
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data } = await fetchProfile();
    setPreferences(data.profile.preferences);
  };

  const handleUpdate = async (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    try {
      await updatePreferences(updated);
      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to update');
      setPreferences(preferences); // Revert
    }
  };

  return (
    <div className="preferences">
      <h1>Notification Preferences</h1>

      <div className="preference-group">
        <h3>Email Notifications</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.marketingEmails}
            onChange={(e) => handleUpdate('marketingEmails', e.target.checked)}
          />
          Marketing emails & promotions
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.orderReminders}
            onChange={(e) => handleUpdate('orderReminders', e.target.checked)}
          />
          Order updates & reminders
        </label>
      </div>

      <div className="preference-group">
        <h3>SMS Notifications</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.smsUpdates}
            onChange={(e) => handleUpdate('smsUpdates', e.target.checked)}
          />
          Order status via SMS
        </label>
      </div>

      <div className="preference-group">
        <h3>WhatsApp Notifications</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.whatsappUpdates}
            onChange={(e) => handleUpdate('whatsappUpdates', e.target.checked)}
          />
          Order updates on WhatsApp
        </label>
      </div>

      <div className="preference-group">
        <h3>Security</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.securityAlerts}
            onChange={(e) => handleUpdate('securityAlerts', e.target.checked)}
          />
          Security alerts (recommended)
        </label>
      </div>
    </div>
  );
};
```

---

## 🧪 Testing

### Manual Testing

```bash
# Get auth token
TOKEN="your_jwt_token"

# Get profile
curl http://localhost:4000/api/profile \
  -H "Authorization: Bearer $TOKEN"

# Get account summary
curl http://localhost:4000/api/profile/summary \
  -H "Authorization: Bearer $TOKEN"

# Update profile
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"birthday":"1995-06-15"}'

# Update preferences
curl -X PATCH http://localhost:4000/api/profile/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"marketingEmails":false,"smsUpdates":true}'

# Get membership
curl http://localhost:4000/api/profile/membership \
  -H "Authorization: Bearer $TOKEN"

# Get rewards
curl http://localhost:4000/api/profile/rewards \
  -H "Authorization: Bearer $TOKEN"

# Redeem points
curl -X POST http://localhost:4000/api/profile/rewards/redeem \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points":100}'

# Get referral
curl http://localhost:4000/api/profile/referral \
  -H "Authorization: Bearer $TOKEN"

# Apply referral code
curl -X POST http://localhost:4000/api/profile/referral/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"referralCode":"ADITIS8X9"}'

# Get security
curl http://localhost:4000/api/profile/security \
  -H "Authorization: Bearer $TOKEN"

# Toggle 2FA
curl -X PATCH http://localhost:4000/api/profile/security/2fa \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled":true}'
```

---

## 📝 Migration Checklist

- [ ] Test profile creation on first access
- [ ] Test membership tier calculation
- [ ] Test reward points redemption
- [ ] Test referral code generation
- [ ] Test referral code application
- [ ] Test preferences update
- [ ] Test 2FA toggle
- [ ] Test trusted devices
- [ ] Test account summary aggregation
- [ ] Frontend: Create profile API client
- [ ] Frontend: My Account dashboard
- [ ] Frontend: Membership page
- [ ] Frontend: Rewards page
- [ ] Frontend: Referral page
- [ ] Frontend: Preferences page
- [ ] Frontend: Security settings

---

## 🔐 Security

- ✅ JWT authentication on all endpoints
- ✅ User can only access own profile
- ✅ Validation on all inputs
- ✅ Birthday age validation (13-120)
- ✅ Points redemption validation
- ✅ Referral code format validation
- ✅ Device security tracking

---

## 🎯 Future Enhancements

1. **Badges & Achievements**
   - Shopping milestones
   - First purchase badge
   - Review champion
   - Referral master

2. **Personalization**
   - Size preferences
   - Style preferences
   - Brand favorites
   - Category interests

3. **Gamification**
   - Daily login streaks
   - Challenge completion
   - Seasonal events
   - Bonus point multipliers

4. **Social Features**
   - Follow friends
   - Share purchases
   - Gift wishlists
   - Social referrals

5. **Advanced Security**
   - Biometric login
   - Device fingerprinting
   - Anomaly detection
   - Session management

---

**Customer Profile Module Status:** ✅ Complete

**Files Created:**
- `server/Controllers/customerProfileController.js` - 710+ lines
- `server/routes/customerProfileRoutes.js` - 13 endpoints
- `server/middleware/validation/customerProfileValidation.js` - 270+ lines

**Files Updated:**
- `server/index.js` - Added profile routes

**Model:** Already exists at `server/models/CustomerProfile.js` (451 lines)

**Total Endpoints:** 64 (51 previous + 13 new)
