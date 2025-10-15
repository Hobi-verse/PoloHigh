const FormSection = ({
  title,
  subtitle,
  isOpen = true,
  onToggle,
  children,
}) => {
  const toggleable = typeof onToggle === "function";

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white/80 shadow-sm transition hover:shadow-md">
      <header
        className={`flex items-start justify-between gap-4 border-b border-emerald-100/60 px-5 py-4 ${
          toggleable ? "cursor-pointer hover:bg-emerald-50/50" : ""
        }`}
        onClick={toggleable ? onToggle : undefined}
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          ) : null}
        </div>
        {toggleable ? (
          <span
            className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 text-emerald-600 transition ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        ) : null}
      </header>
      {isOpen ? <div className="px-5 py-5">{children}</div> : null}
    </section>
  );
};

export default FormSection;
