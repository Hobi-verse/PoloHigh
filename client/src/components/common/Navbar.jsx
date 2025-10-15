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
    "border-b border-white/10 bg-[#0b1d18]/95 text-emerald-50 backdrop-blur",
    sticky ? "sticky top-0 z-40" : "relative",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClasses}>
      <nav className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center gap-4">
          <Link
            to={brandHref}
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-emerald-50 transition hover:text-emerald-200"
            onClick={handleNavigate}
          >
            {brand}
          </Link>

          <ul className="hidden lg:flex items-center gap-6 text-sm font-medium text-emerald-100">
            {items.map((link) => {
              const path = link?.to ?? link?.href ?? "#";
              return (
                <li key={`${link.label}-${path}`}>
                  <Link
                    to={path}
                    onClick={handleNavigate}
                    className="transition hover:text-emerald-300"
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-3">
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
                  const key =
                    action.key ?? `${action.label ?? "action"}-${index}`;

                  if (action.variant === "button") {
                    if (action.to) {
                      return (
                        <Link
                          key={key}
                          to={action.to}
                          onClick={action.onClick}
                          className="inline-flex items-center justify-center rounded-full border border-emerald-300/70 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-400/10"
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
                          className="inline-flex items-center justify-center rounded-full border border-emerald-300/70 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-400/10"
                        >
                          {action.label}
                        </a>
                      );
                    }

                    return null;
                  }

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

            <button
              type="button"
              onClick={handleToggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/10 lg:hidden"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              <img
                src={isOpen ? closeIcon : menuIcon}
                alt=""
                aria-hidden="true"
                className="h-5 w-5"
              />
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
            <ul className="flex flex-col gap-3 text-sm font-medium text-emerald-100">
              {items.map((link) => {
                const path = link?.to ?? link?.href ?? "#";
                return (
                  <li key={`${link.label}-${path}`}>
                    <Link
                      to={path}
                      onClick={handleNavigate}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition hover:border-emerald-300/50 hover:bg-emerald-400/10"
                    >
                      {link.label}
                      <span aria-hidden>→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {mobileActions.length ? (
            <div className="flex flex-wrap gap-3">
              {mobileActions.map((action, index) => {
                const key =
                  action.key ?? `${action.label ?? "action"}-mobile-${index}`;

                if (action.variant === "button") {
                  const buttonClasses =
                    "flex-1 rounded-full border border-emerald-300/70 px-4 py-2 text-center text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-400/10";

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

                return (
                  <IconButton
                    key={key}
                    to={action.to}
                    href={action.href}
                    icon={action.icon}
                    label={action.label}
                    onClick={action.onClick}
                    className="h-12 w-12"
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
