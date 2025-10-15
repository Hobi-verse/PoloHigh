const ColorSwatchGroup = ({ colors = [], value, onChange }) => (
  <div className="flex flex-wrap gap-3">
    {colors.map((color) => {
      const isActive = color.value === value;
      return (
        <button
          key={color.value ?? color.hex}
          type="button"
          onClick={() => onChange?.(color.value, color)}
          aria-label={color.label ?? color.value}
          title={color.label ?? color.value}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition focus-visible:outline focus-visible:outline-emerald-300 focus-visible:outline-offset-2 ${
            isActive ? "border-emerald-300" : "border-transparent"
          }`}
        >
          <span
            className={`h-6 w-6 rounded-full border border-white/30 ${
              color.value === "all"
                ? "bg-gradient-to-r from-emerald-200 to-emerald-500"
                : ""
            }`}
            style={
              color.value === "all"
                ? undefined
                : { backgroundColor: color.hex ?? color.value }
            }
          />
        </button>
      );
    })}
  </div>
);

export default ColorSwatchGroup;
