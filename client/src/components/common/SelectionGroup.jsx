const SelectionGroup = ({ items = [], value, onChange, multiple = false }) => {
  const handleSelect = (itemValue) => {
    if (multiple) {
      const nextValues = new Set(Array.isArray(value) ? value : []);
      if (nextValues.has(itemValue)) {
        nextValues.delete(itemValue);
      } else {
        nextValues.add(itemValue);
      }
      onChange?.(Array.from(nextValues));
    } else {
      onChange?.(itemValue);
    }
  };

  const isSelected = (itemValue) =>
    multiple ? value?.includes(itemValue) : value === itemValue;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = isSelected(item.value);
        return (
          <button
            key={item.value ?? item.label}
            type="button"
            onClick={() => handleSelect(item.value)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-emerald-300 focus-visible:outline-offset-2 ${
              active
                ? "border-emerald-300 bg-emerald-400/10 text-emerald-100"
                : "border-white/10 bg-white/5 text-emerald-200/80 hover:border-emerald-300/40 hover:bg-emerald-400/10"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default SelectionGroup;
