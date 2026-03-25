import { Navigate, Route, Routes } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import SiteHeader from "./components/layout/SiteHeader";
import SiteFooter from "./components/layout/SiteFooter";
import ProtectedRoute from "./components/common/ProtectedRoute";
import useAuthSession from "./hooks/useAuthSession";
import HomePage from "./pages/store/HomePage";
import CatalogPage from "./pages/store/CatalogPage";
import ProductPage from "./pages/store/ProductPage";
import CartPage from "./pages/store/CartPage";
import WishlistPage from "./pages/store/WishlistPage";
import CheckoutPage from "./pages/store/CheckoutPage";
import AccountPage from "./pages/store/AccountPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

const App = () => {
  const session = useAuthSession();
  const isLoggedIn = Boolean(session?.token);
  const userName = session?.user?.fullName || session?.user?.name || "";

  return (
    <div className="app-shell">
      <div className="app-frame">
        <SiteHeader isLoggedIn={isLoggedIn} userName={userName} />
        <div className="page-content">
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<CatalogPage />} path="/shop/:section" />
            <Route element={<CatalogPage />} path="/shop" />
            <Route element={<ProductPage isLoggedIn={isLoggedIn} />} path="/products/:productId" />
            <Route element={<CartPage isLoggedIn={isLoggedIn} />} path="/cart" />
            <Route
              element={
                <ProtectedRoute session={session}>
                  <WishlistPage isLoggedIn={isLoggedIn} />
                </ProtectedRoute>
              }
              path="/wishlist"
            />
            <Route
              element={
                <ProtectedRoute session={session}>
                  <CheckoutPage isLoggedIn={isLoggedIn} />
                </ProtectedRoute>
              }
              path="/checkout"
            />
            <Route
              element={
                <ProtectedRoute session={session}>
                  <AccountPage isLoggedIn={isLoggedIn} />
                </ProtectedRoute>
              }
              path="/account"
            />
            <Route element={<LoginPage />} path="/login" />
            <Route element={<SignupPage />} path="/signup" />
            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </div>
        <SiteFooter />
      </div>
      <SpeedInsights />
    </div>
  );
};

export default App;
