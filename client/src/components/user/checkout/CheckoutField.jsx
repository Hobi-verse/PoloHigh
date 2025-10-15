const baseFieldClasses =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-emerald-200/40 focus:border-emerald-400/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition";

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
    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
      {label}
      {optional ? (
        <span className="ml-2 text-[0.7rem] font-medium lowercase text-emerald-200/50">
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
            className="bg-[#07150f] text-sm text-emerald-900"
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
