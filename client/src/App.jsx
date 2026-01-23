import { Routes, Route, Navigate } from 'react-router-dom';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import FamilySelector from './components/FamilySelector';
import ParentLayout from './layouts/ParentLayout';
import AdminLayout from './layouts/AdminLayout';
import OrderPage from './pages/parent/OrderPage';
import InventoryPage from './pages/parent/InventoryPage';
import ExchangePage from './pages/parent/ExchangePage';
import MyStatusPage from './pages/parent/MyStatusPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import FamiliesPage from './pages/admin/FamiliesPage';
import CookiesPage from './pages/admin/CookiesPage';
import AdminInventoryPage from './pages/admin/InventoryPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import AdminExchangesPage from './pages/admin/ExchangesPage';
import { Spinner, Center } from '@chakra-ui/react';

function AdminRoutes() {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return <Center h="100vh"><Spinner size="xl" /></Center>;
  }

  if (!isAdmin) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="families" element={<FamiliesPage />} />
        <Route path="cookies" element={<CookiesPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="exchanges" element={<AdminExchangesPage />} />
      </Route>
    </Routes>
  );
}

function ParentRoutes() {
  const { selectedFamily } = useFamily();

  if (!selectedFamily) {
    return <FamilySelector />;
  }

  return (
    <Routes>
      <Route element={<ParentLayout />}>
        <Route index element={<Navigate to="/order" replace />} />
        <Route path="order" element={<OrderPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="exchange" element={<ExchangePage />} />
        <Route path="my-status" element={<MyStatusPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <FamilyProvider>
      <AdminProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<ParentRoutes />} />
        </Routes>
      </AdminProvider>
    </FamilyProvider>
  );
}

export default App;
