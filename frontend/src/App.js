import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdmissionDashboard from './pages/admission/AdmissionDashboard';
import WalkInRegistry from './pages/admission/WalkInRegistry';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import InventoryDashboard from './pages/inventory/InventoryDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import { Toaster } from 'sonner';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/walk-in-registry" element={<WalkInRegistry />} />
        
        {/* Protected Routes */}
        <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admission/*" element={<ProtectedRoute><AdmissionDashboard /></ProtectedRoute>} />
        <Route path="/teacher/*" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/finance/*" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
        <Route path="/inventory/*" element={<ProtectedRoute><InventoryDashboard /></ProtectedRoute>} />
        <Route path="/parent/*" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;