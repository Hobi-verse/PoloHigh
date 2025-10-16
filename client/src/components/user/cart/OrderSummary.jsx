import { Link } from "react-router-dom";
import { formatINR } from "../../../utils/currency.js";
import arrowRightIcon from "../../../assets/icons/arrow-right.svg";
import OrderSummaryRow from "../../common/OrderSummaryRow.jsx";

const OrderSummary = ({
  subtotal = 0,
  estimatedTax = 0,
  shippingLabel = "Free",
  checkoutPath = "/checkout",
  discount = 0,
  couponCode = "",
  onRemoveCoupon,
  children,
}) => {
  const totalBeforeDiscount = subtotal + estimatedTax;
  const appliedDiscount = Math.max(0, discount);
  const total = Math.max(totalBeforeDiscount - appliedDiscount, 0);
  const hasDiscount = appliedDiscount > 0;
  const hasCoupon = Boolean(couponCode);

  return (
    <aside className="space-y-6 rounded-3xl border border-secondary/50 bg-secondary/40 p-6 shadow-2xl shadow-secondary/20">
  <div>
    <h2 className="text-lg font-semibold text-text-base">Order Summary</h2>
  </div>

  <div className="space-y-3 text-sm">
    <OrderSummaryRow label="Subtotal" value={formatINR(subtotal)} />
    <OrderSummaryRow label="Shipping" value={shippingLabel} />
    <OrderSummaryRow
      label="Estimated Tax"
      value={formatINR(estimatedTax)}
    />
    {hasDiscount ? (
      <OrderSummaryRow
        label={
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted">
            Coupon {couponCode ? `(${couponCode})` : ""}
          </span>
        }
        value={`- ${formatINR(appliedDiscount)}`}
      />
    ) : null}
  </div>

  <OrderSummaryRow
    label={
      <span className="text-sm font-semibold text-text-base">
        Total
      </span>
    }
    value={formatINR(total)}
    emphasis
  />

  {hasCoupon ? (
    <button
      type="button"
      onClick={onRemoveCoupon}
      className="w-full rounded-full border border-text-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-text-muted transition hover:border-primary/70 hover:text-primary"
    >
      Remove coupon
    </button>
  ) : null}

  <Link
    to={checkoutPath}
    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-secondary transition hover:bg-primary/90"
  >
    Proceed to Checkout
    <img src={arrowRightIcon} alt="" aria-hidden className="h-4 w-4" />
  </Link>

  {children}
</aside>
  );
};

export default OrderSummary;
