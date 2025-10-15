import SectionCard from "./SectionCard.jsx";
import PaymentCard from "./PaymentCard.jsx";
import formatINR from "../../../utils/currency.js";

const PaymentsSection = ({ paymentMethods, walletBalance = 0 }) => {
  const hasPayments =
    Array.isArray(paymentMethods) && paymentMethods.length > 0;

  return (
    <SectionCard
      title="Payments & wallet"
      description="Keep your payments up to date for one-tap checkout."
    >
      {hasPayments ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {paymentMethods.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-200/40 bg-white/5 p-6 text-sm text-emerald-200/70">
          Save a payment method to check out faster and earn rewards.
        </div>
      )}
      <div className="mt-4 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
          Wallet balance
        </p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {formatINR(walletBalance)}
        </p>
        <p className="text-xs text-emerald-200/80">
          Earn more credits when you pay online.
        </p>
      </div>
      <button
        type="button"
        className="mt-4 inline-flex items-center justify-center rounded-full border border-emerald-300/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-200"
      >
        Add payment method
      </button>
    </SectionCard>
  );
};

export default PaymentsSection;
