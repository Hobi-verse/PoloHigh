import { useEffect, useState } from "react";
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
  const [cart, setCart] = useState({ items: [], totals: {} });

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
  const activeItems = items.filter((item) => !item.savedForLater);
  const savedItems = items.filter((item) => item.savedForLater);
  const totals = cart?.totals || {};
  const subtotal = Number(totals.subtotal || 0);

  const handleQuantityChange = async (itemId, quantity) => {
    if (!itemId) {
      setError("Unable to update quantity.");
      return;
    }

    try {
      await api.cart.updateItem(itemId, { quantity });
      setError("");
      await reloadCart();
    } catch (requestError) {
      setError(requestError?.message || "Unable to update quantity.");
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!itemId) {
      setError("Unable to remove item.");
      return;
    }

    try {
      await api.cart.removeItem(itemId);
      setError("");
      await reloadCart();
    } catch (requestError) {
      setError(requestError?.message || "Unable to remove item.");
    }
  };

  const handleSaveForLater = async (itemId) => {
    if (!itemId) {
      setError("Unable to save item for later.");
      return;
    }

    try {
      await api.cart.saveForLater(itemId);
      setError("");
      await reloadCart();
    } catch (requestError) {
      setError(requestError?.message || "Unable to save item for later.");
    }
  };

  const handleMoveBackToCart = async (itemId) => {
    if (!itemId) {
      setError("Unable to move item to cart.");
      return;
    }

    try {
      await api.cart.moveToCart(itemId);
      setError("");
      await reloadCart();
    } catch (requestError) {
      setError(requestError?.message || "Unable to move item to cart.");
    }
  };

  if (loading) {
    return <LoadingState message="Loading your cart..." />;
  }

  if (error && !activeItems.length && !savedItems.length) {
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

        {!activeItems.length && !savedItems.length ? (
          <div className="state-box">
            <p>Your cart is empty.</p>
            <Link className="button button--gold" to="/shop/all">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-list">
              {activeItems.length ? activeItems.map((item) => (
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
                        className="button button--outline"
                        onClick={() => handleSaveForLater(item._id || item.id)}
                        type="button"
                      >
                        Save for Later
                      </button>
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
              )) : <p className="catalog-footnote">No active items in cart.</p>}

              {savedItems.length ? (
                <section className="section-block">
                  <div className="section-block__header">
                    <div>
                      <p className="section-block__eyebrow">Saved for later</p>
                      <h2>Move back anytime</h2>
                    </div>
                  </div>
                  <div className="cart-list">
                    {savedItems.map((item) => (
                      <article className="cart-item" key={item._id || item.id}>
                        <img
                          alt={item.title || "Saved cart product"}
                          src={item.imageUrl || "https://placehold.co/280x360/f2ece1/1d2a44?text=POLO+HIGH"}
                        />
                        <div className="cart-item__content">
                          <h3>{item.title}</h3>
                          <p>{item.size || "Standard"} • {item.color || "Default"}</p>
                          <p>{formatINR(Number(item.price || 0))}</p>
                          <div className="cart-item__actions">
                            <button
                              className="button button--outline"
                              onClick={() => handleMoveBackToCart(item._id || item.id)}
                              type="button"
                            >
                              Move to Cart
                            </button>
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
                </section>
              ) : null}
            </div>

            <aside className="summary-card">
              <h3>Order Summary</h3>
              <p>Subtotal: <strong>{formatINR(subtotal)}</strong></p>
              <p>Total Items: <strong>{totals.itemCount || activeItems.length}</strong></p>
              <p className="summary-total">Payable: {formatINR(subtotal)}</p>

              <button
                className="button button--gold"
                disabled={!activeItems.length}
                onClick={() => navigate("/checkout")}
                type="button"
              >
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
