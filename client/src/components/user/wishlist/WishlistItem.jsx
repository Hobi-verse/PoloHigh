import { Link } from "react-router-dom";
import { formatINR } from "../../../utils/currency.js";
import bagIcon from "../../../assets/icons/bag.svg";
import trashIcon from "../../../assets/icons/trash.svg";

const WishlistBadge = ({ inStock }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
      inStock
        ? "bg-emerald-400/15 text-emerald-200"
        : "bg-amber-400/15 text-amber-200"
    }`}
  >
    <span
      className={`h-2 w-2 rounded-full ${
        inStock ? "bg-emerald-300" : "bg-amber-300"
      }`}
    />
    {inStock ? "In stock" : "Back soon"}
  </span>
);

const WishlistItem = ({ item, onAddToCart, onRemove }) => {
  if (!item) return null;

  const canAddToCart = Boolean(item.variantSku && item.inStock !== false);

  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-white/5 p-5 shadow-[0_20px_44px_rgba(8,35,25,0.32)] md:flex-row md:items-center md:justify-between">
      <div className="flex gap-4">
        <Link
          to={`/products/${item.productId ?? item.id}`}
          className="block h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-emerald-900/20"
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
            <h3 className="text-base font-semibold text-white">{item.title}</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-200/60">
              {item.size ? <span>Size {item.size}</span> : null}
              {item.color ? <span>{item.color}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-emerald-100">
              {formatINR(item.price)}
            </p>
            <WishlistBadge inStock={item.inStock !== false} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm font-medium text-emerald-200/80 md:flex-row md:items-center">
        <button
          type="button"
          onClick={() => onAddToCart?.(item)}
          disabled={!canAddToCart}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40 disabled:text-emerald-950/60"
        >
          <img src={bagIcon} alt="" aria-hidden className="h-4 w-4" />
          {canAddToCart ? "Add to cart" : "Select variant"}
        </button>
        <button
          type="button"
          onClick={() => onRemove?.(item)}
          className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-emerald-200/80 transition hover:border-emerald-300/50 hover:text-emerald-100"
        >
          <img src={trashIcon} alt="" aria-hidden className="h-4 w-4" />
          Remove
        </button>
      </div>
    </article>
  );
};

export default WishlistItem;
