import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/endpoints";
import { ErrorState, LoadingState } from "../../components/ui/AsyncState";
import { formatINR } from "../../utils/currency";

const extractWishlist = (response) => {
  return response?.data?.wishlist || response?.wishlist || response || {};
};

const WishlistPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlist, setWishlist] = useState({ items: [] });

  const reloadWishlist = async () => {
    const response = await api.wishlist.get();
    setWishlist(extractWishlist(response));
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    let active = true;

    const loadWishlist = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.wishlist.get();
        if (active) {
          setWishlist(extractWishlist(response));
        }
      } catch (requestError) {
        if (active) {
          setError(requestError?.message || "Unable to load wishlist.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadWishlist();

    return () => {
      active = false;
    };
  }, [isLoggedIn, navigate]);

  const items = Array.isArray(wishlist?.items) ? wishlist.items : [];

  const moveToCart = async (item) => {
    const itemId = item._id || item.id;
    if (!itemId) {
      setError("Unable to move item to cart.");
      return;
    }

    try {
      await api.wishlist.moveToCart(itemId, { quantity: 1 });
      setError("");
      await reloadWishlist();
    } catch (requestError) {
      setError(requestError?.message || "Unable to move item to cart.");
    }
  };

  const removeItem = async (item) => {
    const itemId = item._id || item.id;
    if (!itemId) {
      setError("Unable to remove item.");
      return;
    }

    try {
      await api.wishlist.removeItem(itemId);
      setError("");
      await reloadWishlist();
    } catch (requestError) {
      setError(requestError?.message || "Unable to remove item.");
    }
  };

  if (loading) {
    return <LoadingState message="Loading wishlist..." />;
  }

  if (error && !items.length) {
    return <ErrorState message={error} />;
  }

  return (
    <main className="container">
      <section className="section-block">
        <div className="section-block__header">
          <div>
            <p className="section-block__eyebrow">Wishlist</p>
            <h2>Saved for later</h2>
          </div>
        </div>

        {!items.length ? (
          <div className="state-box">
            <p>No products in wishlist.</p>
            <Link className="button button--gold" to="/shop/all">
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {items.map((item) => (
              <article className="wishlist-card" key={item._id || item.id || item.productId}>
                <img
                  alt={item.title || "Wishlist product"}
                  src={item.imageUrl || "https://placehold.co/420x540/f2ece1/1d2a44?text=POLO+HIGH"}
                />
                <div className="wishlist-card__content">
                  <h3>{item.title}</h3>
                  <p>{formatINR(Number(item.price || 0))}</p>
                  <p className="catalog-footnote">
                    {item.inStock === false ? "Out of stock" : "In stock"}
                  </p>
                  <div className="wishlist-card__actions">
                    <button
                      className="button button--gold"
                      disabled={!item.variantSku || item.inStock === false}
                      onClick={() => moveToCart(item)}
                      type="button"
                    >
                      Move to Cart
                    </button>
                    <button className="button button--text" onClick={() => removeItem(item)} type="button">
                      Remove
                    </button>
                  </div>
                  {!item.variantSku ? (
                    <p className="catalog-footnote">Select a product variant before moving to cart.</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default WishlistPage;
