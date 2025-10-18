const SectionCard = ({
  title,
  description,
  action,
  children,
  className = "",
}) => (
  <section
    className={`rounded-3xl border border-secondary/50 bg-secondary/40 p-6 shadow-2xl shadow-secondary/20 backdrop-blur ${className}`.trim()}
  >
    {(title || description || action) && (
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          {title ? (
            <h2 className="text-lg font-semibold text-text-base md:text-xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm text-text-muted">{description}</p>
          ) : null}
        </div>
        {action ? (
          <div className="text-sm text-text-muted">{action}</div>
        ) : null}
      </header>
    )}

    {children ? <div className="mt-4 space-y-4">{children}</div> : null}
  </section>
);

export default SectionCard;
