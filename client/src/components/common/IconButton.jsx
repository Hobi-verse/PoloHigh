import { Link } from "react-router-dom";

const baseStyles =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300";

const IconButton = ({ icon, label, to, href, onClick, className = "" }) => {
  const renderIcon = () => {
    if (typeof icon === "function") {
      return icon({ className: "h-5 w-5" });
    }
    return icon;
  };

  const content = (
    <span
      className="flex h-full w-full items-center justify-center"
      aria-hidden
    >
      {renderIcon()}
    </span>
  );

  const commonProps = {
    className: `${baseStyles} ${className}`.trim(),
    "aria-label": label,
  };

  if (to) {
    return (
      <Link to={to} {...commonProps} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} {...commonProps} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" {...commonProps} onClick={onClick}>
      {content}
    </button>
  );
};

export default IconButton;
