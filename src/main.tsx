import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuditProvider } from './context/AuditContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AuditPage from './pages/AuditPage';
import ReportsPage from './pages/ReportsPage';
import CorrectiveActionsPage from './pages/CorrectiveActionsPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuditProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="audit/:locationId" element={<AuditPage />} />
            <Route path="actions" element={<CorrectiveActionsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/location/:locationId" element={<ReportsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuditProvider>
  </StrictMode>
);