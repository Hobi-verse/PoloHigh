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
    try {
      await api.wishlist.moveToCart(item._id || item.id, { quantity: 1 });
      await reloadWishlist();
    } catch (requestError) {
      setError(requestError?.message || "Unable to move item to cart.");
    }
  };

  const removeItem = async (item) => {
    try {
      await api.wishlist.removeItem(item._id || item.id);
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
              <article className="wishlist-card" key={item._id || item.id}>
                <img
                  alt={item.title || "Wishlist product"}
                  src={item.imageUrl || "https://placehold.co/420x540/f2ece1/1d2a44?text=POLO+HIGH"}
                />
                <div className="wishlist-card__content">
                  <h3>{item.title}</h3>
                  <p>{formatINR(Number(item.price || 0))}</p>
                  <div className="wishlist-card__actions">
                    <button className="button button--gold" onClick={() => moveToCart(item)} type="button">
                      Move to Cart
                    </button>
                    <button className="button button--text" onClick={() => removeItem(item)} type="button">
                      Remove
                    </button>
                  </div>
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
