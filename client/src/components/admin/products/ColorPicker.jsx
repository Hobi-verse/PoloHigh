import { useMemo, useState } from "react";

const DEFAULT_SWATCHES = [
  { label: "Black", value: "black", hex: "#000000" },
  { label: "White", value: "white", hex: "#ffffff" },
  { label: "Red", value: "red", hex: "#ef4444" },
  { label: "Blue", value: "blue", hex: "#3b82f6" },
  { label: "Green", value: "green", hex: "#10b981" },
  { label: "Yellow", value: "yellow", hex: "#f59e0b" },
  { label: "Purple", value: "purple", hex: "#8b5cf6" },
  { label: "Pink", value: "pink", hex: "#ec4899" },
  { label: "Orange", value: "orange", hex: "#f97316" },
  { label: "Gray", value: "gray", hex: "#6b7280" },
  { label: "Navy", value: "navy", hex: "#1e3a8a" },
  { label: "Brown", value: "brown", hex: "#92400e" },
];

const ColorPicker = ({ colors = [], onChange, maxColors = 10 }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#000000");

  const usedHexes = useMemo(
    () => new Set(colors.map((color) => color.hex)),
    [colors]
  );
  const canAddMore = colors.length < maxColors;

  const addColor = (color) => {
    if (!canAddMore || usedHexes.has(color.hex)) {
      return;
    }

    const next = {
      id: crypto.randomUUID(),
      name: color.label ?? color.name ?? color.hex,
      hex: color.hex,
      value: color.value ?? color.hex,
    };

    onChange?.([...colors, next]);
  };

  const addCustomColor = () => {
    const trimmed = customName.trim();
    if (!trimmed || usedHexes.has(customHex) || !canAddMore) {
      return;
    }

    onChange?.([
      ...colors,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        hex: customHex,
        value: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
    ]);

    setCustomName("");
    setCustomHex("#000000");
    setShowCustom(false);
  };

  const removeColor = (targetId) => {
    onChange?.(colors.filter((color) => color.id !== targetId));
  };

  return (
    <div className="space-y-4">
      {colors.length ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Selected colors</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <div
                key={color.id}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm"
              >
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-medium">{color.name}</span>
                <button
                  type="button"
                  onClick={() => removeColor(color.id)}
                  className="rounded-full p-1 text-slate-400 transition hover:text-red-500"
                  aria-label={`Remove ${color.name}`}
                >
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {canAddMore ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Quick add</p>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {DEFAULT_SWATCHES.map((swatch) => {
              const isSelected = usedHexes.has(swatch.hex);
              return (
                <button
                  type="button"
                  key={swatch.hex}
                  disabled={isSelected}
                  onClick={() => addColor(swatch)}
                  className={`relative h-10 w-full rounded-lg border-2 transition ${
                    isSelected
                      ? "cursor-not-allowed border-slate-200 opacity-60"
                      : "border-transparent hover:scale-105 hover:border-emerald-400"
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.label}
                >
                  {isSelected ? (
                    <span className="absolute inset-0 flex items-center justify-center text-white">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-7.778 7.778a1 1 0 01-1.414 0L3.293 11.85a1 1 0 011.414-1.414l3.102 3.1 7.071-7.07a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-600">
          Maximum of {maxColors} colors selected
        </p>
      )}

      {canAddMore ? (
        <div className="space-y-3">
          {showCustom ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-600">
                    Color name
                  </span>
                  <input
                    type="text"
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    placeholder="e.g. Forest Green"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-medium text-slate-600">
                    Hex
                  </span>
                  <input
                    type="color"
                    value={customHex}
                    onChange={(event) => setCustomHex(event.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-slate-200"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addCustomColor}
                    disabled={!customName.trim()}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add color
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustom(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
            >
              + Add custom color
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ColorPicker;
