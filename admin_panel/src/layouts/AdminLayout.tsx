import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Users", path: "/users" },
  { label: "Properties", path: "/properties" },
  { label: "Reviews", path: "/reviews" },
  { label: "Visits", path: "/visits" },
  { label: "Analytics", path: "/analytics" },
  { label: "Billing", path: "/billing" },

];

export function AdminLayout() {
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>

          <div>
            <strong>RentItEase</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-mini">
            <strong>{user?.fullName ?? "Administrator"}</strong>
            <span>{user?.email ?? ""}</span>
          </div>

          <button
            className="secondary-button full-width"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Administration</h1>
            <p>Manage RentItEase from one place.</p>
          </div>

          <span className="role-badge">ADMIN</span>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
