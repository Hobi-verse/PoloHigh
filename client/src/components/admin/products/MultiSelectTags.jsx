import { useId, useMemo, useState } from "react";

const MultiSelectTags = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Type to add tags…",
  maxTags = 20,
  allowCustom = true,
}) => {
  const inputId = useId();
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => new Set(value), [value]);
  const remainingSlots = maxTags - value.length;

  const filtered = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return options.filter((option) => !selected.has(option));
    }

    return options.filter(
      (option) => option.toLowerCase().includes(query) && !selected.has(option)
    );
  }, [inputValue, options, selected]);

  const addTag = (tag) => {
    if (!tag || selected.has(tag) || remainingSlots <= 0) {
      return;
    }

    onChange?.([...value, tag]);
    setInputValue("");
  };

  const removeTag = (tag) => {
    onChange?.(value.filter((current) => current !== tag));
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && inputValue.trim()) {
      event.preventDefault();
      const formatted = inputValue.trim();
      if (allowCustom || options.includes(formatted)) {
        addTag(formatted);
      }
    } else if (event.key === "Backspace" && !inputValue && value.length) {
      removeTag(value[value.length - 1]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={`flex min-h-[2.75rem] flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 ${
          remainingSlots > 0 ? "border-slate-200" : "border-amber-300"
        }`}
        onClick={() => document.getElementById(inputId)?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700"
          >
            {tag}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeTag(tag);
              }}
              className="rounded-full p-1 text-emerald-600 transition hover:bg-emerald-200/70"
              aria-label={`Remove ${tag}`}
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
          </span>
        ))}

        <input
          id={inputId}
          type="text"
          value={inputValue}
          disabled={remainingSlots <= 0}
          onChange={(event) => {
            setInputValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder={value.length ? "" : placeholder}
          className="flex-1 min-w-[8rem] border-none bg-transparent text-sm outline-none"
        />
      </div>

      {open && (filtered.length || (allowCustom && inputValue.trim())) ? (
        <div className="absolute z-10 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
          {filtered.map((option) => (
            <button
              type="button"
              key={option}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => addTag(option)}
              className="flex w-full justify-between rounded-2xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-emerald-50"
            >
              <span>{option}</span>
              <span className="text-xs text-slate-500">Add</span>
            </button>
          ))}
          {!filtered.length && allowCustom ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => addTag(inputValue.trim())}
              className="w-full rounded-2xl px-3 py-2 text-left text-sm text-emerald-700 transition hover:bg-emerald-50"
            >
              Add "{inputValue.trim()}"
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>
          {allowCustom
            ? "Press Enter to add custom tags"
            : "Select from the list"}
        </span>
        <span>
          {value.length}/{maxTags}
        </span>
      </div>
    </div>
  );
};

export default MultiSelectTags;
