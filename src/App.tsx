import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import POSPage from './pages/POSPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import InventoryPage from './pages/InventoryPage';
import HistoryPage from './pages/HistoryPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import PreviousSessions from './pages/PreviousSessionsPage'; // Assuming you have a page for previous sessions

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="previous-sessions" element={<PreviousSessions />} />
          <Route path="Settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;