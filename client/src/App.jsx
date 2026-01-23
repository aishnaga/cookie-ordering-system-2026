import { Routes, Route, Navigate } from 'react-router-dom';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import FamilySelector from './components/FamilySelector';
import ParentLayout from './layouts/ParentLayout';
import OrderPage from './pages/parent/OrderPage';
import InventoryPage from './pages/parent/InventoryPage';
import ExchangePage from './pages/parent/ExchangePage';
import MyStatusPage from './pages/parent/MyStatusPage';

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
      <Routes>
        <Route path="/admin/*" element={<div>Admin (coming next)</div>} />
        <Route path="/*" element={<ParentRoutes />} />
      </Routes>
    </FamilyProvider>
  );
}

export default App;
