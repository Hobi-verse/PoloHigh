import { NavLink, Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import adminLinks from "./adminLinks";

const AdminDashboardLayout = () => (
  <div className="min-h-screen bg-emerald-400/10 flex flex-col">
    <AdminHeader />
    <div className="flex flex-1 flex-col gap-6 px-6 pb-6 lg:flex-row mt-4">
      <nav className="lg:hidden">
        <ul className="grid grid-cols-2 gap-3">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow transition ring-1 ring-emerald-100 ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "bg-white/95 text-emerald-700 hover:bg-emerald-50"
                    }`
                  }
                >
                  <Icon className="text-base" />
                  {link.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <AdminSidebar />
      <div className="custom-scrollbar mt-4 flex-1 overflow-y-auto rounded-2xl bg-white/95 px-8 pb-10 pt-16 text-slate-900 shadow-xl ring-1 ring-emerald-100 scroll-pt-24 lg:mt-0 lg:max-h-[calc(100vh-7.5rem)] lg:pt-20">
        <Outlet />
      </div>
    </div>
  </div>
);

export default AdminDashboardLayout;
