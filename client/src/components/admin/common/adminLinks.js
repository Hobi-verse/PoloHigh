import {
  FiHome,
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiUserCheck,
  FiPieChart,
  FiTag,
} from "react-icons/fi";

export const adminLinks = [
  { label: "Dashboard", to: "/admin/dashboard", icon: FiHome },
  { label: "Users", to: "/admin/users", icon: FiUsers },
  { label: "Orders", to: "/admin/orders", icon: FiShoppingBag },
  { label: "Products", to: "/admin/products", icon: FiPackage },
  { label: "Customers", to: "/admin/customers", icon: FiUserCheck },
  { label: "Coupons", to: "/admin/coupons", icon: FiTag },
  { label: "Reports", to: "/admin/reports", icon: FiPieChart },
];

export default adminLinks;
