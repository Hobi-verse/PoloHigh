import { useEffect, useMemo, useState } from "react";
import { formatINR } from "../../../utils/currency.js";

const statusColors = {
  active: "text-emerald-200 bg-emerald-500/10",
  expired: "text-rose-200 bg-rose-500/10",
  inactive: "text-amber-200 bg-amber-500/10",
};

const CouponPanel = ({
  appliedCoupon,
  isApplying,
  applyError,
  onApply,
  onAutoApply,
  onRemove,
  availableCoupons,
  availableLoading,
  availableError,
  onRefresh,
  isLoggedIn,
}) => {
  const [codeInput, setCodeInput] = useState("");

  useEffect(() => {
    if (!appliedCoupon?.code) {
      return;
    }

    setCodeInput(appliedCoupon.code);
  }, [appliedCoupon?.code]);

  const statusLabel = useMemo(() => {
    if (!appliedCoupon) {
      return "No coupon applied";
    }

    if (appliedCoupon.discountApplied > 0) {
      return `Saving ${formatINR(appliedCoupon.discountApplied)}`;
    }

    if (appliedCoupon.freeShipping) {
      return "Free shipping applied";
    }

    return "Coupon applied";
  }, [appliedCoupon]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!codeInput.trim() || isApplying) {
      return;
    }

    onApply?.(codeInput.trim());
  };

  const handleAutoApply = () => {
    if (isApplying) {
      return;
    }

    onAutoApply?.();
  };

  const handleRemove = () => {
    if (isApplying) {
      return;
    }

    onRemove?.();
    setCodeInput("");
  };

  return (
    <div className="rounded-2xl border border-secondary/50 bg-secondary/10 p-5 text-sm text-text-base">
      <div className="flex flex-wrap items-center justify-between gap-3">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
      Coupons
    </p>
    <p className="text-sm text-text-base/80">
      Apply a coupon to save more.
    </p>
  </div>
  {appliedCoupon ? (
    <span className="rounded-full border border-primary/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-primary">
      {statusLabel}
    </span>
  ) : null}
</div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
  <div className="flex flex-col gap-3 sm:flex-row">
    <input
      type="text"
      name="couponCode"
      value={codeInput}
      onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
      spellCheck={false}
      autoComplete="off"
      placeholder="Enter coupon code"
      className="flex-1 rounded-2xl border border-secondary/50 bg-secondary px-4 py-2 text-sm uppercase tracking-[0.2em] text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      disabled={isApplying}
    />
    <button
      type="submit"
      className="flex items-center justify-center rounded-xl bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/70"
      disabled={isApplying || !codeInput.trim()}
    >
      {isApplying ? "Applying" : "Apply"}
    </button>
  </div>
  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted sm:gap-3">
    <button
      type="button"
      onClick={handleAutoApply}
      disabled={isApplying}
      className="font-semibold uppercase tracking-[0.3em] transition hover:text-primary disabled:cursor-not-allowed disabled:text-text-muted/50"
    >
      Auto apply best
    </button>
  </div>
  {applyError ? (
    // Note: Kept red for error state as it's a universal UX pattern.
    <div className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-100">
      {applyError}
    </div>
  ) : null}
  {appliedCoupon ? (
    <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs text-text-base">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em]">
            Coupon applied
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-text-muted">
            <span>{appliedCoupon.code}</span>
            {appliedCoupon.discountApplied ? (
              <span>
                Savings {formatINR(appliedCoupon.discountApplied)}
              </span>
            ) : null}
            {appliedCoupon.freeShipping ? (
              <span>Free shipping</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded-full border border-text-muted/50 px-3 py-1 font-semibold uppercase tracking-[0.3em] text-text-muted transition hover:border-primary hover:text-primary"
        >
          Remove
        </button>
      </div>
    </div>
  ) : null}
</form>

      <div className="mt-5 space-y-3">
  {availableLoading ? (
    <div className="rounded-xl border border-secondary/50 bg-secondary/40 px-4 py-3 text-xs text-text-muted">
      Loading available coupons...
    </div>
  ) : availableError ? (
    // Note: Error state colors are kept as-is for universal UX clarity.
    <div className="space-y-2 rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
      <p>{availableError}</p>
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center justify-center rounded-full border border-rose-200/60 px-3 py-1 font-semibold uppercase tracking-[0.3em] text-rose-100 transition hover:border-rose-100 hover:bg-rose-100/10"
      >
        Retry
      </button>
    </div>
  ) : isLoggedIn && availableCoupons.length ? (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
        <span>Available coupons for you</span>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-text-muted/40 px-3 py-1 font-semibold uppercase tracking-[0.3em] transition hover:border-primary/70 hover:text-primary"
        >
          Refresh
        </button>
      </div>
      <ul className="space-y-3">
        {availableCoupons.map((coupon) => {
          const isActive = coupon.isActive && !coupon.isExpired;
          const statusKey = isActive
            ? "active"
            : coupon.isExpired
            ? "expired"
            : "inactive";
          const statusClass =
            statusColors[statusKey] ?? statusColors.active;

          return (
            <li
              key={coupon.id ?? coupon.code}
              className="rounded-2xl border border-secondary/50 bg-secondary/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold tracking-[0.3em] text-text-base">
                      {coupon.code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.25em] ${statusClass}`}
                    >
                      {isActive
                        ? "Active"
                        : coupon.isExpired
                        ? "Expired"
                        : "Inactive"}
                    </span>
                  </div>
                  {coupon.description ? (
                    <p className="text-xs text-text-muted">
                      {coupon.description}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-text-muted/80">
                    <span>
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}% off`
                        : coupon.discountType === "fixed"
                        ? `${formatINR(coupon.discountValue)} off`
                        : "Free shipping"}
                    </span>
                    {coupon.minOrderAmount ? (
                      <span>
                        Min order {formatINR(coupon.minOrderAmount)}
                      </span>
                    ) : null}
                    {coupon.validity?.end ? (
                      <span>
                        Valid till{" "}
                        {new Date(
                          coupon.validity.end
                        ).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onApply?.(coupon.code)}
                  disabled={isApplying}
                  className="rounded-full border border-text-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-text-muted transition hover:border-primary/70 hover:text-primary disabled:cursor-not-allowed disabled:border-text-muted/20 disabled:text-text-muted/40"
                >
                  Apply
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  ) : (
    <div className="rounded-xl border border-secondary/50 bg-secondary/40 px-4 py-3 text-xs text-text-muted">
      {isLoggedIn
        ? "No personal coupons available right now."
        : "Sign in to see coupons curated for you."}
    </div>
  )}
</div>
    </div>
  );
};

export default CouponPanel;
