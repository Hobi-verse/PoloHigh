import { Link } from "react-router-dom";

const Breadcrumbs = ({ items = [], homeLabel = "Home" }) => {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="text-xs sm:text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-emerald-200/70">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const label = item.label ?? item.name ?? homeLabel;
          const path = item.to ?? item.href;

          if (isLast || !path) {
            return (
              <li key={label} className="text-emerald-100" aria-current="page">
                {label}
              </li>
            );
          }

          return (
            <li key={label} className="flex items-center gap-1">
              <Link to={path} className="transition hover:text-emerald-100">
                {label}
              </Link>
              <span aria-hidden className="opacity-70">
                /
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
