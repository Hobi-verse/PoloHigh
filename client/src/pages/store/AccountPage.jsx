import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/endpoints";
import { ErrorState, LoadingState } from "../../components/ui/AsyncState";
import { formatINR } from "../../utils/currency";

const AccountPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

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
        const response = await api.profile.getSummary();
        if (active) {
          setSummary(response?.data || response || null);
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

  if (loading) {
    return <LoadingState message="Loading account..." />;
  }

  if (error || !summary) {
    return <ErrorState message={error || "Account summary not available."} />;
  }

  const profile = summary.profile || {};
  const membership = summary.membership || {};
  const rewards = summary.rewards || {};
  const recentOrders = Array.isArray(summary.recentOrders) ? summary.recentOrders : [];
  const addresses = Array.isArray(summary.addresses) ? summary.addresses : [];

  return (
    <main className="container">
      <section className="section-block">
        <div className="section-block__header">
          <div>
            <p className="section-block__eyebrow">My Account</p>
            <h2>{profile.fullName || "Customer Profile"}</h2>
          </div>
        </div>

        <div className="account-grid">
          <article className="summary-card">
            <h3>Membership</h3>
            <p>Tier: <strong>{membership.tier || "Bronze"}</strong></p>
            <p>Wallet Balance: <strong>{formatINR(Number(rewards.walletBalance || 0))}</strong></p>
            <p>Reward Points: <strong>{Number(rewards.rewardPoints || 0)}</strong></p>
          </article>

          <article className="summary-card">
            <h3>Default Address</h3>
            {addresses[0] ? (
              <>
                <p>{addresses[0].recipient}</p>
                <p>{addresses[0].addressLine1}</p>
                <p>
                  {addresses[0].city}, {addresses[0].state} {addresses[0].postalCode}
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
            <p className="section-block__eyebrow">Orders</p>
            <h2>Recent Purchases</h2>
          </div>
        </div>

        {recentOrders.length ? (
          <div className="order-list">
            {recentOrders.map((order) => (
              <article className="order-card" key={order.id || order._id}>
                <p>Order: {order.orderNumber || order.id}</p>
                <p>Status: {order.status}</p>
                <p>Total: {formatINR(Number(order.total || order.pricing?.grandTotal || 0))}</p>
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
