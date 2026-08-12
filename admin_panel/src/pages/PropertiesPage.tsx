import { useEffect, useMemo, useState } from "react";

import {
  deleteProperty,
  getProperties,
  getProperty,
  hideProperty,
  unhideProperty,
  type AdminPropertyDetails,
  type AdminPropertyListItem,
} from "../api/propertiesApi";

type StatusFilter = "ALL" | "AVAILABLE" | "HIDDEN";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatPrice(value: number | string): string {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}

function PropertyDetailsPanel({
  property,
  onClose,
}: {
  property: AdminPropertyDetails;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card user-details-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{property.title}</h2>
            <p>
              {property.city}
              {property.locality ? `, ${property.locality}` : ""}
            </p>
          </div>

          <button className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {property.primaryImage && (
          <img
            className="property-detail-image"
            src={property.primaryImage}
            alt={property.title}
          />
        )}

        <div className="user-detail-grid">
          <div>
            <span>Owner</span>
            <strong>{property.owner.fullName}</strong>
          </div>

          <div>
            <span>Owner email</span>
            <strong>{property.owner.email}</strong>
          </div>

          <div>
            <span>Rent</span>
            <strong>{formatPrice(property.price)}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {property.isAvailable ? "Available" : "Hidden / Unavailable"}
            </strong>
          </div>

          <div>
            <span>Bedrooms</span>
            <strong>{property.bedrooms ?? "—"}</strong>
          </div>

          <div>
            <span>Bathrooms</span>
            <strong>{property.bathrooms ?? "—"}</strong>
          </div>

          <div>
            <span>Area</span>
            <strong>
              {property.area !== undefined ? `${property.area} sq.ft` : "—"}
            </strong>
          </div>

          <div>
            <span>Property type</span>
            <strong>{property.propertyType ?? "—"}</strong>
          </div>

          <div>
            <span>Favorites</span>
            <strong>{property.totalFavorites}</strong>
          </div>

          <div>
            <span>Visits</span>
            <strong>{property.totalVisits}</strong>
          </div>

          <div>
            <span>Reviews</span>
            <strong>{property.totalReviews}</strong>
          </div>

          <div>
            <span>Created</span>
            <strong>{formatDate(property.createdAt)}</strong>
          </div>
        </div>

        {property.description && (
          <div className="detail-section">
            <h3>Description</h3>
            <p>{property.description}</p>
          </div>
        )}

        {property.address && (
          <div className="detail-section">
            <h3>Address</h3>
            <p>
              {property.address}
              {property.city ? `, ${property.city}` : ""}
              {property.state ? `, ${property.state}` : ""}
              {property.pincode ? ` - ${property.pincode}` : ""}
            </p>
          </div>
        )}

        {property.images && property.images.length > 0 && (
          <div className="detail-section">
            <h3>Images</h3>

            <div className="property-image-list">
              {property.images.map((image) => (
                <img key={image.id} src={image.imageUrl} alt={property.title} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PropertiesPage() {
  const [properties, setProperties] = useState<AdminPropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [selectedProperty, setSelectedProperty] =
    useState<AdminPropertyDetails | null>(null);

  const [busyPropertyId, setBusyPropertyId] = useState<string | null>(null);

  async function loadProperties() {
    setLoading(true);
    setError("");

    try {
      const result = await getProperties();
      setProperties(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load properties.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return properties.filter((property) => {
      const matchesSearch =
        !query ||
        property.title.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        (property.locality ?? "").toLowerCase().includes(query) ||
        property.owner.fullName.toLowerCase().includes(query) ||
        property.owner.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "AVAILABLE" && property.isAvailable) ||
        (statusFilter === "HIDDEN" && !property.isAvailable);

      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  async function handleViewProperty(id: string) {
    try {
      const property = await getProperty(id);
      setSelectedProperty(property);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load property details.",
      );
    }
  }

  async function handleToggleVisibility(property: AdminPropertyListItem) {
    const action = property.isAvailable ? "hide" : "unhide";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${property.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyPropertyId(property.id);
    setError("");

    try {
      const updated = property.isAvailable
        ? await hideProperty(property.id)
        : await unhideProperty(property.id);

      setProperties((current) =>
        current.map((item) =>
          item.id === property.id
            ? {
                ...item,
                ...updated,
              }
            : item,
        ),
      );

      if (selectedProperty?.id === property.id) {
        setSelectedProperty((current) =>
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
        err instanceof Error ? err.message : `Unable to ${action} property.`,
      );
    } finally {
      setBusyPropertyId(null);
    }
  }

  async function handleDelete(property: AdminPropertyListItem) {
    const confirmed = window.confirm(
      `Delete "${property.title}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyPropertyId(property.id);
    setError("");

    try {
      await deleteProperty(property.id);

      setProperties((current) =>
        current.filter((item) => item.id !== property.id),
      );

      if (selectedProperty?.id === property.id) {
        setSelectedProperty(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete property.",
      );
    } finally {
      setBusyPropertyId(null);
    }
  }

  if (loading) {
    return (
      <section className="page-section">
        <div className="content-card">Loading properties…</div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <h2>Property Management</h2>
          <p>Review and manage RentItEase properties and listings.</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => void loadProperties()}
        >
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="content-card">
        <div className="users-toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Search property, city or owner..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <option value="ALL">All properties</option>
            <option value="AVAILABLE">Available</option>
            <option value="HIDDEN">Hidden / unavailable</option>
          </select>
        </div>

        <div className="table-summary">
          Showing {filteredProperties.length} of {properties.length} properties
        </div>

        {filteredProperties.length === 0 ? (
          <div className="empty-state">
            <h3>No properties found</h3>
            <p>Try changing the search or filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>Rent</th>
                  <th>Status</th>
                  <th>Activity</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProperties.map((property) => {
                  const busy = busyPropertyId === property.id;

                  return (
                    <tr key={property.id}>
                      <td>
                        <div className="user-cell">
                          {property.primaryImage && (
                            <img
                              className="property-table-image"
                              src={property.primaryImage}
                              alt=""
                            />
                          )}

                          <div>
                            <strong>{property.title}</strong>
                            <span>{property.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="user-cell">
                          <strong>{property.owner.fullName}</strong>
                          <span>{property.owner.email}</span>
                        </div>
                      </td>

                      <td>
                        {property.city}
                        {property.locality ? `, ${property.locality}` : ""}
                      </td>

                      <td>{formatPrice(property.price)}</td>

                      <td>
                        <span
                          className={
                            property.isAvailable
                              ? "status-badge status-active"
                              : "status-badge status-inactive"
                          }
                        >
                          {property.isAvailable ? "Available" : "Hidden"}
                        </span>
                      </td>

                      <td>
                        <div className="property-activity">
                          <span>{property.totalFavorites} favorites</span>
                          <span>{property.totalVisits} visits</span>
                          <span>{property.totalReviews} reviews</span>
                        </div>
                      </td>

                      <td>{formatDate(property.createdAt)}</td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="table-button"
                            onClick={() => void handleViewProperty(property.id)}
                            disabled={busy}
                          >
                            View
                          </button>

                          <button
                            className="table-button"
                            onClick={() =>
                              void handleToggleVisibility(property)
                            }
                            disabled={busy}
                          >
                            {busy
                              ? "..."
                              : property.isAvailable
                                ? "Hide"
                                : "Unhide"}
                          </button>

                          <button
                            className="table-button danger-button"
                            onClick={() => void handleDelete(property)}
                            disabled={busy}
                          >
                            Delete
                          </button>
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

      {selectedProperty && (
        <PropertyDetailsPanel
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </section>
  );
}

