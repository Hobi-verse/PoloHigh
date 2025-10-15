import { useCallback } from "react";

const defaultButtonClasses =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/40 bg-white/5 text-lg text-emerald-100 transition hover:border-emerald-300/70 hover:bg-emerald-400/10";

const QuantitySelector = ({
  value = 1,
  min = 1,
  max = 10,
  onChange,
  variant = "default",
  className = "",
}) => {
  const clamp = useCallback(
    (next) => {
      if (typeof next !== "number" || Number.isNaN(next)) {
        return min;
      }
      return Math.min(Math.max(next, min), max);
    },
    [min, max]
  );

  const handleDecrease = () => {
    const nextValue = clamp(value - 1);
    if (nextValue !== value) {
      onChange?.(nextValue);
    }
  };

  const handleIncrease = () => {
    const nextValue = clamp(value + 1);
    if (nextValue !== value) {
      onChange?.(nextValue);
    }
  };

  if (variant === "pill") {
    return (
      <div
        className={`inline-flex items-center rounded-full border border-white/10 bg-white/5 text-emerald-100 shadow-sm [box-shadow:0_8px_20px_rgba(8,35,25,0.25)] ${className}`.trim()}
      >
        <button
          type="button"
          onClick={handleDecrease}
          className="h-10 w-10 rounded-l-full text-lg transition hover:bg-emerald-400/10"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="px-4 text-sm font-semibold">{value}</span>
        <button
          type="button"
          onClick={handleIncrease}
          className="h-10 w-10 rounded-r-full text-lg transition hover:bg-emerald-400/10"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <button
        type="button"
        onClick={handleDecrease}
        className={defaultButtonClasses}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold text-emerald-100">
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrease}
        className={defaultButtonClasses}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
