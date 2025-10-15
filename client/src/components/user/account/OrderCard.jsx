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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-200/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Order {order.id}</p>
          <p className="text-xs text-emerald-200/70">
            Placed on {formatDate(order.placedOn)} · {order.items} items
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
        >
          {order.status}
        </span>
      </div>
      <div className="mt-4 grid gap-4 text-sm text-emerald-200/80 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/60">
            Total amount
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-100">
            {formatINR(order.total)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/60">
            Payment method
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-100">
            {order.paymentMethod}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/60">
            Delivery
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-100">
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
