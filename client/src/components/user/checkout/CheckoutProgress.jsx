const statusStyles = {
  complete:
    "border-primary/60 bg-primary text-secondary shadow-lg shadow-primary/30",
  current:
    "border-primary bg-secondary/40 text-text-base shadow-2xl shadow-primary/25",
  upcoming: "border-secondary/50 bg-secondary/40 text-text-muted",
};

const CheckoutProgress = ({ steps }) => {
  return (
    <nav
      aria-label="Checkout progress"
      className="rounded-3xl border border-secondary/50 bg-secondary/40 p-4 shadow-2xl shadow-secondary/20"
    >
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => {
          const variant = statusStyles[step.status] ?? statusStyles.upcoming;
          const isComplete = step.status === "complete";
          const isCurrent = step.status === "current";

          const labelClass = isCurrent || isComplete ? "text-text-base" : "text-text-muted";

          return (
            <li
              key={step.label}
              className={`flex items-center gap-4 rounded-2xl border px-4 py-3 transition ${variant}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-secondary/50 bg-secondary/40 text-base font-semibold">
                {isComplete ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-text-muted">
                  Step {index + 1}
                </p>
                <p className={`text-sm font-semibold ${labelClass}`}>
                  {step.label}
                </p>
                {isCurrent ? (
                  <p className="text-xs text-text-base/80">
                    Currently selected
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default CheckoutProgress;
