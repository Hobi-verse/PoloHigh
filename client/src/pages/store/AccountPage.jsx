import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/endpoints";
import { ErrorState, LoadingState } from "../../components/ui/AsyncState";
import { formatINR } from "../../utils/currency";

const INITIAL_ADDRESS_FORM = {
  recipient: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  type: "home",
};

const getAddressId = (address) => address?._id || address?.id || "";
const extractAddresses = (response) => response?.data?.addresses || response?.addresses || [];
const getRequestErrorMessage = (requestError, fallbackMessage) =>
  requestError?.payload?.errors?.[0]?.message || requestError?.message || fallbackMessage;

const AccountPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(INITIAL_ADDRESS_FORM);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressActionError, setAddressActionError] = useState("");
  const [addressActionMessage, setAddressActionMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    let active = true;

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError("");
        const [response, addressResponse] = await Promise.all([
          api.profile.getSummary(),
          api.addresses.list().catch(() => null),
        ]);
        if (active) {
          setSummary(response?.data || response || null);
          setAddresses(extractAddresses(addressResponse));
        }
      } catch (requestError) {
        if (active) {
          setError(requestError?.message || "Unable to load account summary.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      active = false;
    };
  }, [isLoggedIn, navigate]);

  const handleAddressFieldChange = (field, value) => {
    setAddressForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const refreshAddresses = async () => {
    const response = await api.addresses.list();
    const nextAddresses = extractAddresses(response);
    setAddresses(nextAddresses);
    return nextAddresses;
  };

  const handleCreateAddress = async (event) => {
    event.preventDefault();
    try {
      setAddressSaving(true);
      setAddressActionError("");
      setAddressActionMessage("");

      await api.addresses.create({
        recipient: addressForm.recipient.trim(),
        phone: addressForm.phone.trim(),
        addressLine1: addressForm.addressLine1.trim(),
        addressLine2: addressForm.addressLine2.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postalCode: addressForm.postalCode.trim(),
        country: addressForm.country.trim() || "India",
        type: addressForm.type,
      });

      await refreshAddresses();
      setAddressForm(INITIAL_ADDRESS_FORM);
      setAddressActionMessage("Address added successfully.");
    } catch (requestError) {
      setAddressActionError(getRequestErrorMessage(requestError, "Unable to add address."));
    } finally {
      setAddressSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    if (!addressId) {
      return;
    }

    try {
      setAddressActionError("");
      setAddressActionMessage("");
      await api.addresses.setDefault(addressId);
      await refreshAddresses();
      setAddressActionMessage("Default address updated.");
    } catch (requestError) {
      setAddressActionError(getRequestErrorMessage(requestError, "Unable to update default address."));
    }
  };

  if (loading) {
    return <LoadingState message="Loading account..." />;
  }

  if (error || !summary) {
    return <ErrorState message={error || "Account summary not available."} />;
  }

  const profile = summary.profile || {};
  const recentOrders = Array.isArray(summary.recentOrders) ? summary.recentOrders : [];
  const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0] || null;

  return (
    <main className="container">
      <section className="section-block">
        <div className="section-block__header">
          <div>
            <p className="section-block__eyebrow">My Account</p>
            <h2>{profile.name || "Customer Profile"}</h2>
          </div>
        </div>

        <div className="account-grid">
          <article className="summary-card">
            <h3>Profile</h3>
            <p>Name: <strong>{profile.name || "-"}</strong></p>
            <p>Email: <strong>{profile.email || "-"}</strong></p>
            <p>Phone: <strong>{profile.phone || "-"}</strong></p>
          </article>

          <article className="summary-card">
            <h3>Default Address</h3>
            {defaultAddress ? (
              <>
                <p>{defaultAddress.recipient}</p>
                <p>{defaultAddress.addressLine1}</p>
                <p>
                  {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
                </p>
              </>
            ) : (
              <p>No address available.</p>
            )}
          </article>
        </div>
      </section>

      <section className="section-block">
        <div className="section-block__header">
          <div>
            <p className="section-block__eyebrow">Addresses</p>
            <h2>Manage Delivery Addresses</h2>
          </div>
        </div>

        <div className="account-grid">
          <article className="summary-card">
            <h3>Saved Addresses</h3>
            {addresses.length ? (
              <div className="address-list">
                {addresses.map((address) => (
                  <article className="address-card" key={getAddressId(address)}>
                    <div>
                      <p>
                        <strong>{address.recipient}</strong>
                        {address.isDefault ? " (Default)" : ""}
                      </p>
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p>{address.phone}</p>
                    </div>
                    {!address.isDefault ? (
                      <button
                        className="button button--outline"
                        onClick={() => handleSetDefaultAddress(getAddressId(address))}
                        type="button"
                      >
                        Set Default
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p>No addresses saved yet.</p>
            )}
          </article>

          <article className="summary-card">
            <h3>Add Address</h3>
            <form className="address-form" onSubmit={handleCreateAddress}>
              <input
                onChange={(event) => handleAddressFieldChange("recipient", event.target.value)}
                placeholder="Recipient"
                required
                value={addressForm.recipient}
              />
              <input
                onChange={(event) => handleAddressFieldChange("phone", event.target.value)}
                placeholder="Phone (10 digits)"
                required
                value={addressForm.phone}
              />
              <input
                onChange={(event) => handleAddressFieldChange("addressLine1", event.target.value)}
                placeholder="Address line 1"
                required
                value={addressForm.addressLine1}
              />
              <input
                onChange={(event) => handleAddressFieldChange("addressLine2", event.target.value)}
                placeholder="Address line 2 (optional)"
                value={addressForm.addressLine2}
              />
              <div className="two-col">
                <input
                  onChange={(event) => handleAddressFieldChange("city", event.target.value)}
                  placeholder="City"
                  required
                  value={addressForm.city}
                />
                <input
                  onChange={(event) => handleAddressFieldChange("state", event.target.value)}
                  placeholder="State"
                  required
                  value={addressForm.state}
                />
              </div>
              <div className="two-col">
                <input
                  onChange={(event) => handleAddressFieldChange("postalCode", event.target.value)}
                  placeholder="PIN code"
                  required
                  value={addressForm.postalCode}
                />
                <select
                  onChange={(event) => handleAddressFieldChange("type", event.target.value)}
                  value={addressForm.type}
                >
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button className="button button--gold" disabled={addressSaving} type="submit">
                {addressSaving ? "Saving..." : "Save Address"}
              </button>
            </form>
          </article>
        </div>

        {addressActionError ? (
          <p className="inline-message inline-message--error">{addressActionError}</p>
        ) : null}
        {addressActionMessage ? <p className="inline-message">{addressActionMessage}</p> : null}
      </section>

      <section className="section-block">
        <div className="section-block__header">
          <div>
            <p className="section-block__eyebrow">Orders</p>
            <h2>Recent Purchases</h2>
          </div>
        </div>

        {recentOrders.length ? (
          <div className="order-list">
            {recentOrders.map((order) => (
              <article className="order-card" key={order.id || order._id}>
                <p>Order: {order.orderNumber || order.id || "-"}</p>
                <p>Status: {order.status || "-"}</p>
                <p>Total: {formatINR(Number(order.total || order.pricing?.grandTotal || 0))}</p>
                <p className="catalog-footnote">Placed: {order.placedOn || "-"}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="catalog-footnote">No recent orders found.</p>
        )}
      </section>
    </main>
  );
};

export default AccountPage;
