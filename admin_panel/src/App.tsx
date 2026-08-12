import { Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { VisitsPage } from "./pages/VisitsPage";
import { AdminLayout } from "./layouts/AdminLayout";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { BillingPage } from "./pages/BillingPage";


export default function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/visits" element={<VisitsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/billing" element={<BillingPage />} />

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}
