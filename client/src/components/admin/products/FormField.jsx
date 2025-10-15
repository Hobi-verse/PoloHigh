const FormField = ({
  label,
  required = false,
  error,
  helpText,
  className = "",
  children,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label ? (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          {error}
        </p>
      ) : helpText ? (
        <p className="text-xs text-slate-500">{helpText}</p>
      ) : null}
    </div>
  );
};

export default FormField;
