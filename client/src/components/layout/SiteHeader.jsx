import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiHeart, FiLogIn, FiLogOut, FiShoppingBag, FiUser } from "react-icons/fi";
import { api } from "../../api/endpoints";
import { clearAuthSession } from "../../utils/authStorage";

const PRIMARY_NAV = [
  { label: "New Arrivals", to: "/shop/all" },
  { label: "Clothing", to: "/shop/men-clothing" },
  { label: "Fragrance", to: "/shop/perfumes" },
  { label: "Accessories", to: "/shop/accessories" },
];

const SiteHeader = ({ isLoggedIn, userName = "", onAuthChange }) => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const syncCounters = useCallback(async () => {
    if (!isLoggedIn) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }

    try {
      const [cartSummary, wishlistSummary] = await Promise.all([
        api.cart.getSummary(),
        api.wishlist.getSummary(),
      ]);

      const cartItems =
        cartSummary?.data?.itemCount ??
        cartSummary?.itemCount ??
        cartSummary?.count ??
        0;
      const wishItems =
        wishlistSummary?.data?.itemCount ??
        wishlistSummary?.itemCount ??
        wishlistSummary?.count ??
        0;

      setCartCount(Number(cartItems) || 0);
      setWishlistCount(Number(wishItems) || 0);
    } catch {
      setCartCount(0);
      setWishlistCount(0);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    syncCounters();
  }, [location.pathname, isLoggedIn, syncCounters]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Session is cleared client-side even when backend token is already invalid.
    } finally {
      clearAuthSession();
      onAuthChange?.();
      navigate("/");
    }
  };

  return (
    <header className="site-header">
      <div className="site-header__top">
        <Link className="brand-mark" to="/">
          <img alt="PoloHigh" className="brand-mark__logo" src="/polohighlogo.jpg" />
          <span className="brand-mark__text">PoloHigh</span>
        </Link>

        <nav className="site-primary-nav">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              className={({ isActive }) => `site-primary-nav__item${isActive ? " active" : ""}`}
              key={item.label}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <NavLink
            aria-label="Wishlist"
            className={({ isActive }) => `header-action${isActive ? " active" : ""}`}
            title="Wishlist"
            to="/wishlist"
          >
            <FiHeart />
            {wishlistCount > 0 ? <span className="header-action__badge">{wishlistCount}</span> : null}
          </NavLink>

          <NavLink
            aria-label="Cart"
            className={({ isActive }) => `header-action${isActive ? " active" : ""}`}
            title="Cart"
            to="/cart"
          >
            <FiShoppingBag />
            {cartCount > 0 ? <span className="header-action__badge">{cartCount}</span> : null}
          </NavLink>

          {isLoggedIn ? (
            <>
              <NavLink
                aria-label="Profile"
                className={({ isActive }) => `header-action${isActive ? " active" : ""}`}
                title={userName ? `Profile (${userName})` : "Profile"}
                to="/account"
              >
                <FiUser />
              </NavLink>

              <button
                aria-label="Logout"
                className="header-action header-action--button"
                onClick={handleLogout}
                title="Logout"
                type="button"
              >
                <FiLogOut />
              </button>
            </>
          ) : (
            <NavLink
              aria-label="Login"
              className={({ isActive }) => `header-action${isActive ? " active" : ""}`}
              title="Login"
              to="/login"
            >
              <FiLogIn />
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
