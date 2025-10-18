import formatINR from "../../../utils/currency.js";
import { orderStatusStyles } from "./accountConstants.js";
import { formatDate } from "./accountUtils.js";

const OrderCard = ({ order }) => {
  if (!order) {
    return null;
  }

  const statusClass =
    orderStatusStyles[order.status] ?? orderStatusStyles.Default;

  return (
    <div className="rounded-2xl border border-secondary/50 bg-secondary/40 p-4 transition hover:border-primary/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-base">
            Order {order.id}
          </p>
          <p className="text-xs text-text-muted">
            Placed on {formatDate(order.placedOn)} · {order.items} items
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
        >
          {order.status}
        </span>
      </div>
      <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Total amount
          </p>
          <p className="mt-1 text-sm font-medium text-text-base">
            {formatINR(order.total)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Payment method
          </p>
          <p className="mt-1 text-sm font-medium text-text-base">
            {order.paymentMethod}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Delivery
          </p>
          <p className="mt-1 text-sm font-medium text-text-base">
            {order.status === "Delivered"
              ? `Delivered on ${formatDate(order.deliveredOn)}`
              : order.expectedDelivery
              ? `Arriving by ${formatDate(order.expectedDelivery)}`
              : "We'll update you soon"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
