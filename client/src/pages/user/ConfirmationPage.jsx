import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserNavbar from "../../components/user/common/UserNavbar.jsx";
import Breadcrumbs from "../../components/common/Breadcrumbs.jsx";
import OrderItemCard from "../../components/common/OrderItemCard.jsx";
import OrderSummaryRow from "../../components/common/OrderSummaryRow.jsx";
import { formatINR } from "../../utils/currency.js";
import arrowRightIcon from "../../assets/icons/arrow-right.svg";
import { fetchOrderById } from "../../api/orders.js";

const StatusBadge = ({ status }) => {
  const styles = {
    complete: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    current: "bg-white/10 text-white border-white/20",
    upcoming: "bg-[#081712] text-emerald-200/60 border-white/5",
  };

  return (
    <span
      className={`inline-flex h-8 min-w-[7rem] items-center justify-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.2em] ${
        styles[status] || styles.upcoming
      }`}
    >
      {status === "complete"
        ? "Completed"
        : status === "current"
        ? "In progress"
        : "Upcoming"}
    </span>
  );
};

const TimelineStep = ({ step, index, isLast }) => (
  <article className="flex gap-4">
    <div className="relative flex flex-col items-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
          step.status === "complete"
            ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
            : step.status === "current"
            ? "border-white/30 bg-white/10 text-white"
            : "border-white/10 bg-[#0c1e18] text-emerald-200/60"
        }`}
      >
        {index + 1}
      </div>
      {isLast ? null : (
        <div
          className="mt-1 h-full w-px flex-1 bg-gradient-to-b from-white/10 to-transparent"
          aria-hidden
        />
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-white">{step.title}</h3>
      <p className="text-xs text-emerald-200/70">{step.description}</p>
      <StatusBadge status={step.status} />
    </div>
  </article>
);

const InfoBlock = ({ title, children, description }) => (
  <section className="space-y-4 rounded-3xl border border-white/5 bg-[#0b1f19] p-6 shadow-[0_16px_40px_rgba(8,35,25,0.35)]">
    <header className="space-y-1">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description ? (
        <p className="text-sm text-emerald-200/70">{description}</p>
      ) : null}
    </header>
    <div className="space-y-4 text-sm text-emerald-100">{children}</div>
  </section>
);

const formatPlacedOn = (placedOn) => {
  if (!placedOn) {
    return null;
  }

  const parsed = new Date(placedOn);
  if (Number.isNaN(parsed.getTime())) {
    return placedOn;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

const ConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const runtimeData = location.state ?? {};
  const [confirmationData, setConfirmationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConfirmation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchOrderById(runtimeData.order?.id ?? "latest");
      setConfirmationData(response);
    } catch (apiError) {
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [runtimeData.order?.id]);

  useEffect(() => {
    loadConfirmation();
  }, [loadConfirmation]);

  const order = useMemo(() => {
    const fallbackOrder = confirmationData?.order ?? {};
    const runtimeOrder = runtimeData.order ?? {};
    return {
      ...fallbackOrder,
      ...runtimeOrder,
      totals: {
        ...fallbackOrder.totals,
        ...(runtimeOrder.totals ?? {}),
      },
      items: runtimeOrder.items ?? fallbackOrder.items,
    };
  }, [confirmationData?.order, runtimeData.order]);

  const customer = useMemo(() => {
    const fallbackCustomer = confirmationData?.customer ?? {};
    const runtimeCustomer = runtimeData.customer ?? {};
    return { ...fallbackCustomer, ...runtimeCustomer };
  }, [confirmationData?.customer, runtimeData.customer]);

  const shipping = useMemo(() => {
    const fallbackShipping = confirmationData?.shipping ?? {};
    const runtimeShipping = runtimeData.shipping ?? {};
    return {
      ...fallbackShipping,
      addressLines:
        runtimeShipping.addressLines ?? fallbackShipping.addressLines,
      instructions:
        runtimeShipping.instructions ?? fallbackShipping.instructions,
    };
  }, [confirmationData?.shipping, runtimeData.shipping]);

  const support = confirmationData?.support ?? {};
  const nextSteps = confirmationData?.nextSteps ?? [];

  const orderItems = order.items ?? [];
  const totals = order.totals ?? {};
  const subtotal = totals.subtotal ?? 0;
  const shippingCost = totals.shipping ?? 0;
  const shippingLabel =
    shippingCost === 0
      ? totals.shippingLabel ?? "Free"
      : formatINR(shippingCost);
  const tax = totals.tax ?? 0;
  const total = subtotal + shippingCost + tax;

  const placedOnLabel = useMemo(() => {
    const fallbackPlacedOn = confirmationData?.order?.placedOn;
    const value = order.placedOn ?? fallbackPlacedOn;
    return value ? formatPlacedOn(value) : null;
  }, [confirmationData?.order?.placedOn, order.placedOn]);

  const handleContinueShopping = () => {
    navigate("/");
  };

  const handleEmailSupport = () => {
    window.open(
      `mailto:${support.email}?subject=Order%20${order.id}`,
      "_blank"
    );
  };

  const greetingName = customer?.name?.split(" ")?.[0] ?? "there";

  return (
    <div className="min-h-screen bg-[#07150f] text-emerald-50">
      <UserNavbar />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Checkout", to: "/checkout" },
            { label: "Order confirmed" },
          ]}
        />

        {loading ? (
          <section className="rounded-3xl border border-white/5 bg-[#0b1f19] p-8 text-sm text-emerald-200/70">
            Finalising your order details...
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-rose-300/40 bg-rose-500/10 p-8 text-sm text-rose-100">
            We couldn&apos;t load your order confirmation. Please refresh the
            page.
          </section>
        ) : (
          <section className="space-y-6 rounded-3xl border border-white/5 bg-[#0b1f19] p-8 shadow-[0_26px_60px_rgba(8,35,25,0.45)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-300 shadow-inner">
                  ✓
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/70">
                    Order confirmed
                  </p>
                  <h1 className="text-3xl font-semibold text-white md:text-4xl">
                    Thank you, {greetingName}! Your order is on its way.
                  </h1>
                  <p className="text-sm text-emerald-200/75">
                    We'll email updates to {customer.email}. Delivery window{" "}
                    {order.deliveryWindow ??
                      confirmationData?.order?.deliveryWindow}
                    .
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                  Order ID
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {order.id}
                </p>
                {placedOnLabel ? (
                  <p className="mt-1 text-xs text-emerald-200/70">
                    Placed on {placedOnLabel}
                  </p>
                ) : null}
                {order.transactionId ? (
                  <p className="mt-3 text-xs text-emerald-200/70">
                    Transaction ID:{" "}
                    <span className="text-emerald-100">
                      {order.transactionId}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-6">
            <InfoBlock
              title="What's next"
              description="Track your package as it moves through each stage."
            >
              <div className="space-y-5">
                {nextSteps.map((step, index) => (
                  <TimelineStep
                    key={step.title}
                    step={step}
                    index={index}
                    isLast={index === nextSteps.length - 1}
                  />
                ))}
              </div>
            </InfoBlock>

            <InfoBlock
              title="Delivery details"
              description={`Estimated delivery ${
                order.deliveryWindow ??
                confirmationData?.order?.deliveryWindow ??
                "TBD"
              }`}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/60">
                    Shipping address
                  </p>
                  <div className="space-y-1 text-sm text-emerald-100">
                    <p className="font-semibold text-white">{customer.name}</p>
                    {shipping.addressLines?.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                    <p className="text-emerald-200/70">{customer.phone}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/60">
                    Payment method
                  </p>
                  <p className="text-sm text-emerald-100">
                    {order.paymentMethod ??
                      confirmationData?.order?.paymentMethod ??
                      "Pending"}
                  </p>
                  {order.placedOn ? (
                    <div className="rounded-2xl border border-white/5 bg-[#0d221c] p-4 text-xs text-emerald-200/70">
                      The receipt has been sent to{" "}
                      <span className="text-emerald-100">{customer.email}</span>
                      .
                    </div>
                  ) : null}
                </div>
              </div>

              {shipping.instructions ? (
                <div className="rounded-2xl border border-dashed border-emerald-400/30 bg-[#0d221c] p-4 text-xs text-emerald-200/70">
                  Delivery note: {shipping.instructions}
                </div>
              ) : null}
            </InfoBlock>

            <InfoBlock
              title="Need help?"
              description="We're here Monday to Saturday, 10am - 6pm IST."
            >
              <div className="space-y-3 text-sm text-emerald-100">
                <p>
                  Email us at{" "}
                  <span className="text-white">{support.email}</span> or call{" "}
                  {support.phone} if there's anything you need.
                </p>
                <button
                  type="button"
                  onClick={handleEmailSupport}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80 transition hover:border-emerald-300/60 hover:text-emerald-100"
                >
                  Contact support
                  <img
                    src={arrowRightIcon}
                    alt=""
                    className="h-3 w-3"
                    aria-hidden
                  />
                </button>
              </div>
            </InfoBlock>
          </div>

          <aside className="space-y-6 rounded-3xl border border-white/5 bg-[#0b1f19] p-6 shadow-[0_20px_50px_rgba(8,35,25,0.4)]">
            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/70">
                Order details
              </p>
              <h2 className="text-lg font-semibold text-white">
                Items in this order
              </h2>
            </header>

            <div className="space-y-4">
              {orderItems.map((item) => (
                <OrderItemCard key={item.id} item={item} />
              ))}
            </div>

            <div className="space-y-3 border-t border-white/5 pt-4 text-sm">
              <OrderSummaryRow label="Subtotal" value={formatINR(subtotal)} />
              <OrderSummaryRow label="Shipping" value={shippingLabel} />
              <OrderSummaryRow label="Tax" value={formatINR(tax)} />
            </div>
            <OrderSummaryRow label="Total" value={formatINR(total)} emphasis />

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleContinueShopping}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                Continue shopping
                <img
                  src={arrowRightIcon}
                  alt=""
                  aria-hidden
                  className="h-4 w-4"
                />
              </button>
              <button
                type="button"
                onClick={handleEmailSupport}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-white/20 hover:bg-white/5"
              >
                Need help with this order?
              </button>
            </div>

            {order.transactionId ? (
              <p className="text-center text-[0.7rem] text-emerald-200/60">
                Payment reference{" "}
                <span className="text-emerald-100">{order.transactionId}</span>
              </p>
            ) : null}
          </aside>
        </section>
      </main>
    </div>
  );
};

export default ConfirmationPage;
