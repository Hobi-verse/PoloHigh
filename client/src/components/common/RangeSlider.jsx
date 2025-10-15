import { formatINR } from "../../utils/currency.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const RangeSlider = ({
  min = 0,
  max = 100,
  step = 1,
  value = [min, max],
  onChange,
  label,
}) => {
  const [minValue, maxValue] = value;

  const handleMinChange = (event) => {
    const nextValue = clamp(Number(event.target.value), min, maxValue - step);
    onChange?.([nextValue, maxValue]);
  };

  const handleMaxChange = (event) => {
    const nextValue = clamp(Number(event.target.value), minValue + step, max);
    onChange?.([minValue, nextValue]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-medium text-emerald-100">
        <span>{label ?? "Price Range"}</span>
        <span>
          {formatINR(minValue)} - {formatINR(maxValue)}
        </span>
      </div>
      <div className="relative h-6">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={handleMinChange}
          className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-emerald-400/80"
          style={{
            left: `${((minValue - min) / (max - min)) * 100}%`,
            right: `${(1 - (maxValue - min) / (max - min)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

export default RangeSlider;
