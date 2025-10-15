const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 rounded-2xl bg-[#0d221c] p-4 text-sm text-emerald-100">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/60">
      {label}
    </span>
    <span className="text-emerald-100/90">{value}</span>
  </div>
);

const ProductInformation = ({ details = {}, specifications = [] }) => (
  <section className="space-y-6 rounded-3xl border border-white/5 bg-white/5 p-6">
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-white">Product details</h2>
      <p className="text-sm leading-relaxed text-emerald-200/80">
        {details.description}
      </p>
    </div>

    {details.features?.length ? (
      <ul className="grid gap-3 text-sm text-emerald-100/80">
        {details.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span aria-hidden className="mt-1 text-emerald-300">
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
