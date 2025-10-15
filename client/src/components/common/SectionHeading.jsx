const SectionHeading = ({ title, eyebrow }) => (
  <div className="mb-6 space-y-2">
    {eyebrow ? (
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/70">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="text-2xl font-semibold text-emerald-50 md:text-3xl">
      {title}
    </h2>
  </div>
);

export default SectionHeading;
