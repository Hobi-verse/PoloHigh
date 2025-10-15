# Address Module - API Documentation

## Overview

The Address module manages shipping and billing addresses for users, including default address selection, validation, and CRUD operations.

---

## 📋 Features

- ✅ **Multiple addresses** - Save home, office, and other addresses
- ✅ **Default address** - Set primary shipping address
- ✅ **Address validation** - Validate Indian PIN codes
- ✅ **CRUD operations** - Create, read, update, delete addresses
- ✅ **Formatted display** - Get formatted address strings
- ✅ **Delivery instructions** - Add special delivery notes
- ✅ **Geo-coordinates** - Optional location coordinates
- ✅ **Auto-default** - First address automatically becomes default

---

## 🔗 API Endpoints

### 1. Get All Addresses
**GET** `/api/addresses`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "id": "addr_id",
        "label": "Home",
        "recipient": "Aditi Sharma",
        "phone": "+91 9876543210",
        "addressLine1": "12, Green Vista Apartments",
        "addressLine2": "1st Main Road, Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560038",
        "country": "India",
        "isDefault": true,
        "type": "home",
        "deliveryInstructions": "Ring bell twice",
        "formattedAddress": "12, Green Vista Apartments, 1st Main Road, Indiranagar, Bengaluru, Karnataka - 560038, India",
        "createdAt": "2025-10-06T10:30:00.000Z",
        "updatedAt": "2025-10-06T10:30:00.000Z"
      }
    ],
    "count": 2
  }
}
```

**Sorting:** Default address first, then by creation date (newest first)

---

### 2. Get Address by ID
**GET** `/api/addresses/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - MongoDB ObjectId of address

**Response:**
```json
{
  "success": true,
  "data": {
    "address": {
      "id": "addr_id",
      "label": "Home",
      "recipient": "Aditi Sharma",
      "phone": "+91 9876543210",
      "addressLine1": "12, Green Vista Apartments",
      "addressLine2": "1st Main Road, Indiranagar",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560038",
      "country": "India",
      "isDefault": true,
      "type": "home",
      "deliveryInstructions": "Ring bell twice",
      "coordinates": {
        "latitude": 12.9716,
        "longitude": 77.5946
      },
      "formattedAddress": "12, Green Vista Apartments, 1st Main Road, Indiranagar, Bengaluru, Karnataka - 560038, India",
      "createdAt": "2025-10-06T10:30:00.000Z",
      "updatedAt": "2025-10-06T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `404` - Address not found or doesn't belong to user

---

### 3. Get Default Address
**GET** `/api/addresses/default`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "address": {
      "id": "addr_id",
      "label": "Home",
      "recipient": "Aditi Sharma",
      "phone": "+91 9876543210",
      "addressLine1": "12, Green Vista Apartments",
      "addressLine2": "1st Main Road, Indiranagar",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560038",
      "country": "India",
      "isDefault": true,
      "type": "home",
      "deliveryInstructions": "Ring bell twice",
      "formattedAddress": "12, Green Vista Apartments, 1st Main Road, Indiranagar, Bengaluru, Karnataka - 560038, India",
      "createdAt": "2025-10-06T10:30:00.000Z",
      "updatedAt": "2025-10-06T10:30:00.000Z"
    }
  }
}
```

**Behavior:**
- Returns the address marked as default
- If no default, returns most recent address
- Used in checkout flow

**Error Responses:**
- `404` - No addresses found for user

---

### 4. Create Address
**POST** `/api/addresses`

**Authentication:** Required

**Request Body:**
```json
{
  "label": "Home",
  "recipient": "Aditi Sharma",
  "phone": "+91 9876543210",
  "addressLine1": "12, Green Vista Apartments",
  "addressLine2": "1st Main Road, Indiranagar",
  "city": "Bengaluru",
  "state": "Karnataka",
  "postalCode": "560038",
  "country": "India",
  "isDefault": true,
  "type": "home",
  "deliveryInstructions": "Ring bell twice",
  "coordinates": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```

**Validation Rules:**
- `label` - Optional, string, max 50 chars (default: "Home")
- `recipient` - Required, string, 2-100 chars
- `phone` - Required, valid Indian mobile (10 digits, starts with 6-9)
- `addressLine1` - Required, string, 5-200 chars
- `addressLine2` - Optional, string, max 200 chars
- `city` - Required, string, 2-50 chars
- `state` - Required, string, 2-50 chars
- `postalCode` - Required, 6-digit PIN code
- `country` - Optional, string (default: "India")
- `isDefault` - Optional, boolean (default: false)
- `type` - Optional, enum: "home" | "office" | "other" (default: "home")
- `deliveryInstructions` - Optional, string, max 500 chars
- `coordinates` - Optional, object with latitude/longitude

**Response:**
```json
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "address": {
      "id": "addr_id",
      "label": "Home",
      "recipient": "Aditi Sharma",
      "phone": "+91 9876543210",
      "addressLine1": "12, Green Vista Apartments",
      "addressLine2": "1st Main Road, Indiranagar",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560038",
      "country": "India",
      "isDefault": true,
      "type": "home",
      "deliveryInstructions": "Ring bell twice",
      "formattedAddress": "12, Green Vista Apartments, 1st Main Road, Indiranagar, Bengaluru, Karnataka - 560038, India",
      "createdAt": "2025-10-06T10:30:00.000Z"
    }
  }
}
```

**Auto-Default:**
- If this is user's first address → automatically set as default
- If `isDefault: true` → removes default from other addresses

**Error Responses:**
- `400` - Validation failed

---

### 5. Update Address
**PUT** `/api/addresses/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - MongoDB ObjectId of address

**Request Body:** (all fields optional)
```json
{
  "label": "Office",
  "recipient": "Aditi Sharma",
  "phone": "+91 9876543210",
  "addressLine1": "WeWork Prestige Cube",
  "addressLine2": "Koramangala 6th Block",
  "city": "Bengaluru",
  "state": "Karnataka",
  "postalCode": "560095",
  "country": "India",
  "isDefault": false,
  "type": "office",
  "deliveryInstructions": "Ask for reception",
  "coordinates": {
    "latitude": 12.9352,
    "longitude": 77.6245
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "address": { ... }
  }
}
```

**Behavior:**
- Only updates provided fields
- Setting `isDefault: true` removes default from other addresses
- Owner verification - can only update own addresses

**Error Responses:**
- `400` - Validation failed
- `404` - Address not found

---

### 6. Set Default Address
**PATCH** `/api/addresses/:id/set-default`

**Authentication:** Required

**URL Parameters:**
- `id` - MongoDB ObjectId of address

**Response:**
```json
{
  "success": true,
  "message": "Default address updated",
  "data": {
    "address": {
      "id": "addr_id",
      "label": "Home",
      "recipient": "Aditi Sharma",
      "isDefault": true,
      "formattedAddress": "12, Green Vista Apartments, 1st Main Road, Indiranagar, Bengaluru, Karnataka - 560038, India"
    }
  }
}
```

**Behavior:**
- Sets specified address as default
- Automatically removes default flag from other addresses
- Quick endpoint for changing default without full update

**Error Responses:**
- `404` - Address not found

---

### 7. Delete Address
**DELETE** `/api/addresses/:id`

**Authentication:** Required

**URL Parameters:**
- `id` - MongoDB ObjectId of address

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

**Behavior:**
- Deletes specified address
- If deleted address was default → makes next address default
- Owner verification - can only delete own addresses

**Error Responses:**
- `404` - Address not found

---

### 8. Validate PIN Code
**POST** `/api/addresses/validate-pincode`

**Authentication:** Required

**Request Body:**
```json
{
  "postalCode": "560038",
  "state": "Karnataka"
}
```

**Validation Rules:**
- `postalCode` - Required, 6-digit number
- `state` - Optional, string

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "postalCode": "560038"
  }
}
```

**Future Enhancement:**
- Integrate with India Post API
- Return city, state, district from PIN
- Check if deliverable
- Estimate delivery time

**Error Responses:**
- `400` - Invalid PIN code format

---

## 🔄 Business Logic

### Default Address Management

**Creating First Address:**
```
IF user has 0 addresses THEN
  set new address as default
ELSE IF isDefault = true THEN
  remove default from all other addresses
  set new address as default
END
```

**Updating Address:**
```
IF isDefault changed to true THEN
  remove default from all other addresses
END
```

**Deleting Default Address:**
```
IF deleted address was default THEN
  find most recent remaining address
  set it as default
END
```

### Phone Number Validation

**Accepted Formats:**
- `9876543210` - 10 digits starting with 6-9
- `+91 9876543210` - With country code
- `+919876543210` - Without space

### PIN Code Validation

**Current:**
- Format check: 6 digits
- Range: 000000 - 999999

**Future:**
- Verify with India Post database
- Check deliverability
- Auto-fill city/state

### Formatted Address

**Format:**
```
addressLine1, addressLine2, city, state - postalCode, country
```

**Example:**
```
12, Green Vista Apartments, 1st Main Road, Indiranagar, Bengaluru, Karnataka - 560038, India
```

---

## 🎨 Frontend Integration

### 1. Create Address API Client

**File:** `client/src/api/address.js` (create new file)

```javascript
import { apiRequest } from "./client";

export const fetchAddresses = async ({ signal } = {}) =>
  apiRequest("/addresses", { signal });

export const fetchAddressById = async (id) =>
  apiRequest(`/addresses/${id}`);

export const fetchDefaultAddress = async () =>
  apiRequest("/addresses/default");

export const createAddress = async (payload) =>
  apiRequest("/addresses", {
    method: "POST",
    body: payload,
  });

export const updateAddress = async (id, payload) =>
  apiRequest(`/addresses/${id}`, {
    method: "PUT",
    body: payload,
  });

export const setDefaultAddress = async (id) =>
  apiRequest(`/addresses/${id}/set-default`, {
    method: "PATCH",
  });

export const deleteAddress = async (id) =>
  apiRequest(`/addresses/${id}`, {
    method: "DELETE",
  });

export const validatePinCode = async (postalCode, state) =>
  apiRequest("/addresses/validate-pincode", {
    method: "POST",
    body: { postalCode, state },
  });
```

### 2. Address List Component

**MyAccountPage.jsx - Addresses Section:**
```javascript
import { fetchAddresses, deleteAddress, setDefaultAddress } from '../api/address';

const AddressesSection = () => {
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    const { data } = await fetchAddresses();
    setAddresses(data.addresses);
  };

  const handleSetDefault = async (id) => {
    await setDefaultAddress(id);
    await loadAddresses();
    toast.success('Default address updated');
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this address?')) {
      await deleteAddress(id);
      await loadAddresses();
      toast.success('Address deleted');
    }
  };

  return (
    <div className="addresses">
      {addresses.map(addr => (
        <AddressCard
          key={addr.id}
          address={addr}
          onSetDefault={() => handleSetDefault(addr.id)}
          onDelete={() => handleDelete(addr.id)}
        />
      ))}
    </div>
  );
};
```

### 3. Add/Edit Address Form

**AddressForm.jsx:**
```javascript
import { createAddress, updateAddress } from '../api/address';

const AddressForm = ({ addressId = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    label: 'Home',
    recipient: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
    type: 'home',
    deliveryInstructions: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (addressId) {
        await updateAddress(addressId, formData);
        toast.success('Address updated');
      } else {
        await createAddress(formData);
        toast.success('Address added');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="recipient"
        placeholder="Full Name"
        value={formData.recipient}
        onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
        required
      />
      {/* ... other fields */}
      <button type="submit">Save Address</button>
    </form>
  );
};
```

### 4. Checkout Address Selection

**CheckoutPage.jsx:**
```javascript
import { fetchAddresses, fetchDefaultAddress } from '../api/address';

const CheckoutPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    const { data } = await fetchAddresses();
    setAddresses(data.addresses);
    
    // Auto-select default address
    const defaultAddr = data.addresses.find(a => a.isDefault);
    if (defaultAddr) {
      setSelectedAddressId(defaultAddr.id);
    }
  };

  return (
    <div className="checkout">
      <h2>Shipping Address</h2>
      {addresses.map(addr => (
        <AddressRadio
          key={addr.id}
          address={addr}
          selected={selectedAddressId === addr.id}
          onSelect={() => setSelectedAddressId(addr.id)}
        />
      ))}
      <button onClick={() => setShowAddressForm(true)}>
        + Add New Address
      </button>
    </div>
  );
};
```

### 5. PIN Code Validation

**AddressForm.jsx:**
```javascript
import { validatePinCode } from '../api/address';

const handlePinCodeBlur = async () => {
  try {
    const { data } = await validatePinCode(formData.postalCode, formData.state);
    
    if (!data.valid) {
      setErrors({ ...errors, postalCode: 'Invalid PIN code' });
    } else {
      setErrors({ ...errors, postalCode: '' });
      // Future: Auto-fill city/state from API response
    }
  } catch (error) {
    console.error('PIN code validation failed:', error);
  }
};

<input
  type="text"
  name="postalCode"
  placeholder="PIN Code"
  value={formData.postalCode}
  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
  onBlur={handlePinCodeBlur}
  maxLength={6}
  pattern="\d{6}"
  required
/>
```

---

## 🧪 Testing

### 1. Manual Testing

```bash
# Get auth token
TOKEN="your_jwt_token_here"

# Get all addresses
curl -X GET http://localhost:4000/api/addresses \
  -H "Authorization: Bearer $TOKEN"

# Get default address
curl -X GET http://localhost:4000/api/addresses/default \
  -H "Authorization: Bearer $TOKEN"

# Create address
curl -X POST http://localhost:4000/api/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Home",
    "recipient": "Aditi Sharma",
    "phone": "+91 9876543210",
    "addressLine1": "12, Green Vista Apartments",
    "addressLine2": "1st Main Road, Indiranagar",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560038",
    "country": "India",
    "isDefault": true,
    "type": "home",
    "deliveryInstructions": "Ring bell twice"
  }'

# Update address
curl -X PUT http://localhost:4000/api/addresses/ADDRESS_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label": "Office", "isDefault": false}'

# Set default address
curl -X PATCH http://localhost:4000/api/addresses/ADDRESS_ID/set-default \
  -H "Authorization: Bearer $TOKEN"

# Validate PIN code
curl -X POST http://localhost:4000/api/addresses/validate-pincode \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"postalCode": "560038", "state": "Karnataka"}'

# Delete address
curl -X DELETE http://localhost:4000/api/addresses/ADDRESS_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Test Scenarios

**Scenario 1: First Address Creation**
1. User has no addresses
2. Create first address
3. Should automatically become default
4. Verify `isDefault: true`

**Scenario 2: Multiple Addresses**
1. Create home address (default)
2. Create office address (not default)
3. Get all addresses
4. Verify default address appears first

**Scenario 3: Change Default**
1. Have 2+ addresses
2. Set non-default as default
3. Verify old default becomes non-default
4. Verify new default is marked

**Scenario 4: Delete Default Address**
1. Delete current default address
2. Verify next address becomes default
3. Get addresses - should have new default

**Scenario 5: PIN Code Validation**
1. Enter 6-digit PIN
2. Call validate endpoint
3. Verify format validation
4. Future: Verify city/state auto-fill

**Scenario 6: Phone Validation**
1. Try invalid phone (less than 10 digits)
2. Should fail validation
3. Try valid phone (+91 9876543210)
4. Should pass validation

---

## 🛡️ Security & Validation

### Authentication
- All endpoints require valid JWT token
- User can only access their own addresses
- Address automatically linked to `req.user._id`

### Input Validation
- Recipient: 2-100 characters
- Phone: Indian mobile format (10 digits, 6-9)
- Address Line 1: 5-200 characters
- City, State: 2-50 characters
- PIN Code: Exactly 6 digits
- Delivery Instructions: Max 500 characters

### Error Handling
- Invalid phone format
- Invalid PIN code format
- Address not found
- Validation errors with field-specific messages

---

## 📊 Database Schema

### Address Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  label: String,
  recipient: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  isDefault: Boolean,
  type: String (enum: home, office, other),
  deliveryInstructions: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `userId` - Fast user lookup
- `userId + isDefault` - Quick default address retrieval

### Methods
- `getFormattedAddress()` - Returns formatted address string

---

## 📝 Migration Checklist

- [ ] Test all address endpoints
- [ ] Create address API client
- [ ] Update My Account page with address section
- [ ] Create address form component
- [ ] Create address card component
- [ ] Implement checkout address selection
- [ ] Add PIN code validation
- [ ] Test phone number validation
- [ ] Test default address logic
- [ ] Handle empty state (no addresses)
- [ ] Test delete confirmation
- [ ] Mobile responsive design

---

## 🔄 Integration with Other Modules

### Order Module (Future)
- Order will reference shipping address
- Address snapshot saved in order
- Delivery tracking uses address

### User Module
- Addresses linked to user via `userId`
- Can extend to guest checkout addresses

---

## 🎯 Future Enhancements

1. **Google Places API** - Auto-complete address
2. **India Post API** - Validate PIN codes, get city/state
3. **Geolocation** - Get current location coordinates
4. **Address Verification** - Verify deliverability
5. **Saved Locations** - "Near me" suggestions
6. **Multiple Recipients** - Different names for same address
7. **Address Nicknames** - "Mom's place", "Beach house"
8. **Bulk Import** - Import from contacts

---

**Address Module Status:** ✅ Complete

**Files Created:**
- `server/Controllers/addressController.js`
- `server/routes/addressRoutes.js`
- `server/middleware/validation/addressValidation.js`
- `server/docs/ADDRESS_MODULE.md`

**Files Updated:**
- `server/index.js` (added address routes)

**Model:** Already exists at `server/models/Address.js`
