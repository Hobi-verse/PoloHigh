import { useState } from "react";
import { Link } from "react-router-dom";
import IconButton from "./IconButton.jsx";
import SearchField from "./SearchField.jsx";
import menuIcon from "../../assets/icons/menu.svg";
import closeIcon from "../../assets/icons/close.svg";

const Navbar = ({
  brand,
  brandHref = "/",
  links = [],
  actions = [],
  search,
  sticky = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const items = Array.isArray(links) ? links : [];
  const navActions = Array.isArray(actions) ? actions : [];

  const handleToggle = () => setIsOpen((open) => !open);
  const handleNavigate = () => setIsOpen(false);

  const desktopActions = navActions.filter((action) => !action?.desktopHidden);
  const mobileActions = navActions.filter((action) => !action?.mobileHidden);

  const headerClasses = [
    "border-b border-secondary/50 bg-background/95 text-text-base backdrop-blur",
    sticky ? "sticky top-0 z-40" : "relative",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClasses}>
      <nav className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center gap-6">
  {/* Brand */}
  <Link
    to={brandHref}
    className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-text-base transition-opacity hover:opacity-80"
    onClick={handleNavigate}
  >
    {brand}
  </Link>

  {/* Desktop Navigation Links */}
  <ul className="hidden lg:flex items-center gap-8 text-sm font-medium">
    {items.map((link) => {
      const path = link?.to ?? link?.href ?? "#";
      return (
        <li key={`${link.label}-${path}`}>
          <Link
            to={path}
            onClick={handleNavigate}
            className="text-text-muted transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        </li>
      );
    })}
  </ul>

  {/* Right Side Actions */}
  <div className="ml-auto flex items-center gap-4">
    {search ? (
      <SearchField
        {...search}
        aria-label={search["aria-label"] ?? "Search"}
        className="hidden lg:block lg:w-72"
      />
    ) : null}

    {desktopActions.length ? (
      <div className="hidden md:flex items-center gap-2">
        {desktopActions.map((action, index) => {
          const key = action.key ?? `${action.label ?? "action"}-${index}`;

          // Primary Button (e.g., Login/Sign Up)
          if (action.variant === "button") {
            const commonProps = {
              key: key,
              onClick: action.onClick,
              className: "inline-flex items-center justify-center rounded-full border border-primary px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-background"
            };
            if (action.to) {
              return <Link to={action.to} {...commonProps}>{action.label}</Link>;
            }
            if (action.href) {
              return <a href={action.href} {...commonProps}>{action.label}</a>;
            }
            return null;
          }

          // Icon Button
          return (
            <IconButton
              key={key}
              to={action.to}
              href={action.href}
              icon={action.icon}
              label={action.label}
              onClick={action.onClick}
            />
          );
        })}
      </div>
    ) : null}

    {/* Mobile Menu Toggle */}
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-secondary hover:text-text-base lg:hidden"
      aria-expanded={isOpen}
      aria-label="Toggle navigation menu"
    >
      {/* Example using SVGs for better styling control */}
      {isOpen ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      )}
    </button>
  </div>
</div>

        <div
          className={`${
            isOpen ? "mt-6" : "hidden"
          } flex flex-col gap-4 lg:hidden`}
        >
          {search ? (
            <SearchField
              {...search}
              aria-label={search["aria-label"] ?? "Search"}
              className="w-full"
            />
          ) : null}

          {items.length ? (
            <ul className="flex flex-col gap-3 text-sm font-medium">
  {items.map((link) => {
    const path = link?.to ?? link?.href ?? "#";
    return (
      <li key={`${link.label}-${path}`}>
        <Link
          to={path}
          onClick={handleNavigate}
          className="group flex items-center justify-between rounded-xl border border-secondary/60 bg-secondary/40 px-4 py-3 text-text-base transition-colors hover:border-primary hover:bg-secondary"
        >
          {link.label}
          <span className="text-text-muted transition-colors group-hover:text-primary" aria-hidden>
            →
          </span>
        </Link>
      </li>
    );
  })}
</ul>
          ) : null}

          {mobileActions.length ? (
            <div className="flex flex-wrap items-center gap-3">
  {mobileActions.map((action, index) => {
    const key = action.key ?? `${action.label ?? "action"}-mobile-${index}`;

    if (action.variant === "button") {
      // Redesigned primary button styles for mobile
      const buttonClasses =
        "flex-1 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-background transition hover:opacity-90";

      if (action.to) {
        return (
          <Link
            key={key}
            to={action.to}
            onClick={action.onClick}
            className={buttonClasses}
          >
            {action.label}
          </Link>
        );
      }

      if (action.href) {
        return (
          <a
            key={key}
            href={action.href}
            onClick={action.onClick}
            className={buttonClasses}
          >
            {action.label}
          </a>
        );
      }

      return null;
    }

    // IconButton will use the styles we've designed previously
    return (
      <IconButton
        key={key}
        to={action.to}
        href={action.href}
        icon={action.icon}
        label={action.label}
        onClick={action.onClick}
        className="h-12 w-12" // Larger size for mobile tap targets
      />
    );
  })}
</div>
          ) : null}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
