import { Link } from "react-router-dom";
import { formatINR } from "../../../utils/currency.js";
import bagIcon from "../../../assets/icons/bag.svg";
import trashIcon from "../../../assets/icons/trash.svg";

const WishlistBadge = ({ inStock }) => (
  <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        inStock
          ? "bg-primary/20 text-primary"
          : "bg-text-muted/20 text-text-muted"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          inStock ? "bg-primary" : "bg-text-muted"
        }`}
      />
      {inStock ? "In stock" : "Back soon"}
    </span>
);

const WishlistItem = ({ item, onAddToCart, onRemove }) => {
  if (!item) return null;

  const canAddToCart = Boolean(item.variantSku && item.inStock !== false);

  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-secondary/50 bg-secondary/40 p-5 shadow-2xl shadow-secondary/20 md:flex-row md:items-center md:justify-between">
  <div className="flex gap-4">
    <Link
      to={`/products/${item.productId ?? item.id}`}
      className="block h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-secondary/50 bg-secondary"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
    </Link>
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-text-base">{item.title}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
          {item.size ? <span>Size {item.size}</span> : null}
          {item.color ? <span>{item.color}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-primary">
          {formatINR(item.price)}
        </p>
        <WishlistBadge inStock={item.inStock !== false} />
      </div>
    </div>
  </div>

  <div className="flex flex-col gap-3 text-sm font-medium md:flex-row md:items-center">
    <button
      type="button"
      onClick={() => onAddToCart?.(item)}
      disabled={!canAddToCart}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-secondary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60 disabled:text-secondary/60"
    >
      <img src={bagIcon} alt="" aria-hidden className="h-4 w-4" />
      {canAddToCart ? "Add to cart" : "Select variant"}
    </button>
    <button
      type="button"
      onClick={() => onRemove?.(item)}
      className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-text-muted transition hover:border-primary/50 hover:text-primary"
    >
      <img src={trashIcon} alt="" aria-hidden className="h-4 w-4" />
      Remove
    </button>
  </div>
</article>
  );
};

export default WishlistItem;
