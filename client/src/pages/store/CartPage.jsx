import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/endpoints";
import { ErrorState, LoadingState } from "../../components/ui/AsyncState";
import { formatINR } from "../../utils/currency";

const extractCart = (response) => {
  return response?.data?.cart || response?.cart || response || {};
};

const CartPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [cart, setCart] = useState({ items: [], totals: {} });
  const [couponResult, setCouponResult] = useState(null);

  const reloadCart = async () => {
    const response = await api.cart.get();
    setCart(extractCart(response));
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    let active = true;

    const loadCart = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.cart.get();
        if (active) {
          setCart(extractCart(response));
        }
      } catch (requestError) {
        if (active) {
          setError(requestError?.message || "Unable to load cart.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCart();

    return () => {
      active = false;
    };
  }, [isLoggedIn, navigate]);

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const totals = cart?.totals || {};
  const subtotal = Number(totals.subtotal || 0);

  const orderAmount = useMemo(() => {
    if (couponResult?.coupon?.finalAmount) {
      return Number(couponResult.coupon.finalAmount);
    }
    return subtotal;
  }, [couponResult, subtotal]);

  const handleQuantityChange = async (itemId, quantity) => {
    try {
      await api.cart.updateItem(itemId, { quantity });
      await reloadCart();
    } catch (requestError) {
      setError(requestError?.message || "Unable to update quantity.");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await api.cart.removeItem(itemId);
      await reloadCart();
    } catch (requestError) {
      setError(requestError?.message || "Unable to remove item.");
    }
  };

  const handleApplyCoupon = async (event) => {
    event.preventDefault();
    try {
      const payload = await api.coupons.validate({
        code: couponCode.trim(),
        orderAmount: subtotal,
        items: items.map((item) => ({
          productId: item.productId?._id || item.productId || item.productSlug || item.id,
          quantity: item.quantity || 1,
          price: item.price || 0,
        })),
      });
      setCouponResult(payload?.data || payload);
      setError("");
    } catch (requestError) {
      setCouponResult(null);
      setError(requestError?.message || "Unable to apply coupon.");
    }
  };

  if (loading) {
    return <LoadingState message="Loading your cart..." />;
  }

  if (error && !items.length) {
    return <ErrorState message={error} />;
  }

  return (
    <main className="container cart-page">
      <section className="section-block">
        <div className="section-block__header">
          <div>
            <p className="section-block__eyebrow">Cart</p>
            <h2>Your selected pieces</h2>
          </div>
        </div>

        {!items.length ? (
          <div className="state-box">
            <p>Your cart is empty.</p>
            <Link className="button button--gold" to="/shop/all">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-list">
              {items.map((item) => (
                <article className="cart-item" key={item._id || item.id}>
                  <img
                    alt={item.title || "Cart product"}
                    src={item.imageUrl || "https://placehold.co/280x360/f2ece1/1d2a44?text=POLO+HIGH"}
                  />
                  <div className="cart-item__content">
                    <h3>{item.title}</h3>
                    <p>{item.size || "Standard"} • {item.color || "Default"}</p>
                    <p>{formatINR(Number(item.price || 0))}</p>
                    <div className="cart-item__actions">
                      <label>
                        Qty
                        <select
                          onChange={(event) =>
                            handleQuantityChange(item._id || item.id, Number(event.target.value))
                          }
                          value={item.quantity || 1}
                        >
                          {[1, 2, 3, 4, 5].map((count) => (
                            <option key={count} value={count}>
                              {count}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="button button--text"
                        onClick={() => handleRemoveItem(item._id || item.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="summary-card">
              <h3>Order Summary</h3>
              <p>Subtotal: <strong>{formatINR(subtotal)}</strong></p>
              <p>Total Items: <strong>{totals.itemCount || items.length}</strong></p>
              {couponResult?.discountApplied ? (
                <p>Discount: <strong>-{formatINR(couponResult.discountApplied)}</strong></p>
              ) : null}
              <p className="summary-total">Payable: {formatINR(orderAmount)}</p>

              <form className="coupon-form" onSubmit={handleApplyCoupon}>
                <input
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Coupon code"
                  value={couponCode}
                />
                <button className="button button--outline" type="submit">
                  Apply
                </button>
              </form>

              <button className="button button--gold" onClick={() => navigate("/checkout")} type="button">
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
};

export default CartPage;
