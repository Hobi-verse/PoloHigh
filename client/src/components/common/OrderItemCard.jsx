import { formatINR } from "../../utils/currency.js";

const OrderItemCard = ({ item, className = "", showSize = true }) => {
  if (!item) {
    return null;
  }

  const { title, size, price, quantity = 1, imageUrl } = item;

  return (
    <article
      className={`flex gap-4 rounded-2xl border border-secondary/50 bg-secondary/40 p-4 ${className}`.trim()}
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title ?? "Product image"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-text-muted">
            No image
          </div>
        )}
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-secondary shadow-lg">
          {quantity}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-base">{title}</h3>
          {showSize && size ? (
            <p className="text-xs text-text-muted">Size {size}</p>
          ) : null}
        </div>
        <p className="text-sm font-semibold text-primary">{formatINR(price)}</p>
      </div>
    </article>
  );
};

export default OrderItemCard;
