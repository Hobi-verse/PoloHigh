import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/endpoints";
import { ErrorState, LoadingState } from "../../components/ui/AsyncState";
import { formatINR } from "../../utils/currency";

const ProductPage = ({ isLoggedIn }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedSku, setSelectedSku] = useState("");

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const [productResponse, reviewResponse] = await Promise.all([
          api.products.getById(productId),
          api.reviews.listProductReviews(productId, { limit: 6 }),
        ]);

        const productData = productResponse?.product ?? productResponse;
        const reviewItems = reviewResponse?.data?.reviews ?? reviewResponse?.reviews ?? [];

        if (!active) {
          return;
        }

        setProduct(productData);
        setReviews(reviewItems);
        setSelectedSku(productData?.variants?.[0]?.sku ?? "");
      } catch (requestError) {
        if (!active) {
          return;
        }
        setError(requestError?.message || "Failed to load product details.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  const selectedVariant = useMemo(() => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    return variants.find((variant) => variant.sku === selectedSku) || variants[0] || null;
  }, [product?.variants, selectedSku]);

  const price = Number(selectedVariant?.priceOverride ?? product?.price ?? product?.basePrice ?? 0);
  const stockCount = Number(selectedVariant?.stockLevel ?? selectedVariant?.stock ?? 0);
  const isInStock = stockCount > 0;
  const productRating = Number(product?.averageRating ?? 0);
  const reviewCount = Number(product?.reviewCount ?? reviews.length ?? 0);
  const image =
    product?.media?.find((item) => item.isPrimary)?.url ||
    product?.media?.[0]?.url ||
    "https://placehold.co/900x1080/f2ece1/1d2a44?text=POLO+HIGH";

  const requireAuth = () => {
    if (isLoggedIn) {
      return false;
    }
    navigate("/login");
    return true;
  };

  const handleAddToCart = async () => {
    if (requireAuth()) {
      return;
    }
    if (!selectedVariant?.sku) {
      setActionMessage("This product is currently unavailable.");
      return;
    }
    try {
      await api.cart.addItem({
        productId: product?.id || product?.slug || productId,
        variantSku: selectedVariant.sku,
        quantity: 1,
      });
      setActionMessage("Added to cart.");
    } catch (requestError) {
      setActionMessage(requestError?.message || "Unable to add to cart.");
    }
  };

  const handleAddToWishlist = async () => {
    if (requireAuth()) {
      return;
    }
    try {
      await api.wishlist.addItem({
        productId: product?.id || product?.slug || productId,
        variantSku: selectedVariant?.sku || undefined,
      });
      setActionMessage("Added to wishlist.");
    } catch (requestError) {
      setActionMessage(requestError?.message || "Unable to add to wishlist.");
    }
  };

  if (loading) {
    return <LoadingState message="Preparing product details..." />;
  }

  if (error || !product) {
    return <ErrorState message={error || "Product not found."} />;
  }

  return (
    <main className="container product-page">
      <section className="product-detail">
        <img alt={product.title} className="product-detail__image" src={image} />
        <div className="product-detail__content">
          <p className="product-detail__category">{product.category}</p>
          <h1>{product.title}</h1>
          <div className="product-detail__meta-row">
            <p className="product-detail__rating">{productRating.toFixed(1)} ★</p>
            <p className={`product-detail__stock ${isInStock ? "" : "is-out"}`}>
              {isInStock ? `${stockCount} in stock` : "Out of stock"}
            </p>
          </div>
          <p className="product-detail__description">{product.description}</p>
          <p className="product-detail__price">{formatINR(price)}</p>

          {Array.isArray(product?.variants) && product.variants.length ? (
            <label className="product-select">
              Variant
              <select
                onChange={(event) => setSelectedSku(event.target.value)}
                value={selectedVariant?.sku || ""}
              >
                {product.variants.map((variant) => (
                  <option key={variant.sku} value={variant.sku}>
                    {variant.size || "Size"} • {variant.color?.name || variant.color || "Color"} •{" "}
                    {variant.stockLevel ?? variant.stock ?? 0} in stock
                  </option>
                ))}
              </select>
              <small className="product-select__hint">
                {selectedVariant?.sku ? `SKU: ${selectedVariant.sku}` : "Select a variant"}
              </small>
            </label>
          ) : null}

          <div className="product-detail__actions">
            <button
              className="button button--gold"
              disabled={!isInStock}
              onClick={handleAddToCart}
              type="button"
            >
              Add to Cart
            </button>
            <button className="button button--outline" onClick={handleAddToWishlist} type="button">
              Add to Wishlist
            </button>
          </div>
          {actionMessage ? <p className="inline-message">{actionMessage}</p> : null}
          <p className="product-detail__review-count">{reviewCount} verified reviews</p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-block__header">
          <div>
            <p className="section-block__eyebrow">Client Feedback</p>
            <h2>Recent Reviews</h2>
          </div>
        </div>
        <div className="review-list">
          {reviews.length ? (
            reviews.map((review) => (
              <article className="review-card" key={review.id || review._id}>
                <p className="review-card__rating">{Number(review.rating || 0).toFixed(1)} ★</p>
                <h3>{review.title || "Verified buyer"}</h3>
                <p>{review.comment || "No review comment."}</p>
              </article>
            ))
          ) : (
            <p className="catalog-footnote">No reviews yet for this product.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default ProductPage;
