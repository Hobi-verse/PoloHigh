import { formatINR } from "../../../utils/currency.js";
import arrowRightIcon from "../../../assets/icons/arrow-right.svg";
import OrderItemCard from "../../common/OrderItemCard.jsx";
import OrderSummaryRow from "../../common/OrderSummaryRow.jsx";

const CheckoutOrderSummary = ({
  order,
  onPlaceOrder,
  isPlacingOrder = false,
}) => {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = order.shipping ?? 0;
  const shippingLabel =
    shippingCost === 0
      ? order.shippingLabel ?? "Free"
      : formatINR(shippingCost);
  const tax = order.tax ?? 0;
  const total = subtotal + shippingCost + tax;

  return (
    <aside className="space-y-6 rounded-3xl border border-secondary/50 bg-secondary/40 p-6 shadow-2xl shadow-secondary/20">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
          Your order
        </p>
        <h2 className="text-lg font-semibold text-text-base">Order Summary</h2>
      </header>

      <div className="space-y-4">
        {order.items.map((item) => (
          <OrderItemCard key={item.id} item={item} />
        ))}
      </div>

      <div className="space-y-3 border-t border-secondary/50 pt-4 text-sm">
        <OrderSummaryRow label="Subtotal" value={formatINR(subtotal)} />
        <OrderSummaryRow label="Shipping" value={shippingLabel} />
        <OrderSummaryRow label="Tax" value={formatINR(tax)} />
      </div>

      <OrderSummaryRow label="Total" value={formatINR(total)} emphasis />

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onPlaceOrder?.(order)}
          disabled={isPlacingOrder}
          className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
            isPlacingOrder
              ? "cursor-not-allowed bg-primary/70 text-secondary/70"
              : "bg-primary text-secondary hover:bg-primary/90"
          }`}
        >
          {isPlacingOrder ? "Processing order..." : "Place Order"}
          {isPlacingOrder ? null : (
            <img src={arrowRightIcon} alt="" aria-hidden className="h-4 w-4" />
          )}
        </button>
        <p className="text-center text-xs text-text-muted">
          Your payment information is encrypted and secure.
        </p>
      </div>
    </aside>
  );
};

export default CheckoutOrderSummary;
