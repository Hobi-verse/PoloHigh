import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchCategoryTree } from "../../../api/categories.js";
import { logoutUser } from "../../../api/auth";
import { clearAuthSession } from "../../../utils/authStorage";
import searchIcon from "../../../assets/icons/search.svg";
import heartIcon from "../../../assets/icons/heart.svg";
import bagIcon from "../../../assets/icons/bag.svg";
import userIcon from "../../../assets/icons/user.svg";
import loginIcon from "../../../assets/icons/log-in.svg";
import logoutIcon from "../../../assets/icons/log-out.svg";
import menuIcon from "../../../assets/icons/menu.svg";
import closeIcon from "../../../assets/icons/close.svg";

const createIconRenderer =
  (src) =>
  ({ className = "" } = {}) =>
    <img src={src} alt="" className={className} aria-hidden="true" />;

const CategoryDropdown = ({ gender, categories, isVisible, onClose }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  // Organize categories for display based on gender
  const organizeCategories = (categories, gender) => {
    if (!categories || categories.length === 0) {
      return [];
    }

    // For women, we expect "Women Ethnic" and "Women Western" as separate main categories
    if (gender === "Women") {
      return categories.map((mainCategory) => ({
        title: mainCategory.name,
        mainCategory: mainCategory,
        subcategories: mainCategory.children || [],
      }));
    }

    // For Men and Kids, show all their categories
    return categories.map((mainCategory) => ({
      title: mainCategory.name,
      mainCategory: mainCategory,
      subcategories: mainCategory.children || [],
    }));
  };

  const categoryGroups = organizeCategories(categories, gender);

  // Special handling for Women's comprehensive dropdown
  const renderWomenDropdown = () => {
    const ethnicCategory = categoryGroups.find(
      (cat) => cat.title === "Women Ethnic"
    );
    const westernCategory = categoryGroups.find(
      (cat) => cat.title === "Women Western"
    );

    if (!ethnicCategory && !westernCategory) {
      return renderStandardDropdown();
    }

    return (
      <div className="grid grid-cols-12 gap-x-8 gap-y-6">
  {/* Women Ethnic Section */}
  {ethnicCategory && (
    <div className="col-span-8">
      {/* Main Title */}
      <h3 className="mb-4 border-b border-text-muted/30 pb-2 text-sm font-bold uppercase tracking-wider text-text-base">
        {ethnicCategory.title}
      </h3>
      <div className="grid grid-cols-6 gap-x-6 gap-y-4">
        {/* Column 1: Sarees */}
        <div className="space-y-1.5">
          <h4 className="mb-2 text-sm font-semibold text-text-base">
            Sarees
          </h4>
          {ethnicCategory.subcategories
            .filter((sub) => sub.name.toLowerCase().includes("saree"))
            .slice(0, 8)
            .map((subcategory) => (
              <Link
                key={subcategory.slug}
                to={`/category/${subcategory.slug}`}
                className="block text-sm text-text-muted transition-colors hover:text-primary hover:underline"
                onClick={onClose}
              >
                {subcategory.name}
              </Link>
            ))}
        </div>

        {/* Column 2: Kurtis */}
        <div className="space-y-1.5">
          <h4 className="mb-2 text-sm font-semibold text-text-base">
            Kurtis
          </h4>
          {ethnicCategory.subcategories
            .filter((sub) => sub.name.toLowerCase().includes("kurti"))
            .slice(0, 5)
            .map((subcategory) => (
              <Link
                key={subcategory.slug}
                to={`/category/${subcategory.slug}`}
                className="block text-sm text-text-muted transition-colors hover:text-primary hover:underline"
                onClick={onClose}
              >
                {subcategory.name}
              </Link>
            ))}
        </div>
        
        {/* Other columns would follow the same pattern... */}

      </div>
    </div>
  )}

  {/* Women Western Section */}
  {westernCategory && (
    <div className="col-span-4">
      {/* Main Title */}
      <h3 className="mb-4 border-b border-text-muted/30 pb-2 text-sm font-bold uppercase tracking-wider text-text-base">
        {westernCategory.title}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {/* Column 1 */}
        <div className="space-y-1.5">
          {westernCategory.subcategories
            .slice(0, 6)
            .map((subcategory) => (
              <Link
                key={subcategory.slug}
                to={`/category/${subcategory.slug}`}
                className="block text-sm text-text-muted transition-colors hover:text-primary hover:underline"
                onClick={onClose}
              >
                {subcategory.name}
              </Link>
            ))}
        </div>
        {/* Column 2 */}
        <div className="space-y-1.5">
          {westernCategory.subcategories.slice(6).map((subcategory) => (
            <Link
              key={subcategory.slug}
              to={`/category/${subcategory.slug}`}
              className="block text-sm text-text-muted transition-colors hover:text-primary hover:underline"
              onClick={onClose}
            >
              {subcategory.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
    );
  };

  const renderStandardDropdown = () => {
    return (
      <div
  className={`grid gap-x-8 gap-y-6 ${
    gender === "Men"
      ? "grid-cols-4"
      : gender === "Kids"
      ? "grid-cols-3"
      : "grid-cols-4"
  }`}
>
  {categoryGroups.map((group, groupIndex) => (
    <div key={group.mainCategory?.slug || groupIndex} className="space-y-2">
      {/* Group Title */}
      <h3 className="mb-3 border-b border-text-muted/30 pb-2 text-sm font-bold uppercase tracking-wider text-text-base">
        {group.title}
      </h3>

      <div className="space-y-1.5">
        {/* "All" Link - Higher prominence */}
        <Link
          to={`/category/${group.mainCategory?.slug}?gender=${gender}`}
          className="block text-sm font-medium text-text-base transition-colors hover:text-primary hover:underline"
          onClick={onClose}
        >
          All {group.mainCategory?.name}
        </Link>

        {/* Subcategory Links - Muted for hierarchy */}
        {group.subcategories && group.subcategories.length > 0 && (
          <div className="ml-2 space-y-1.5 border-l border-text-muted/20 pl-3">
            {group.subcategories.slice(0, 10).map((subcategory) => (
              <Link
                key={subcategory.slug || subcategory.id}
                to={`/category/${subcategory.slug}?gender=${gender}`}
                className="block text-sm text-text-muted transition-colors hover:text-primary hover:underline"
                onClick={onClose}
              >
                {subcategory.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  ))}
</div>
    );
  };

  return (
    <div
  ref={dropdownRef}
  className="absolute left-0 top-full z-50 mt-2 rounded-2xl border border-secondary/40 bg-background shadow-2xl shadow-black/50 backdrop-blur-lg"
  style={{
    width: "90%",
    minWidth: "1000px",
    maxWidth: "1400px",
    marginLeft: 0,
  }}
>
  <div className="px-8 py-6">
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-lg font-bold text-text-base">
        {gender === "Women"
          ? "Women's Fashion"
          : gender === "Men"
          ? "Men's Collection"
          : "Kids Collection"}
      </h2>
      <button
        onClick={onClose}
        className="text-text-muted transition-colors hover:text-text-base"
      >
        &#x2715; {/* A slightly softer 'X' character */}
      </button>
    </div>

    {/* Category Content will be rendered here */}
    {gender === "Women" ? renderWomenDropdown() : renderStandardDropdown()}

    {/* Footer with action buttons */}
    <div className="mt-6 flex gap-4 border-t border-text-muted/30 pt-6">
      <Link
        to={`/${gender.toLowerCase()}`}
        className="inline-block rounded-lg border border-text-muted px-6 py-2 text-center text-sm font-medium text-text-base transition-colors hover:border-primary hover:text-primary"
        onClick={onClose}
      >
        Shop All {gender}'s Items
      </Link>
      <Link
        to="/offers"
        className="inline-block rounded-lg border border-text-muted px-6 py-2 text-center text-sm font-medium text-text-base transition-colors hover:border-primary hover:text-primary"
        onClick={onClose}
      >
        Special Offers
      </Link>
    </div>
  </div>
</div>
  );
};

const GenderCategoryNavbar = ({
  searchTerm = "",
  onSearchChange,
  onSearchSubmit,
  isLoggedIn = false,
  onLogout,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [genderCategories, setGenderCategories] = useState({
    Women: [],
    Men: [],
    Kids: [],
  });
  const hoverTimeoutRef = useRef(null);

  const genderLinks = [
    { label: "Women", value: "Women", to: "/women" },
    { label: "Men", value: "Men", to: "/men" },
    { label: "Kids", value: "Kids", to: "/kids" },
  ];

  useEffect(() => {
    const loadCategoriesForAllGenders = async () => {
      try {
        console.log("Loading categories for all genders...");

        // Load categories for each gender
        const genderPromises = genderLinks.map(async (genderLink) => {
          try {
            const response = await fetchCategoryTree({
              gender: genderLink.value,
            });
            console.log(`${genderLink.value} categories response:`, response);
            return {
              gender: genderLink.value,
              categories: response.success ? response.categories : [],
            };
          } catch (apiError) {
            console.error(
              `Failed to load ${genderLink.value} categories:`,
              apiError
            );
            return {
              gender: genderLink.value,
              categories: [],
            };
          }
        });

        const results = await Promise.all(genderPromises);

        const newGenderCategories = {};
        results.forEach(({ gender, categories }) => {
          newGenderCategories[gender] = categories;
        });

        console.log("All gender categories loaded:", newGenderCategories);
        setGenderCategories(newGenderCategories);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategoriesForAllGenders();
  }, []);

  const handleMouseEnter = (gender) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveDropdown(gender);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 300);
  };

  const handleDropdownMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleDropdownMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 300);
  };

  const handleDropdownClose = () => {
    setActiveDropdown(null);
  };

  const performLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      try {
        await logoutUser();
      } catch (apiError) {
        console.error("Logout request failed", apiError);
      } finally {
        clearAuthSession();

        if (typeof window !== "undefined" && window.localStorage) {
          try {
            window.localStorage.removeItem("User1");
          } catch (storageError) {
            console.warn("Unable to clear legacy auth key", storageError);
          }
        }
      }

      if (typeof onLogout === "function") {
        try {
          const result = await onLogout();
          if (result === false) return;
        } catch (handlerError) {
          console.error("Logout handler threw an error", handlerError);
        }
      }

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const commonActions = [
    {
      label: "Wishlist",
      to: "/wishlist",
      icon: createIconRenderer(heartIcon),
    },
    {
      label: "Cart",
      to: "/cart",
      icon: createIconRenderer(bagIcon),
    },
  ];

  const authActions = isLoggedIn
    ? [
        {
          label: "Account",
          to: "/account",
          icon: createIconRenderer(userIcon),
        },
        {
          label: "Log out",
          icon: createIconRenderer(logoutIcon),
          onClick: performLogout,
        },
      ]
    : [
        {
          label: "Log in",
          to: "/login",
          icon: createIconRenderer(loginIcon),
        },
      ];

  const actions = [...commonActions, ...authActions];

  return (
    <header className="border-b border-white/10 bg-background text-text-muted backdrop-blur sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 py-4 relative">
        <div className="flex items-center gap-4">
          {/* Brand */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-emerald-50 transition hover:text-emerald-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <img
              src="/polohighlogo.jpg"
              alt="Polohigh"
              className="h-6 rounded-full w-auto md:h-10"
            />
            <span className="text-base font-semibold tracking-tight text-primary/90 md:text-lg">
              POLOHIGH
            </span>
          </Link>

          {/* Desktop Navigation with Hover Dropdowns */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-emerald-100">
            {genderLinks.map((link) => (
              <div
                key={link.value}
                onMouseEnter={() => handleMouseEnter(link.value)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={link.to}
                  className="transition hover:text-yellow-200 hover:underline py-2 px-2"
                >
                  {link.label}
                </Link>
              </div>
            ))}

            <Link
              to="/accessories"
              className="transition hover:text-yellow-200 hover:underline py-2 px-2"
            >
              Accessories
            </Link>

            <Link
              to="/home-living"
              className="transition hover:text-yellow-200 hover:underline py-2 px-2"
            >
              Home & Living
            </Link>
          </div>

          {/* Full-width Dropdown positioned relative to navbar */}
          <div
            className="absolute top-full left-0 w-full"
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          >
            {genderLinks.map((link) => (
              <CategoryDropdown
                key={`dropdown-${link.value}`}
                gender={link.value}
                categories={genderCategories[link.value] || []}
                isVisible={activeDropdown === link.value}
                onClose={handleDropdownClose}
              />
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="ml-auto flex items-center gap-3">
            {/* Search Field */}
            <div className="hidden lg:block lg:w-72">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSearchSubmit?.(searchTerm);
                    }
                  }}
                  className="w-full rounded-full border border-secondary/60 bg-secondary/40 px-4 py-2 pl-10 text-sm text-text-base placeholder:text-text-muted backdrop-blur transition focus:border-primary focus:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <img
                  src={searchIcon}
                  alt=""
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
  {actions.map((action, index) => {
    const key = action.key ?? `${action.label ?? "action"}-${index}`;

    // Primary Action Button (e.g., Login)
    if (action.variant === "button" && action.to) {
      return (
        <Link
          key={key}
          to={action.to}
          onClick={action.onClick}
          className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-background"
        >
          {action.label}
        </Link>
      );
    }

    // Icon Link (e.g., Wishlist, Cart)
    if (action.to) {
      return (
        <Link
          key={key}
          to={action.to}
          onClick={action.onClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-secondary hover:text-text-base"
          title={action.label}
        >
          <action.icon className="h-5 w-5" />
        </Link>
      );
    }

    // Icon Button (e.g., Logout)
    return (
      <button
        key={key}
        type="button"
        onClick={action.onClick}
        disabled={isLoggingOut}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-secondary hover:text-text-base disabled:cursor-not-allowed disabled:opacity-60"
        title={isLoggingOut ? "Logging out..." : action.label}
      >
        <action.icon className="h-5 w-5" />
      </button>
    );
  })}
</div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/10 lg:hidden"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <img
                src={isMobileMenuOpen ? closeIcon : menuIcon}
                alt=""
                aria-hidden="true"
                className="h-5 w-5"
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`${
            isMobileMenuOpen ? "mt-6" : "hidden"
          } flex flex-col gap-4 lg:hidden`}
        >
          {/* Mobile Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearchSubmit?.(searchTerm);
                }
              }}
              className="w-full rounded-xl border border-secondary/60 bg-secondary/40 px-4 py-3 pl-10 text-sm text-text-base placeholder:text-text-muted backdrop-blur transition focus:border-primary focus:bg-secondary/60 focus:outline-none"
            />
            <img
              src={searchIcon}
              alt=""
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/60"
              aria-hidden="true"
            />
          </div>

          {/* Mobile Navigation Links */}
          <ul className="flex flex-col gap-3 text-sm font-medium text-emerald-100">
            {genderLinks.map((link) => (
              <li key={link.value}>
                <Link
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition hover:border-emerald-300/50 hover:bg-emerald-400/10"
                >
                  {link.label}
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/accessories"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition hover:border-emerald-300/50 hover:bg-emerald-400/10"
              >
                Accessories
                <span aria-hidden>→</span>
              </Link>
            </li>
            <li>
              <Link
                to="/home-living"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition hover:border-emerald-300/50 hover:bg-emerald-400/10"
              >
                Home & Living
                <span aria-hidden>→</span>
              </Link>
            </li>
          </ul>

          {/* Mobile Actions */}
          <div className="flex flex-wrap gap-3">
            {actions.map((action, index) => {
              const key =
                action.key ?? `${action.label ?? "action"}-mobile-${index}`;

              if (action.variant === "button") {
                return (
                  <Link
                    key={key}
                    to={action.to}
                    onClick={action.onClick}
                    className="flex-1 rounded-full border border-emerald-300/70 px-4 py-2 text-center text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-400/10"
                  >
                    {action.label}
                  </Link>
                );
              }

              if (action.to) {
                return (
                  <Link
                    key={key}
                    to={action.to}
                    onClick={action.onClick}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/10"
                    title={action.label}
                  >
                    <action.icon className="h-6 w-6" />
                  </Link>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={action.onClick}
                  disabled={isLoggingOut}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  title={isLoggingOut ? "Logging out..." : action.label}
                >
                  <action.icon className="h-6 w-6" />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default GenderCategoryNavbar;
