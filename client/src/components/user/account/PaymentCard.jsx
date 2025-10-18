import formatINR from "../../../utils/currency.js";

const PaymentCard = ({ payment }) => {
  if (!payment) {
    return null;
  }

  const details = [
    payment.type === "Credit Card" && payment.last4
      ? `${payment.brand} ending •••• ${payment.last4}`
      : null,
    payment.handle,
    payment.holderName,
    payment.expiry ? `Expires ${payment.expiry}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-2xl border border-secondary/50 bg-secondary/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-base">
            {payment.brand}
          </p>
          <p className="text-xs text-text-muted">{payment.type}</p>
        </div>
        {payment.isDefault ? (
          <span className="rounded-full border border-primary/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Primary
          </span>
        ) : null}
      </div>

      {payment.type === "Wallet" ? (
        <p className="mt-3 text-lg font-semibold text-primary">
          Balance: {formatINR(payment.balance)}
        </p>
      ) : null}

      {details.length ? (
        <ul className="mt-3 space-y-1 text-sm text-text-muted">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        <button
          type="button"
          className="rounded-full border border-secondary/50 px-3 py-1 transition hover:border-primary/70 hover:text-primary"
        >
          Manage
        </button>
        <button
          type="button"
          className="rounded-full border border-secondary/50 px-3 py-1 transition hover:border-primary/70 hover:text-primary"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default PaymentCard;
