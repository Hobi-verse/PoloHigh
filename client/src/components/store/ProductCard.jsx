import { Link } from "react-router-dom";
import { formatINR } from "../../utils/currency";

const getPrimaryImage = (product) => {
  const media = Array.isArray(product?.media) ? product.media : [];
  const primary = media.find((item) => item?.isPrimary) || media[0];
  return primary?.url || "https://placehold.co/600x780/f2ece1/1d2a44?text=POLO+HIGH";
};

const ProductCard = ({ product }) => {
  const price = Number(product?.price ?? product?.basePrice ?? 0);
  const rating = Number(product?.averageRating ?? 0);
  const stars = Math.max(0, Math.min(5, Math.round(rating || 4)));
  const productLink = `/products/${product?.slug || product?.id}`;

  return (
    <article className="product-card">
      <Link className="product-card__image-wrap" to={productLink}>
        <img alt={product?.title || "Product"} className="product-card__image" src={getPrimaryImage(product)} />
        <div className="product-card__title-bar">
          <h3 className="product-card__title">{product?.title || "Untitled product"}</h3>
        </div>

        <div className="product-card__hover-panel">
          <p className="product-card__category">{product?.category || "Luxury Edit"}</p>
          <div className="product-card__meta">
            <span className="product-card__price">{formatINR(price)}</span>
            <span className="product-card__rating">{rating.toFixed(1)}</span>
          </div>
          <div className="product-card__stars">
            {Array.from({ length: 5 }, (_, index) => (
              <span key={`${product?.id || product?.slug}-star-${index}`}>
                {index < stars ? "★" : "☆"}
              </span>
            ))}
          </div>
          <span className="product-card__cta">Buy Now</span>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
