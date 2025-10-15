const CheckoutSection = ({ title, description, children, action }) => {
  return (
    <section className="rounded-3xl border border-white/5 bg-white/[0.045] p-6 shadow-[0_24px_60px_rgba(6,28,21,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-emerald-200/70">{description}</p>
          ) : null}
        </div>
        {action ? (
          <div className="text-sm text-emerald-200/60">{action}</div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4">{children}</div>
    </section>
  );
};

export default CheckoutSection;
