const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 rounded-2xl bg-background p-4 text-sm text-text-base">
  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
    {label}
  </span>
  <span className="text-text-base/90">{value}</span>
</div>
);

const ProductInformation = ({ details = {}, specifications = [] }) => (
  <section className="space-y-6 rounded-3xl border border-secondary/20 bg-secondary p-6">
  <div className="space-y-2">
    <h2 className="text-lg font-semibold text-text-base">Product details</h2>
    <p className="text-sm leading-relaxed text-text-base/80">
      {details.description}
    </p>
  </div>

  {details.features?.length ? (
    <ul className="grid gap-3 text-sm text-text-base/80">
      {details.features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <span aria-hidden className="mt-1 text-primary">
            •
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  ) : null}

  {specifications.length ? (
    <div className="grid gap-3 sm:grid-cols-2">
      {specifications.map((spec) => (
        <InfoRow key={spec.label} label={spec.label} value={spec.value} />
      ))}
    </div>
  ) : null}
</section>
);

export default ProductInformation;
