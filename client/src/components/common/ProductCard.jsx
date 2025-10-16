import { Link } from "react-router-dom";
import { formatINR } from "../../utils/currency.js";
import starIcon from "../../assets/icons/star.svg";

const ProductCard = ({
  id,
  title,
  price,
  mrp,
  brand,
  discountPercentage,
  averageRating,
  reviewCount,
  tag,
  badge,
  tags,
  imageUrl,
  imageAlt,
  to,
  onSelect,
}) => {
  const numericPrice =
    typeof price === "number" && Number.isFinite(price) ? price : null;
  const numericMrp =
    typeof mrp === "number" && Number.isFinite(mrp) && mrp > 0 ? mrp : null;

  const formattedPrice =
    numericPrice !== null ? formatINR(numericPrice) : price;
  const formattedMrp = numericMrp ? formatINR(numericMrp) : null;

  const parsedDiscount = Number.parseFloat(discountPercentage);
  const fallbackDiscount =
    numericMrp && numericPrice !== null && numericMrp > numericPrice
      ? ((numericMrp - numericPrice) / numericMrp) * 100
      : null;
  const discountCandidate =
    Number.isFinite(parsedDiscount) && parsedDiscount > 0
      ? parsedDiscount
      : fallbackDiscount;
  const roundedDiscount =
    Number.isFinite(discountCandidate) && discountCandidate > 0
      ? Math.min(99, Math.max(1, Math.round(discountCandidate)))
      : null;
  const hasDiscount = typeof roundedDiscount === "number";
  const showOriginalPrice =
    numericMrp !== null && numericPrice !== null && numericMrp > numericPrice;

  const numericRating =
    typeof averageRating === "number" &&
    Number.isFinite(averageRating) &&
    averageRating > 0
      ? averageRating
      : null;
  const ratingDisplay = numericRating ? numericRating.toFixed(1) : null;
  const reviewLabel =
    typeof reviewCount === "number" && reviewCount > 0
      ? `(${reviewCount})`
      : null;

  const merchandisingLabel = (() => {
    const primary = badge ?? tag;
    if (typeof primary === "string" && primary.trim()) {
      return primary.trim();
    }

    if (Array.isArray(tags)) {
      const firstTag = tags.find(
        (entry) => typeof entry === "string" && entry.trim()
      );
      if (firstTag) {
        return firstTag.trim();
      }
    }

    if (!numericRating) {
      return "New";
    }

    return null;
  })();

  const cardContent = (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-secondary/40 bg-background p-4 shadow-xl shadow-black/40 transition hover:border-primary">
  {/* Discount Badge */}
  {hasDiscount ? (
    <span className="absolute left-4 top-4 z-10 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
      {roundedDiscount}% OFF
    </span>
  ) : null}

  {/* Image Container */}
  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-background">
    {merchandisingLabel ? (
      <span className="absolute right-3 top-3 z-10 rounded-full border border-primary/50 bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
        {merchandisingLabel}
      </span>
    ) : null}
    {imageUrl ? (
      <img
        src={imageUrl}
        alt={imageAlt ?? title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        loading="lazy"
      />
    ) : null}
  </div>

  {/* Content Section */}
  <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-text-base">{title}</h3>
      {brand ? (
        <p className="text-sm text-text-muted">{brand}</p>
      ) : null}
    </div>

    <div className="flex items-center gap-2 text-sm text-text-base">
      {/* Replace with SVG star icon for color control */}
      <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
      {ratingDisplay}
      {reviewLabel ? (
        <span className="text-text-muted">{reviewLabel}</span>
      ) : null}
    </div>

    <div className="flex items-baseline gap-2">
      <span className="text-base font-semibold text-text-base">
        {formattedPrice}
      </span>
      {showOriginalPrice ? (
        <span className="text-sm text-text-muted line-through">
          {formattedMrp}
        </span>
      ) : null}
    </div>
  </div>
</article>
  );

  if (to) {
    return (
      <Link to={to} onClick={() => onSelect?.(id)}>
        {cardContent}
      </Link>
    );
  }

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(id)}
        className="h-full w-full text-left"
      >
        {cardContent}
      </button>
    );
  }

  return <div className="h-full w-full">{cardContent}</div>;
};

export default ProductCard;
