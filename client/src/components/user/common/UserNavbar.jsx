// this is just for refrence that how we have to use common components as much as possible main common in single folder named common and then use it in other components we will delete the navbar later as we can use the tarnary operator for the navbar so we will chnage it later

import { useState } from "react";
import Navbar from "../../common/Navbar.jsx";
import searchIcon from "../../../assets/icons/search.svg";
import heartIcon from "../../../assets/icons/heart.svg";
import bagIcon from "../../../assets/icons/bag.svg";
import userIcon from "../../../assets/icons/user.svg";
import loginIcon from "../../../assets/icons/log-in.svg";
import logoutIcon from "../../../assets/icons/log-out.svg";
import { logoutUser } from "../../../api/auth";
import { clearAuthSession } from "../../../utils/authStorage";

const userLinks = [
  { label: "Women", to: "/women" },
  { label: "Men", to: "/men" },
  { label: "Kids", to: "/kids" },
  { label: "Accessories", to: "/accessories" },
  { label: "Home & Living", to: "/home-living" },
];

const createIconRenderer =
  (src) =>
  ({ className = "" } = {}) =>
    <img src={src} alt="" className={className} aria-hidden="true" />;

const UserNavbar = ({
  searchTerm = "",
  onSearchChange,
  onSearchSubmit,
  isLoggedIn = false,
  onLogout,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const performLogout = async () => {
    if (isLoggingOut) {
      return;
    }

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
          if (result === false) {
            return;
          }
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
    <Navbar
      brand={
        <>
          <img
            src="/ciyatakeLogo.png"
            alt="Ciyatake"
            className="h-8 w-auto md:h-10"
          />
          <span className="text-base font-semibold tracking-tight text-emerald-50 md:text-lg">
            Ciyatake
          </span>
        </>
      }
      brandHref="/"
      links={userLinks}
      search={{
        placeholder: "Search products...",
        value: searchTerm,
        onChange: (value) => onSearchChange?.(value),
        onSubmit: (value) => onSearchSubmit?.(value),
        icon: createIconRenderer(searchIcon),
      }}
      actions={actions}
    />
  );
};

export default UserNavbar;
