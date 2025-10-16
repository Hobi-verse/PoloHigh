import { Link } from "react-router-dom";
import QuantitySelector from "../../common/QuantitySelector.jsx";
import Divider from "../../common/Divider.jsx";
import { formatINR } from "../../../utils/currency.js";
import trashIcon from "../../../assets/icons/trash.svg";
import heartIcon from "../../../assets/icons/heart.svg";

const CartItem = ({ item, onQuantityChange, onRemove, onSaveForLater }) => {
  if (!item) return null;

  const handleQuantityChange = (nextValue) => {
    onQuantityChange?.(item.id, nextValue);
  };

  const handleRemove = () => {
    onRemove?.(item.id);
  };

  const handleSaveForLater = () => {
    onSaveForLater?.(item.id);
  };

  return (
    <article className="space-y-4 rounded-3xl border border-secondary/50 bg-secondary/40 p-6 shadow-2xl shadow-secondary/20">
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
        <div>
          <h3 className="text-base font-semibold text-text-base">
            {item.title}
          </h3>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Size {item.size}
          </p>
        </div>
        <p className="text-sm font-semibold text-primary">
          {formatINR(item.price)}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <QuantitySelector
        value={item.quantity}
        onChange={handleQuantityChange}
        min={1}
        max={item.maxQuantity ?? 6}
        variant="pill"
      />
    </div>
  </div>

  <Divider className="my-2" />

  <div className="flex flex-col gap-3 text-sm font-medium text-text-muted sm:flex-row sm:items-center sm:justify-between">
    <button
      type="button"
      onClick={handleRemove}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-left transition hover:text-primary"
    >
      <img src={trashIcon} alt="" aria-hidden className="h-4 w-4" />
      Remove
    </button>
    <button
      type="button"
      onClick={handleSaveForLater}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-left transition hover:text-primary"
    >
      <img src={heartIcon} alt="" aria-hidden className="h-4 w-4" />
      Save for later
    </button>
  </div>
</article>
  );
};

export default CartItem;
