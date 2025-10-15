const statusStyles = {
  complete:
    "border-emerald-400/60 bg-emerald-500 text-emerald-950 shadow-[0_10px_30px_rgba(16,185,129,0.25)]",
  current:
    "border-emerald-400/60 bg-white/10 text-white shadow-[0_12px_32px_rgba(8,35,25,0.35)]",
  upcoming: "border-white/10 bg-white/5 text-emerald-200/70",
};

const CheckoutProgress = ({ steps }) => {
  return (
    <nav
      aria-label="Checkout progress"
      className="rounded-3xl border border-white/5 bg-white/[0.04] p-4 shadow-[0_24px_50px_rgba(8,35,25,0.35)]"
    >
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => {
          const variant = statusStyles[step.status] ?? statusStyles.upcoming;
          const isComplete = step.status === "complete";
          const isCurrent = step.status === "current";

          const labelClass =
            isCurrent || isComplete ? "text-white" : "text-emerald-100/80";

          return (
            <li
              key={step.label}
              className={`flex items-center gap-4 rounded-2xl border px-4 py-3 transition ${variant}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/10 text-base font-semibold">
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
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-200/70">
                  Step {index + 1}
                </p>
                <p className={`text-sm font-semibold ${labelClass}`}>
                  {step.label}
                </p>
                {isCurrent ? (
                  <p className="text-xs text-emerald-100/80">
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
