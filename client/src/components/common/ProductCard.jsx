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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-4 shadow-lg transition hover:border-emerald-300/50 hover:bg-emerald-400/10">
      {hasDiscount ? (
        <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {roundedDiscount}% OFF
        </span>
      ) : null}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-emerald-900/40">
        {merchandisingLabel ? (
          <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-50">
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
      <div className="mt-4 flex flex-col gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {brand ? (
            <p className="text-sm text-emerald-200/80">{brand}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-100">
          <img src={starIcon} alt="" aria-hidden="true" className="h-4 w-4" />
          {ratingDisplay && reviewLabel ? (
            <span className="text-emerald-200/60">{reviewLabel}</span>
          ) : null}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-white">
            {formattedPrice}
          </span>
          {showOriginalPrice ? (
            <span className="text-sm text-emerald-200/60 line-through">
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
