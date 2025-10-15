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
    <aside className="space-y-6 rounded-3xl border border-white/5 bg-[#0b1f19] p-6 shadow-[0_26px_60px_rgba(8,35,25,0.45)]">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
          Your order
        </p>
        <h2 className="text-lg font-semibold text-white">Order Summary</h2>
      </header>

      <div className="space-y-4">
        {order.items.map((item) => (
          <OrderItemCard key={item.id} item={item} />
        ))}
      </div>

      <div className="space-y-3 border-t border-white/5 pt-4 text-sm">
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
              ? "cursor-not-allowed bg-emerald-500/70 text-emerald-950"
              : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          }`}
        >
          {isPlacingOrder ? "Processing order..." : "Place Order"}
          {isPlacingOrder ? null : (
            <img src={arrowRightIcon} alt="" aria-hidden className="h-4 w-4" />
          )}
        </button>
        <p className="text-center text-xs text-emerald-200/70">
          Your payment information is encrypted and secure.
        </p>
      </div>
    </aside>
  );
};

export default CheckoutOrderSummary;
