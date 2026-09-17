import { FormEvent, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/dashboard", keywords: "overview stats activity" },
  { label: "Users", path: "/users", keywords: "user tenant owner admin name email phone role" },
  { label: "Properties", path: "/properties", keywords: "property listing title location city owner status approval" },
  { label: "Owner Requests", path: "/owner-requests", keywords: "owner request approval pending user" },
  { label: "Reviews", path: "/reviews", keywords: "review rating comment property user moderation" },
  { label: "Visits", path: "/visits", keywords: "visit tenant owner property date status booking" },
  { label: "Analytics", path: "/analytics", keywords: "analytics metrics reports performance" },
  { label: "Premium Memberships", path: "/premium-memberships", keywords: "premium membership plan subscription trial member" },
  { label: "Billing", path: "/billing", keywords: "billing invoice payment razorpay transaction" },
  { label: "Social Media", path: "/social-media", keywords: "social media post facebook instagram youtube platform publish schedule" },
];

export function AdminLayout() {
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState("");

  const searchResults = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    if (!query) return [];
    return navItems.filter((item) =>
      `${item.label} ${item.keywords}`.toLowerCase().includes(query),
    );
  }, [globalSearch]);

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  function openResult(path: string) {
    setGlobalSearch("");
    navigate(path);
  }

  function submitGlobalSearch(event: FormEvent) {
    event.preventDefault();
    if (searchResults.length > 0) openResult(searchResults[0].path);
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div><strong>RentItEase</strong><span>Admin Panel</span></div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-mini"><strong>{user?.fullName ?? "Administrator"}</strong><span>{user?.email ?? ""}</span></div>
          <button className="secondary-button full-width" onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><h1>Administration</h1><p>Manage RentItEase from one place.</p></div>
          <div className="topbar-actions">
            <form className="admin-global-search" onSubmit={submitGlobalSearch} role="search">
              <span className="admin-global-search-icon" aria-hidden="true">⌕</span>
              <input
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder="Search admin modules…"
                aria-label="Search admin modules"
                autoComplete="off"
              />
              {globalSearch && (
                <button type="button" className="admin-global-search-clear" onClick={() => setGlobalSearch("")} aria-label="Clear search">×</button>
              )}
              {globalSearch.trim() && (
                <div className="admin-global-search-results">
                  {searchResults.length > 0 ? searchResults.map((item) => (
                    <button type="button" key={item.path} onClick={() => openResult(item.path)}>
                      <strong>{item.label}</strong>
                      <span>{item.keywords.split(" ").slice(0, 5).join(" · ")}</span>
                    </button>
                  )) : <div className="admin-global-search-empty">No admin module matches “{globalSearch.trim()}”.</div>}
                </div>
              )}
            </form>
            <span className="role-badge">ADMIN</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
