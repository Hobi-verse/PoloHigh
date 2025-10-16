import { useCallback } from "react";

const defaultButtonClasses =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-secondary text-lg text-text-base transition hover:border-primary/70 hover:bg-primary/10";
  
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
  className={`inline-flex items-center rounded-full border border-secondary/20 bg-secondary text-text-base shadow-lg shadow-secondary/20 ${className}`.trim()}
>
  <button
    type="button"
    onClick={handleDecrease}
    className="h-10 w-10 rounded-l-full text-lg transition hover:bg-primary/10"
    aria-label="Decrease quantity"
  >
    −
  </button>
  <span className="px-4 text-sm font-semibold">{value}</span>
  <button
    type="button"
    onClick={handleIncrease}
    className="h-10 w-10 rounded-r-full text-lg transition hover:bg-primary/10"
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
  <span className="min-w-[2rem] text-center text-sm font-semibold text-text-base">
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
