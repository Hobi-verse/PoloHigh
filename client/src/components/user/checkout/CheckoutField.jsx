const baseFieldClasses = "w-full rounded-2xl border border-secondary/50 bg-secondary px-4 py-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition";

const CheckoutField = ({
  label,
  optional = false,
  type = "text",
  placeholder,
  autoComplete,
  options,
  ...rest
}) => (
  <label className="flex flex-col gap-2">
  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
    {label}
    {optional ? (
      <span className="ml-2 text-[0.7rem] font-medium lowercase text-text-muted/70">
        optional
      </span>
    ) : null}
  </span>

  {Array.isArray(options) && options.length ? (
    <select className={baseFieldClasses} {...rest}>
      {options.map((option) => (
        <option
          key={option.value ?? option}
          value={option.value ?? option}
          disabled={option.disabled ?? false}
          hidden={option.hidden ?? false}
          className="bg-background text-text-base"
        >
          {option.label ?? option}
        </option>
      ))}
    </select>
  ) : (
    <input
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={baseFieldClasses}
      {...rest}
    />
  )}
</label>
);

export default CheckoutField;
