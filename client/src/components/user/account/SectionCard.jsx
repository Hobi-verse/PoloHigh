const SectionCard = ({
  title,
  description,
  action,
  children,
  className = "",
}) => (
  <section
    className={`rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-emerald-900/10 backdrop-blur ${className}`.trim()}
  >
    {(title || description || action) && (
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          {title ? (
            <h2 className="text-lg font-semibold text-white md:text-xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm text-emerald-200/75">{description}</p>
          ) : null}
        </div>
        {action ? (
          <div className="text-sm text-emerald-200/80">{action}</div>
        ) : null}
      </header>
    )}

    {children ? <div className="mt-4 space-y-4">{children}</div> : null}
  </section>
);

export default SectionCard;
