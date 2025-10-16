import { Link } from "react-router-dom";

const baseStyles =
  "inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-secondary hover:text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  
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
