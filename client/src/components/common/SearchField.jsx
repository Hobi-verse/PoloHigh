import { useMemo, useState } from "react";

const baseInputStyles =
  "w-full appearance-none rounded-full border border-secondary/60 bg-secondary/40 px-4 py-2.5 text-sm text-text-base placeholder:text-text-muted transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50";

const SearchField = ({
  placeholder = "Search...",
  value,
  defaultValue = "",
  onChange,
  onSubmit,
  icon,
  className = "",
  "aria-label": ariaLabel,
}) => {
  const isControlled = useMemo(() => value !== undefined, [value]);
  const [internalValue, setInternalValue] = useState(defaultValue);

  const currentValue = isControlled ? value : internalValue;

  const handleChange = (event) => {
    const nextValue = event.target.value;
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue, event);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(currentValue, event);
  };

  const renderIcon = () => {
    if (typeof icon === "function") {
      return icon({ className: "h-4 w-4" });
    }
    return icon;
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`.trim()}>
  {icon ? (
    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
      {renderIcon()}
    </span>
  ) : null}
  <input
    type="search"
    value={currentValue}
    onChange={handleChange}
    placeholder={placeholder}
    aria-label={ariaLabel ?? placeholder}
    className={`${baseInputStyles} ${icon ? "pl-10" : "pl-4"}`.trim()}
  />
</form>
  );
};

export default SearchField;
