import { useEffect, useMemo, useState } from "react";

import {
  activateUser,
  deactivateUser,
  deleteUser,
  getUser,
  getUsers,
  type AdminUserDetails,
  type AdminUserListItem,
  type UserRole,
} from "../api/usersApi";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type RoleFilter = "ALL" | UserRole;

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function roleLabel(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "OWNER":
      return "Owner";
    default:
      return "User";
  }
}

function UserDetailsPanel({
  user,
  onClose,
}: {
  user: AdminUserDetails;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card user-details-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{user.fullName}</h2>
            <p>{user.email}</p>
          </div>

          <button className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="user-detail-grid">
          <div>
            <span>Role</span>
            <strong>{roleLabel(user.role)}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{user.isActive ? "Active" : "Inactive"}</strong>
          </div>

          <div>
            <span>Phone</span>
            <strong>{user.phone || "Not provided"}</strong>
          </div>

          <div>
            <span>Joined</span>
            <strong>{formatDate(user.createdAt)}</strong>
          </div>

          <div>
            <span>Properties</span>
            <strong>{user.totalProperties}</strong>
          </div>

          <div>
            <span>Favorites</span>
            <strong>{user.favorites?.length ?? 0}</strong>
          </div>

          <div>
            <span>Reviews</span>
            <strong>{user.reviews?.length ?? 0}</strong>
          </div>

          <div>
            <span>Visits</span>
            <strong>{user.visits?.length ?? 0}</strong>
          </div>
        </div>

        {user.properties && user.properties.length > 0 && (
          <div className="detail-section">
            <h3>Properties</h3>

            <div className="detail-list">
              {user.properties.map((property) => (
                <div key={property.id}>
                  <strong>{property.title}</strong>
                  <span>
                    {property.city}
                    {property.locality ? `, ${property.locality}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function UsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(
    null,
  );

  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const result = await getUsers();
      setUsers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query);

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.isActive) ||
        (statusFilter === "INACTIVE" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  async function handleViewUser(id: string) {
    try {
      const user = await getUser(id);
      setSelectedUser(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load user details.",
      );
    }
  }

  async function handleToggleStatus(user: AdminUserListItem) {
    const action = user.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.fullName}?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyUserId(user.id);
    setError("");

    try {
      const updated = user.isActive
        ? await deactivateUser(user.id)
        : await activateUser(user.id);

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                ...updated,
              }
            : item,
        ),
      );

      if (selectedUser?.id === user.id) {
        setSelectedUser((current) =>
          current
            ? {
                ...current,
                ...updated,
              }
            : current,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Unable to ${action} user.`,
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDelete(user: AdminUserListItem) {
    if (user.role === "ADMIN") {
      window.alert(
        "Administrator accounts cannot be deleted from this screen.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete ${user.fullName}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyUserId(user.id);
    setError("");

    try {
      await deleteUser(user.id);

      setUsers((current) => current.filter((item) => item.id !== user.id));

      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user.");
    } finally {
      setBusyUserId(null);
    }
  }

  if (loading) {
    return (
      <section className="page-section">
        <div className="content-card">
          <p>Loading users…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>View and manage RentItEase users, owners and administrators.</p>
        </div>

        <button className="secondary-button" onClick={() => void loadUsers()}>
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="content-card">
        <div className="users-toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Search name, email or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="filter-select"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as RoleFilter)
            }
          >
            <option value="ALL">All roles</option>
            <option value="USER">Users</option>
            <option value="OWNER">Owners</option>
            <option value="ADMIN">Administrators</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="table-summary">
          Showing {filteredUsers.length} of {users.length} users
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <h3>No users found</h3>
            <p>Try changing the search or filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Properties</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const busy = busyUserId === user.id;

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <strong>{user.fullName}</strong>
                          <span>{user.email}</span>
                        </div>
                      </td>

                      <td>{user.phone || "—"}</td>

                      <td>
                        <span
                          className={`role-badge role-${user.role.toLowerCase()}`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            user.isActive
                              ? "status-badge status-active"
                              : "status-badge status-inactive"
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>{user.totalProperties}</td>

                      <td>{formatDate(user.createdAt)}</td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="table-button"
                            onClick={() => void handleViewUser(user.id)}
                            disabled={busy}
                          >
                            View
                          </button>

                          <button
                            className="table-button"
                            onClick={() => void handleToggleStatus(user)}
                            disabled={busy}
                          >
                            {busy
                              ? "..."
                              : user.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>

                          {user.role !== "ADMIN" && (
                            <button
                              className="table-button danger-button"
                              onClick={() => void handleDelete(user)}
                              disabled={busy}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailsPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </section>
  );
}
