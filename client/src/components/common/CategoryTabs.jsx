const baseButtonStyles =
  "rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const CategoryTabs = ({ items = [], value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => {
      const isActive = item.value === value;
      return (
        <button
          key={item.value ?? item.label}
          type="button"
          onClick={() => onChange?.(item.value, item)}
          className={`${baseButtonStyles} ${
            isActive
              ? "border-emerald-300 bg-emerald-400/10 text-emerald-100"
              : "border-white/10 bg-white/5 text-emerald-200/80 hover:border-emerald-300/50 hover:bg-emerald-400/10"
          }`}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

export default CategoryTabs;
