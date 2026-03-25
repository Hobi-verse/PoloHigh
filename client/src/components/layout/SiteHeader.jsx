import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/endpoints";
import { clearAuthSession } from "../../utils/authStorage";

const PRIMARY_NAV = [
  { label: "New Arrivals", to: "/shop/all" },
  { label: "Clothing", to: "/shop/men-clothing" },
  { label: "Fragrance", to: "/shop/perfumes" },
  { label: "Accessories", to: "/shop/accessories" },
  { label: "Journal", to: "/shop/all?q=journal" },
  { label: "The Atelier", to: "/shop/all?q=atelier" },
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
          <NavLink className={({ isActive }) => `header-link${isActive ? " active" : ""}`} to="/wishlist">
            Wishlist <span className="badge">{wishlistCount || ""}</span>
          </NavLink>
          <NavLink className={({ isActive }) => `header-link${isActive ? " active" : ""}`} to="/cart">
            Cart <span className="badge">{cartCount || ""}</span>
          </NavLink>
          {isLoggedIn ? (
            <>
              <NavLink className={({ isActive }) => `header-link${isActive ? " active" : ""}`} to="/account">
                {userName ? userName.split(" ")[0] : "Account"}
              </NavLink>
              <button className="button button--text" onClick={handleLogout} type="button">
                Logout
              </button>
            </>
          ) : (
            <NavLink className={({ isActive }) => `header-link${isActive ? " active" : ""}`} to="/login">
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
