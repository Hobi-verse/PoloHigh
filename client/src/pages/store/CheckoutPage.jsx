import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/endpoints";
import { ErrorState, LoadingState } from "../../components/ui/AsyncState";
import { formatINR } from "../../utils/currency";

const PAYMENT_METHODS = ["COD", "UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"];

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

  const subtotal = Number(cart?.totals?.subtotal || 0);

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
        setSelectedAddressId(
          nextAddresses.find((address) => address.isDefault)?._id ||
            nextAddresses[0]?._id ||
            ""
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
    const shipping = subtotal >= 5000 ? 0 : 150;
    const tax = Math.round(subtotal * 0.06);
    return subtotal + shipping + tax;
  }, [subtotal]);

  const createAddress = async (event) => {
    event.preventDefault();
    try {
      const response = await api.addresses.create(newAddress);
      const createdAddress = response?.data?.address || response?.address || response;
      if (!createdAddress?._id) {
        throw new Error("Address could not be created.");
      }
      setAddresses((prev) => [createdAddress, ...prev]);
      setSelectedAddressId(createdAddress._id);
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
      setError(requestError?.message || "Unable to create address.");
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
                <label className="address-card" key={address._id || address.id}>
                  <input
                    checked={selectedAddressId === (address._id || address.id)}
                    name="address"
                    onChange={() => setSelectedAddressId(address._id || address.id)}
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
            <p>Payable: <strong>{formatINR(payableAmount)}</strong></p>

            {error ? <p className="inline-message inline-message--error">{error}</p> : null}
            {success ? <p className="inline-message">{success}</p> : null}

            <button className="button button--gold" disabled={placingOrder} onClick={placeOrder} type="button">
              {placingOrder ? "Placing order..." : "Place Order"}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default CheckoutPage;
