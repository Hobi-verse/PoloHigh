const CheckoutSection = ({ title, description, children, action }) => {
  return (
    <section className="rounded-3xl border border-secondary/50 bg-secondary/40 p-6 shadow-2xl shadow-secondary/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-base">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          ) : null}
        </div>
        {action ? (
          <div className="text-sm text-text-muted">{action}</div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4">{children}</div>
    </section>
  );
};

export default CheckoutSection;
