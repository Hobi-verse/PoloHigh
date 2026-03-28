import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/endpoints";
import { ErrorState, LoadingState } from "../../components/ui/AsyncState";
import { formatINR } from "../../utils/currency";

const PAYMENT_METHODS = ["COD", "UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"];
const getAddressId = (address) => address?._id || address?.id || "";
const getRequestErrorMessage = (requestError, fallbackMessage) =>
  requestError?.payload?.errors?.[0]?.message || requestError?.message || fallbackMessage;

const CheckoutPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [customerNotes, setCustomerNotes] = useState("");
  const [cart, setCart] = useState({ items: [], totals: {} });
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipient: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    type: "home",
  });

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const activeCartItems = items.filter((item) => !item.savedForLater);
  const subtotal = Number(cart?.totals?.subtotal || 0);
  const discountAmount = Number(couponResult?.discountApplied || 0);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    let active = true;
    const loadCheckoutData = async () => {
      try {
        setLoading(true);
        setError("");
        const [addressResponse, cartResponse] = await Promise.all([
          api.addresses.list(),
          api.cart.get(),
        ]);

        const nextAddresses =
          addressResponse?.data?.addresses || addressResponse?.addresses || [];
        const nextCart = cartResponse?.data?.cart || cartResponse?.cart || cartResponse || {};

        if (!active) {
          return;
        }

        setAddresses(nextAddresses);
        setCart(nextCart);
        const defaultAddress = nextAddresses.find((address) => address.isDefault);
        setSelectedAddressId(
          getAddressId(defaultAddress) || getAddressId(nextAddresses[0]) || ""
        );
      } catch (requestError) {
        if (active) {
          setError(requestError?.message || "Unable to load checkout.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCheckoutData();

    return () => {
      active = false;
    };
  }, [isLoggedIn, navigate]);

  const payableAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [discountAmount, subtotal]);

  const handleApplyCoupon = async (event) => {
    event.preventDefault();
    const normalizedCode = couponCode.trim();
    if (!normalizedCode) {
      setError("Enter a coupon code first.");
      return;
    }

    if (!activeCartItems.length) {
      setError("Add items to cart before applying a coupon.");
      return;
    }

    try {
      setCouponLoading(true);
      setError("");
      const response = await api.coupons.validate({
        code: normalizedCode,
        orderAmount: subtotal,
        items: activeCartItems.map((item) => ({
          productId: item.productId?._id || item.productId || item.productSlug || item.id,
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
        })),
      });

      const appliedCoupon = response?.data || response;
      setCouponResult(appliedCoupon);
      setCouponCode(appliedCoupon?.code || normalizedCode.toUpperCase());
      setSuccess(`Coupon ${appliedCoupon?.code || normalizedCode.toUpperCase()} applied.`);
    } catch (requestError) {
      setCouponResult(null);
      setSuccess("");
      setError(requestError?.message || "Unable to apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponResult(null);
    setSuccess("");
    setError("");
  };

  const createAddress = async (event) => {
    event.preventDefault();
    try {
      const response = await api.addresses.create(newAddress);
      const createdAddress = response?.data?.address || response?.address || response;
      const createdAddressId = getAddressId(createdAddress);
      if (!createdAddressId) {
        throw new Error("Address could not be created.");
      }
      setAddresses((prev) => [createdAddress, ...prev]);
      setSelectedAddressId(createdAddressId);
      setNewAddress({
        recipient: "",
        phone: "",
        addressLine1: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        type: "home",
      });
      setError("");
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "Unable to create address."));
    }
  };

  const placeOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select an address.");
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");
      const response = await api.orders.create({
        addressId: selectedAddressId,
        paymentMethod,
        customerNotes,
        couponCode: couponResult?.code || undefined,
      });

      const orderNumber =
        response?.data?.order?.orderNumber ||
        response?.data?.orderNumber ||
        response?.orderNumber ||
        "";

      setSuccess(`Order placed successfully${orderNumber ? ` (${orderNumber})` : ""}.`);
      setTimeout(() => navigate("/account"), 1200);
    } catch (requestError) {
      setError(requestError?.message || "Unable to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <LoadingState message="Preparing checkout..." />;
  }

  if (error && !addresses.length) {
    return <ErrorState message={error} />;
  }

  return (
    <main className="container checkout-page">
      <section className="section-block">
        <div className="section-block__header">
          <div>
            <p className="section-block__eyebrow">Checkout</p>
            <h2>Secure your order</h2>
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-column">
            <h3>Delivery Address</h3>
            <div className="address-list">
              {addresses.map((address) => (
                <label className="address-card" key={getAddressId(address)}>
                  <input
                    checked={selectedAddressId === getAddressId(address)}
                    name="address"
                    onChange={() => setSelectedAddressId(getAddressId(address))}
                    type="radio"
                  />
                  <div>
                    <p>{address.recipient}</p>
                    <p>{address.addressLine1}</p>
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p>{address.phone}</p>
                  </div>
                </label>
              ))}
            </div>

            <form className="address-form" onSubmit={createAddress}>
              <h3>Add new address</h3>
              <input
                onChange={(event) => setNewAddress((prev) => ({ ...prev, recipient: event.target.value }))}
                placeholder="Recipient"
                required
                value={newAddress.recipient}
              />
              <input
                onChange={(event) => setNewAddress((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Phone"
                required
                value={newAddress.phone}
              />
              <input
                onChange={(event) => setNewAddress((prev) => ({ ...prev, addressLine1: event.target.value }))}
                placeholder="Address line"
                required
                value={newAddress.addressLine1}
              />
              <div className="two-col">
                <input
                  onChange={(event) => setNewAddress((prev) => ({ ...prev, city: event.target.value }))}
                  placeholder="City"
                  required
                  value={newAddress.city}
                />
                <input
                  onChange={(event) => setNewAddress((prev) => ({ ...prev, state: event.target.value }))}
                  placeholder="State"
                  required
                  value={newAddress.state}
                />
              </div>
              <input
                onChange={(event) => setNewAddress((prev) => ({ ...prev, postalCode: event.target.value }))}
                placeholder="PIN code"
                required
                value={newAddress.postalCode}
              />
              <button className="button button--outline" type="submit">
                Save Address
              </button>
            </form>
          </div>

          <aside className="summary-card">
            <h3>Payment & Summary</h3>
            <label>
              Payment Method
              <select onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Order Notes
              <textarea
                onChange={(event) => setCustomerNotes(event.target.value)}
                placeholder="Delivery instructions (optional)"
                rows={3}
                value={customerNotes}
              />
            </label>

            <p>Subtotal: <strong>{formatINR(subtotal)}</strong></p>
            {discountAmount > 0 ? (
              <p>
                Discount{couponResult?.code ? ` (${couponResult.code})` : ""}:{" "}
                <strong>-{formatINR(discountAmount)}</strong>
              </p>
            ) : null}
            <p>Payable: <strong>{formatINR(payableAmount)}</strong></p>

            <form className="coupon-form" onSubmit={handleApplyCoupon}>
              <input
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="Coupon code"
                value={couponCode}
              />
              <button className="button button--outline" disabled={couponLoading} type="submit">
                {couponLoading ? "Applying..." : "Apply"}
              </button>
            </form>
            {couponResult ? (
              <button className="button button--text" onClick={handleRemoveCoupon} type="button">
                Remove Coupon
              </button>
            ) : null}

            {error ? <p className="inline-message inline-message--error">{error}</p> : null}
            {success ? <p className="inline-message">{success}</p> : null}

            <button
              className="button button--gold"
              disabled={placingOrder || !activeCartItems.length}
              onClick={placeOrder}
              type="button"
            >
              {placingOrder ? "Placing order..." : "Place Order"}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default CheckoutPage;
