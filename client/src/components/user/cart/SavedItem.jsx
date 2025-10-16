import { Link } from "react-router-dom";
import { formatINR } from "../../../utils/currency.js";
import bagIcon from "../../../assets/icons/bag.svg";
import trashIcon from "../../../assets/icons/trash.svg";

const SavedItem = ({ item, onMoveToCart, onRemove }) => {
  if (!item) return null;

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-text-muted/20 bg-secondary p-5 shadow-xl shadow-black/40 sm:flex-row sm:items-center sm:justify-between">
  {/* Product Information */}
  <div className="flex gap-4">
    <Link
      to={`/products/${item.productId ?? item.id}`}
      className="block h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-text-muted/20 bg-background"
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
    <div className="space-y-1.5">
      <div>
        <h3 className="text-base font-semibold text-text-base">{item.title}</h3>
        {item.size ? (
          <p className="text-xs uppercase tracking-widest text-text-muted">
            Size {item.size}
          </p>
        ) : null}
      </div>
      <p className="text-sm font-semibold text-text-base">
        {formatINR(item.price)}
      </p>
    </div>
  </div>

  {/* Action Buttons */}
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    {/* Primary Action */}
    <button
      type="button"
      onClick={() => onMoveToCart?.(item.id)}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-background"
    >
      {/* Replace with an SVG icon if possible */}
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
      Move to cart
    </button>
    {/* Secondary Action */}
    <button
      type="button"
      onClick={() => onRemove?.(item.id)}
      className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-base"
    >
       {/* Replace with an SVG icon if possible */}
       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      Remove
    </button>
  </div>
</article>
  );
};

export default SavedItem;
