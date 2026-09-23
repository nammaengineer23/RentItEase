import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/AuthContext";
import { searchAdminRecords } from "../api/adminSearchApi";
import type { AdminSearchResult } from "../api/adminSearchApi";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Users", path: "/users" },
  { label: "Properties", path: "/properties" },
  { label: "Owner Requests", path: "/owner-requests" },
  { label: "Reviews", path: "/reviews" },
  { label: "Visits", path: "/visits" },
  { label: "Analytics", path: "/analytics" },
  { label: "Billing", path: "/billing" },
  { label: "Social Media", path: "/social-media" },
];

export function AdminLayout() {
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<AdminSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const query = globalSearch.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    let cancelled = false;
    setSearching(true);
    setSearchError("");
    const timer = window.setTimeout(async () => {
      try {
        const response = await searchAdminRecords(query);
        if (!cancelled) setSearchResults(response.results ?? []);
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : "Search failed.");
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [globalSearch]);

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  function openResult(result: AdminSearchResult) {
    const query = globalSearch.trim();
    setGlobalSearch("");
    setSearchResults([]);
    navigate(`${result.path}?search=${encodeURIComponent(query)}&record=${encodeURIComponent(result.id)}`);
  }

  function submitGlobalSearch(event: FormEvent) {
    event.preventDefault();
    if (searchResults.length > 0) openResult(searchResults[0]);
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
                placeholder="Search users, properties, visits, invoices…"
                aria-label="Search RentItEase admin records"
                autoComplete="off"
              />
              {globalSearch && (
                <button type="button" className="admin-global-search-clear" onClick={() => setGlobalSearch("")} aria-label="Clear search">×</button>
              )}
              {globalSearch.trim().length >= 2 && (
                <div className="admin-global-search-results">
                  {searching ? (
                    <div className="admin-global-search-empty">Searching records…</div>
                  ) : searchError ? (
                    <div className="admin-global-search-empty">{searchError}</div>
                  ) : searchResults.length > 0 ? searchResults.map((item) => (
                    <button type="button" key={`${item.type}-${item.id}`} onClick={() => openResult(item)}>
                      <strong>{item.title}</strong>
                      <span>{item.type.replaceAll("_", " ")} · {item.subtitle}</span>
                    </button>
                  )) : (
                    <div className="admin-global-search-empty">No matching records found.</div>
                  )}
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
